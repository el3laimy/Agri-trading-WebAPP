from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import json

from app import crud, schemas
from app.api.v1.endpoints.crops import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.InventoryRead])
def read_inventory_levels(db: Session = Depends(get_db)):
    inventory_levels = crud.get_inventory_levels(db)
    
    response_inventory = []
    for inv in inventory_levels:
        # We need to manually convert the JSON strings in Crop to objects
        # because the ORM model stores them as Text.
        # Note: Ideally this should be handled by a Pydantic validator or a model property.
        try:
            allowed_units = json.loads(inv.crop.allowed_pricing_units)
        except (json.JSONDecodeError, TypeError):
            allowed_units = [str(inv.crop.allowed_pricing_units)] if inv.crop.allowed_pricing_units else []

        try:
            factors = json.loads(inv.crop.conversion_factors)
        except (json.JSONDecodeError, TypeError):
            factors = {}

        response_crop = schemas.Crop(
            crop_id=inv.crop.crop_id,
            crop_name=inv.crop.crop_name,
            is_active=inv.crop.is_active,
            allowed_pricing_units=allowed_units,
            conversion_factors=factors
        )
        
        inv_response = schemas.InventoryRead(
            current_stock_kg=inv.current_stock_kg,
            average_cost_per_kg=inv.average_cost_per_kg,
            crop=response_crop
        )
        response_inventory.append(inv_response)
        
    return response_inventory

@router.post("/adjustments", response_model=schemas.InventoryAdjustmentRead)
def create_inventory_adjustment(adjustment: schemas.InventoryAdjustmentCreate, db: Session = Depends(get_db)):
    return crud.create_inventory_adjustment(db=db, adjustment=adjustment)

@router.get("/{crop_id}/batches")
def get_crop_batches(crop_id: int, db: Session = Depends(get_db)):
    """Get active batches for a specific crop"""
    from app.models import InventoryBatch
    batches = db.query(InventoryBatch).filter(
        InventoryBatch.crop_id == crop_id,
        InventoryBatch.is_active == True,
        InventoryBatch.quantity_kg > 0
    ).order_by(InventoryBatch.purchase_date.asc()).all()
    
    return [
        {
            "batch_id": b.batch_id,
            "quantity_kg": b.quantity_kg,
            "cost_per_kg": b.cost_per_kg,
            "purchase_date": b.purchase_date,
            "expiry_date": b.expiry_date,
            "supplier_name": b.supplier.name if b.supplier else "N/A"
        }
        for b in batches
    ]
