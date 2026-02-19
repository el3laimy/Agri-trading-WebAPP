from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal

from app import models, schemas, crud

def create_payment(db: Session, payment: schemas.PaymentCreate, user_id: int = None):
    """
    إنشاء دفعة مالية مع قيود محاسبية متوازنة.
    يستخدم AccountingEngine لضمان التوازن والدقة.
    """
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # 1. Create the payment record
    payment_data = payment.model_dump()
    payment_data['created_by'] = user_id
    db_payment = models.Payment(**payment_data)
    db.add(db_payment)
    db.flush()

    # 2. Update the related transaction (Purchase or Sale)
    if payment.transaction_type == 'PURCHASE':
        transaction = db.query(models.Purchase).filter(models.Purchase.purchase_id == payment.transaction_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail="عملية الشراء غير موجودة")
        transaction.amount_paid += payment.amount
        if transaction.amount_paid >= transaction.total_cost:
            transaction.payment_status = 'PAID'
        else:
            transaction.payment_status = 'PARTIAL'
    elif payment.transaction_type == 'SALE':
        transaction = db.query(models.Sale).filter(models.Sale.sale_id == payment.transaction_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail="عملية البيع غير موجودة")
        transaction.amount_received += payment.amount
        if transaction.amount_received >= transaction.total_sale_amount:
            transaction.payment_status = 'PAID'
        else:
            transaction.payment_status = 'PARTIAL'
    elif payment.transaction_type == 'GENERAL':
        pass
    else:
        raise HTTPException(status_code=400, detail="نوع العملية غير صالح")

    # 3. Create balanced GL entries using AccountingEngine
    trans_type_ar = "شراء" if payment.transaction_type == 'PURCHASE' else "بيع" if payment.transaction_type == 'SALE' else "عام"
    description = f"دفعة عن عملية {trans_type_ar} #{payment.transaction_id}"
    amount = Decimal(str(payment.amount))
    
    engine = get_engine(db)
    engine.create_balanced_entry(
        entries=[
            LedgerEntry(account_id=payment.debit_account_id, debit=amount, credit=Decimal(0), description=description),
            LedgerEntry(account_id=payment.credit_account_id, debit=Decimal(0), credit=amount, description=description),
        ],
        entry_date=payment.payment_date,
        source_type='PAYMENT',
        source_id=db_payment.payment_id,
        created_by=user_id
    )

    db.flush()  # Caller manages transaction - allows rollback on error
    db.refresh(db_payment)
    return db_payment

