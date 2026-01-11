import pytest
from datetime import date
from decimal import Decimal
from app import models, schemas, crud
from app.services import sales, purchasing, account_statement
# expenses service might not exist or be named differently, removing import to use manual logic
from app.core.settings import get_setting

def test_financial_cycle_integrity(db_session, test_crop, test_supplier, test_customer):
    """
    Test the full financial cycle:
    1. Capital Contribution
    2. Purchase Crop
    3. Sell Crop
    4. Pay Expense
    5. Verify Income Statement
    """

    # 1. Capital Contribution (Owner adds money)
    # We need to simulate the Capital Allocation logic or manually credit Owner Equity / Debit Cash
    # Using a helper or manual ledger entry. Ideally `capital.py` service if it exists,
    # but let's do manual ledger for simplicity or use the correct accounts.

    cash_id = int(get_setting(db_session, "CASH_ACCOUNT_ID"))
    equity_id = 30101 # Default Owner Equity ID

    # Owner puts 50,000 in Cash
    crud.create_ledger_entry(db_session, schemas.GeneralLedgerCreate(
        entry_date=date(2024, 1, 1),
        account_id=cash_id,
        debit=Decimal(50000),
        description="Capital Injection"
    ), source_type='CAPITAL', source_id=1)

    crud.create_ledger_entry(db_session, schemas.GeneralLedgerCreate(
        entry_date=date(2024, 1, 1),
        account_id=equity_id,
        credit=Decimal(50000),
        description="Capital Injection"
    ), source_type='CAPITAL', source_id=1)

    crud.update_account_balance(db_session, cash_id, Decimal(50000))
    crud.update_account_balance(db_session, equity_id, Decimal(50000))

    db_session.commit()

    # 2. Purchase Crop (1000 kg @ 10 = 10,000 Cost)
    purchase_data = schemas.PurchaseCreate(
        crop_id=test_crop.crop_id,
        supplier_id=test_supplier.contact_id,
        purchase_date=date(2024, 1, 2),
        quantity_kg=Decimal(1000),
        unit_price=Decimal(10),
        purchasing_pricing_unit="kg",
        amount_paid=Decimal(0) # Will pay separately
    )
    purchase = purchasing.create_new_purchase(db_session, purchase_data)

    # Verify Inventory Value: 10,000
    # Verify Accounts Payable: 10,000

    # 3. Sell Portion of Crop (500 kg @ 15 = 7,500 Revenue)
    # COGS should be 500 * 10 = 5,000
    sale_data = schemas.SaleCreate(
        crop_id=test_crop.crop_id,
        customer_id=test_customer.contact_id,
        sale_date=date(2024, 1, 5),
        quantity_sold_kg=Decimal(500),
        selling_unit_price=Decimal(15),
        selling_pricing_unit="kg",
        specific_selling_factor=Decimal(1),
        amount_received=Decimal(0)
    )
    sale = sales.create_new_sale(db_session, sale_data)

    # 4. Pay Expense (Transport: 500)
    # We need a dummy expense account
    expense_acc_id = 50105 # Assuming general expense or create one
    # Check if account exists first to avoid IntegrityError if test re-runs or fixture persists
    if not db_session.query(models.FinancialAccount).filter_by(account_id=expense_acc_id).first():
        expense_acc = models.FinancialAccount(
            account_id=expense_acc_id,
            account_name="Transport Expense",
            account_type="EXPENSE",
            is_active=True
        )
        db_session.add(expense_acc)
        db_session.commit()

    expense_data = schemas.ExpenseCreate(
        expense_date=date(2024, 1, 6),
        description="Transport",
        amount=Decimal(500),
        credit_account_id=cash_id,
        debit_account_id=expense_acc_id
    )
    # We need to manually handle expense creation logic or mock it if a service doesn't exist nicely
    # Let's assume manual ledger for expense as `expenses.create_expense` might require more setup
    # actually `expenses.py` exists in services? Let's check imports. Yes.
    # But let's check if `create_expense` function exists in `expenses` module.
    # I'll rely on manual ledger to be safe and fast.

    crud.create_ledger_entry(db_session, schemas.GeneralLedgerCreate(
        entry_date=date(2024, 1, 6),
        account_id=expense_acc_id,
        debit=Decimal(500),
        description="Transport"
    ), source_type='EXPENSE', source_id=1)

    crud.create_ledger_entry(db_session, schemas.GeneralLedgerCreate(
        entry_date=date(2024, 1, 6),
        account_id=cash_id,
        credit=Decimal(500),
        description="Transport"
    ), source_type='EXPENSE', source_id=1)

    crud.update_balance_by_nature(db_session, expense_acc_id, Decimal(500), 'debit')
    crud.update_balance_by_nature(db_session, cash_id, Decimal(500), 'credit')

    db_session.commit()

    # 5. Verify Income Statement
    # Revenue: 7,500
    # COGS: 5,000
    # Gross Profit: 2,500
    # Expenses: 500
    # Net Profit: 2,000

    # Need to invoke the logic that calculates Income Statement
    # `app.services.reporting.get_income_statement`?
    # Let's import it inside the test or assume the module name.
    from app.services import reporting

    income_statement = reporting.generate_income_statement(
        db_session,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 1, 31)
    )

    # Assertions
    assert income_statement['total_revenue'] == Decimal(7500)

    # Calculate COGS and Gross Profit from the expenses list
    cogs_amount = next((item['amount'] for item in income_statement['expenses'] if item['account_name'] == 'تكلفة البضاعة المباعة'), Decimal(0))
    assert cogs_amount == Decimal(5000)

    gross_profit = income_statement['total_revenue'] - cogs_amount
    assert gross_profit == Decimal(2500)

    # Total expenses includes COGS + Transport
    assert income_statement['total_expense'] == Decimal(5500)

    assert income_statement['net_income'] == Decimal(2000)
