
import requests
import json
import sys
from datetime import date
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
USERNAME = "admin"
PASSWORD = "admin123"

# Standard IDs (from bootstrap or common knowledge of the system)
CASH_ACCOUNT_ID = 10101
OWNER_EQUITY_ID = 30101

# Colors
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, type="INFO"):
    if type == "INFO":
        print(f"{Colors.OKBLUE}[INFO]{Colors.ENDC} {msg}")
    elif type == "SUCCESS":
        print(f"{Colors.OKGREEN}[SUCCESS]{Colors.ENDC} {msg}")
    elif type == "ERROR":
        print(f"{Colors.FAIL}[ERROR]{Colors.ENDC} {msg}")
    elif type == "HEADER":
        print(f"\n{Colors.HEADER}{Colors.BOLD}=== {msg} ==={Colors.ENDC}")

def get_token():
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": USERNAME, "password": PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            log(f"Authentication failed: {response.text}", "ERROR")
            sys.exit(1)
    except Exception as e:
        log(f"Connection failed: {str(e)}", "ERROR")
        sys.exit(1)

def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def run_test():
    token = get_token()
    headers = get_headers(token)
    
    # ---------------------------------------------------------
    # 1. SETUP: Create Account & Crop
    # ---------------------------------------------------------
    log("Setting up Extended Test Data...", "HEADER")
    
    # Create Expense Account
    expense_acc_name = f"Test Expense {int(time.time())}"
    acc_data = {
        "account_name": expense_acc_name,
        "account_type": "EXPENSE",
        "current_balance": 0
    }
    res = requests.post(f"{BASE_URL}/financial-accounts/", json=acc_data, headers=headers)
    if res.status_code not in [200, 201]:
        log(f"Failed to create expense account: {res.text}", "ERROR")
        sys.exit(1)
    expense_acc = res.json()
    expense_acc_id = expense_acc['account_id']
    log(f"Created Expense Account: {expense_acc_name} (ID: {expense_acc_id})", "SUCCESS")

    # Create Crop
    crop_name = f"ReturnCrop_{int(time.time())}"
    crop_data = {
        "crop_name": crop_name,
        "is_active": True,
        "allowed_pricing_units": ["kg"],
        "conversion_factors": {"kg": 1.0}
    }
    res = requests.post(f"{BASE_URL}/crops/", json=crop_data, headers=headers)
    crop = res.json()
    crop_id = crop['crop_id']
    log(f"Created Crop: {crop_name} (ID: {crop_id})", "SUCCESS")
    
    # Create Supplier
    supplier_data = {
        "name": f"ReturnSupplier_{int(time.time())}",
        "is_supplier": True,
        "phone": "0000000000"
    }
    res = requests.post(f"{BASE_URL}/contacts/", json=supplier_data, headers=headers)
    supplier = res.json()
    supplier_id = supplier['contact_id']
    log(f"Created Supplier: {supplier['name']} (ID: {supplier_id})", "SUCCESS")

    # ---------------------------------------------------------
    # 2. TEST EXPENSE RECORDING
    # ---------------------------------------------------------
    log("Testing EXPENSE Recording...", "HEADER")
    expense_amount = 500.0
    expense_data = {
        "expense_date": date.today().isoformat(),
        "description": "Test Utility Bill",
        "amount": expense_amount,
        "credit_account_id": CASH_ACCOUNT_ID,    # Payer (Cash)
        "debit_account_id": expense_acc_id,      # Receiver (Expense Category)
        "supplier_id": None
    }
    
    # Get Cash Balance Before
    res = requests.get(f"{BASE_URL}/financial-accounts/{CASH_ACCOUNT_ID}", headers=headers)
    cash_before = float(res.json()['current_balance'])
    
    # Execute Expense
    res = requests.post(f"{BASE_URL}/expenses/", json=expense_data, headers=headers)
    if res.status_code != 200:
        log(f"Expense failed: {res.text}", "ERROR")
    else:
        exp = res.json()
        log(f"Expense Recorded: ID {exp['expense_id']} | Amount: {expense_amount}", "SUCCESS")
        
        # Check Cash Balance After
        res = requests.get(f"{BASE_URL}/financial-accounts/{CASH_ACCOUNT_ID}", headers=headers)
        cash_after = float(res.json()['current_balance'])
        
        if abs(cash_before - cash_after - expense_amount) < 0.01:
            log(f"Cash Account correctly decreased by {expense_amount}", "SUCCESS")
        else:
            log(f"Cash Mismatch! Before: {cash_before}, After: {cash_after}, Diff: {cash_before - cash_after} (Expected {expense_amount})", "ERROR")

    # ---------------------------------------------------------
    # 3. TEST CAPITAL CONTRIBUTION
    # ---------------------------------------------------------
    log("Testing CAPITAL CONTRIBUTION...", "HEADER")
    capital_amount = 10000.0
    capital_data = {
        "transaction_date": date.today().isoformat(),
        "type": "CONTRIBUTION",
        "amount": capital_amount,
        "description": "Initial Capital Injection Test",
        "owner_name": "Test Owner"
    }
    
    # Get Equity Balance Before (using 30101 default)
    res = requests.get(f"{BASE_URL}/financial-accounts/{OWNER_EQUITY_ID}", headers=headers)
    equity_before = float(res.json()['current_balance']) if res.status_code == 200 else 0
    
    # Update Cash Before (it changed after expense)
    res = requests.get(f"{BASE_URL}/financial-accounts/{CASH_ACCOUNT_ID}", headers=headers)
    cash_before = float(res.json()['current_balance'])

    # Execute Capital Transaction
    # Correct endpoint is /capital/transaction (singular)
    res = requests.post(f"{BASE_URL}/capital/transaction", json=capital_data, headers=headers)
    
    if res.status_code != 200:
        log(f"Capital contribution failed: {res.text}", "ERROR")
    else:
        log(f"Capital Contribution Recorded: {capital_amount}", "SUCCESS")
        
        # Check Cash Balance After
        res = requests.get(f"{BASE_URL}/financial-accounts/{CASH_ACCOUNT_ID}", headers=headers)
        cash_after = float(res.json()['current_balance'])
        
        # Check Equity Balance After
        res = requests.get(f"{BASE_URL}/financial-accounts/{OWNER_EQUITY_ID}", headers=headers)
        equity_after = float(res.json()['current_balance'])
        
        if abs(cash_after - cash_before - capital_amount) < 0.01:
             log(f"Cash correctly increased by {capital_amount}", "SUCCESS")
        else:
             log(f"Cash Capital Mismatch! Diff: {cash_after - cash_before}", "ERROR")

        if abs(equity_after - equity_before - capital_amount) < 0.01:
             log(f"Equity correctly increased by {capital_amount}", "SUCCESS")
        else:
             log(f"Equity Capital Mismatch! Diff: {equity_after - equity_before}", "ERROR")

    # ---------------------------------------------------------
    # 4. TEST PURCHASE RETURN
    # ---------------------------------------------------------
    log("Testing PURCHASE RETURN...", "HEADER")
    
    # First, buy 100 units
    purchase_data = {
        "crop_id": crop_id,
        "supplier_id": supplier_id,
        "purchase_date": date.today().isoformat(),
        "quantity_kg": 100,
        "unit_price": 10,
        "purchasing_pricing_unit": "kg",
        "conversion_factor": 1.0,
        "amount_paid": 0 # Credit
    }
    res = requests.post(f"{BASE_URL}/purchases/", json=purchase_data, headers=headers)
    if res.status_code != 200:
        log("Prerequisite Purchase Failed", "ERROR")
        return
    purchase_id = res.json()['purchase_id']
    log(f"Prerequisite Purchase Created (ID: {purchase_id})", "INFO")
    
    # Return 20 units
    return_qty = 20.0
    return_data = {
        "purchase_id": purchase_id,
        "return_date": date.today().isoformat(),
        "quantity_kg": return_qty,
        "return_reason": "Damaged items"
    }
    
    res = requests.post(f"{BASE_URL}/purchase-returns/", json=return_data, headers=headers)
    if res.status_code != 200:
        log(f"Purchase Return Failed: {res.text}", "ERROR")
    else:
        ret = res.json()
        log(f"Purchase Return Created (ID: {ret['return_id']})", "SUCCESS")
        
        # Verify Inventory (100 - 20 = 80)
        res = requests.get(f"{BASE_URL}/inventory/", headers=headers)
        inv_items = res.json()
        target_inv = next((item for item in inv_items if item['crop']['crop_id'] == crop_id), None)
        
        if target_inv and abs(float(target_inv['current_stock_kg']) - 80.0) < 0.01:
            log(f"Inventory correctly became 80.0 kg", "SUCCESS")
        else:
            log(f"Inventory Mismatch! Expected 80.0, got {target_inv.get('current_stock_kg') if target_inv else 'None'}", "ERROR")

        # Verify Supplier Account Statement
        # Expecting Purchase (+1000) and Return (-200) -> Net 800 balance due.
        res = requests.get(f"{BASE_URL}/contacts/{supplier_id}/statement", headers=headers)
        if res.status_code == 200:
            stmt = res.json()
            balance = float(stmt['closing_balance'])
            log(f"Supplier Closing Balance from Statement: {balance}", "INFO")
            
            # The system likely treats "Amount Supplier Needs to be Paid" as Positive or Negative depending on implementation.
            # Usually Suppliers Balance Due is Liability (Credit).
            # If implementation follows standard:
            # - Purchase: Credit AP (increases balance if we view liability as positive)
            # - Return: Debit AP (decreases balance)
            
            if abs(balance - 800.0) < 0.01:
                log("Supplier Balance Correct (800.0)", "SUCCESS")
            elif abs(balance + 800.0) < 0.01:
                 log("Supplier Balance Correct (-800.0)", "SUCCESS")
            else:
                 log(f"Supplier Balance Mismatch (Expected 800)", "WARNING")
        else:
            log(f"Failed to get Supplier Statement: {res.text}", "ERROR")

    log("Extended Features Test Completed!", "HEADER")

if __name__ == "__main__":
    run_test()
