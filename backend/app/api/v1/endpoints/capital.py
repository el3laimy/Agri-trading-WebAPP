from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app import schemas
from app.auth import dependencies as deps
from app.services import capital as capital_service

router = APIRouter()

@router.post("/transaction", response_model=dict)
def create_capital_transaction(
    transaction: schemas.CapitalTransactionCreate,
    db: Session = Depends(deps.get_db),
    # current_user: models.User = Depends(deps.get_current_active_user) # Uncomment when auth is fully enforced
) -> Any:
    """
    تسجيل حركة رأس مال جديدة (مساهمة أو مسحوبات).
    """
    try:
        result = capital_service.create_capital_transaction(db, transaction)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"حدث خطأ أثناء تسجيل المعاملة: {str(e)}"
        )
