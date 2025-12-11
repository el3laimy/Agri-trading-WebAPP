from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from datetime import date, timedelta

from app import models

def get_general_ledger_entries(db: Session):
    return db.query(models.GeneralLedger).options(joinedload(models.GeneralLedger.account)).order_by(models.GeneralLedger.entry_date.desc(), models.GeneralLedger.entry_id.desc()).all()

def generate_trial_balance(db: Session):
    """
    Calculates the trial balance by summing debits and credits for each account.
    """
    trial_balance_query = (
        db.query(
            models.FinancialAccount.account_id,
            models.FinancialAccount.account_name,
            func.sum(models.GeneralLedger.debit).label('total_debit'),
            func.sum(models.GeneralLedger.credit).label('total_credit')
        )
        .join(models.GeneralLedger, models.FinancialAccount.account_id == models.GeneralLedger.account_id)
        .group_by(models.FinancialAccount.account_id, models.FinancialAccount.account_name)
        .order_by(models.FinancialAccount.account_id)
    )
    return trial_balance_query.all()

def generate_balance_sheet(db: Session, end_date: date):
    """
    Generates a balance sheet for a specific date.
    """
    account_balances = db.query(
        models.FinancialAccount.account_id,
        models.FinancialAccount.account_name,
        models.FinancialAccount.account_type,
        (func.sum(models.GeneralLedger.debit) - func.sum(models.GeneralLedger.credit)).label('balance')
    ).join(models.GeneralLedger, models.FinancialAccount.account_id == models.GeneralLedger.account_id)\
     .filter(models.GeneralLedger.entry_date <= end_date)\
     .group_by(models.FinancialAccount.account_id, models.FinancialAccount.account_name, models.FinancialAccount.account_type)\
     .all()

    assets = []
    liabilities = []
    equity_accounts = []
    total_assets = 0
    total_liabilities = 0
    total_equity = 0
    
    revenue_for_re = 0
    expense_for_re = 0

    for acc_id, acc_name, acc_type, balance in account_balances:
        if acc_type in ['LIABILITY', 'EQUITY', 'REVENUE']:
            balance = -balance

        if acc_type == 'ASSET':
            assets.append({"account_name": acc_name, "balance": balance})
            total_assets += balance
        elif acc_type == 'LIABILITY':
            liabilities.append({"account_name": acc_name, "balance": balance})
            total_liabilities += balance
        elif acc_type == 'EQUITY':
            equity_accounts.append({"account_name": acc_name, "balance": balance})
            total_equity += balance
        elif acc_type == 'REVENUE':
            revenue_for_re += balance
        elif acc_type == 'EXPENSE':
            # Expense balance is negative of what we want (debits are positive), so add it
            expense_for_re += -balance

    retained_earnings = revenue_for_re - expense_for_re
    equity_accounts.append({"account_name": "Retained Earnings", "balance": retained_earnings})
    total_equity += retained_earnings

    return {
        "end_date": end_date,
        "assets": assets,
        "total_assets": total_assets,
        "liabilities": liabilities,
        "total_liabilities": total_liabilities,
        "equity": equity_accounts,
        "total_equity": total_equity,
        "total_liabilities_and_equity": total_liabilities + total_equity
    }

def generate_equity_statement(db: Session, start_date: date, end_date: date):
    """
    Generates an equity statement for a given period.
    """
    # 1. Calculate Beginning Equity
    beginning_equity_balance = db.query(func.sum(models.GeneralLedger.credit - models.GeneralLedger.debit))\
        .join(models.FinancialAccount, models.FinancialAccount.account_id == models.GeneralLedger.account_id)\
        .filter(models.FinancialAccount.account_type == 'EQUITY')\
        .filter(models.GeneralLedger.entry_date < start_date)\
        .scalar() or 0

    # 2. Calculate Net Income for the period
    income_statement = generate_income_statement(db, start_date, end_date)
    net_income = income_statement['net_income']

    # 3. Calculate Contributions and Draws for the period
    equity_transactions = db.query(
        models.GeneralLedger.debit,
        models.GeneralLedger.credit
    ).join(models.FinancialAccount, models.FinancialAccount.account_id == models.GeneralLedger.account_id)\
     .filter(models.FinancialAccount.account_type == 'EQUITY')\
     .filter(models.GeneralLedger.entry_date.between(start_date, end_date))\
     .all()

    contributions = sum(t.credit for t in equity_transactions)
    draws = sum(t.debit for t in equity_transactions)

    # 4. Calculate Ending Equity
    ending_equity = beginning_equity_balance + net_income + contributions - draws

    return {
        "start_date": start_date,
        "end_date": end_date,
        "beginning_equity": beginning_equity_balance,
        "net_income": net_income,
        "owner_contributions": contributions,
        "owner_draws": draws,
        "ending_equity": ending_equity
    }

def generate_income_statement(db: Session, start_date: date, end_date: date):
    """
    Generates an income statement for a given period.
    """
    transactions = (
        db.query(
            models.FinancialAccount.account_type,
            models.FinancialAccount.account_name,
            func.sum(models.GeneralLedger.credit - models.GeneralLedger.debit).label('balance')
        )
        .join(models.GeneralLedger, models.FinancialAccount.account_id == models.GeneralLedger.account_id)
        .filter(models.FinancialAccount.account_type.in_(['REVENUE', 'EXPENSE']))
        .filter(models.GeneralLedger.entry_date.between(start_date, end_date))
        .group_by(models.FinancialAccount.account_type, models.FinancialAccount.account_name)
    ).all()

    revenues = []
    expenses = []
    total_revenue = 0
    total_expense = 0

    for acc_type, acc_name, balance in transactions:
        if acc_type == 'REVENUE':
            amount = balance
            revenues.append({"account_name": acc_name, "amount": amount})
            total_revenue += amount
        elif acc_type == 'EXPENSE':
            amount = -balance
            expenses.append({"account_name": acc_name, "amount": amount})
            total_expense += amount

    net_income = total_revenue - total_expense

    return {
        "start_date": start_date,
        "end_date": end_date,
        "revenues": revenues,
        "total_revenue": total_revenue,
        "expenses": expenses,
        "total_expense": total_expense,
        "net_income": net_income,
    }