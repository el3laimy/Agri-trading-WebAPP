from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.api.v1.endpoints.crops import get_db
from app.services import treasury

router = APIRouter()

from datetime import date
from typing import Optional
from app import models
from app.auth.dependencies import get_current_user, require_permissions, require_write_permission

@router.get("/summary", response_model=schemas.TreasurySummary)
def read_treasury_summary(target_date: Optional[date] = None, db: Session = Depends(get_db)):
    return treasury.get_treasury_summary(db, target_date)

@router.get("/transactions", response_model=List[schemas.TreasuryTransaction])
def read_treasury_transactions(target_date: Optional[date] = None, limit: int = 100, db: Session = Depends(get_db)):
    return treasury.get_treasury_transactions(db, target_date, limit)

@router.post("/cash-receipt")
def create_cash_receipt(
    receipt: schemas.CashReceiptCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: models.User = Depends(require_write_permission("treasury"))
):
    """إنشاء إيصال قبض نقدي"""
    try:
        result = treasury.create_cash_receipt(db, receipt, user_id=current_user.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cash-payment")
def create_cash_payment(
    payment: schemas.CashPaymentCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: models.User = Depends(require_write_permission("treasury"))
):
    """إنشاء إيصال صرف نقدي"""
    try:
        result = treasury.create_cash_payment(db, payment, user_id=current_user.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/quick-expense")
def create_quick_expense(
    expense: schemas.QuickExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: models.User = Depends(require_write_permission("treasury"))
):
    """تسجيل مصروف سريع"""
    try:
        result = treasury.create_quick_expense(db, expense, user_id=current_user.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    _: models.User = Depends(require_permissions(["treasury:delete"]))
):
    """حذف معاملة مالية"""
    try:
        result = treasury.delete_transaction(db, transaction_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/cash-receipt/{transaction_id}")
def update_cash_receipt(transaction_id: int, receipt: schemas.CashReceiptCreate, db: Session = Depends(get_db)):
    """تحديث إيصال قبض"""
    try:
        data = receipt.model_dump()
        result = treasury.update_transaction(db, transaction_id, data, 'CASH_RECEIPT')
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/cash-payment/{transaction_id}")
def update_cash_payment(transaction_id: int, payment: schemas.CashPaymentCreate, db: Session = Depends(get_db)):
    """تحديث إيصال صرف"""
    try:
        data = payment.model_dump()
        result = treasury.update_transaction(db, transaction_id, data, 'CASH_PAYMENT')
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/quick-expense/{transaction_id}")
def update_quick_expense(transaction_id: int, expense: schemas.QuickExpenseCreate, db: Session = Depends(get_db)):
    """تحديث مصروف سريع"""
    try:
        data = expense.model_dump()
        result = treasury.update_transaction(db, transaction_id, data, 'QUICK_EXPENSE')
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


