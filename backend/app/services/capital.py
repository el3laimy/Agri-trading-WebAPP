from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List, Optional

from app import models, schemas, crud
from app.core.bootstrap import CASH_ACCOUNT_ID, OWNER_EQUITY_ID

def create_capital_transaction(db: Session, transaction: schemas.CapitalTransactionCreate) -> dict:
    """
    تنفيذ حركة رأس مال (زيادة أو تخفيض)
    
    المنطق المحاسبي:
    - مساهمة (CONTRIBUTION):
        - مدين: حـ/ النقدية (10101) [زيادة أصول]
        - دائن: حـ/ رأس المال (30101) [زيادة حقوق ملكية]
        
    - مسحوبات (WITHDRAWAL):
        - مدين: حـ/ رأس المال (30101) [تخفيض حقوق ملكية]
        - دائن: حـ/ النقدية (10101) [تخفيض أصول]
    """
    
    # 1. التحقق من الرصيد المتاح في حالة السحب
    if transaction.type == "WITHDRAWAL":
        # حساب إجمالي حقوق الملكية (رأس المال + الأرباح المحتجزة)
        # هنا سنبسط الأمر ونتحقق من رصيد حساب رأس المال فقط كبداية
        # في نظام أكثر تعقيداً، يجب جمع (رأس المال + الأرباح المرحلة + صافي ربح الفترة الحالية)
        
        capital_account = crud.get_financial_account(db, OWNER_EQUITY_ID)
        current_equity = capital_account.current_balance if capital_account else 0.0
        
        if transaction.amount > current_equity:
            # يمكن السماح بالسحب على المكشوف في بعض الحالات، لكن هنا سنمنعه للسلامة
            raise ValueError(f"رصيد حقوق الملكية غير كافٍ. المتاح: {current_equity}")

    # 2. إنشاء سجل التخصيص (CapitalAllocation) للتوثيق الإداري
    allocation = models.CapitalAllocation(
        allocation_date=transaction.transaction_date,
        allocation_type=transaction.type,
        amount=transaction.amount,
        description=transaction.description,
        reference_number=transaction.reference_number,
        owner_name=transaction.owner_name,
        season_id=transaction.season_id
    )
    db.add(allocation)
    db.flush() # للحصول على ID
    
    # 3. إنشاء القيود المحاسبية (General Ledger)
    if transaction.type == "CONTRIBUTION":
        # قيد النقدية (مدين)
        debit_entry = models.GeneralLedger(
            entry_date=transaction.transaction_date,
            account_id=CASH_ACCOUNT_ID,
            debit=transaction.amount,
            credit=0.0,
            description=f"زيادة رأس مال - {transaction.owner_name}",
            source_type="CAPITAL_CONTRIBUTION",
            source_id=allocation.allocation_id
        )
        # قيد رأس المال (دائن)
        credit_entry = models.GeneralLedger(
            entry_date=transaction.transaction_date,
            account_id=OWNER_EQUITY_ID,
            debit=0.0,
            credit=transaction.amount,
            description=f"زيادة رأس مال - {transaction.owner_name}",
            source_type="CAPITAL_CONTRIBUTION",
            source_id=allocation.allocation_id
        )
        
        # تحديث الأرصدة
        crud.update_account_balance(db, CASH_ACCOUNT_ID, transaction.amount)
        crud.update_account_balance(db, OWNER_EQUITY_ID, transaction.amount) # (Credit acts as positive for Equity usually, depends on sign convention. In this system accounts have 'balance' field. Assuming Credit adds to Equity balance)
        
    elif transaction.type == "WITHDRAWAL":
        # قيد رأس المال (مدين)
        debit_entry = models.GeneralLedger(
            entry_date=transaction.transaction_date,
            account_id=OWNER_EQUITY_ID, # تخفيض رأس المال
            debit=transaction.amount,
            credit=0.0,
            description=f"مسحوبات شخصية - {transaction.owner_name}",
            source_type="CAPITAL_WITHDRAWAL",
            source_id=allocation.allocation_id
        )
        # قيد النقدية (دائن)
        credit_entry = models.GeneralLedger(
            entry_date=transaction.transaction_date,
            account_id=CASH_ACCOUNT_ID,
            debit=0.0,
            credit=transaction.amount,
            description=f"مسحوبات شخصية - {transaction.owner_name}",
            source_type="CAPITAL_WITHDRAWAL",
            source_id=allocation.allocation_id
        )
        
        # تحديث الأرصدة
        crud.update_account_balance(db, OWNER_EQUITY_ID, -transaction.amount)
        crud.update_account_balance(db, CASH_ACCOUNT_ID, -transaction.amount)
        
    db.add(debit_entry)
    db.add(credit_entry)
    db.commit()
    
    return {
        "success": True,
        "message": "تم تسجيل حركة رأس المال بنجاح",
        "allocation_id": allocation.allocation_id,
        "new_balance": crud.get_financial_account(db, OWNER_EQUITY_ID).current_balance
    }

def get_capital_history(db: Session, limit: int = 100):
    return db.query(models.CapitalAllocation)\
             .order_by(models.CapitalAllocation.allocation_date.desc())\
             .limit(limit)\
             .all()
