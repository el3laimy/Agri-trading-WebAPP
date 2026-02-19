
import pytest
from datetime import date, timedelta
from app import models, schemas
from app.services import reporting, accounting_engine
from app.crud import finance as finance_crud
import uuid

def test_general_ledger_server_side_filtering(db_session):
    # 1. Create unique accounts
    unique_id = uuid.uuid4().hex[:8]
    revenue_account = finance_crud.create_financial_account(db_session, schemas.FinancialAccountCreate(
        account_name=f"RevGL_{unique_id}", account_type="REVENUE", code=f"RV{unique_id}"
    ))
    expense_account = finance_crud.create_financial_account(db_session, schemas.FinancialAccountCreate(
        account_name=f"ExpGL_{unique_id}", account_type="EXPENSE", code=f"EX{unique_id}"
    ))
    
    # 2. Create entries
    engine = accounting_engine.get_engine(db_session)
    
    # Entry 1: Date 2023-01-01
    date1 = date(2023, 1, 1)
    engine.create_balanced_entry(
        entry_date=date1, source_type="TEST", source_id=1,
        entries=[
            accounting_engine.LedgerEntry(account_id=expense_account.account_id, debit=100, credit=0),
            accounting_engine.LedgerEntry(account_id=revenue_account.account_id, debit=0, credit=100)
        ]
    )
    
    # Entry 2: Date 2023-02-01
    date2 = date(2023, 2, 1)
    engine.create_balanced_entry(
        entry_date=date2, source_type="TEST", source_id=2,
        entries=[
            accounting_engine.LedgerEntry(account_id=expense_account.account_id, debit=200, credit=0),
            accounting_engine.LedgerEntry(account_id=revenue_account.account_id, debit=0, credit=200)
        ]
    )
    
    db_session.commit()
    
    # 3. Test Filtering
    
    # Test A: Date Filtering (Jan only)
    entries_jan = reporting.get_general_ledger_entries(db_session, start_date=date(2023, 1, 1), end_date=date(2023, 1, 31))
    # Should contain 2 entries (debit & credit) for date1, and 0 for date2
    # But wait, get_general_ledger_entries returns ALL entries matching the filter.
    # We have 2 LedgerEntries per transaction.
    
    jan_ids = [e.source_id for e in entries_jan if e.account_id in [revenue_account.account_id, expense_account.account_id]]
    assert len(jan_ids) == 2 # 1 debit, 1 credit
    assert all(d == 1 for d in jan_ids)
    
    # Test B: Account Filtering (Revenue only)
    entries_rev = reporting.get_general_ledger_entries(db_session, account_id=revenue_account.account_id)
    # Should contain 2 entries (one from Jan, one from Feb)
    assert len(entries_rev) == 2
    assert all(e.account_id == revenue_account.account_id for e in entries_rev)
    
    # Test C: Combined Filtering (Feb + Expense)
    entries_feb_exp = reporting.get_general_ledger_entries(
        db_session, 
        start_date=date(2023, 2, 1), 
        end_date=date(2023, 2, 28),
        account_id=expense_account.account_id
    )
    assert len(entries_feb_exp) == 1
    assert entries_feb_exp[0].debit == 200
    assert entries_feb_exp[0].entry_date == date2
