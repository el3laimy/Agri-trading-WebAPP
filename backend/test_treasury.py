import urllib.request
import json
import random
from datetime import date

BASE_URL = "http://localhost:8000/api/v1"

def api_call(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    
    if data:
        body = json.dumps(data).encode('utf-8')
        req.data = body
        
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return None
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_treasury_flow():
    print("--- Starting Treasury Flow Test ---")
    
    # 1. Get Initial Treasury State
    print("\n1. Fetching Initial Treasury Summary...")
    initial_summary = api_call("/treasury/summary")
    print(f"Initial Balance: {initial_summary['current_balance']}")
    
    # 2. Setup Data (Crop, Customer, Supplier)
    # Reusing existing IDs if possible, or creating dummy ones. 
    # For simplicity, assuming ID 1 exists for all (or creating new)
    # Let's create a new crop to be safe.
    crop_name = f"TestCrop_{random.randint(1000,9999)}_{int(date.today().strftime('%Y%m%d'))}"
    print(f"\n2. Creating Test Crop: {crop_name}")
    crop_data = {
        "crop_name": crop_name,
        "planting_date": str(date.today()),
        "planting_area": 10.0,
        "expected_yield_kg": 1000.0,
        "is_active": True,
        "allowed_pricing_units": ["kg", "ton"],
        "conversion_factors": {"ton": 1000.0, "kg": 1.0}
    }
    crop = api_call("/crops/", "POST", crop_data)
    if not crop:
        print("Failed to create crop. Exiting.")
        return
    crop_id = crop['crop_id']
    
    # Create Inventory for this crop (add purchase later handles it, but let's do initial stock)
    # Actually, we need stock to sell. So let's buy first.
    
    # Create Supplier
    supplier_name = f"TestSupplier_{random.randint(100,999)}"
    print(f"\n2a. Creating Test Supplier: {supplier_name}")
    supplier_data = {"name": supplier_name, "is_supplier": True, "is_customer": False}
    supplier = api_call("/contacts/", "POST", supplier_data)
    supplier_id = supplier['contact_id']

    # Create Customer
    customer_name = f"TestCustomer_{random.randint(100,999)}"
    print(f"\n2b. Creating Test Customer: {customer_name}")
    customer_data = {"name": customer_name, "is_supplier": False, "is_customer": True}
    customer = api_call("/contacts/", "POST", customer_data)
    customer_id = customer['contact_id']
    
    # 3. Create Cash Purchase (Immediate Payment)
    print("\n3. Creating Cash Purchase (100kg @ 10EGP, Paid 1000EGP)...")
    purchase_data = {
        "crop_id": crop_id,
        "supplier_id": supplier_id,
        "purchase_date": str(date.today()),
        "quantity_kg": 100.0,
        "unit_price": 10.0,
        "amount_paid": 1000.0 # Full Payment
    }
    purchase = api_call("/purchases/", "POST", purchase_data)
    if purchase:
        print(f"Purchase Created. ID: {purchase['purchase_id']}, Payment Status: {purchase['payment_status']}")
    
    # 4. Check Treasury (Should show Outflow)
    print("\n4. Checking Treasury after Purchase...")
    summary_after_purchase = api_call("/treasury/summary")
    print(f"Balance: {summary_after_purchase['current_balance']}")
    print(f"Total Out Today: {summary_after_purchase['total_out_today']}")
    
    if summary_after_purchase['total_out_today'] > initial_summary['total_out_today']:
        print("PASS: Total Out increased correctly.")
    else:
        print("FAIL: Total Out did not increase.")

    print("\n5. Creating Cash Sale (50kg @ 20EGP, Received 1000EGP)...")
    sale_data = {
        "crop_id": crop_id,
        "customer_id": customer_id,
        "sale_date": str(date.today()),
        "quantity_sold_kg": 50.0,
        "selling_unit_price": 20.0,
        "selling_pricing_unit": "kg",
        "specific_selling_factor": 1.0,
        "amount_received": 1000.0 # Full Payment
    }
    sale = api_call("/sales/", "POST", sale_data)
    if sale:
         print(f"Sale Created. ID: {sale['sale_id']}, Payment Status: {sale['payment_status']}")

    # 6. Check Treasury (Should show Inflow)
    print("\n6. Checking Treasury after Sale...")
    summary_after_sale = api_call("/treasury/summary")
    print(f"Balance: {summary_after_sale['current_balance']}")
    print(f"Total In Today: {summary_after_sale['total_in_today']}")
    
    if summary_after_sale['total_in_today'] > initial_summary['total_in_today']:
        print("PASS: Total In increased correctly.")
    else:
        print("FAIL: Total In did not increase.")

    # 7. Check Transactions Log
    print("\n7. Fetching Recent Transactions...")
    transactions = api_call("/treasury/transactions?limit=5")
    for t in transactions:
        print(f"- {t['date']} | {t['type']} | {t['amount']} | {t['description']}")

    # 8. Time Travel Test (Opening Balance Check)
    # We will check the summary for Tomorrow.
    # Opening Balance Tomorrow should = Closing Balance Today
    
    import datetime
    tomorrow = str(date.today() + datetime.timedelta(days=1))
    
    print(f"\n8. Checking Summary for Tomorrow ({tomorrow})...")
    summary_tomorrow = api_call(f"/treasury/summary?target_date={tomorrow}")
    
    print(f"Tomorrow Opening Balance: {summary_tomorrow['opening_balance']}")
    # As we just added transactions today, tomorrow's opening balance should reflect them.
    # Specifically, we added: -1000 (Purchase) + 1000 (Sale) = Net 0 change.
    # Wait, check previous logic. Net change is 0. So Opening should be same as today's Opening.
    # Let's try adding one more UNBALANCED transaction today.
    
    print("\n8a. Creating Unbalanced Sale (Receipt 500)...")
    sale_data_2 = {
        "crop_id": crop_id,
        "customer_id": customer_id,
        "sale_date": str(date.today()),
        "quantity_sold_kg": 25.0,
        "selling_unit_price": 20.0,
        "selling_pricing_unit": "kg",
        "specific_selling_factor": 1.0,
        "amount_received": 500.0
    }
    api_call("/sales/", "POST", sale_data_2)
    
    # Recalculate Today
    summary_today_updated = api_call("/treasury/summary")
    print(f"Today Closing Balance: {summary_today_updated['closing_balance']}")
    
    # Check Tomorrow Again
    summary_tomorrow_updated = api_call(f"/treasury/summary?target_date={tomorrow}")
    print(f"Tomorrow Updated Opening Balance: {summary_tomorrow_updated['opening_balance']}")
    
    if summary_tomorrow_updated['opening_balance'] == summary_today_updated['closing_balance']:
        print("PASS: Tomorrow's Opening Balance matches Today's Closing Balance.")
    else:
        print(f"FAIL: Mismatch. Tomorrow Open: {summary_tomorrow_updated['opening_balance']} != Today Close: {summary_today_updated['closing_balance']}")

if __name__ == "__main__":
    test_treasury_flow()
