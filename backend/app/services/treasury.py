from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date
from typing import List, Optional

from app import models, schemas, crud
from app.core.settings import get_setting

def get_treasury_summary(db: Session, target_date: date = None):
    if target_date is None:
        target_date = date.today()
    
    from decimal import Decimal
    
    # 1. Opening Balance: Sum of all transactions BEFORE target_date for CASH accounts
    # Balance = Sum(Debit) - Sum(Credit) [Asset Account]
    
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))
    
    opening_balance_query = db.query(
        func.sum(models.GeneralLedger.debit - models.GeneralLedger.credit)
    ).join(models.FinancialAccount, models.GeneralLedger.account_id == models.FinancialAccount.account_id)\
     .filter(models.FinancialAccount.account_type.in_(['CASH', 'ASSET']))\
     .filter(models.FinancialAccount.account_id == cash_id)\
     .filter(models.GeneralLedger.entry_date < target_date)
    
    opening_balance = opening_balance_query.scalar() or Decimal(0)

    # 2. Total IN (Day): Sum of Debits to Cash accounts on target_date
    total_in = db.query(func.sum(models.GeneralLedger.debit))\
        .filter(models.GeneralLedger.account_id == cash_id)\
        .filter(models.GeneralLedger.entry_date == target_date)\
        .scalar() or Decimal(0)

    # 3. Total OUT (Day): Sum of Credits to Cash accounts on target_date
    total_out = db.query(func.sum(models.GeneralLedger.credit))\
        .filter(models.GeneralLedger.account_id == cash_id)\
        .filter(models.GeneralLedger.entry_date == target_date)\
        .scalar() or Decimal(0)

    # 4. Closing Balance
    closing_balance = opening_balance + total_in - total_out

    # 5. Current Balance (Total System Balance right now)
    cash_account = crud.get_financial_account(db, cash_id)
    current_balance = cash_account.current_balance if cash_account else Decimal(0)

    return schemas.TreasurySummary(
        opening_balance=opening_balance,
        total_in_today=total_in,
        total_out_today=total_out,
        closing_balance=closing_balance,
        current_balance=current_balance
    )

def get_treasury_transactions(db: Session, target_date: date = None, limit: int = 100):
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))

    # Get all ledger entries affecting Cash accounts
    query = db.query(models.GeneralLedger)\
        .filter(models.GeneralLedger.account_id == cash_id)
        
    if target_date:
        query = query.filter(models.GeneralLedger.entry_date == target_date)
        
    transactions = query.order_by(models.GeneralLedger.entry_date.desc(), models.GeneralLedger.entry_id.desc())\
        .limit(limit)\
        .all()
    
    # ✅ Fix N+1: Batch load all payments at once
    payment_source_ids = [
        t.source_id for t in transactions 
        if t.source_type in ['CASH_RECEIPT', 'CASH_PAYMENT'] and t.source_id
    ]
    
    payments_map = {}
    if payment_source_ids:
        from sqlalchemy.orm import joinedload
        payments = db.query(models.Payment)\
            .options(joinedload(models.Payment.contact))\
            .filter(models.Payment.payment_id.in_(payment_source_ids))\
            .all()
        payments_map = {p.payment_id: p for p in payments}
    
    result = []
    for t in transactions:
        t_type = "IN" if t.debit > 0 else "OUT"
        amount = t.debit if t.debit > 0 else t.credit
        
        contact_name = None
        if t.source_type in ['CASH_RECEIPT', 'CASH_PAYMENT'] and t.source_id:
            payment = payments_map.get(t.source_id)
            if payment and payment.contact:
                contact_name = payment.contact.name

        result.append(schemas.TreasuryTransaction(
            transaction_id=t.entry_id,
            date=t.entry_date,
            description=t.description,
            amount=amount,
            type=t_type,
            source=t.source_type,
            contact_name=contact_name
        ))
        
    return result


def create_cash_receipt(db: Session, receipt: schemas.CashReceiptCreate, user_id: int = None) -> dict:
    """
    إنشاء إيصال قبض نقدي
    القيد: من حـ/ النقدية إلى حـ/ الذمم المدينة (أو إيراد عام)
    
    التحسين: إنشاء سجل Payment ليظهر في كشف حساب العميل
    """
    from decimal import Decimal
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # Get Account IDs
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))
    accounts_receivable_id = int(get_setting(db, "ACCOUNTS_RECEIVABLE_ID"))

    # 1. إنشاء سجل Payment إذا كان هناك عميل محدد
    payment_id = None
    if receipt.contact_id:
        db_payment = models.Payment(
            payment_date=receipt.receipt_date,
            amount=receipt.amount,
            contact_id=receipt.contact_id,
            payment_method='CASH',
            notes=receipt.description,
            credit_account_id=accounts_receivable_id,
            debit_account_id=cash_id,
            transaction_type='GENERAL',
            transaction_id=None,
            created_by=user_id
        )
        db.add(db_payment)
        db.flush()
        payment_id = db_payment.payment_id
    
    # 2. Create balanced entries using AccountingEngine
    engine = get_engine(db)
    amount = Decimal(str(receipt.amount))
    
    entries = [
        LedgerEntry(account_id=cash_id, debit=amount, credit=Decimal(0), description=receipt.description)
    ]
    if receipt.contact_id:
        entries.append(
            LedgerEntry(account_id=accounts_receivable_id, debit=Decimal(0), credit=amount, description=receipt.description)
        )
    
    # Only create entry if we have both sides
    if len(entries) == 2:
        engine.create_balanced_entry(
            entries=entries,
            entry_date=receipt.receipt_date,
            source_type="CASH_RECEIPT",
            source_id=payment_id or 0,
            created_by=user_id
        )
    else:
        # Single sided entry (no contact) - just cash increase
        # This is a special case, we still need to add cash entry
        cash_entry = models.GeneralLedger(
            entry_date=receipt.receipt_date,
            account_id=cash_id,
            debit=amount,
            credit=Decimal(0),
            description=receipt.description,
            source_type="CASH_RECEIPT",
            source_id=payment_id or 0,
            created_by=user_id
        )
        db.add(cash_entry)
        engine._update_account_balance(cash_id, amount, Decimal(0))
    
    db.commit()
    
    return {
        "success": True,
        "message": f"تم تسجيل قبض نقدي بمبلغ {receipt.amount}",
        "voucher_id": 0,
        "payment_id": payment_id
    }


def create_cash_payment(db: Session, payment: schemas.CashPaymentCreate, user_id: int = None) -> dict:
    """
    إنشاء إيصال صرف نقدي
    القيد: من حـ/ الذمم الدائنة (أو مصروف عام) إلى حـ/ النقدية
    
    التحسين: إنشاء سجل Payment ليظهر في كشف حساب المورد
    """
    # Get Account IDs
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))
    accounts_payable_id = int(get_setting(db, "ACCOUNTS_PAYABLE_ID"))

    # 1. إنشاء سجل Payment إذا كان هناك مورد محدد
    payment_id = None
    if payment.contact_id:
        db_payment = models.Payment(
            payment_date=payment.payment_date,
            amount=payment.amount,
            contact_id=payment.contact_id,
            payment_method='CASH',
            notes=payment.description,
            credit_account_id=cash_id,
            debit_account_id=accounts_payable_id,
            transaction_type='GENERAL',  # صرف عام على الحساب
            transaction_id=None,  # ليس مربوط بفاتورة محددة
            created_by=user_id
        )
        db.add(db_payment)
        db.flush()  # للحصول على payment_id
        payment_id = db_payment.payment_id
    
    # 2. قيد النقدية (دائن - خروج)
    cash_entry = models.GeneralLedger(
        entry_date=payment.payment_date,
        account_id=cash_id,
        debit=0.0,
        credit=payment.amount,
        description=payment.description,
        source_type="CASH_PAYMENT",
        source_id=payment_id or 0,
        created_by=user_id
    )
    db.add(cash_entry)
    
    # 3. قيد الذمم الدائنة (مدين - تخفيض دين للمورد)
    if payment.contact_id:
        payable_entry = models.GeneralLedger(
            entry_date=payment.payment_date,
            account_id=accounts_payable_id,
            debit=payment.amount,
            credit=0.0,
            description=payment.description,
            source_type="CASH_PAYMENT",
            source_id=payment_id or 0,
            created_by=user_id
        )
        db.add(payable_entry)
        crud.update_account_balance(db, accounts_payable_id, -payment.amount)
    
    # 4. تحديث رصيد الحساب النقدي
    crud.update_account_balance(db, cash_id, -payment.amount)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"تم تسجيل صرف نقدي بمبلغ {payment.amount}",
        "voucher_id": cash_entry.entry_id,
        "payment_id": payment_id
    }


def create_quick_expense(db: Session, expense: schemas.QuickExpenseCreate, user_id: int = None) -> dict:
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
    
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))

    # 1. إنشاء سجل المصروفات (Expense Model)
    # لضمان ظهوره في تقارير المصروفات
    db_expense = models.Expense(
        expense_date=expense.expense_date,
        description=expense.description,
        amount=expense.amount,
        debit_account_id=expense_account_id,
        credit_account_id=cash_id,
        created_by=user_id
    )
    db.add(db_expense)
    db.flush() # للحصول على expense_id
    
    # قيد المصروفات (مدين)
    expense_entry = models.GeneralLedger(
        entry_date=expense.expense_date,
        account_id=expense_account_id,
        debit=expense.amount,
        credit=0.0,
        description=expense.description,
        source_type="QUICK_EXPENSE",
        source_id=db_expense.expense_id,
        created_by=user_id
    )
    db.add(expense_entry)
    
    # قيد النقدية (دائن - خروج)
    cash_entry = models.GeneralLedger(
        entry_date=expense.expense_date,
        account_id=cash_id,
        debit=0.0,
        credit=expense.amount,
        description=expense.description,
        source_type="QUICK_EXPENSE",
        source_id=db_expense.expense_id,
        created_by=user_id
    )
    db.add(cash_entry)
    
    # تحديث الأرصدة
    crud.update_account_balance(db, expense_account_id, expense.amount)
    crud.update_account_balance(db, cash_id, -expense.amount)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"تم تسجيل مصروف بمبلغ {expense.amount}",
        "voucher_id": cash_entry.entry_id,
        "expense_id": db_expense.expense_id
    }


def delete_transaction(db: Session, transaction_id: int):
    """
    حذف معاملة مالية (قبض/صرف/مصروف)
    1. البحث عن القيد المحاسبي
    2. تحديد نوع المعاملة والمصدر
    3. عكس التأثير المالي على الأرصدة
    4. حذف القيود والسجل الأصلي
    """
    # 1. البحث عن القيد الرئيسي
    gl_entry = db.query(models.GeneralLedger).filter(models.GeneralLedger.entry_id == transaction_id).first()
    if not gl_entry:
        raise ValueError("المعاملة غير موجودة")

    source_type = gl_entry.source_type
    source_id = gl_entry.source_id

    # 2. البحث عن جميع القيود المرتبطة بهذه المعاملة
    related_entries = db.query(models.GeneralLedger).filter(
        models.GeneralLedger.source_type == source_type,
        models.GeneralLedger.source_id == source_id
    ).all()

    # 3. عكس التأثير المالي وتحديث الأرصدة
    for entry in related_entries:
        account = db.query(models.FinancialAccount).get(entry.account_id)
        if not account:
            continue

        # تحديد طبيعة الحساب لحساب التغير في الرصيد
        # الأصول والمصروفات: الرصيد = مدين - دائن
        # الخصوم والإيرادات وحقوق الملكية: الرصيد = دائن - مدين
        is_normal_debit = account.account_type in ['ASSET', 'CASH', 'EXPENSE', 'RECEIVABLE']
        
        # التغير الذي أحدثه القيد في الرصيد
        if is_normal_debit:
            balance_change = entry.debit - entry.credit
        else:
            balance_change = entry.credit - entry.debit
            
        # لعكس التأثير، نطرح التغيير (نضيف السالب)
        crud.update_account_balance(db, account.account_id, -balance_change)

    # 4. حذف السجلات
    # حذف السجل الأصلي (Payment / Expense)
    if source_type in ['CASH_RECEIPT', 'CASH_PAYMENT']:
        db.query(models.Payment).filter(models.Payment.payment_id == source_id).delete()
    elif source_type == 'QUICK_EXPENSE':
        db.query(models.Expense).filter(models.Expense.expense_id == source_id).delete()
    
    # حذف قيود اليومية
    for entry in related_entries:
        db.delete(entry)
        

    db.commit()
    return {"success": True, "message": "تم حذف المعاملة بنجاح"}

def update_transaction(db: Session, transaction_id: int, data: dict, transaction_type: str):
    """
    تحديث معاملة مالية
    الاستراتيجية: حذف المعاملة القديمة وإنشاء واحدة جديدة
    """
    # 1. حذف القديم
    delete_transaction(db, transaction_id)
    
    # 2. إنشاء الجديد بناءً على النوع
    if transaction_type == 'CASH_RECEIPT':
        create_data = schemas.CashReceiptCreate(**data)
        return create_cash_receipt(db, create_data)
    elif transaction_type == 'CASH_PAYMENT':
        create_data = schemas.CashPaymentCreate(**data)
        return create_cash_payment(db, create_data)
    elif transaction_type == 'QUICK_EXPENSE':
        create_data = schemas.QuickExpenseCreate(**data)
        return create_quick_expense(db, create_data)
    
    raise ValueError("Invalid transaction type")

