from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.PurchaseReturnRead)
def create_purchase_return(purchase_return: schemas.PurchaseReturnCreate, db: Session = Depends(get_db)):
    """Create a purchase return"""
    try:
        return crud.create_purchase_return(db=db, purchase_return=purchase_return)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/", response_model=List[schemas.PurchaseReturnRead])
def get_purchase_returns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all purchase returns"""
    return crud.get_purchase_returns(db, skip=skip, limit=limit)
