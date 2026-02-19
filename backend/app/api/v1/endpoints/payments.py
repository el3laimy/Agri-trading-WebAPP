from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services import payments
from app.schemas import PaymentCreate, PaymentRead
from app.api.v1.endpoints.crops import get_db
from app.core.idempotency import check_idempotency

router = APIRouter()

@router.post("/", response_model=PaymentRead, dependencies=[Depends(check_idempotency)])
def create_new_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    """
    Record a new payment and update related records.
    Protected by Idempotency Key.
    """
    return payments.create_payment(db=db, payment=payment)

