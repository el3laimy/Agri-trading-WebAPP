from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import crud, schemas
from app import crud, schemas
from app.core.bootstrap import INVENTORY_ACCOUNT_ID, ACCOUNTS_PAYABLE_ID, CASH_ACCOUNT_ID
from app.services import payments as payment_service

def create_new_purchase(db: Session, purchase: schemas.PurchaseCreate):
    """
    Creates a new purchase record and handles all related business logic:
    1. Calculates total cost.
    2. Updates inventory stock and average cost.
    3. Creates double-entry general ledger records.
    4. Updates financial account balances.
    All within a single database transaction.
    """
    # Validate crop and supplier existence
    crop = crud.get_crop(db, purchase.crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop with id {purchase.crop_id} not found.")
    
    supplier = crud.get_contact(db, purchase.supplier_id)
    if not supplier or not supplier.is_supplier:
        raise HTTPException(status_code=404, detail=f"Supplier with id {purchase.supplier_id} not found.")

    total_cost = purchase.quantity_kg * purchase.unit_price

    try:
        # 1. Create the purchase record first to get ID
        purchase_data = purchase.model_dump()
        purchase_data['total_cost'] = total_cost
        db_purchase = crud.create_purchase_record(db, purchase_data=purchase_data)
        db.flush() # Flush to get the purchase_id

        # 2. Add Stock Batch (Updates Inventory Aggregate automatically)
        from app.services.inventory import add_stock_batch
        add_stock_batch(
            db=db,
            crop_id=purchase.crop_id,
            quantity_kg=purchase.quantity_kg,
            cost_per_kg=purchase.unit_price,
            purchase_date=purchase.purchase_date,
            purchase_id=db_purchase.purchase_id,
            supplier_id=purchase.supplier_id,
            notes=purchase.notes
        )

        # Create General Ledger entries (Double-entry bookkeeping)
        ledger_description = f"Purchase of {purchase.quantity_kg}kg of {crop.crop_name} from {supplier.name}"
        
        # 1. Debit Inventory (increase in assets)
        debit_entry = schemas.GeneralLedgerCreate(
            entry_date=purchase.purchase_date,
            account_id=INVENTORY_ACCOUNT_ID,
            debit=total_cost,
            description=ledger_description
        )
        crud.create_ledger_entry(db, entry=debit_entry, source_type='PURCHASE', source_id=db_purchase.purchase_id)

        # 2. Credit Accounts Payable (increase in liabilities)
        credit_entry = schemas.GeneralLedgerCreate(
            entry_date=purchase.purchase_date,
            account_id=ACCOUNTS_PAYABLE_ID,
            credit=total_cost,
            description=ledger_description
        )
        crud.create_ledger_entry(db, entry=credit_entry, source_type='PURCHASE', source_id=db_purchase.purchase_id)

        # Update account balances
        crud.update_account_balance(db, account_id=INVENTORY_ACCOUNT_ID, amount=total_cost)
        crud.update_account_balance(db, account_id=ACCOUNTS_PAYABLE_ID, amount=total_cost)

        db.commit()
        db.refresh(db_purchase)
        db.refresh(db_purchase)

        # Handle immediate payment if provided
        if purchase.amount_paid and purchase.amount_paid > 0:
            payment_data = schemas.PaymentCreate(
                payment_date=purchase.purchase_date,
                amount=purchase.amount_paid,
                contact_id=purchase.supplier_id,
                payment_method='Cash', # Default to Cash
                credit_account_id=CASH_ACCOUNT_ID,
                debit_account_id=ACCOUNTS_PAYABLE_ID,
                transaction_type='PURCHASE',
                transaction_id=db_purchase.purchase_id
            )
            payment_service.create_payment(db, payment_data)
            db.refresh(db_purchase)

        return db_purchase

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred during the transaction: {e}")
