from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import models, schemas, crud

def create_payment(db: Session, payment: schemas.PaymentCreate, user_id: int = None):
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
        # No specific transaction to update for GENERAL payments
        pass
    else:
        raise HTTPException(status_code=400, detail="نوع العملية غير صالح")

    # 3. Create General Ledger entries
    # Debit the asset account (Cash/Bank)
    
    # Translate Transaction Type for description
    trans_type_ar = "شراء" if payment.transaction_type == 'PURCHASE' else "بيع" if payment.transaction_type == 'SALE' else "عام"
    
    debit_entry = models.GeneralLedger(
        entry_date=payment.payment_date,
        account_id=payment.debit_account_id,
        debit=payment.amount,
        credit=0,
        description=f"دفعة عن عملية {trans_type_ar} #{payment.transaction_id}",
        source_type='PAYMENT',
        source_id=db_payment.payment_id,
        created_by=user_id
    )
    db.add(debit_entry)

    # Credit the liability/receivable account
    credit_entry = models.GeneralLedger(
        entry_date=payment.payment_date,
        account_id=payment.credit_account_id,
        debit=0,
        credit=payment.amount,
        description=f"دفعة عن عملية {trans_type_ar} #{payment.transaction_id}",
        source_type='PAYMENT',
        source_id=db_payment.payment_id,
        created_by=user_id
    )
    db.add(credit_entry)

    # 4. Update account balances
    # 4. Update account balances
    crud.update_balance_by_nature(db, payment.debit_account_id, payment.amount, 'debit')
    crud.update_balance_by_nature(db, payment.credit_account_id, payment.amount, 'credit')

    db.commit()
    db.refresh(db_payment)
    return db_payment
