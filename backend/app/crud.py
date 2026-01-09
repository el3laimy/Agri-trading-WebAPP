from sqlalchemy.orm import Session, joinedload
import json
from . import models, schemas
from .core.settings import get_setting

# --- Crop CRUD Functions ---

def get_crop(db: Session, crop_id: int):
    return db.query(models.Crop).filter(models.Crop.crop_id == crop_id).first()

def get_crop_by_name(db: Session, name: str):
    return db.query(models.Crop).filter(models.Crop.crop_name == name).first()

def get_crops(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Crop).offset(skip).limit(limit).all()

def create_crop(db: Session, crop: schemas.CropCreate):
    db_crop = models.Crop(
        crop_name=crop.crop_name,
        allowed_pricing_units=json.dumps(crop.allowed_pricing_units),
        conversion_factors=json.dumps(crop.conversion_factors),
        is_active=crop.is_active,
        is_complex_unit=crop.is_complex_unit,
        default_tare_per_bag=crop.default_tare_per_bag,
        standard_unit_weight=crop.standard_unit_weight
    )
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop

def delete_crop(db: Session, crop_id: int):
    # Basic delete, will fail if foreign keys exist
    db_crop = get_crop(db, crop_id)
    if db_crop:
        db.delete(db_crop)
        db.commit()
    return db_crop

def get_crop_dependencies(db: Session, crop_id: int) -> dict:
    """Check for dependent records in various tables"""
    dependencies = {
        "sales": db.query(models.Sale).filter(models.Sale.crop_id == crop_id).count(),
        "purchases": db.query(models.Purchase).filter(models.Purchase.crop_id == crop_id).count(),
        "inventory": db.query(models.Inventory).filter(models.Inventory.crop_id == crop_id).count(),
        "inventory_batches": db.query(models.InventoryBatch).filter(models.InventoryBatch.crop_id == crop_id).count(),
        "supply_contracts": db.query(models.SupplyContract).filter(models.SupplyContract.crop_id == crop_id).count(),
        "daily_prices": db.query(models.DailyPrice).filter(models.DailyPrice.crop_id == crop_id).count(),
        "inventory_adjustments": db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.crop_id == crop_id).count(),
    }
    return dependencies

def migrate_crop_data(db: Session, old_crop_id: int, new_crop_id: int):
    """Migrate all related data from old_crop_id to new_crop_id"""
    
    # Update related tables
    db.query(models.Sale).filter(models.Sale.crop_id == old_crop_id).update({"crop_id": new_crop_id})
    db.query(models.Purchase).filter(models.Purchase.crop_id == old_crop_id).update({"crop_id": new_crop_id})
    db.query(models.Inventory).filter(models.Inventory.crop_id == old_crop_id).update({"crop_id": new_crop_id}) # Likely to fail unique constraint if new crop already has inventory, handled in logic? Actually Inventory is usually 1:1. 
    # For Inventory: if target crop already has inventory, we might need to merge. 
    # Current simple logic: specific inventory row update might fail. 
    # Better logic for inventory: Delete old inventory row if target exists, or update if not.
    # Check if target inventory exists
    target_inventory = db.query(models.Inventory).filter(models.Inventory.crop_id == new_crop_id).first()
    if target_inventory:
         # Move Stock
         source_inventory = db.query(models.Inventory).filter(models.Inventory.crop_id == old_crop_id).first()
         if source_inventory:
             target_inventory.current_stock_kg += source_inventory.current_stock_kg
             # Recalculate average cost? Complex. For now just accum stock.
             db.delete(source_inventory)
    else:
        db.query(models.Inventory).filter(models.Inventory.crop_id == old_crop_id).update({"crop_id": new_crop_id})

    db.query(models.InventoryBatch).filter(models.InventoryBatch.crop_id == old_crop_id).update({"crop_id": new_crop_id})
    db.query(models.SupplyContract).filter(models.SupplyContract.crop_id == old_crop_id).update({"crop_id": new_crop_id})
    db.query(models.DailyPrice).filter(models.DailyPrice.crop_id == old_crop_id).update({"crop_id": new_crop_id})
    db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.crop_id == old_crop_id).update({"crop_id": new_crop_id})
    
    db.commit()
    
    # Finally delete the old crop
    delete_crop(db, old_crop_id)

def delete_crop_with_dependencies(db: Session, crop_id: int):
    """Force delete crop and all its related data"""
    
    # Delete related records first
    db.query(models.Sale).filter(models.Sale.crop_id == crop_id).delete()
    db.query(models.Purchase).filter(models.Purchase.crop_id == crop_id).delete()
    db.query(models.InventoryBatch).filter(models.InventoryBatch.crop_id == crop_id).delete()
    db.query(models.SupplyContract).filter(models.SupplyContract.crop_id == crop_id).delete()
    db.query(models.DailyPrice).filter(models.DailyPrice.crop_id == crop_id).delete()
    db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.crop_id == crop_id).delete()
    db.query(models.Inventory).filter(models.Inventory.crop_id == crop_id).delete()
    
    db.commit()
    
    # Delete the crop
    delete_crop(db, crop_id)

# --- Contact CRUD Functions ---

def get_contact(db: Session, contact_id: int):
    return db.query(models.Contact).filter(models.Contact.contact_id == contact_id).first()

def get_contacts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Contact).offset(skip).limit(limit).all()

def create_contact(db: Session, contact: schemas.ContactCreate):
    db_contact = models.Contact(**contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

# --- Financial Account CRUD Functions ---

def get_financial_account(db: Session, account_id: int):
    return db.query(models.FinancialAccount).filter(models.FinancialAccount.account_id == account_id).first()

def get_financial_accounts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FinancialAccount).order_by(models.FinancialAccount.account_name).offset(skip).limit(limit).all()

def create_financial_account(db: Session, account: schemas.FinancialAccountCreate) -> models.FinancialAccount:
    db_account = models.FinancialAccount(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_financial_account(db: Session, account_id: int, account_update: schemas.FinancialAccountUpdate) -> models.FinancialAccount:
    db_account = get_financial_account(db, account_id)
    if db_account:
        update_data = account_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_account, key, value)
        db.commit()
        db.refresh(db_account)
    return db_account

def delete_financial_account(db: Session, account_id: int) -> models.FinancialAccount:
    db_account = get_financial_account(db, account_id)
    if db_account:
        db_account.is_active = False
        db.commit()
        db.refresh(db_account)
    return db_account

def update_balance_by_nature(db: Session, account_id: int, amount: float, entry_type: str):
    """
    تحديث رصيد الحساب بناءً على طبيعته.
    
    Args:
        db: جلسة قاعدة البيانات
        account_id: معرف الحساب
        amount: المبلغ (دائماً موجب)
        entry_type: نوع القيد ('debit' أو 'credit')
        
    Logic:
        - الأصول والمصروفات (طبيعتها مدينة): 
            - Debit يزيد الرصيد
            - Credit ينقص الرصيد
        - الخصوم، الإيرادات، حقوق الملكية (طبيعتها دائنة):
            - Credit يزيد الرصيد
            - Debit ينقص الرصيد
    """
    account = db.query(models.FinancialAccount).filter(models.FinancialAccount.account_id == account_id).first()
    if not account:
        return

    # تحديد ما إذا كان الحساب طبيعته مدينة
    # ASSET, CASH, EXPENSE, RECEIVABLE -> Debit increases
    is_normal_debit = account.account_type in ['ASSET', 'CASH', 'EXPENSE', 'RECEIVABLE']
    
    from decimal import Decimal
    change = Decimal(0)
    # Ensure amount is Decimal. Convert to string first to avoid float precision issues if input is float
    amount = Decimal(str(amount)) 
    
    if is_normal_debit:
        if entry_type.lower() == 'debit':
            change = amount
        else:
            change = -amount
    else:
        # LIABILITY, EQUITY, REVENUE, PAYABLE -> Credit increases
        if entry_type.lower() == 'credit':
            change = amount
        else:
            change = -amount
            
    account.current_balance += change
    db.add(account)

# Legacy wrapper for backward compatibility if needed, but better to refactor usage
def update_account_balance(db: Session, account_id: int, amount: float):
    # This old function assumed the caller knew the sign (+/-)
    # We will deprecate it, but keep it for now if needed.
    # Actually, let's keep it simple: just update the balance.
    account = db.query(models.FinancialAccount).filter(models.FinancialAccount.account_id == account_id).first()
    if account:
        from decimal import Decimal
        account.current_balance += Decimal(str(amount))
        db.add(account)

# --- General Ledger CRUD Functions ---

def create_ledger_entry(db: Session, entry: schemas.GeneralLedgerCreate, source_type: str, source_id: int, created_by: int = None):
    db_entry = models.GeneralLedger(
        **entry.model_dump(),
        source_type=source_type,
        source_id=source_id,
        created_by=created_by
    )
    db.add(db_entry)
    return db_entry

# --- Inventory CRUD Functions ---

def get_or_create_inventory(db: Session, crop_id: int) -> models.Inventory:
    inventory = db.query(models.Inventory).filter(models.Inventory.crop_id == crop_id).first()
    if not inventory:
        inventory = models.Inventory(crop_id=crop_id)
        db.add(inventory)
        db.flush() # Use flush to get the object in the session without committing
    return inventory

def get_inventory_levels(db: Session):
    return db.query(models.Inventory).options(joinedload(models.Inventory.crop)).all()

def create_inventory_adjustment(db: Session, adjustment: schemas.InventoryAdjustmentCreate) -> models.InventoryAdjustment:
    # 1. Get Inventory
    inventory = get_or_create_inventory(db, adjustment.crop_id)
    
    # 2. Determine Cost
    # Use current average cost for the adjustment value
    cost_per_kg = inventory.average_cost_per_kg
    total_value = adjustment.quantity_kg * cost_per_kg
    
    # 3. Create Adjustment Record
    db_adjustment = models.InventoryAdjustment(
        **adjustment.model_dump(),
        cost_per_kg=cost_per_kg,
        total_value=total_value
    )
    db.add(db_adjustment)
    
    # 4. Update Inventory
    inventory.current_stock_kg += adjustment.quantity_kg
    db.add(inventory)
    
    # 5. Create General Ledger Entries (تأثير مالي)
    adj_description = f"تعديل مخزون - {adjustment.adjustment_type} - {adjustment.notes or ''}"
    abs_value = abs(total_value)
    
    if adjustment.quantity_kg < 0:
        # Loss/Spoilage: Debit Expense (Loss), Credit Inventory
        # Debit Loss
        loss_id = int(get_setting(db, "INVENTORY_LOSS_ACCOUNT_ID", 50102))
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

        db.add(models.GeneralLedger(
            entry_date=adjustment.adjustment_date,
            account_id=loss_id,
            debit=abs_value,
            credit=0.0,
            description=adj_description,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        ))
        # Credit Inventory
        db.add(models.GeneralLedger(
            entry_date=adjustment.adjustment_date,
            account_id=inventory_id,
            debit=0.0,
            credit=abs_value,
            description=adj_description,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        ))
        # Update Balances
        update_account_balance(db, loss_id, abs_value)
        update_account_balance(db, inventory_id, -abs_value)
        
    elif adjustment.quantity_kg > 0:
        # Gain: Debit Inventory, Credit Revenue (Gain)
        gain_id = int(get_setting(db, "INVENTORY_GAIN_ACCOUNT_ID", 40102))
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

        # Debit Inventory
        db.add(models.GeneralLedger(
            entry_date=adjustment.adjustment_date,
            account_id=inventory_id,
            debit=abs_value,
            credit=0.0,
            description=adj_description,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        ))
        # Credit Revenue
        db.add(models.GeneralLedger(
            entry_date=adjustment.adjustment_date,
            account_id=gain_id,
            debit=0.0,
            credit=abs_value,
            description=adj_description,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        ))
        # Update Balances
        update_account_balance(db, inventory_id, abs_value)
        update_account_balance(db, gain_id, -abs_value)

    db.commit()
    db.refresh(db_adjustment)
    return db_adjustment

# --- Purchase CRUD Functions ---

def get_purchases(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Purchase)
        .options(joinedload(models.Purchase.crop), joinedload(models.Purchase.supplier))
        .order_by(models.Purchase.purchase_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_purchase_record(db: Session, purchase_data: dict) -> models.Purchase:
    db_purchase = models.Purchase(**purchase_data)
    db.add(db_purchase)
    db.flush() # Flush to get the purchase_id
    
    # Create Audit Log
    db_log = models.AuditLog(
        action_type="CREATE",
        table_name="purchases",
        record_id=db_purchase.purchase_id,
        new_values=json.dumps(purchase_data, default=str),
        user_id=purchase_data.get('created_by')
    )
    db.add(db_log)
    
    return db_purchase


# --- Sale CRUD Functions ---

def get_sales(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Sale)
        .options(joinedload(models.Sale.crop), joinedload(models.Sale.customer))
        .order_by(models.Sale.sale_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_sale_record(db: Session, sale_data: dict) -> models.Sale:
    db_sale = models.Sale(**sale_data)
    db.add(db_sale)
    return db_sale

# --- Expense CRUD Functions ---

def get_expenses(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Expense)
        .options(
            joinedload(models.Expense.credit_account),
            joinedload(models.Expense.debit_account),
            joinedload(models.Expense.supplier)
        )
        .order_by(models.Expense.expense_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_expense(db: Session, expense: schemas.ExpenseCreate, user_id: int = None) -> models.Expense:
    # 1. Create the expense record
    expense_data = expense.model_dump()
    expense_data['created_by'] = user_id
    db_expense = models.Expense(**expense_data)
    db.add(db_expense)
    db.flush() # Flush to get the expense_id for the ledger entries

    # 2. Create General Ledger entries for the double-entry bookkeeping
    # Debit the expense account
    debit_entry = models.GeneralLedger(
        entry_date=db_expense.expense_date,
        account_id=db_expense.debit_account_id,
        debit=db_expense.amount,
        credit=0,
        description=f"Expense: {db_expense.description}",
        source_type='EXPENSE',
        source_id=db_expense.expense_id
    )
    db.add(debit_entry)

    # Credit the cash/bank account
    credit_entry = models.GeneralLedger(
        entry_date=db_expense.expense_date,
        account_id=db_expense.credit_account_id,
        debit=0,
        credit=db_expense.amount,
        description=f"Expense: {db_expense.description}",
        source_type='EXPENSE',
        source_id=db_expense.expense_id
    )
    db.add(credit_entry)

    # 3. Update account balances
    update_account_balance(db, account_id=db_expense.debit_account_id, amount=db_expense.amount) # Balance increases for debit expense accounts
    update_account_balance(db, account_id=db_expense.credit_account_id, amount=-db_expense.amount) # Balance decreases for credit asset accounts

    db.commit()
    db.refresh(db_expense)
    return db_expense

# --- Sale Return CRUD Functions ---

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
    update_account_balance(db, sales_revenue_id, refund_amount)  # increase (debit)
    update_account_balance(db, accounts_receivable_id, -refund_amount)  # decrease (credit)
    
    # 7. تحديث إجمالي المبيعة الأصلية (اختياري)
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

# --- Purchase Return CRUD Functions ---

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
    update_account_balance(db, accounts_payable_id, -returned_cost)  # decrease payable (debit)
    update_account_balance(db, inventory_id, -returned_cost)  # decrease inventory (credit)
    
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

# --- Season CRUD Functions ---

def get_seasons(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Season).order_by(models.Season.start_date.desc()).offset(skip).limit(limit).all()

def get_season(db: Session, season_id: int):
    return db.query(models.Season).filter(models.Season.season_id == season_id).first()

def create_season(db: Session, season: schemas.SeasonCreate) -> models.Season:
    db_season = models.Season(**season.model_dump())
    db.add(db_season)
    db.commit()
    db.refresh(db_season)
    return db_season

def update_season(db: Session, season_id: int, season_update: schemas.SeasonUpdate) -> models.Season:
    db_season = get_season(db, season_id)
    if db_season:
        update_data = season_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_season, key, value)
        db.commit()
        db.refresh(db_season)
    return db_season

def delete_season(db: Session, season_id: int) -> models.Season:
    db_season = get_season(db, season_id)
    if db_season:
        db.delete(db_season)
        db.commit()
    return db_season

# --- Daily Price CRUD Functions ---

def create_daily_price(db: Session, price: schemas.DailyPriceCreate) -> models.DailyPrice:
    db_price = models.DailyPrice(**price.model_dump())
    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price

def get_daily_prices(db: Session, crop_id: int = None, start_date = None, end_date = None, skip: int = 0, limit: int = 100):
    query = db.query(models.DailyPrice).options(joinedload(models.DailyPrice.crop))
    
    if crop_id:
        query = query.filter(models.DailyPrice.crop_id == crop_id)
    if start_date:
        query = query.filter(models.DailyPrice.price_date >= start_date)
    if end_date:
        query = query.filter(models.DailyPrice.price_date <= end_date)
    
    return query.order_by(models.DailyPrice.price_date.desc()).offset(skip).limit(limit).all()
