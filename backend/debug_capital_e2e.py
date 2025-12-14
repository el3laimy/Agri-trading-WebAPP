from fastapi.testclient import TestClient
from app.main import app
from app import crud, models
from app.core.bootstrap import CASH_ACCOUNT_ID, OWNER_EQUITY_ID
from app.database import SessionLocal
import datetime

client = TestClient(app)

def run_test():
    print("=== Starting Capital Management E2E Test (Backend) ===")
    
    # 1. Login
    print("\n[1] Logging in as admin...")
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if login_resp.status_code != 200:
        print(f"Login Failed: {login_resp.text}")
        return
    
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login Successful.")

    # Get Initial Balances
    db = SessionLocal()
    cash_acct = crud.get_financial_account(db, CASH_ACCOUNT_ID)
    equity_acct = crud.get_financial_account(db, OWNER_EQUITY_ID)
    initial_cash = cash_acct.current_balance
    initial_equity = equity_acct.current_balance
    print(f"Initial Balances -> Cash: {initial_cash}, Equity: {initial_equity}")
    db.close()

    # 2. Contribution
    print("\n[2] Testing Capital Contribution (1,000,000)...")
    contrib_data = {
        "transaction_date": str(datetime.date.today()),
        "type": "CONTRIBUTION",
        "amount": 1000000.0,
        "description": "Test Contribution",
        "owner_name": "Test Owner",
        "reference_number": "REF-001"
    }
    
    # Note: Using dependency injection in endpoints requires valid token if enforced.
    # Currently endpoint might not enforce auth but passing headers is good practice.
    resp = client.post("/api/v1/capital/transaction", json=contrib_data, headers=headers)
    
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
    
    if resp.status_code != 200:
        print("Contribution Failed!")
        return

    # Verify Balances
    db = SessionLocal()
    cash_acct = crud.get_financial_account(db, CASH_ACCOUNT_ID)
    equity_acct = crud.get_financial_account(db, OWNER_EQUITY_ID)
    
    # Equity is credit account, so positive balance means Credit? 
    # In this system, 'current_balance' usually tracks the absolute value or net based on type.
    # Typically: Equity increases with Credit. Cash increases with Debit.
    # app/services/capital.py: 
    #   Contribution: Debit Cash, Credit Equity.
    #   update_account_balance(db, CASH_ACCOUNT_ID, amount) (Adds to balance)
    #   update_account_balance(db, OWNER_EQUITY_ID, amount) (Adds to balance)
    
    print(f"Post-Contribution -> Cash: {cash_acct.current_balance}, Equity: {equity_acct.current_balance}")
    
    expected_cash = initial_cash + 1000000.0
    expected_equity = initial_equity + 1000000.0
    
    if abs(cash_acct.current_balance - expected_cash) < 0.01 and abs(equity_acct.current_balance - expected_equity) < 0.01:
        print("SUCCESS: Balances updated correctly for Contribution.")
    else:
        print(f"FAILURE: Balances incorrect. Expected Cash: {expected_cash}, Equity: {expected_equity}")

    db.close()

    # 3. Withdrawal
    print("\n[3] Testing Capital Withdrawal (50,000)...")
    withdraw_data = {
        "transaction_date": str(datetime.date.today()),
        "type": "WITHDRAWAL",
        "amount": 50000.0,
        "description": "Test Withdrawal",
        "owner_name": "Test Owner"
    }

    resp = client.post("/api/v1/capital/transaction", json=withdraw_data, headers=headers)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code != 200:
         print(f"Withdrawal Failed: {resp.text}")
         return

    # Verify Balances
    db = SessionLocal()
    cash_acct = crud.get_financial_account(db, CASH_ACCOUNT_ID)
    equity_acct = crud.get_financial_account(db, OWNER_EQUITY_ID)
    
    print(f"Post-Withdrawal -> Cash: {cash_acct.current_balance}, Equity: {equity_acct.current_balance}")

    expected_cash_final = expected_cash - 50000.0
    expected_equity_final = expected_equity - 50000.0

    if abs(cash_acct.current_balance - expected_cash_final) < 0.01 and abs(equity_acct.current_balance - expected_equity_final) < 0.01:
        print("SUCCESS: Balances updated correctly for Withdrawal.")
    else:
        print(f"FAILURE: Balances incorrect.")
    
    db.close()

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Test crashed: {e}")
        import traceback
        traceback.print_exc()

