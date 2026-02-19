from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db
from app.services import season_closing

router = APIRouter()

@router.get("/", response_model=List[schemas.SeasonRead])
def get_seasons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all seasons"""
    seasons = crud.get_seasons(db, skip=skip, limit=limit)
    return seasons

@router.get("/{season_id}", response_model=schemas.SeasonRead)
def get_season(season_id: int, db: Session = Depends(get_db)):
    """Get a specific season by ID"""
    season = crud.get_season(db, season_id=season_id)
    if season is None:
        raise HTTPException(status_code=404, detail="الموسم غير موجود")
    return season

@router.get("/{season_id}/summary")
def get_season_summary(season_id: int, db: Session = Depends(get_db)):
    """الحصول على ملخص الموسم (المبيعات، المشتريات، المصروفات)"""
    return season_closing.get_season_summary(db, season_id)

@router.post("/", response_model=schemas.SeasonRead)
def create_season(season: schemas.SeasonCreate, db: Session = Depends(get_db)):
    """Create a new season"""
    return crud.create_season(db=db, season=season)

@router.put("/{season_id}", response_model=schemas.SeasonRead)
def update_season(season_id: int, season_update: schemas.SeasonUpdate, db: Session = Depends(get_db)):
    """Update a season"""
    db_season = crud.update_season(db, season_id=season_id, season_update=season_update)
    if db_season is None:
        raise HTTPException(status_code=404, detail="الموسم غير موجود")
    return db_season

@router.post("/{season_id}/activate", response_model=schemas.SeasonRead)
def activate_season(season_id: int, db: Session = Depends(get_db)):
    """
    تفعيل الموسم الحالي
    """
    db_season = crud.activate_season(db, season_id=season_id)
    if db_season is None:
        raise HTTPException(status_code=404, detail="الموسم غير موجود")
    return db_season

@router.post("/{season_id}/close")
def close_season(season_id: int, db: Session = Depends(get_db)):
    """
    إغلاق الموسم وترحيل الأرباح
    
    - يحسب صافي الربح (الإيرادات - المصروفات)
    - يرحل الربح لحساب الأرباح المرحلة
    - يغير حالة الموسم إلى COMPLETED
    - لا يصفر أرصدة الموردين/العملاء/الخزينة
    """
    return season_closing.close_season(db, season_id)

@router.delete("/{season_id}", response_model=schemas.SeasonRead)
def delete_season(season_id: int, db: Session = Depends(get_db)):
    """Delete a season"""
    db_season = crud.delete_season(db, season_id=season_id)
    if db_season is None:
        raise HTTPException(status_code=404, detail="الموسم غير موجود")
    return db_season

