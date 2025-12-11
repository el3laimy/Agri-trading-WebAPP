from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services import payments
from app.schemas import PaymentCreate, PaymentRead
from app.api.v1.endpoints.crops import get_db

router = APIRouter()

@router.post("/", response_model=PaymentRead)
def create_new_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    """
    Record a new payment and update related records.
    """
    return payments.create_payment(db=db, payment=payment)
