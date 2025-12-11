from sqlalchemy.orm import Session
from app import models, crud

# تعريف أرقام الحسابات الأساسية كمتغيرات ثابتة لسهولة الوصول إليها
INVENTORY_ACCOUNT_ID = 10103
ACCOUNTS_PAYABLE_ID = 20101
CASH_ACCOUNT_ID = 10101
SALES_REVENUE_ACCOUNT_ID = 40101
COGS_ACCOUNT_ID = 50101
ACCOUNTS_RECEIVABLE_ID = 10104
INVENTORY_LOSS_ACCOUNT_ID = 50102
INVENTORY_GAIN_ACCOUNT_ID = 40102
OWNER_EQUITY_ID = 30101  # رأس المال

def bootstrap_financial_accounts(db: Session):
    """
    Checks for and creates the default financial accounts if they don't exist.
    """
    accounts_to_create = [
        {'account_id': INVENTORY_ACCOUNT_ID, 'account_name': 'المخزون', 'account_type': 'ASSET'},
        {'account_id': ACCOUNTS_PAYABLE_ID, 'account_name': 'الذمم الدائنة (الموردين)', 'account_type': 'LIABILITY'},
        {'account_id': CASH_ACCOUNT_ID, 'account_name': 'الخزنة الرئيسية', 'account_type': 'ASSET'},
        {'account_id': SALES_REVENUE_ACCOUNT_ID, 'account_name': 'إيرادات المبيعات', 'account_type': 'REVENUE'},
        {'account_id': COGS_ACCOUNT_ID, 'account_name': 'تكلفة البضاعة المباعة', 'account_type': 'EXPENSE'},
        {'account_id': ACCOUNTS_RECEIVABLE_ID, 'account_name': 'الذمم المدينة (العملاء)', 'account_type': 'ASSET'},
        {'account_id': INVENTORY_LOSS_ACCOUNT_ID, 'account_name': 'خسائر المخزون (تالف/عجز)', 'account_type': 'EXPENSE'},
        {'account_id': INVENTORY_GAIN_ACCOUNT_ID, 'account_name': 'أرباح فروقات المخزون', 'account_type': 'REVENUE'},
        {'account_id': OWNER_EQUITY_ID, 'account_name': 'رأس المال', 'account_type': 'EQUITY'},
    ]

    for acc_data in accounts_to_create:
        acc = crud.get_financial_account(db, account_id=acc_data['account_id'])
        if not acc:
            new_acc = models.FinancialAccount(**acc_data)
            db.add(new_acc)
            db.commit()
            db.refresh(new_acc)

