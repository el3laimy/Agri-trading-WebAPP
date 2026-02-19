
from datetime import date, timedelta
import pytest
import uuid
from app import models, schemas
from app.services import reporting, accounting_engine
from app.crud import finance as finance_crud

def test_trial_balance_date_filtering(db_session):
    # 1. Create Accounts with unique names
    unique_id = uuid.uuid4().hex[:8]
    revenue_account = finance_crud.create_financial_account(db_session, schemas.FinancialAccountCreate(
        account_name=f"Test Revenue {unique_id}",
        account_type="REVENUE",
        code=f"REV{unique_id}"
    ))
    cash_account = finance_crud.create_financial_account(db_session, schemas.FinancialAccountCreate(
        account_name=f"Test Cash {unique_id}",
        account_type="ASSET",
        code=f"CASH{unique_id}"
    ))

    # 2. Create Entries at different dates
    engine = accounting_engine.get_engine(db_session)
    
    # Entry 1: Jan 1st
    date1 = date(2023, 1, 1)
    engine.create_balanced_entry(
        entry_date=date1,
        source_type="MANUAL_TEST",
        source_id=1,
        entries=[
            accounting_engine.LedgerEntry(account_id=cash_account.account_id, debit=1000, credit=0),
            accounting_engine.LedgerEntry(account_id=revenue_account.account_id, debit=0, credit=1000)
        ]
    )

    # Entry 2: Feb 1st
    date2 = date(2023, 2, 1)
    engine.create_balanced_entry(
        entry_date=date2,
        source_type="MANUAL_TEST",
        source_id=2,
        entries=[
            accounting_engine.LedgerEntry(account_id=cash_account.account_id, debit=500, credit=0),
            accounting_engine.LedgerEntry(account_id=revenue_account.account_id, debit=0, credit=500)
        ]
    )
    
    # Ensure entries are committed
    db_session.commit()

    # 3. Test Filtering
    
    # Case A: Filter up to Jan 15th (Should only include Entry 1)
    tb_jan = reporting.generate_trial_balance(db_session, end_date=date(2023, 1, 15))
    print(f"DEBUG: tb_jan results: {tb_jan}")
    
    cash_jan = next((item for item in tb_jan if item.account_id == cash_account.account_id), None)
    assert cash_jan is not None, f"Cash account {cash_account.account_id} not found in Jan TB. TB content: {tb_jan}"
    assert cash_jan.total_debit == 1000
    
    # Case B: Filter up to Feb 15th (Should include Entry 1 and 2)
    tb_feb = reporting.generate_trial_balance(db_session, end_date=date(2023, 2, 15))
    cash_feb = next((item for item in tb_feb if item.account_id == cash_account.account_id), None)
    # total_debit is sum of debits
    assert cash_feb is not None
    assert cash_feb.total_debit == 1500

    # Case C: No Filter (All time)
    tb_all = reporting.generate_trial_balance(db_session)
    cash_all = next((item for item in tb_all if item.account_id == cash_account.account_id), None)
    assert cash_all is not None
    assert cash_all.total_debit == 1500
