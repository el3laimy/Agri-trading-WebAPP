"""
Sale and Purchase Returns CRUD Operations
"""
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.core.settings import get_setting
from .finance import update_account_balance
from .inventory import get_or_create_inventory


def create_sale_return(db: Session, sale_return: schemas.SaleReturnCreate) -> models.SaleReturn:
    """
    إنشاء مرتجع مبيعات مع القيود المحاسبية
    القيد: من حـ/ إيرادات المبيعات إلى حـ/ الذمم المدينة
    """
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
    
    # 4. Update inventory - add back the returned quantity
    inventory = get_or_create_inventory(db, sale.crop_id)
    inventory.current_stock_kg += sale_return.quantity_kg
    db.add(inventory)
    
    # 5. إضافة القيود المحاسبية - عكس قيد البيع
    return_description = f"مرتجع مبيعات - فاتورة #{sale.sale_id}"
    
    sales_revenue_id = int(get_setting(db, "SALES_REVENUE_ACCOUNT_ID"))
    accounts_receivable_id = int(get_setting(db, "ACCOUNTS_RECEIVABLE_ID"))

    # مدين: إيرادات المبيعات (تخفيض الإيراد)
    debit_entry = models.GeneralLedger(
        entry_date=sale_return.return_date,
        account_id=sales_revenue_id,
        debit=refund_amount,
        credit=0.0,
        description=return_description,
        source_type='SALE_RETURN',
        source_id=db_sale_return.return_id
    )
    db.add(debit_entry)
    
    # دائن: الذمم المدينة (تخفيض دين العميل)
    credit_entry = models.GeneralLedger(
        entry_date=sale_return.return_date,
        account_id=accounts_receivable_id,
        debit=0.0,
        credit=refund_amount,
        description=return_description,
        source_type='SALE_RETURN',
        source_id=db_sale_return.return_id
    )
    db.add(credit_entry)
    
    # 6. تحديث أرصدة الحسابات
    update_account_balance(db, sales_revenue_id, refund_amount)
    update_account_balance(db, accounts_receivable_id, -refund_amount)
    
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
    """
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
    
    # 4. Update inventory - subtract the returned quantity
    inventory = get_or_create_inventory(db, purchase.crop_id)
    inventory.current_stock_kg -= purchase_return.quantity_kg
    db.add(inventory)
    
    # 5. إضافة القيود المحاسبية - عكس قيد الشراء
    return_description = f"مرتجع مشتريات - فاتورة #{purchase.purchase_id}"
    
    accounts_payable_id = int(get_setting(db, "ACCOUNTS_PAYABLE_ID"))
    inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

    # مدين: الذمم الدائنة (تخفيض دينا للمورد)
    debit_entry = models.GeneralLedger(
        entry_date=purchase_return.return_date,
        account_id=accounts_payable_id,
        debit=returned_cost,
        credit=0.0,
        description=return_description,
        source_type='PURCHASE_RETURN',
        source_id=db_purchase_return.return_id
    )
    db.add(debit_entry)
    
    # دائن: المخزون (تخفيض قيمة المخزون)
    credit_entry = models.GeneralLedger(
        entry_date=purchase_return.return_date,
        account_id=inventory_id,
        debit=0.0,
        credit=returned_cost,
        description=return_description,
        source_type='PURCHASE_RETURN',
        source_id=db_purchase_return.return_id
    )
    db.add(credit_entry)
    
    # 6. تحديث أرصدة الحسابات
    update_account_balance(db, accounts_payable_id, -returned_cost)
    update_account_balance(db, inventory_id, -returned_cost)
    
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
