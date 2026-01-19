from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import crud, schemas
from app.core.settings import get_setting
from app.services import payments as payment_service

def create_new_sale(db: Session, sale: schemas.SaleCreate, user_id: int = None):
    """
    Creates a new sale record and handles all related business logic:
    1. Calculates total sale amount.
    2. Calculates Cost of Goods Sold (COGS).
    3. Updates inventory stock (decrease).
    4. Creates double-entry general ledger records.
    5. Updates financial account balances.
    All within a single database transaction.
    """
    # Validate crop and customer
    crop = crud.get_crop(db, sale.crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"المحصول رقم {sale.crop_id} غير موجود.")
    
    customer = crud.get_contact(db, sale.customer_id)
    if not customer or not customer.is_customer:
        raise HTTPException(status_code=404, detail=f"العميل رقم {sale.customer_id} غير موجود.")

    # Remove manual inventory check as consume_stock handles it more robustly (or we check aggregate first)
    # But to be safe and efficient, we can check aggregate first if we want, but consume_stock does it too.
    
    inventory = crud.get_or_create_inventory(db, crop_id=sale.crop_id)
    # Quick pre-check
    if inventory.current_stock_kg < sale.quantity_sold_kg:
         raise HTTPException(status_code=400, detail=f"رصيد المخزون غير كافي للمحصول '{crop.crop_name}'. المتاح: {inventory.current_stock_kg} كجم")

    total_sale_amount = sale.quantity_sold_kg * sale.selling_unit_price
    
    try:
        # 1. Consume Stock (FIFO) & Calculate COGS
        from app.services.inventory import consume_stock
        consumed_batches = consume_stock(db, sale.crop_id, sale.quantity_sold_kg)
        
        # Calculate precise COGS based on actual batches used
        cost_of_goods_sold = sum(item['quantity_kg'] * item['cost_per_kg'] for item in consumed_batches)

        # 2. Create the Sale record
        sale_data = sale.model_dump()
        sale_data['total_sale_amount'] = total_sale_amount
        sale_data['created_by'] = user_id
        db_sale = crud.create_sale_record(db, sale_data=sale_data)
        db.flush() # Get the sale_id for the ledger entries

        # 3. Create General Ledger entries using AccountingEngine
        from decimal import Decimal
        from app.services.accounting_engine import get_engine, LedgerEntry
        
        sale_description = f"بيع {sale.quantity_sold_kg} كجم {crop.crop_name} للعميل {customer.name}"
        cogs_description = f"تكلفة مبيعات - {crop.crop_name} - {customer.name}"

        # Get Account IDs from Settings
        accounts_receivable_id = int(get_setting(db, "ACCOUNTS_RECEIVABLE_ID"))
        sales_revenue_id = int(get_setting(db, "SALES_REVENUE_ACCOUNT_ID"))
        cogs_id = int(get_setting(db, "COGS_ACCOUNT_ID"))
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

        # Use AccountingEngine for balanced entries
        engine = get_engine(db)
        
        # Entry 1: Sales Revenue (Debit AR, Credit Revenue)
        engine.create_balanced_entry(
            entries=[
                LedgerEntry(account_id=accounts_receivable_id, debit=Decimal(str(total_sale_amount)), credit=Decimal(0), description=sale_description),
                LedgerEntry(account_id=sales_revenue_id, debit=Decimal(0), credit=Decimal(str(total_sale_amount)), description=sale_description)
            ],
            entry_date=sale.sale_date,
            source_type='SALE',
            source_id=db_sale.sale_id,
            created_by=user_id
        )
        
        # Entry 2: COGS (Debit COGS, Credit Inventory)
        engine.create_balanced_entry(
            entries=[
                LedgerEntry(account_id=cogs_id, debit=Decimal(str(cost_of_goods_sold)), credit=Decimal(0), description=cogs_description),
                LedgerEntry(account_id=inventory_id, debit=Decimal(0), credit=Decimal(str(cost_of_goods_sold)), description=cogs_description)
            ],
            entry_date=sale.sale_date,
            source_type='SALE_COGS',
            source_id=db_sale.sale_id,
            created_by=user_id
        )

        db.commit()
        db.refresh(db_sale)

        # 5. Handle immediate payment if provided
        if sale.amount_received and sale.amount_received > 0:
            payment_data = schemas.PaymentCreate(
                payment_date=sale.sale_date,
                amount=sale.amount_received,
                contact_id=sale.customer_id,
                payment_method='Cash', # Default to Cash for quick sales
                credit_account_id=accounts_receivable_id,
                debit_account_id=int(get_setting(db, "CASH_ACCOUNT_ID")),
                transaction_type='SALE',
                transaction_id=db_sale.sale_id
            )
            payment_service.create_payment(db, payment_data, user_id=user_id)
            db.refresh(db_sale) # Refresh to get updated payment status

        return db_sale

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تسجيل عملية البيع: {e}")
