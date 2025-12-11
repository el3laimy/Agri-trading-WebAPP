from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date
from typing import List, Optional

from app import models, schemas, crud
from app.core.bootstrap import CASH_ACCOUNT_ID, ACCOUNTS_RECEIVABLE_ID, ACCOUNTS_PAYABLE_ID

def get_treasury_summary(db: Session, target_date: date = None):
    if target_date is None:
        target_date = date.today()
    
    # 1. Opening Balance: Sum of all transactions BEFORE target_date for CASH accounts
    # Balance = Sum(Debit) - Sum(Credit) [Asset Account]
    opening_balance_query = db.query(
        func.sum(models.GeneralLedger.debit - models.GeneralLedger.credit)
    ).join(models.FinancialAccount, models.GeneralLedger.account_id == models.FinancialAccount.account_id)\
     .filter(models.FinancialAccount.account_type.in_(['CASH', 'ASSET']))\
     .filter(models.FinancialAccount.account_id == CASH_ACCOUNT_ID)\
     .filter(models.GeneralLedger.entry_date < target_date)
    
    opening_balance = opening_balance_query.scalar() or 0.0

    # 2. Total IN (Day): Sum of Debits to Cash accounts on target_date
    total_in = db.query(func.sum(models.GeneralLedger.debit))\
        .filter(models.GeneralLedger.account_id == CASH_ACCOUNT_ID)\
        .filter(models.GeneralLedger.entry_date == target_date)\
        .scalar() or 0.0

    # 3. Total OUT (Day): Sum of Credits to Cash accounts on target_date
    total_out = db.query(func.sum(models.GeneralLedger.credit))\
        .filter(models.GeneralLedger.account_id == CASH_ACCOUNT_ID)\
        .filter(models.GeneralLedger.entry_date == target_date)\
        .scalar() or 0.0

    # 4. Closing Balance
    closing_balance = opening_balance + total_in - total_out

    # 5. Current Balance (Total System Balance right now)
    cash_account = crud.get_financial_account(db, CASH_ACCOUNT_ID)
    current_balance = cash_account.current_balance if cash_account else 0.0

    return schemas.TreasurySummary(
        opening_balance=opening_balance,
        total_in_today=total_in,
        total_out_today=total_out,
        closing_balance=closing_balance,
        current_balance=current_balance
    )

def get_treasury_transactions(db: Session, target_date: date = None, limit: int = 100):
    # Get all ledger entries affecting Cash accounts
    query = db.query(models.GeneralLedger)\
        .filter(models.GeneralLedger.account_id == CASH_ACCOUNT_ID)
        
    if target_date:
        query = query.filter(models.GeneralLedger.entry_date == target_date)
        
    transactions = query.order_by(models.GeneralLedger.entry_date.desc(), models.GeneralLedger.entry_id.desc())\
        .limit(limit)\
        .all()
    
    result = []
    for t in transactions:
        # Determine type based on debit/credit
        # Debit to Asset = IN (Increase)
        # Credit to Asset = OUT (Decrease)
        
        t_type = "IN" if t.debit > 0 else "OUT"
        amount = t.debit if t.debit > 0 else t.credit
        
        result.append(schemas.TreasuryTransaction(
            transaction_id=t.entry_id,
            date=t.entry_date,
            description=t.description,
            amount=amount,
            type=t_type,
            source=t.source_type
        ))
        
    return result


def create_cash_receipt(db: Session, receipt: schemas.CashReceiptCreate) -> dict:
    """
    إنشاء إيصال قبض نقدي
    القيد: من حـ/ النقدية إلى حـ/ الذمم المدينة (أو إيراد عام)
    """
    # قيد النقدية (مدين)
    cash_entry = models.GeneralLedger(
        entry_date=receipt.receipt_date,
        account_id=CASH_ACCOUNT_ID,
        debit=receipt.amount,
        credit=0.0,
        description=receipt.description,
        source_type="CASH_RECEIPT",
        source_id=0
    )
    db.add(cash_entry)
    
    # قيد الذمم المدينة أو الإيراد (دائن)
    credit_account_id = ACCOUNTS_RECEIVABLE_ID if receipt.contact_id else CASH_ACCOUNT_ID
    if receipt.contact_id:
        receivable_entry = models.GeneralLedger(
            entry_date=receipt.receipt_date,
            account_id=ACCOUNTS_RECEIVABLE_ID,
            debit=0.0,
            credit=receipt.amount,
            description=receipt.description,
            source_type="CASH_RECEIPT",
            source_id=0
        )
        db.add(receivable_entry)
    
    # تحديث رصيد الحساب النقدي
    crud.update_account_balance(db, CASH_ACCOUNT_ID, receipt.amount)
    if receipt.contact_id:
        crud.update_account_balance(db, ACCOUNTS_RECEIVABLE_ID, -receipt.amount)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"تم تسجيل قبض نقدي بمبلغ {receipt.amount}",
        "voucher_id": cash_entry.entry_id
    }


def create_cash_payment(db: Session, payment: schemas.CashPaymentCreate) -> dict:
    """
    إنشاء إيصال صرف نقدي
    القيد: من حـ/ الذمم الدائنة (أو مصروف عام) إلى حـ/ النقدية
    """
    # قيد النقدية (دائن - خروج)
    cash_entry = models.GeneralLedger(
        entry_date=payment.payment_date,
        account_id=CASH_ACCOUNT_ID,
        debit=0.0,
        credit=payment.amount,
        description=payment.description,
        source_type="CASH_PAYMENT",
        source_id=0
    )
    db.add(cash_entry)
    
    # قيد الذمم الدائنة (مدين - تخفيض دين)
    if payment.contact_id:
        payable_entry = models.GeneralLedger(
            entry_date=payment.payment_date,
            account_id=ACCOUNTS_PAYABLE_ID,
            debit=payment.amount,
            credit=0.0,
            description=payment.description,
            source_type="CASH_PAYMENT",
            source_id=0
        )
        db.add(payable_entry)
        crud.update_account_balance(db, ACCOUNTS_PAYABLE_ID, -payment.amount)
    
    # تحديث رصيد الحساب النقدي
    crud.update_account_balance(db, CASH_ACCOUNT_ID, -payment.amount)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"تم تسجيل صرف نقدي بمبلغ {payment.amount}",
        "voucher_id": cash_entry.entry_id
    }


def create_quick_expense(db: Session, expense: schemas.QuickExpenseCreate) -> dict:
    """
    تسجيل مصروف سريع من الخزينة
    القيد: من حـ/ المصروفات إلى حـ/ النقدية
    """
    # إنشاء حساب مصروفات عام إذا لم يكن موجوداً
    expense_account_id = 50103  # مصروفات عمومية
    
    # التحقق من وجود الحساب
    expense_account = crud.get_financial_account(db, expense_account_id)
    if not expense_account:
        # إنشاء حساب المصروفات
        expense_account = models.FinancialAccount(
            account_id=expense_account_id,
            account_name="مصروفات عمومية",
            account_type="EXPENSE",
            current_balance=0.0
        )
        db.add(expense_account)
        db.commit()
    
    # قيد المصروفات (مدين)
    expense_entry = models.GeneralLedger(
        entry_date=expense.expense_date,
        account_id=expense_account_id,
        debit=expense.amount,
        credit=0.0,
        description=expense.description,
        source_type="QUICK_EXPENSE",
        source_id=0
    )
    db.add(expense_entry)
    
    # قيد النقدية (دائن - خروج)
    cash_entry = models.GeneralLedger(
        entry_date=expense.expense_date,
        account_id=CASH_ACCOUNT_ID,
        debit=0.0,
        credit=expense.amount,
        description=expense.description,
        source_type="QUICK_EXPENSE",
        source_id=0
    )
    db.add(cash_entry)
    
    # تحديث الأرصدة
    crud.update_account_balance(db, expense_account_id, expense.amount)
    crud.update_account_balance(db, CASH_ACCOUNT_ID, -expense.amount)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"تم تسجيل مصروف بمبلغ {expense.amount}",
        "voucher_id": cash_entry.entry_id
    }

