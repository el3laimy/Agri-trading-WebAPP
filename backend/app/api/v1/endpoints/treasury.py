from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.api.v1.endpoints.crops import get_db
from app.services import treasury

router = APIRouter()

from datetime import date
from typing import Optional

@router.get("/summary", response_model=schemas.TreasurySummary)
def read_treasury_summary(target_date: Optional[date] = None, db: Session = Depends(get_db)):
    return treasury.get_treasury_summary(db, target_date)

@router.get("/transactions", response_model=List[schemas.TreasuryTransaction])
def read_treasury_transactions(target_date: Optional[date] = None, limit: int = 100, db: Session = Depends(get_db)):
    return treasury.get_treasury_transactions(db, target_date, limit)

@router.post("/cash-receipt")
def create_cash_receipt(receipt: schemas.CashReceiptCreate, db: Session = Depends(get_db)):
    """إنشاء إيصال قبض نقدي"""
    try:
        result = treasury.create_cash_receipt(db, receipt)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cash-payment")
def create_cash_payment(payment: schemas.CashPaymentCreate, db: Session = Depends(get_db)):
    """إنشاء إيصال صرف نقدي"""
    try:
        result = treasury.create_cash_payment(db, payment)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/quick-expense")
def create_quick_expense(expense: schemas.QuickExpenseCreate, db: Session = Depends(get_db)):
    """تسجيل مصروف سريع"""
    try:
        result = treasury.create_quick_expense(db, expense)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

