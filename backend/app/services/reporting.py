from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from datetime import date, timedelta
from decimal import Decimal

from app import models

def get_general_ledger_entries(db: Session, start_date: date = None, end_date: date = None, account_id: int = None):
    query = db.query(models.GeneralLedger).options(joinedload(models.GeneralLedger.account))
    
    if start_date:
        query = query.filter(models.GeneralLedger.entry_date >= start_date)
    if end_date:
        query = query.filter(models.GeneralLedger.entry_date <= end_date)
    if account_id:
        query = query.filter(models.GeneralLedger.account_id == account_id)
        
    return query.order_by(models.GeneralLedger.entry_date.desc(), models.GeneralLedger.entry_id.desc()).all()

def generate_trial_balance(db: Session, end_date: date = None):
    """
    Calculates the trial balance by summing debits and credits for each account up to a specific date.
    """
    query = db.query(
        models.FinancialAccount.account_id,
        models.FinancialAccount.account_name,
        func.sum(models.GeneralLedger.debit).label('total_debit'),
        func.sum(models.GeneralLedger.credit).label('total_credit')
    ).join(models.GeneralLedger, models.FinancialAccount.account_id == models.GeneralLedger.account_id)

    if end_date:
        query = query.filter(models.GeneralLedger.entry_date <= end_date)

    query = query.group_by(models.FinancialAccount.account_id, models.FinancialAccount.account_name).order_by(models.FinancialAccount.account_id)
    
    return query.all()

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
    assets = []
    liabilities = []
    equity_accounts = []
    total_assets = Decimal(0)
    total_liabilities = Decimal(0)
    total_equity = Decimal(0)
    
    revenue_for_re = Decimal(0)
    expense_for_re = Decimal(0)

    for acc_id, acc_name, acc_type, balance_val in account_balances:
        balance = Decimal(str(balance_val or 0))
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
        .filter(models.GeneralLedger.entry_date < start_date)\
        .scalar() or 0
    beginning_equity_balance = Decimal(str(beginning_equity_balance))

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

    contributions = sum(Decimal(str(t.credit or 0)) for t in equity_transactions)
    draws = sum(Decimal(str(t.debit or 0)) for t in equity_transactions)

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
    revenues = []
    expenses = []
    total_revenue = Decimal(0)
    total_expense = Decimal(0)

    for acc_type, acc_name, balance_val in transactions:
        balance = Decimal(str(balance_val or 0))
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