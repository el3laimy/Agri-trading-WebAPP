"""
Inventory CRUD Operations
"""
from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from app import models, schemas
from app.core.settings import get_setting


def get_or_create_inventory(db: Session, crop_id: int) -> models.Inventory:
    inventory = db.query(models.Inventory).filter(models.Inventory.crop_id == crop_id).first()
    if not inventory:
        inventory = models.Inventory(crop_id=crop_id)
        db.add(inventory)
        db.flush()
    return inventory


def get_inventory_levels(db: Session):
    return db.query(models.Inventory).options(joinedload(models.Inventory.crop)).all()


def create_inventory_adjustment(db: Session, adjustment: schemas.InventoryAdjustmentCreate) -> models.InventoryAdjustment:
    """
    إنشاء تعديل مخزون مع قيود محاسبية متوازنة.
    يستخدم AccountingEngine لضمان التوازن والدقة.
    """
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # 1. Get Inventory
    inventory = get_or_create_inventory(db, adjustment.crop_id)
    
    # 2. Determine Cost
    cost_per_kg = inventory.average_cost_per_kg
    total_value = adjustment.quantity_kg * cost_per_kg
    
    # 3. Create Adjustment Record
    db_adjustment = models.InventoryAdjustment(
        **adjustment.model_dump(),
        cost_per_kg=cost_per_kg,
        total_value=total_value
    )
    db.add(db_adjustment)
    db.flush()
    
    # 4. Update Inventory
    inventory.current_stock_kg += adjustment.quantity_kg
    db.add(inventory)
    
    # 5. Create balanced GL entries using AccountingEngine
    adj_description = f"تعديل مخزون - {adjustment.adjustment_type} - {adjustment.notes or ''}"
    abs_value = abs(total_value)
    
    engine = get_engine(db)
    
    if adjustment.quantity_kg < 0:
        # Loss/Spoilage: Debit Expense (Loss), Credit Inventory
        loss_id = int(get_setting(db, "INVENTORY_LOSS_ACCOUNT_ID", 50102))
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

        engine.create_balanced_entry(
            entries=[
                LedgerEntry(account_id=loss_id, debit=abs_value, credit=Decimal(0), description=adj_description),
                LedgerEntry(account_id=inventory_id, debit=Decimal(0), credit=abs_value, description=adj_description),
            ],
            entry_date=adjustment.adjustment_date,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        )
        
    elif adjustment.quantity_kg > 0:
        # Gain: Debit Inventory, Credit Revenue (Gain)
        gain_id = int(get_setting(db, "INVENTORY_GAIN_ACCOUNT_ID", 40102))
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

        engine.create_balanced_entry(
            entries=[
                LedgerEntry(account_id=inventory_id, debit=abs_value, credit=Decimal(0), description=adj_description),
                LedgerEntry(account_id=gain_id, debit=Decimal(0), credit=abs_value, description=adj_description),
            ],
            entry_date=adjustment.adjustment_date,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        )

    db.commit()
    db.refresh(db_adjustment)
    return db_adjustment


def delete_inventory_adjustment(db: Session, adjustment_id: int):
    """
    حذف تعديل مخزون مع عكس القيود المحاسبية.
    يستخدم AccountingEngine لضمان عكس الأرصدة بشكل صحيح.
    """
    from app.services.accounting_engine import get_engine
    
    # 1. Get adjustment
    adjustment = db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.adjustment_id == adjustment_id).first()
    if not adjustment:
        return None
        
    # 2. Get Inventory
    inventory = get_or_create_inventory(db, adjustment.crop_id)
    
    # 3. Reverse Inventory Update
    inventory.current_stock_kg -= adjustment.quantity_kg
    db.add(inventory)
    
    # 4. Reverse Financial Impact via AccountingEngine
    engine = get_engine(db)
    
    old_entries = db.query(models.GeneralLedger).filter(
        models.GeneralLedger.source_type == 'ADJUSTMENT',
        models.GeneralLedger.source_id == adjustment_id
    ).all()
    
    for entry in old_entries:
        engine._update_account_balance(
            entry.account_id,
            Decimal(str(entry.credit)),  # عكس: الدائن يصبح مدين
            Decimal(str(entry.debit))    # عكس: المدين يصبح دائن
        )
        db.delete(entry)

    # 5. Delete Adjustment
    db.delete(adjustment)
    db.commit()
    return True

