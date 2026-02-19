from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud, models, schemas
from app.database import SessionLocal

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.FinancialAccount)
def create_financial_account(account: schemas.FinancialAccountCreate, db: Session = Depends(get_db)):
    """
    Create a new financial account.
    """
    return crud.create_financial_account(db=db, account=account)

@router.get("/", response_model=List[schemas.FinancialAccount])
def read_financial_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all financial accounts.
    """
    accounts = crud.get_financial_accounts(db, skip=skip, limit=limit)
    return accounts

@router.get("/{account_id}", response_model=schemas.FinancialAccount)
def read_financial_account(account_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single financial account by its ID.
    """
    db_account = crud.get_financial_account(db, account_id=account_id)
    if db_account is None:
        raise HTTPException(status_code=404, detail="الحساب المالي غير موجود")
    return db_account

@router.put("/{account_id}", response_model=schemas.FinancialAccount)
def update_financial_account(account_id: int, account: schemas.FinancialAccountUpdate, db: Session = Depends(get_db)):
    """
    Update a financial account.
    """
    db_account = crud.update_financial_account(db, account_id=account_id, account_update=account)
    if db_account is None:
        raise HTTPException(status_code=404, detail="الحساب المالي غير موجود")
    return db_account

@router.delete("/{account_id}", response_model=schemas.FinancialAccount)
def delete_financial_account(account_id: int, db: Session = Depends(get_db)):
    """
    Deactivate a financial account (soft delete).
    """
    db_account = crud.delete_financial_account(db, account_id=account_id)
    if db_account is None:
        raise HTTPException(status_code=404, detail="الحساب المالي غير موجود")
    return db_account
