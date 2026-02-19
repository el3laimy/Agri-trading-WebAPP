"""
Sales, Purchases, and Expenses CRUD Operations
"""
from sqlalchemy.orm import Session, joinedload
import json
from app import models, schemas


# --- Purchase CRUD Functions ---

def get_purchases(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Purchase)
        .options(joinedload(models.Purchase.crop), joinedload(models.Purchase.supplier))
        .order_by(models.Purchase.purchase_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_purchase_record(db: Session, purchase_data: dict) -> models.Purchase:
    db_purchase = models.Purchase(**purchase_data)
    db.add(db_purchase)
    db.flush()
    
    # Create Audit Log
    db_log = models.AuditLog(
        action_type="CREATE",
        table_name="purchases",
        record_id=db_purchase.purchase_id,
        new_values=json.dumps(purchase_data, default=str),
        user_id=purchase_data.get('created_by')
    )
    db.add(db_log)
    
    return db_purchase


# --- Sale CRUD Functions ---

def get_sales(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Sale)
        .options(joinedload(models.Sale.crop), joinedload(models.Sale.customer))
        .order_by(models.Sale.sale_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_sale_record(db: Session, sale_data: dict) -> models.Sale:
    db_sale = models.Sale(**sale_data)
    db.add(db_sale)
    return db_sale


# --- Expense CRUD Functions ---

def get_expenses(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Expense)
        .options(
            joinedload(models.Expense.credit_account),
            joinedload(models.Expense.debit_account),
            joinedload(models.Expense.supplier)
        )
        .order_by(models.Expense.expense_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_expense(db: Session, expense: schemas.ExpenseCreate, user_id: int = None) -> models.Expense:
    """
    إنشاء مصروف مع قيود محاسبية متوازنة.
    يستخدم AccountingEngine لضمان التوازن والدقة.
    """
    from decimal import Decimal
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # 1. Create the expense record
    expense_data = expense.model_dump()
    expense_data['created_by'] = user_id
    db_expense = models.Expense(**expense_data)
    db.add(db_expense)
    db.flush()

    # 2. Create balanced GL entries using AccountingEngine
    amount = Decimal(str(db_expense.amount))
    engine = get_engine(db)
    engine.create_balanced_entry(
        entries=[
            LedgerEntry(account_id=db_expense.debit_account_id, debit=amount, credit=Decimal(0), description=f"Expense: {db_expense.description}"),
            LedgerEntry(account_id=db_expense.credit_account_id, debit=Decimal(0), credit=amount, description=f"Expense: {db_expense.description}"),
        ],
        entry_date=db_expense.expense_date,
        source_type='EXPENSE',
        source_id=db_expense.expense_id,
        created_by=user_id
    )

    db.commit()
    db.refresh(db_expense)
    return db_expense


def update_expense(db: Session, expense_id: int, expense_update: schemas.ExpenseCreate, user_id: int) -> models.Expense:
    """
    تحديث مصروف: عكس القيد القديم + إنشاء قيد جديد.
    يستخدم AccountingEngine لضمان التوازن والدقة.
    """
    from decimal import Decimal
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # 1. Get existing expense
    db_expense = db.query(models.Expense).filter(models.Expense.expense_id == expense_id).first()
    if not db_expense:
        return None

    engine = get_engine(db)
    
    # 2. عكس القيود القديمة عبر المحرك المحاسبي
    old_entries = db.query(models.GeneralLedger).filter(
        models.GeneralLedger.source_type == 'EXPENSE',
        models.GeneralLedger.source_id == expense_id
    ).all()
    
    for entry in old_entries:
        # عكس التأثير على أرصدة الحسابات
        engine._update_account_balance(
            entry.account_id,
            Decimal(str(entry.credit)),  # عكس: الدائن يصبح مدين
            Decimal(str(entry.debit))    # عكس: المدين يصبح دائن
        )
        db.delete(entry)

    # 3. Update expense record fields
    update_data = expense_update.model_dump()
    for key, value in update_data.items():
        setattr(db_expense, key, value)

    # 4. Create new balanced GL entries
    amount = Decimal(str(db_expense.amount))
    engine.create_balanced_entry(
        entries=[
            LedgerEntry(account_id=db_expense.debit_account_id, debit=amount, credit=Decimal(0), description=f"Expense: {db_expense.description}"),
            LedgerEntry(account_id=db_expense.credit_account_id, debit=Decimal(0), credit=amount, description=f"Expense: {db_expense.description}"),
        ],
        entry_date=db_expense.expense_date,
        source_type='EXPENSE',
        source_id=db_expense.expense_id,
        created_by=user_id
    )

    db.commit()
    db.refresh(db_expense)
    return db_expense


def delete_expense(db: Session, expense_id: int):
    """
    حذف مصروف مع عكس القيود المحاسبية.
    يستخدم AccountingEngine لضمان عكس الأرصدة بشكل صحيح.
    """
    from decimal import Decimal
    from app.services.accounting_engine import get_engine
    
    # 1. Get the expense
    db_expense = db.query(models.Expense).filter(models.Expense.expense_id == expense_id).first()
    if not db_expense:
        return None

    engine = get_engine(db)
    
    # 2. عكس القيود المحاسبية
    old_entries = db.query(models.GeneralLedger).filter(
        models.GeneralLedger.source_type == 'EXPENSE',
        models.GeneralLedger.source_id == expense_id
    ).all()
    
    for entry in old_entries:
        engine._update_account_balance(
            entry.account_id,
            Decimal(str(entry.credit)),  # عكس
            Decimal(str(entry.debit))    # عكس
        )
        db.delete(entry)

    # 3. Delete the expense
    db.delete(db_expense)
    db.commit()
    return db_expense

