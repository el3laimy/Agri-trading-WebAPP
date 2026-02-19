"""
Sale and Purchase Returns CRUD Operations
"""
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.core.settings import get_setting
from .inventory import get_or_create_inventory


def create_sale_return(db: Session, sale_return: schemas.SaleReturnCreate) -> models.SaleReturn:
    """
    إنشاء مرتجع مبيعات مع القيود المحاسبية
    القيد: من حـ/ إيرادات المبيعات إلى حـ/ الذمم المدينة
    
    يستخدم AccountingEngine لضمان التوازن والدقة.
    FIFO: ينشئ دفعة جديدة بالتكلفة الأصلية (COGS)
    """
    from decimal import Decimal
    from datetime import date as date_type
    from app.services.inventory import add_stock_batch
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # 1. Get the original sale
    sale = db.query(models.Sale).filter(models.Sale.sale_id == sale_return.sale_id).first()
    if not sale:
        raise ValueError(f"Sale with ID {sale_return.sale_id} not found")
    
    # 2. Calculate refund amount based on the original sale price
    refund_amount = (sale_return.quantity_kg / sale.quantity_sold_kg) * sale.total_sale_amount
    
    # 3. Create the sale return record
    db_sale_return = models.SaleReturn(
        **sale_return.model_dump(),
        refund_amount=refund_amount
    )
    db.add(db_sale_return)
    db.flush()
    
    # 4. حساب التكلفة الأصلية (COGS) للكمية المباعة
    # البحث بـ source_type بدلاً من الوصف النصي
    cogs_entry = db.query(models.GeneralLedger).filter(
        models.GeneralLedger.source_type == 'SALE_COGS',
        models.GeneralLedger.source_id == sale.sale_id,
        models.GeneralLedger.debit > 0
    ).first()
    
    if cogs_entry and sale.quantity_sold_kg > 0:
        original_cost_per_kg = Decimal(str(cogs_entry.debit)) / Decimal(str(sale.quantity_sold_kg))
    else:
        inventory = db.query(models.Inventory).filter(
            models.Inventory.crop_id == sale.crop_id
        ).first()
        original_cost_per_kg = inventory.average_cost_per_kg if inventory else Decimal(0)
    
    # 5. إنشاء دفعة جديدة بالتكلفة الأصلية (FIFO-compliant)
    add_stock_batch(
        db=db,
        crop_id=sale.crop_id,
        quantity_kg=Decimal(str(sale_return.quantity_kg)),
        cost_per_kg=original_cost_per_kg,
        purchase_date=sale_return.return_date,
        notes=f"مرتجع مبيعات - فاتورة #{sale.sale_id}"
    )
    
    # 6. إنشاء قيد متوازن بمحرك المحاسبة - عكس قيد البيع
    return_description = f"مرتجع مبيعات - فاتورة #{sale.sale_id}"
    
    sales_revenue_id = int(get_setting(db, "SALES_REVENUE_ACCOUNT_ID"))
    accounts_receivable_id = int(get_setting(db, "ACCOUNTS_RECEIVABLE_ID"))

    engine = get_engine(db)
    refund_decimal = Decimal(str(refund_amount))
    
    engine.create_balanced_entry(
        entries=[
            LedgerEntry(account_id=sales_revenue_id, debit=refund_decimal, credit=Decimal(0), description=return_description),
            LedgerEntry(account_id=accounts_receivable_id, debit=Decimal(0), credit=refund_decimal, description=return_description),
        ],
        entry_date=sale_return.return_date,
        source_type='SALE_RETURN',
        source_id=db_sale_return.return_id
    )
    
    # 7. تحديث إجمالي المبيعة الأصلية
    sale.total_sale_amount -= refund_amount
    sale.quantity_sold_kg -= sale_return.quantity_kg
    
    db.commit()
    db.refresh(db_sale_return)
    return db_sale_return


def get_sale_returns(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.SaleReturn)
        .options(joinedload(models.SaleReturn.sale))
        .order_by(models.SaleReturn.return_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_purchase_return(db: Session, purchase_return: schemas.PurchaseReturnCreate) -> models.PurchaseReturn:
    """
    إنشاء مرتجع مشتريات مع القيود المحاسبية
    القيد: من حـ/ الذمم الدائنة إلى حـ/ المخزون
    
    يستخدم AccountingEngine لضمان التوازن والدقة.
    FIFO: يعدل الدفعة الأصلية المرتبطة بالشراء
    """
    from decimal import Decimal
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # 1. Get the original purchase
    purchase = db.query(models.Purchase).filter(models.Purchase.purchase_id == purchase_return.purchase_id).first()
    if not purchase:
        raise ValueError(f"Purchase with ID {purchase_return.purchase_id} not found")
    
    # 2. Calculate returned cost based on the original purchase price
    returned_cost = (purchase_return.quantity_kg / purchase.quantity_kg) * purchase.total_cost
    
    # 3. Create the purchase return record
    db_purchase_return = models.PurchaseReturn(
        **purchase_return.model_dump(),
        returned_cost=returned_cost
    )
    db.add(db_purchase_return)
    db.flush()
    
    # 4. تعديل الدفعة الأصلية المرتبطة بالشراء (FIFO-compliant)
    from app.models import InventoryBatch
    
    batch = db.query(InventoryBatch).filter(
        InventoryBatch.purchase_id == purchase.purchase_id,
        InventoryBatch.is_active == True
    ).first()
    
    return_qty = Decimal(str(purchase_return.quantity_kg))
    
    if batch:
        batch.quantity_kg -= return_qty
        
        if batch.quantity_kg <= Decimal('0.0001'):
            batch.is_active = False
            batch.quantity_kg = Decimal(0)
    
    # 5. تحديث المخزون الإجمالي
    inventory = get_or_create_inventory(db, purchase.crop_id)
    inventory.current_stock_kg -= return_qty
    inventory.net_stock_kg -= return_qty
    
    if inventory.net_stock_kg > 0:
        active_batches = db.query(InventoryBatch).filter(
            InventoryBatch.crop_id == purchase.crop_id,
            InventoryBatch.is_active == True,
            InventoryBatch.quantity_kg > 0
        ).all()
        
        total_value = sum(Decimal(str(b.quantity_kg)) * Decimal(str(b.cost_per_kg)) for b in active_batches)
        total_qty = sum(Decimal(str(b.quantity_kg)) for b in active_batches)
        
        if total_qty > 0:
            inventory.average_cost_per_kg = total_value / total_qty
    elif inventory.net_stock_kg <= 0:
        inventory.net_stock_kg = Decimal(0)
        inventory.current_stock_kg = Decimal(0)
    
    db.add(inventory)
    
    # 6. إنشاء قيد متوازن بمحرك المحاسبة - عكس قيد الشراء
    return_description = f"مرتجع مشتريات - فاتورة #{purchase.purchase_id}"
    
    accounts_payable_id = int(get_setting(db, "ACCOUNTS_PAYABLE_ID"))
    inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

    engine = get_engine(db)
    returned_cost_decimal = Decimal(str(returned_cost))
    
    engine.create_balanced_entry(
        entries=[
            LedgerEntry(account_id=accounts_payable_id, debit=returned_cost_decimal, credit=Decimal(0), description=return_description),
            LedgerEntry(account_id=inventory_id, debit=Decimal(0), credit=returned_cost_decimal, description=return_description),
        ],
        entry_date=purchase_return.return_date,
        source_type='PURCHASE_RETURN',
        source_id=db_purchase_return.return_id
    )
    
    # 7. تحديث إجمالي المشتراة الأصلية
    purchase.total_cost -= returned_cost
    purchase.quantity_kg -= purchase_return.quantity_kg
    
    db.commit()
    db.refresh(db_purchase_return)
    return db_purchase_return


def get_purchase_returns(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.PurchaseReturn)
        .options(joinedload(models.PurchaseReturn.purchase))
        .order_by(models.PurchaseReturn.return_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
