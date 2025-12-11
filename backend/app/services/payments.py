from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import models, schemas, crud

def create_payment(db: Session, payment: schemas.PaymentCreate):
    # 1. Create the payment record
    db_payment = models.Payment(**payment.model_dump())
    db.add(db_payment)
    db.flush()

    # 2. Update the related transaction (Purchase or Sale)
    if payment.transaction_type == 'PURCHASE':
        transaction = db.query(models.Purchase).filter(models.Purchase.purchase_id == payment.transaction_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail="Purchase not found")
        transaction.amount_paid += payment.amount
        if transaction.amount_paid >= transaction.total_cost:
            transaction.payment_status = 'PAID'
        else:
            transaction.payment_status = 'PARTIAL'
    elif payment.transaction_type == 'SALE':
        transaction = db.query(models.Sale).filter(models.Sale.sale_id == payment.transaction_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail="Sale not found")
        transaction.amount_received += payment.amount
        if transaction.amount_received >= transaction.total_sale_amount:
            transaction.payment_status = 'PAID'
        else:
            transaction.payment_status = 'PARTIAL'
    elif payment.transaction_type == 'GENERAL':
        # No specific transaction to update for GENERAL payments
        pass
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    # 3. Create General Ledger entries
    # Debit the asset account (Cash/Bank)
    debit_entry = models.GeneralLedger(
        entry_date=payment.payment_date,
        account_id=payment.debit_account_id,
        debit=payment.amount,
        credit=0,
        description=f"Payment for {payment.transaction_type} #{payment.transaction_id}",
        source_type='PAYMENT',
        source_id=db_payment.payment_id
    )
    db.add(debit_entry)

    # Credit the liability/receivable account
    credit_entry = models.GeneralLedger(
        entry_date=payment.payment_date,
        account_id=payment.credit_account_id,
        debit=0,
        credit=payment.amount,
        description=f"Payment for {payment.transaction_type} #{payment.transaction_id}",
        source_type='PAYMENT',
        source_id=db_payment.payment_id
    )
    db.add(credit_entry)

    # 4. Update account balances
    crud.update_account_balance(db, account_id=payment.debit_account_id, amount=payment.amount)
    crud.update_account_balance(db, account_id=payment.credit_account_id, amount=-payment.amount)

    db.commit()
    db.refresh(db_payment)
    return db_payment
