"""
Financial Account and General Ledger CRUD Operations
"""
from sqlalchemy.orm import Session
from decimal import Decimal
from app import models, schemas


# --- Financial Account Functions ---

def get_financial_account(db: Session, account_id: int):
    return db.query(models.FinancialAccount).filter(models.FinancialAccount.account_id == account_id).first()


def get_financial_accounts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FinancialAccount).order_by(models.FinancialAccount.account_name).offset(skip).limit(limit).all()


def create_financial_account(db: Session, account: schemas.FinancialAccountCreate) -> models.FinancialAccount:
    db_account = models.FinancialAccount(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def update_financial_account(db: Session, account_id: int, account_update: schemas.FinancialAccountUpdate) -> models.FinancialAccount:
    db_account = get_financial_account(db, account_id)
    if db_account:
        update_data = account_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_account, key, value)
        db.commit()
        db.refresh(db_account)
    return db_account


def delete_financial_account(db: Session, account_id: int) -> models.FinancialAccount:
    db_account = get_financial_account(db, account_id)
    if db_account:
        db_account.is_active = False
        db.commit()
        db.refresh(db_account)
    return db_account


def update_balance_by_nature(db: Session, account_id: int, amount: float, entry_type: str):
    """
    تحديث رصيد الحساب بناءً على طبيعته.
    
    Args:
        db: جلسة قاعدة البيانات
        account_id: معرف الحساب
        amount: المبلغ (دائماً موجب)
        entry_type: نوع القيد ('debit' أو 'credit')
        
    Logic:
        - الأصول والمصروفات (طبيعتها مدينة): 
            - Debit يزيد الرصيد
            - Credit ينقص الرصيد
        - الخصوم، الإيرادات، حقوق الملكية (طبيعتها دائنة):
            - Credit يزيد الرصيد
            - Debit ينقص الرصيد
    """
    account = db.query(models.FinancialAccount).filter(models.FinancialAccount.account_id == account_id).first()
    if not account:
        return

    # تحديد ما إذا كان الحساب طبيعته مدينة
    is_normal_debit = account.account_type in ['ASSET', 'CASH', 'EXPENSE', 'RECEIVABLE']
    
    change = Decimal(0)
    amount = Decimal(str(amount))
    
    if is_normal_debit:
        if entry_type.lower() == 'debit':
            change = amount
        else:
            change = -amount
    else:
        # LIABILITY, EQUITY, REVENUE, PAYABLE -> Credit increases
        if entry_type.lower() == 'credit':
            change = amount
        else:
            change = -amount
            
    account.current_balance += change
    db.add(account)


def update_account_balance(db: Session, account_id: int, amount: float):
    """Legacy wrapper for backward compatibility"""
    account = db.query(models.FinancialAccount).filter(models.FinancialAccount.account_id == account_id).first()
    if account:
        account.current_balance += Decimal(str(amount))
        db.add(account)


# --- General Ledger Functions ---

def create_ledger_entry(db: Session, entry: schemas.GeneralLedgerCreate, source_type: str, source_id: int, created_by: int = None):
    db_entry = models.GeneralLedger(
        **entry.model_dump(),
        source_type=source_type,
        source_id=source_id,
        created_by=created_by
    )
    db.add(db_entry)
    return db_entry
