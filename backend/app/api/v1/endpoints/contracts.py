from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ....database import get_db
from ....models import SupplyContract, SupplierRating, Contact
from ....schemas import (
    SupplyContractCreate, SupplyContractRead, 
    SupplierRatingCreate, SupplierRatingRead
)

router = APIRouter()

# --- Contracts ---

@router.post("/contracts/", response_model=SupplyContractRead)
def create_contract(
    contract: SupplyContractCreate, 
    db: Session = Depends(get_db)
):
    total_amount = contract.quantity_kg * contract.price_per_kg
    db_contract = SupplyContract(
        supplier_id=contract.supplier_id,
        crop_id=contract.crop_id,
        contract_date=contract.contract_date,
        delivery_date=contract.delivery_date,
        quantity_kg=contract.quantity_kg,
        price_per_kg=contract.price_per_kg,
        total_amount=total_amount,
        status=contract.status,
        notes=contract.notes
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

@router.get("/contracts/", response_model=List[SupplyContractRead])
def get_contracts(
    skip: int = 0, 
    limit: int = 100, 
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SupplyContract)
    if supplier_id:
        query = query.filter(SupplyContract.supplier_id == supplier_id)
    if status:
        query = query.filter(SupplyContract.status == status)
    
    return query.offset(skip).limit(limit).all()

@router.put("/contracts/{contract_id}", response_model=SupplyContractRead)
def update_contract_status(
    contract_id: int, 
    status: str = Query(..., regex="^(ACTIVE|COMPLETED|CANCELLED)$"), 
    db: Session = Depends(get_db)
):
    contract = db.query(SupplyContract).filter(SupplyContract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract.status = status
    db.commit()
    db.refresh(contract)
    return contract

# --- Ratings ---

@router.post("/ratings/", response_model=SupplierRatingRead)
def create_rating(
    rating: SupplierRatingCreate, 
    db: Session = Depends(get_db)
):
    db_rating = SupplierRating(
        supplier_id=rating.supplier_id,
        rating_date=rating.rating_date,
        quality_score=rating.quality_score,
        delivery_score=rating.delivery_score,
        price_score=rating.price_score,
        notes=rating.notes
    )
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    return db_rating

@router.get("/ratings/{supplier_id}", response_model=List[SupplierRatingRead])
def get_supplier_ratings(
    supplier_id: int, 
    db: Session = Depends(get_db)
):
    return db.query(SupplierRating).filter(SupplierRating.supplier_id == supplier_id).all()
