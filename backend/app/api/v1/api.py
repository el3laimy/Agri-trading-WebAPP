from fastapi import APIRouter
from app.api.v1.endpoints import contacts, crops, purchases, sales, financial_accounts, reports, expenses, journal, inventory, payments, seasons, sale_returns, purchase_returns, daily_prices, treasury, auth, backup, notifications, contracts, capital

api_router = APIRouter()

# Include all the routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(crops.router, prefix="/crops", tags=["crops"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(financial_accounts.router, prefix="/financial-accounts", tags=["financial-accounts"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(seasons.router, prefix="/seasons", tags=["seasons"])
api_router.include_router(sale_returns.router, prefix="/sale-returns", tags=["sale-returns"])
api_router.include_router(purchase_returns.router, prefix="/purchase-returns", tags=["purchase-returns"])
api_router.include_router(daily_prices.router, prefix="/daily-prices", tags=["daily-prices"])
api_router.include_router(treasury.router, prefix="/treasury", tags=["treasury"])
api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(capital.router, prefix="/capital", tags=["capital"])

