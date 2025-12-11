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

@router.post("/", response_model=schemas.ExpenseRead)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    """
    Create a new expense, automatically generating the corresponding general ledger entries.
    """
    # You might want to add extra validation here, e.g., ensure debit and credit accounts are valid types
    return crud.create_expense(db=db, expense=expense)

@router.get("/", response_model=List[schemas.ExpenseRead])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all expenses.
    """
    expenses = crud.get_expenses(db, skip=skip, limit=limit)
    return expenses
