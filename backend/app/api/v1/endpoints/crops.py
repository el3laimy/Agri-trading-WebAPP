from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import json

from app import crud, models, schemas
from app.database import SessionLocal
from app.core.calculation_formulas import get_available_formulas

router = APIRouter()

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _crop_to_response(db_crop) -> schemas.Crop:
    """Helper function to convert DB crop to response schema"""
    return schemas.Crop(
        crop_id=db_crop.crop_id,
        crop_name=db_crop.crop_name,
        allowed_pricing_units=json.loads(db_crop.allowed_pricing_units),
        conversion_factors=json.loads(db_crop.conversion_factors),
        is_active=db_crop.is_active,
        is_complex_unit=db_crop.is_complex_unit or False,
        default_tare_per_bag=db_crop.default_tare_per_bag or 0,
        standard_unit_weight=db_crop.standard_unit_weight
    )

@router.get("/formulas")
def get_calculation_formulas():
    """إرجاع قائمة صيغ الحساب المتاحة"""
    return get_available_formulas()

@router.post("/", response_model=schemas.Crop)
def create_crop(crop: schemas.CropCreate, db: Session = Depends(get_db)):
    db_crop = crud.get_crop_by_name(db, name=crop.crop_name)
    if db_crop:
        raise HTTPException(status_code=400, detail="يوجد محصول بهذا الاسم بالفعل")
    
    new_crop = crud.create_crop(db=db, crop=crop)
    return _crop_to_response(new_crop)

@router.get("/", response_model=List[schemas.Crop])
def read_crops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_crops = crud.get_crops(db, skip=skip, limit=limit)
    return [_crop_to_response(db_crop) for db_crop in db_crops]

@router.get("/{crop_id}", response_model=schemas.Crop)
def read_crop(crop_id: int, db: Session = Depends(get_db)):
    db_crop = crud.get_crop(db, crop_id=crop_id)
    if db_crop is None:
        raise HTTPException(status_code=404, detail="المحصول غير موجود")
    
    return _crop_to_response(db_crop)

@router.put("/{crop_id}", response_model=schemas.Crop)
def update_crop(crop_id: int, crop: schemas.CropCreate, db: Session = Depends(get_db)):
    db_crop = crud.get_crop(db, crop_id=crop_id)
    if db_crop is None:
        raise HTTPException(status_code=404, detail="المحصول غير موجود")
    
    # Update crop fields
    db_crop.crop_name = crop.crop_name
    db_crop.allowed_pricing_units = json.dumps(crop.allowed_pricing_units)
    db_crop.conversion_factors = json.dumps(crop.conversion_factors)
    db_crop.is_active = crop.is_active
    db_crop.is_complex_unit = crop.is_complex_unit
    db_crop.default_tare_per_bag = crop.default_tare_per_bag
    db_crop.standard_unit_weight = crop.standard_unit_weight
    
    db.commit()
    db.refresh(db_crop)
    
    return _crop_to_response(db_crop)

@router.delete("/{crop_id}")
def delete_crop(crop_id: int, db: Session = Depends(get_db)):
    db_crop = crud.get_crop(db, crop_id=crop_id)
    if db_crop is None:
        raise HTTPException(status_code=404, detail="المحصول غير موجود")
    
    # Check for direct relationship dependencies
    # We use our new helper to get a detailed report
    dependencies = crud.get_crop_dependencies(db, crop_id)
    
    total_conflicts = sum(dependencies.values())
    
    if total_conflicts > 0:
        # Return 409 Conflict with details
        # We need to structure the response so frontend can parse it
        return JSONResponse(
            status_code=409,
            content={
                "detail": "لا يمكن حذف المحصول لأنه مرتبط بعمليات أخرى",
                "conflicts": dependencies
            }
        )
    
    db.delete(db_crop)
    db.commit()
    
    return {"message": "تم حذف المحصول بنجاح"}

@router.post("/{crop_id}/migrate-and-delete")
def migrate_and_delete_crop(
    crop_id: int, 
    migration_request: schemas.CropMigrationRequest,
    db: Session = Depends(get_db)
):
    """
    Migrate data from crop_id to target_crop_id then delete crop_id
    """
    source_crop = crud.get_crop(db, crop_id)
    if not source_crop:
        raise HTTPException(status_code=404, detail="المحصول المراد حذفه غير موجود")
        
    target_crop = crud.get_crop(db, migration_request.target_crop_id)
    if not target_crop:
        raise HTTPException(status_code=404, detail="المحصول الهدف غير موجود")
        
    if crop_id == migration_request.target_crop_id:
        raise HTTPException(status_code=400, detail="لا يمكن النقل لنفس المحصول")
        
    crud.migrate_crop_data(db, crop_id, migration_request.target_crop_id)
    
    return {"message": f"تم نقل البيانات إلى {target_crop.crop_name} وحذف المحصول القديم بنجاح"}

@router.delete("/{crop_id}/force")
def force_delete_crop(crop_id: int, db: Session = Depends(get_db)):
    """
    Destructive: Delete crop and ALL related data
    """
    db_crop = crud.get_crop(db, crop_id=crop_id)
    if db_crop is None:
        raise HTTPException(status_code=404, detail="المحصول غير موجود")
        
    crud.delete_crop_with_dependencies(db, crop_id)
    
    return {"message": "تم حذف المحصول وجميع السجلات المرتبطة به بنجاح"}

