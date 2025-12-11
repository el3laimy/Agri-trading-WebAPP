from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.DailyPriceRead)
def create_daily_price(price: schemas.DailyPriceCreate, db: Session = Depends(get_db)):
    """Create a new daily price record"""
    return crud.create_daily_price(db=db, price=price)

@router.get("/", response_model=List[schemas.DailyPriceRead])
def get_daily_prices(
    crop_id: Optional[int] = Query(None, description="Filter by crop ID"),
    start_date: Optional[date] = Query(None, description="Start date for filtering"),
    end_date: Optional[date] = Query(None, description="End date for filtering"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get daily prices with optional filters"""
    return crud.get_daily_prices(
        db, 
        crop_id=crop_id, 
        start_date=start_date, 
        end_date=end_date, 
        skip=skip, 
        limit=limit
    )
