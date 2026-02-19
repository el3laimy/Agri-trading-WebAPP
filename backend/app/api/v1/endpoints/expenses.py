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

from app.auth.dependencies import get_current_user

# ... imports ...

@router.post("/", response_model=schemas.ExpenseRead)
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new expense, automatically generating the corresponding general ledger entries.
    """
    # You might want to add extra validation here, e.g., ensure debit and credit accounts are valid types
    return crud.create_expense(db=db, expense=expense, user_id=current_user.user_id)

@router.get("/", response_model=List[schemas.ExpenseRead])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all expenses.
    """
    expenses = crud.get_expenses(db, skip=skip, limit=limit)
    return expenses

@router.put("/{expense_id}", response_model=schemas.ExpenseRead)
def update_expense(
    expense_id: int,
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update an expense. This reverses the financial impact of the old expense and applies the new one.
    """
    db_expense = crud.update_expense(db, expense_id=expense_id, expense_update=expense, user_id=current_user.user_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Delete an expense. This reverses the financial impact.
    """
    success = crud.delete_expense(db, expense_id=expense_id)
    if not success:
         raise HTTPException(status_code=404, detail="Expense not found")
    return
