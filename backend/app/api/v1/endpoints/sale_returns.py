from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.SaleReturnRead)
def create_sale_return(sale_return: schemas.SaleReturnCreate, db: Session = Depends(get_db)):
    """Create a sale return"""
    try:
        return crud.create_sale_return(db=db, sale_return=sale_return)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/", response_model=List[schemas.SaleReturnRead])
def get_sale_returns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all sale returns"""
    return crud.get_sale_returns(db, skip=skip, limit=limit)
