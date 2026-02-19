from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List, Optional

from app import models, schemas, crud
from app.core.settings import get_setting

def create_capital_transaction(db: Session, transaction: schemas.CapitalTransactionCreate) -> dict:
    """
    تنفيذ حركة رأس مال (زيادة أو تخفيض)
    يستخدم AccountingEngine لضمان التوازن والدقة.
    
    المنطق المحاسبي:
    - مساهمة (CONTRIBUTION):
        - مدين: حـ/ النقدية (10101) [زيادة أصول]
        - دائن: حـ/ رأس المال (30101) [زيادة حقوق ملكية]
        
    - مسحوبات (WITHDRAWAL):
        - مدين: حـ/ رأس المال (30101) [تخفيض حقوق ملكية]
        - دائن: حـ/ النقدية (10101) [تخفيض أصول]
    """
    from decimal import Decimal
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # 1. التحقق من الرصيد المتاح في حالة السحب
    if transaction.type == "WITHDRAWAL":
        equity_id = int(get_setting(db, "OWNER_EQUITY_ID"))
        capital_account = crud.get_financial_account(db, equity_id)
        current_equity = capital_account.current_balance if capital_account else Decimal(0)
        
        if transaction.amount > current_equity:
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
    db.flush()
    
    # 3. إنشاء القيود المحاسبية عبر المحرك المحاسبي
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))
    equity_id = int(get_setting(db, "OWNER_EQUITY_ID"))
    amount = Decimal(str(transaction.amount))

    engine = get_engine(db)
    
    if transaction.type == "CONTRIBUTION":
        description = f"زيادة رأس مال - {transaction.owner_name}"
        engine.create_balanced_entry(
            entries=[
                LedgerEntry(account_id=cash_id, debit=amount, credit=Decimal(0), description=description),
                LedgerEntry(account_id=equity_id, debit=Decimal(0), credit=amount, description=description),
            ],
            entry_date=transaction.transaction_date,
            source_type="CAPITAL_CONTRIBUTION",
            source_id=allocation.allocation_id
        )
        
    elif transaction.type == "WITHDRAWAL":
        description = f"مسحوبات شخصية - {transaction.owner_name}"
        engine.create_balanced_entry(
            entries=[
                LedgerEntry(account_id=equity_id, debit=amount, credit=Decimal(0), description=description),
                LedgerEntry(account_id=cash_id, debit=Decimal(0), credit=amount, description=description),
            ],
            entry_date=transaction.transaction_date,
            source_type="CAPITAL_WITHDRAWAL",
            source_id=allocation.allocation_id
        )
    
    db.commit()
    
    return {
        "success": True,
        "message": "تم تسجيل حركة رأس المال بنجاح",
        "allocation_id": allocation.allocation_id,
        "new_balance": crud.get_financial_account(db, equity_id).current_balance
    }

def get_capital_history(db: Session, limit: int = 100):
    return db.query(models.CapitalAllocation)\
             .order_by(models.CapitalAllocation.allocation_date.desc())\
             .limit(limit)\
             .all()
