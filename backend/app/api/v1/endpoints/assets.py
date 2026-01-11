from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, models
from app.api.v1.endpoints.crops import get_db
from pydantic import BaseModel
from datetime import date
from decimal import Decimal

router = APIRouter()

class FixedAssetBase(BaseModel):
    name: str
    purchase_date: date
    cost: Decimal
    depreciation_rate: Decimal
    status: str = "ACTIVE"
    notes: str = None

class FixedAssetCreate(FixedAssetBase):
    pass

class FixedAssetRead(FixedAssetBase):
    asset_id: int
    current_value: Decimal

    class Config:
        from_attributes = True

@router.post("/", response_model=FixedAssetRead)
def create_asset(asset: FixedAssetCreate, db: Session = Depends(get_db)):
    # Calculate initial current value (same as cost)
    db_asset = models.FixedAsset(**asset.model_dump(), current_value=asset.cost)
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/", response_model=List[FixedAssetRead])
def read_assets(db: Session = Depends(get_db)):
    return db.query(models.FixedAsset).all()

@router.post("/{asset_id}/depreciate")
def calculate_depreciation(asset_id: int, db: Session = Depends(get_db)):
    """
    Simulate depreciation calculation (simplified).
    In real app, this would be a scheduled task or end-of-year process.
    """
    asset = db.query(models.FixedAsset).filter(models.FixedAsset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Simple straight-line depreciation for 1 year
    depreciation_amount = asset.cost * (asset.depreciation_rate / 100)

    if asset.current_value < depreciation_amount:
        depreciation_amount = asset.current_value

    asset.current_value -= depreciation_amount
    db.commit()
    db.refresh(asset)

    return {"message": "Depreciation applied", "new_value": asset.current_value, "depreciation_amount": depreciation_amount}
