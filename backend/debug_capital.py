"""Debug script to analyze capital distribution discrepancy"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///agri_trading.db')
Session = sessionmaker(bind=engine)
db = Session()

print("=== Capital Distribution Debug ===\n")

# Assets
cash = db.execute(text("SELECT current_balance FROM financial_accounts WHERE account_id = 10101")).scalar() or 0
print(f"Cash Balance (10101): {cash:,.2f}")

inventory = db.execute(text("SELECT SUM(current_stock_kg * average_cost_per_kg) FROM inventory")).scalar() or 0
print(f"Inventory Value: {inventory:,.2f}")

total_sales = db.execute(text("SELECT SUM(total_sale_amount) FROM sales")).scalar() or 0
total_received = db.execute(text("SELECT SUM(amount_received) FROM sales")).scalar() or 0
receivables = total_sales - total_received
print(f"Accounts Receivable (Sales - Received): {total_sales:,.2f} - {total_received:,.2f} = {receivables:,.2f}")

total_assets = cash + inventory + receivables
print(f"\n>> TOTAL ASSETS: {total_assets:,.2f}")

# Sources
equity = db.execute(text("SELECT current_balance FROM financial_accounts WHERE account_id = 30101")).scalar() or 0
owner_capital = abs(equity)
print(f"\nOwner Equity (30101): {owner_capital:,.2f}")

# Net Profit - from revenue and expense accounts
revenue = db.execute(text("SELECT SUM(credit - debit) FROM general_ledger gl JOIN financial_accounts fa ON gl.account_id = fa.account_id WHERE fa.account_type = 'REVENUE'")).scalar() or 0
expenses = db.execute(text("SELECT SUM(debit - credit) FROM general_ledger gl JOIN financial_accounts fa ON gl.account_id = fa.account_id WHERE fa.account_type = 'EXPENSE'")).scalar() or 0
net_profit = revenue - expenses
print(f"Total Revenue: {revenue:,.2f}")
print(f"Total Expenses: {expenses:,.2f}")
print(f"Net Profit: {net_profit:,.2f}")

total_purchases = db.execute(text("SELECT SUM(total_cost) FROM purchases")).scalar() or 0
total_paid = db.execute(text("SELECT SUM(amount_paid) FROM purchases")).scalar() or 0
payables = total_purchases - total_paid
print(f"Accounts Payable (Purchases - Paid): {total_purchases:,.2f} - {total_paid:,.2f} = {payables:,.2f}")

total_sources = owner_capital + net_profit + payables
print(f"\n>> TOTAL SOURCES: {total_sources:,.2f}")

difference = total_assets - total_sources
print(f"\n=== DIFFERENCE: {difference:,.2f} ===")

db.close()
