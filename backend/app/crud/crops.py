"""
Crop CRUD Operations
"""
from sqlalchemy.orm import Session
import json
from app import models, schemas


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
        is_active=crop.is_active
    )
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop


def delete_crop(db: Session, crop_id: int):
    """Basic delete, will fail if foreign keys exist"""
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
    
    # Handle Inventory migration (1:1 relationship)
    target_inventory = db.query(models.Inventory).filter(models.Inventory.crop_id == new_crop_id).first()
    if target_inventory:
        # Move Stock
        source_inventory = db.query(models.Inventory).filter(models.Inventory.crop_id == old_crop_id).first()
        if source_inventory:
            target_inventory.current_stock_kg += source_inventory.current_stock_kg
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
