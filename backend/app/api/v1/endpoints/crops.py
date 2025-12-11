from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app import crud, models, schemas
from app.database import SessionLocal

router = APIRouter()

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Crop)
def create_crop(crop: schemas.CropCreate, db: Session = Depends(get_db)):
    db_crop = crud.get_crop_by_name(db, name=crop.crop_name)
    if db_crop:
        raise HTTPException(status_code=400, detail="Crop with this name already registered")
    
    new_crop = crud.create_crop(db=db, crop=crop)
    
    return schemas.Crop(
        crop_id=new_crop.crop_id,
        crop_name=new_crop.crop_name,
        allowed_pricing_units=json.loads(new_crop.allowed_pricing_units),
        conversion_factors=json.loads(new_crop.conversion_factors),
        is_active=new_crop.is_active
    )

@router.get("/", response_model=List[schemas.Crop])
def read_crops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_crops = crud.get_crops(db, skip=skip, limit=limit)
    response_crops = []
    for db_crop in db_crops:
        response_crop = schemas.Crop(
            crop_id=db_crop.crop_id,
            crop_name=db_crop.crop_name,
            allowed_pricing_units=json.loads(db_crop.allowed_pricing_units),
            conversion_factors=json.loads(db_crop.conversion_factors),
            is_active=db_crop.is_active
        )
        response_crops.append(response_crop)
    return response_crops

@router.get("/{crop_id}", response_model=schemas.Crop)
def read_crop(crop_id: int, db: Session = Depends(get_db)):
    db_crop = crud.get_crop(db, crop_id=crop_id)
    if db_crop is None:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    return schemas.Crop(
        crop_id=db_crop.crop_id,
        crop_name=db_crop.crop_name,
        allowed_pricing_units=json.loads(db_crop.allowed_pricing_units),
        conversion_factors=json.loads(db_crop.conversion_factors),
        is_active=db_crop.is_active
    )

@router.put("/{crop_id}", response_model=schemas.Crop)
def update_crop(crop_id: int, crop: schemas.CropCreate, db: Session = Depends(get_db)):
    db_crop = crud.get_crop(db, crop_id=crop_id)
    if db_crop is None:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    # Update crop fields
    db_crop.crop_name = crop.crop_name
    db_crop.allowed_pricing_units = json.dumps(crop.allowed_pricing_units)
    db_crop.conversion_factors = json.dumps(crop.conversion_factors)
    
    db.commit()
    db.refresh(db_crop)
    
    return schemas.Crop(
        crop_id=db_crop.crop_id,
        crop_name=db_crop.crop_name,
        allowed_pricing_units=json.loads(db_crop.allowed_pricing_units),
        conversion_factors=json.loads(db_crop.conversion_factors),
        is_active=db_crop.is_active
    )

@router.delete("/{crop_id}")
def delete_crop(crop_id: int, db: Session = Depends(get_db)):
    db_crop = crud.get_crop(db, crop_id=crop_id)
    if db_crop is None:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    # Check if crop is used in any sales or purchases
    if db_crop.sales or db_crop.purchases:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete crop that has associated sales or purchases"
        )
    
    db.delete(db_crop)
    db.commit()
    
    return {"message": "Crop deleted successfully"}

