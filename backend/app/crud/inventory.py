"""
Inventory CRUD Operations
"""
from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from app import models, schemas
from app.core.settings import get_setting
from .finance import update_account_balance


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
    
    # 4. Update Inventory
    inventory.current_stock_kg += adjustment.quantity_kg
    db.add(inventory)
    
    # 5. Create General Ledger Entries
    adj_description = f"تعديل مخزون - {adjustment.adjustment_type} - {adjustment.notes or ''}"
    abs_value = abs(total_value)
    
    if adjustment.quantity_kg < 0:
        # Loss/Spoilage: Debit Expense (Loss), Credit Inventory
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
        db.add(models.GeneralLedger(
            entry_date=adjustment.adjustment_date,
            account_id=inventory_id,
            debit=0.0,
            credit=abs_value,
            description=adj_description,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        ))
        update_account_balance(db, loss_id, abs_value)
        update_account_balance(db, inventory_id, -abs_value)
        
    elif adjustment.quantity_kg > 0:
        # Gain: Debit Inventory, Credit Revenue (Gain)
        gain_id = int(get_setting(db, "INVENTORY_GAIN_ACCOUNT_ID", 40102))
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))

        db.add(models.GeneralLedger(
            entry_date=adjustment.adjustment_date,
            account_id=inventory_id,
            debit=abs_value,
            credit=0.0,
            description=adj_description,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        ))
        db.add(models.GeneralLedger(
            entry_date=adjustment.adjustment_date,
            account_id=gain_id,
            debit=0.0,
            credit=abs_value,
            description=adj_description,
            source_type='ADJUSTMENT',
            source_id=db_adjustment.adjustment_id
        ))
        update_account_balance(db, inventory_id, abs_value)
        update_account_balance(db, gain_id, -abs_value)

    db.commit()
    db.refresh(db_adjustment)
    return db_adjustment
