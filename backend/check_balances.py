
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "admin"
PASSWORD = "admin123"

# Account IDs
ACCOUNTS = {
    "Cash (10101)": 10101,
    "Inventory (10103)": 10103,
    "Accounts Receivable (10104)": 10104,
    "Accounts Payable (20101)": 20101,
    "Sales Revenue (40101)": 40101,
    "COGS (50101)": 50101,
    "Inventory Loss (50102)": 50102,
    "Inventory Gain (40102)": 40102
}

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
            print(f"Auth Failed: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Connection Failed: {e}")
        sys.exit(1)

def run():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== CURRENT FINANCIAL ACCOUNT BALANCES ===")
    print(f"{'Account':<30} | {'Balance':>15}")
    print("-" * 50)
    
    for name, acc_id in ACCOUNTS.items():
        res = requests.get(f"{BASE_URL}/financial-accounts/{acc_id}", headers=headers)
        if res.status_code == 200:
            data = res.json()
            balance = float(data['current_balance'])
            # Format nicely
            print(f"{name:<30} | {balance:15.2f}")
        else:
            print(f"{name:<30} | {'ERROR':>15}")

if __name__ == "__main__":
    run()
