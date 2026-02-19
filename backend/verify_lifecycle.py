
import requests
import json
import sys
from datetime import date
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
USERNAME = "admin"
PASSWORD = "admin123"

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
            token = response.json()["access_token"]
            log("Authentication successful", "SUCCESS")
            return token
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
    
    # 1. Setup Data: Create Crop
    log("Setting up Test Data...", "HEADER")
    crop_name = f"TestCrop_{int(time.time())}"
    crop_data = {
        "crop_name": crop_name,
        "is_active": True,
        "allowed_pricing_units": ["kg", "ton"],
        "conversion_factors": {"ton": 1000.0, "kg": 1.0}
    }
    
    # Create Crop
    res = requests.post(f"{BASE_URL}/crops/", json=crop_data, headers=headers)
    if res.status_code not in [200, 201]:
        log(f"Failed to create crop: {res.text}", "ERROR")
        return
    crop = res.json()
    crop_id = crop['crop_id']
    log(f"Created Crop: {crop['crop_name']} (ID: {crop_id})", "SUCCESS")

    # 2. Create Contacts
    supplier_data = {
        "name": f"TestSupplier_{int(time.time())}",
        "is_supplier": True,
        "phone": "0123456789"
    }
    res = requests.post(f"{BASE_URL}/contacts/", json=supplier_data, headers=headers)
    supplier = res.json()
    supplier_id = supplier['contact_id']
    log(f"Created Supplier: {supplier['name']} (ID: {supplier_id})", "SUCCESS")

    customer_data = {
        "name": f"TestCustomer_{int(time.time())}",
        "is_customer": True,
        "phone": "0987654321"
    }
    res = requests.post(f"{BASE_URL}/contacts/", json=customer_data, headers=headers)
    customer = res.json()
    customer_id = customer['contact_id']
    log(f"Created Customer: {customer['name']} (ID: {customer_id})", "SUCCESS")
    
    # 3. Get Account IDs 
    # Use built-in defaults or from bootstrap
    # COGS: 50101, Sales: 40101, Inventory: 10103, Cash: 10101, AP: 20101, AR: 10104
    # We can rely on system defaults for endpoints that don't need explicit account (Purchase/Sale)
    # But Payment needs explicit accounts.
    
    # 4. PURCHASE OPERATION
    log("Testing PURCHASE Operation...", "HEADER")
    purchase_qty = 1000
    purchase_price = 10
    purchase_data = {
        "crop_id": crop_id,
        "supplier_id": supplier_id,
        "purchase_date": date.today().isoformat(),
        "quantity_kg": purchase_qty,
        "unit_price": purchase_price,
        "purchasing_pricing_unit": "kg",
        "conversion_factor": 1.0,
        "notes": "Automated Test Purchase",
        "amount_paid": 0  # Credit purchase
    }
    res = requests.post(f"{BASE_URL}/purchases/", json=purchase_data, headers=headers)
    if res.status_code != 200:
        log(f"Purchase failed: {res.text}", "ERROR")
        return
    purchase = res.json()
    purchase_id = purchase['purchase_id']
    log(f"Purchase Created: ID {purchase_id} | Qty: {purchase_qty} | Price: {purchase_price} | Total: {purchase['total_cost']}", "SUCCESS")
    
    # Verify Inventory
    res = requests.get(f"{BASE_URL}/inventory/", headers=headers)
    inv_items = res.json()
    # Filter for our crop
    target_inv = next((item for item in inv_items if item['crop']['crop_id'] == crop_id), None)
    if target_inv and float(target_inv['current_stock_kg']) == purchase_qty:
        log(f"Inventory Verified: {target_inv['current_stock_kg']} kg", "SUCCESS")
    else:
        log(f"Inventory Mismatch! Expected {purchase_qty}, got {target_inv.get('current_stock_kg') if target_inv else 'None'}", "ERROR")

    # 5. PAYMENT OPERATION (Pay 5000 to Supplier)
    log("Testing PAYMENT Operation...", "HEADER")
    payment_amount = 5000
    payment_data = {
        "payment_date": date.today().isoformat(),
        "amount": payment_amount,
        "contact_id": supplier_id,
        "payment_method": "cash",
        "credit_account_id": 10101, # Cash (Asset) - Credit means money leaves?
        # WAIT. In accounting:
        # To decrease Asset (Cash), we CREDIT it.
        # To decrease Liability (AP), we DEBIT it.
        # The API likely asks "credit_account_id" and "debit_account_id" for the entry.
        "debit_account_id": 20101, # AP (Liability) - Debit decreases liability.
        "credit_account_id": 10101, # Cash (Asset) - Credit decreases asset.
        
        # NOTE: Verify if frontend sends these IDs. Usually it does.
        "transaction_type": "PURCHASE",
        "transaction_id": purchase_id
    }
    
    # We need to know valid IDs.
    # Let's trust the bootstrap IDs.
    res = requests.post(f"{BASE_URL}/payments/", json=payment_data, headers=headers)
    if res.status_code != 200:
        log(f"Payment failed: {res.text}", "ERROR")
    else:
        payment = res.json()
        log(f"Payment Created: ID {payment['payment_id']} | Amount: {payment_amount}", "SUCCESS")
        
    # 6. SALE OPERATION
    log("Testing SALE Operation...", "HEADER")
    sale_qty = 500
    sale_price = 20
    sale_data = {
        "crop_id": crop_id,
        "customer_id": customer_id,
        "sale_date": date.today().isoformat(),
        "quantity_sold_kg": sale_qty,
        "selling_unit_price": sale_price,
        "selling_pricing_unit": "kg",
        "specific_selling_factor": 1.0,
        "amount_received": 0 # Credit sale
    }
    
    res = requests.post(f"{BASE_URL}/sales/", json=sale_data, headers=headers)
    if res.status_code != 200:
        log(f"Sale failed: {res.text}", "ERROR")
        return
    sale = res.json()
    sale_id = sale['sale_id']
    log(f"Sale Created: ID {sale_id} | Qty: {sale_qty} | Price: {sale_price} | Total: {sale['total_sale_amount']}", "SUCCESS")
    
    # Verify Inventory (-500)
    res = requests.get(f"{BASE_URL}/inventory/", headers=headers)
    inv_items = res.json()
    target_inv = next((item for item in inv_items if item['crop']['crop_id'] == crop_id), None)
    expected_stock = purchase_qty - sale_qty
    if target_inv and float(target_inv['current_stock_kg']) == expected_stock:
        log(f"Inventory Verified post-sale: {target_inv['current_stock_kg']} kg", "SUCCESS")
    else:
        log(f"Inventory Mismatch post-sale! Expected {expected_stock}, got {target_inv.get('current_stock_kg') if target_inv else 'None'}", "ERROR")

    # 7. RETURN OPERATION (Sale Return)
    log("Testing RETURN Operation (Sale Return)...", "HEADER")
    return_qty = 100
    return_data = {
        "sale_id": sale_id,
        "return_date": date.today().isoformat(),
        "quantity_kg": return_qty,
        "return_reason": "Test Return"
    }
    
    res = requests.post(f"{BASE_URL}/sale-returns/", json=return_data, headers=headers)
    if res.status_code != 200:
        log(f"Return failed: {res.text}", "ERROR")
    else:
        ret = res.json()
        log(f"Return Created: ID {ret['return_id']} | Qty: {return_qty} | User Refund: {ret['refund_amount']}", "SUCCESS")
        
        # Verify Inventory (+100)
        res = requests.get(f"{BASE_URL}/inventory/", headers=headers)
        inv_items = res.json()
        target_inv = next((item for item in inv_items if item['crop']['crop_id'] == crop_id), None)
        expected_stock_final = expected_stock + return_qty
        if target_inv and float(target_inv['current_stock_kg']) == expected_stock_final:
            log(f"Inventory Verified post-return: {target_inv['current_stock_kg']} kg", "SUCCESS")
        else:
            log(f"Inventory Mismatch post-return! Expected {expected_stock_final}, got {target_inv.get('current_stock_kg') if target_inv else 'None'}", "ERROR")

    log("Lifecycle Test Completed!", "HEADER")
    print(f"\n{Colors.WARNING}Please check the General Ledger Report in the browser for financial verification.{Colors.ENDC}")

if __name__ == "__main__":
    run_test()
