import urllib.request
import json
import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

def post_request(endpoint, data):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url)
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    json_data = json.dumps(data).encode('utf-8')
    req.add_header('Content-Length', len(json_data))
    
    try:
        response = urllib.request.urlopen(req, json_data)
        return json.loads(response.read().decode('utf-8')), response.getcode()
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None, e.code
    except Exception as e:
        print(f"Error: {e}")
        return None, 500

def get_request(endpoint):
    url = f"{BASE_URL}{endpoint}"
    try:
        response = urllib.request.urlopen(url)
        return json.loads(response.read().decode('utf-8')), response.getcode()
    except Exception as e:
        print(f"Error fetching {endpoint}: {e}")
        return None, 500

def run_test():
    print("Starting End-to-End API Test Scenario...")
    
    # 1. Create Season
    print("\n[1] Creating Season 'Winter 2025'...")
    season_data = {
        "name": "Winter 2025",
        "start_date": "2025-01-01",
        "end_date": "2025-04-01",
        "status": "UPCOMING"
    }
    season, status = post_request("/seasons/", season_data)
    if status == 200 or status == 201:
        print(f"  Success: Created Season ID {season['season_id']}")
    else:
        print("  Failed to create season")

    # 2. Create Crop
    print("\n[2] Creating Crop 'Potatoes'...")
    crop_data = {
        "crop_name": "Potatoes",
        "allowed_pricing_units": ["kg", "ton"],
        "conversion_factors": {"ton": 1000},
        "is_active": True
    }
    crop, status = post_request("/crops/", crop_data)
    if status == 200 or status == 201:
        print(f"  Success: Created Crop ID {crop['crop_id']}")
        crop_id = crop['crop_id']
    elif status == 400: # Maybe already exists
         print("  Crop might already exist, fetching...")
         # Try to find it
         crops, _ = get_request("/crops/")
         target_crop = next((c for c in crops if c['crop_name'] == "Potatoes"), None)
         if target_crop:
             crop_id = target_crop['crop_id']
             print(f"  Found existing Crop ID {crop_id}")
         else:
             print("  Could not find crop.")
             return
    else:
        print("  Failed to create crop")
        return

    # 3. Create Contacts
    print("\n[3] Creating Contacts...")
    supplier_data = {
        "name": "Ali Seeds",
        "is_supplier": True,
        "is_customer": False
    }
    supplier, status = post_request("/contacts/", supplier_data)
    if status == 200 or status == 201:
        print(f"  Success: Created Supplier ID {supplier['contact_id']}")
        supplier_id = supplier['contact_id']
    else: 
        print("  Failed to create supplier")
        # Attempt fetch logic if needed, but for now just proceed/fail
        return

    customer_data = {
        "name": "Market One",
        "is_supplier": False,
        "is_customer": True
    }
    customer, status = post_request("/contacts/", customer_data)
    if status == 200 or status == 201:
        print(f"  Success: Created Customer ID {customer['contact_id']}")
        customer_id = customer['contact_id']
    else:
        print("  Failed to create customer")
        return

    # 4. Record Purchase
    print("\n[4] Recording Purchase (1000kg Potatoes)...")
    purchase_data = {
        "crop_id": crop_id,
        "supplier_id": supplier_id,
        "purchase_date": datetime.date.today().isoformat(),
        "quantity_kg": 1000.0,
        "unit_price": 5.0 # 5000 Total Cost
    }
    purchase, status = post_request("/purchases/", purchase_data)
    if status == 200 or status == 201:
        print(f"  Success: Created Purchase ID {purchase['purchase_id']}")
        print(f"  Total Cost: {purchase['total_cost']}")
    else:
        print("  Failed to create purchase")
        return

    # 5. Record Sale
    print("\n[5] Recording Sale (500kg Potatoes)...")
    sale_data = {
        "crop_id": crop_id,
        "customer_id": customer_id,
        "sale_date": datetime.date.today().isoformat(),
        "quantity_sold_kg": 500.0,
        "selling_unit_price": 8.0, # 4000 Total Sale
        "selling_pricing_unit": "kg",
        "specific_selling_factor": 1.0
    }
    sale, status = post_request("/sales/", sale_data)
    if status == 200 or status == 201:
        print(f"  Success: Created Sale ID {sale['sale_id']}")
        print(f"  Total Sale Amount: {sale['total_sale_amount']}")
    else:
        print("  Failed to create sale")
        return

    # 6. Verify with Inventory
    print("\n[6] Verifying Inventory...")
    inventory_items, status = get_request(f"/inventory/?crop_id={crop_id}")
    if status == 200:
        # returns list
        target_item = next((i for i in inventory_items if i['crop']['crop_id'] == crop_id), None)
        if target_item:
            print(f"  Inventory for Potatoes: {target_item['current_stock_kg']} kg")
            if abs(target_item['current_stock_kg'] - 500.0) < 0.01:
                 print("  PASSED: Inventory count is correct (1000 - 500 = 500).")
            else:
                 print(f"  FAILED: Expected 500.0, got {target_item['current_stock_kg']}")
        else:
             print("  FAILED: Inventory record not found.")
    else:
        print("  Failed to fetch inventory")

if __name__ == "__main__":
    run_test()
