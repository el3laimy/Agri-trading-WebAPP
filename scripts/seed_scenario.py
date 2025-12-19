import requests
import json
from datetime import date
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

def print_step(message):
    print(f"\n[STEP] {message}")
    print("-" * 50)

def handle_response(response, success_code=200):
    if response.status_code == success_code:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        try:
            print(response.json())
        except:
            print(response.text)
        return None

# --- Data Definitions ---

SEASON_DATA = {
    "name": "موسم صيف 2025",
    "start_date": "2024-12-19",
    "end_date": "2025-09-30",
    "status": "ACTIVE"
}

CROPS_DATA = [
    {"crop_name": "بطاطس (صنف سبونتا)", "allowed_pricing_units": ["kg", "ton"], "conversion_factors": {"ton": 1000}},
    {"crop_name": "بصل أحمر (تصدير)", "allowed_pricing_units": ["kg", "ton"], "conversion_factors": {"ton": 1000}},
    {"crop_name": "ثوم (صيني)", "allowed_pricing_units": ["kg", "ton"], "conversion_factors": {"ton": 1000}},
    {"crop_name": "فول بلدي (عريض)", "allowed_pricing_units": ["kg", "ton"], "conversion_factors": {"ton": 1000}}
]

SUPPLIERS_DATA = [
    {"name": "الحاج أحمد عبد العاطي", "is_supplier": True},
    {"name": "شركة النيل للتوريدات الزراعية", "is_supplier": True},
    {"name": "الحاج محمود السوهاجي", "is_supplier": True},
    {"name": "مزرعة الهدى", "is_supplier": True},
    {"name": "الشيخ سالم الهواري", "is_supplier": True},
    {"name": "أبناء الغربية للزراعة", "is_supplier": True},
    {"name": "الحاج محمد أبو سويلم", "is_supplier": True},
    {"name": "مزرعة الفيروز", "is_supplier": True},
    {"name": "حسن القط", "is_supplier": True},
    {"name": "شركة الوادي الأخضر", "is_supplier": True}
]

CUSTOMERS_DATA = [
    {"name": "شركة شيبسي للصناعات الغذائية", "is_customer": True},
    {"name": "وكالة الأمانة", "is_customer": True},
    {"name": "شركة الرواد للتصدير", "is_customer": True},
    {"name": "هايبر ماركت التوحيد", "is_customer": True},
    {"name": "المعلم خميس", "is_customer": True},
    {"name": "شركة فارم فريش", "is_customer": True},
    {"name": "مصنع إيجيبت فودز", "is_customer": True},
    {"name": "أسواق العثيم", "is_customer": True},
    {"name": "وكالة الحاج رضا", "is_customer": True},
    {"name": "شركة كايرو تريدينج", "is_customer": True}
]

# Purchases: (Crop, Supplier, Quantity Tons, Price/Ton)
PURCHASES_SCENARIO = [
    ("بطاطس (صنف سبونتا)", "الحاج أحمد عبد العاطي", 50, 10000),
    ("بصل أحمر (تصدير)", "شركة النيل للتوريدات الزراعية", 100, 8000),
    ("ثوم (صيني)", "حسن القط", 10, 25000),
    ("فول بلدي (عريض)", "أبناء الغربية للزراعة", 20, 30000),
    ("بطاطس (صنف سبونتا)", "مزرعة الهدى", 30, 10200),
    ("بصل أحمر (تصدير)", "الشيخ سالم الهواري", 50, 7900),
    ("ثوم (صيني)", "مزرعة الفيروز", 5, 24500),
    ("فول بلدي (عريض)", "الحاج محمود السوهاجي", 15, 29500),
    ("بطاطس (صنف سبونتا)", "شركة الوادي الأخضر", 40, 10100),
    ("بصل أحمر (تصدير)", "الحاج محمد أبو سويلم", 60, 8100)
]

# Sales: (Crop, Customer, Quantity Tons, Price/Ton)
SALES_SCENARIO = [
    ("بطاطس (صنف سبونتا)", "شركة شيبسي للصناعات الغذائية", 25, 14000),
    ("بصل أحمر (تصدير)", "وكالة الأمانة", 20, 11000),
    ("ثوم (صيني)", "شركة الرواد للتصدير", 8, 35000),
    ("فول بلدي (عريض)", "مصنع إيجيبت فودز", 10, 38000),
    ("بطاطس (صنف سبونتا)", "المعلم خميس", 10, 13500),
    ("بصل أحمر (تصدير)", "شركة فارم فريش", 40, 11500),
    ("فول بلدي (عريض)", "أسواق العثيم", 5, 40000),
    ("بطاطس (صنف سبونتا)", "وكالة الحاج رضا", 15, 13800),
    ("ثوم (صيني)", "شركة كايرو تريدينج", 4, 34500),
    ("بصل أحمر (تصدير)", "هايبر ماركت التوحيد", 10, 12000)
]

# --- Execution ---

id_map = {
    "season": None,
    "crops": {},
    "suppliers": {},
    "customers": {}
}

def main():
    print("Starting Seeding Process...")
    
    # 1. Create Season
    print_step("Creating Season")
    # Check if exists (simple check: try create, if fail assume exists and try to fetch - for now just create)
    # Ideally should list seasons.
    res = requests.get(f"{BASE_URL}/seasons")
    existing_seasons = res.json()
    target_season = next((s for s in existing_seasons if s['name'] == SEASON_DATA['name']), None)
    
    if target_season:
        print(f"Season '{SEASON_DATA['name']}' already exists with ID {target_season['season_id']}")
        id_map['season'] = target_season['season_id']
    else:
        res = requests.post(f"{BASE_URL}/seasons", json=SEASON_DATA)
        data = handle_response(res)
        if data:
            print(f"Created Season: {data['name']}")
            id_map['season'] = data['season_id']

    # 2. Create Crops
    print_step("Creating Crops")
    res = requests.get(f"{BASE_URL}/crops")
    existing_crops = res.json()
    
    for crop in CROPS_DATA:
        target = next((c for c in existing_crops if c['crop_name'] == crop['crop_name']), None)
        if target:
            print(f"Crop '{crop['crop_name']}' exists.")
            id_map['crops'][crop['crop_name']] = target['crop_id']
        else:
            # Send raw dict/list, requests handles JSON serialization
            payload = {
                "crop_name": crop['crop_name'],
                "allowed_pricing_units": crop['allowed_pricing_units'],
                "conversion_factors": crop['conversion_factors']
            }
            res = requests.post(f"{BASE_URL}/crops", json=payload)
            data = handle_response(res)
            if data:
                print(f"Created Crop: {data['crop_name']}")
                id_map['crops'][data['crop_name']] = data['crop_id']

    # 3. Create Contacts
    print_step("Creating Contacts")
    res = requests.get(f"{BASE_URL}/contacts")
    existing_contacts = res.json()
    
    for contact in SUPPLIERS_DATA + CUSTOMERS_DATA:
        target = next((c for c in existing_contacts if c['name'] == contact['name']), None)
        if target:
            print(f"Contact '{contact['name']}' exists.")
            # Store in appropriate map
            if contact.get('is_supplier'):
                id_map['suppliers'][contact['name']] = target['contact_id']
            if contact.get('is_customer'):
                id_map['customers'][contact['name']] = target['contact_id']
        else:
            res = requests.post(f"{BASE_URL}/contacts", json=contact)
            data = handle_response(res)
            if data:
                print(f"Created Contact: {data['name']}")
                if contact.get('is_supplier'):
                    id_map['suppliers'][contact['name']] = data['contact_id']
                if contact.get('is_customer'):
                    id_map['customers'][contact['name']] = data['contact_id']

    # 4. Initial Capital
    print_step("Setting Initial Capital")
    # Check current treasury balance first? Or just inject. 
    # Capital injection is unique usually. I'll just add it.
    initial_capital_payload = {
        "transaction_date": "2024-12-19",
        "type": "CONTRIBUTION",
        "amount": 2000000,
        "description": "Initial Capital / Opening Balance",
        "owner_name": "المالك",
        "season_id": id_map['season']
    }
    # Note: Capital endpoint might not check duplicates. Safe to skip if balance is high? 
    # Let's assume user wants this added.
    try:
        res = requests.post(f"{BASE_URL}/capital/transaction", json=initial_capital_payload)
        if res.status_code == 200:
            print("Initial Capital Injected: 2,000,000 EGP")
        else:
            print("Capital Injection skipped or failed (might already exist?):", res.status_code)
    except Exception as e:
        print(f"Error injecting capital: {e}")

    # 5. Process Purchases
    print_step("Processing Purchases")
    for crop_name, supplier_name, qty_ton, price_per_ton in PURCHASES_SCENARIO:
        crop_id = id_map['crops'].get(crop_name)
        supplier_id = id_map['suppliers'].get(supplier_name)
        
        if not crop_id or not supplier_id:
            print(f"Skipping purchase: Missing ID for {crop_name} or {supplier_name}")
            continue

        payload = {
            "crop_id": crop_id,
            "supplier_id": supplier_id,
            "purchase_date": "2025-05-01", # Arbitrary date within season
            "quantity_kg": qty_ton * 1000,
            "unit_price": price_per_ton,
            "purchasing_pricing_unit": "ton",
            "conversion_factor": 1000,
            "notes": "Automated Seed Transaction",
            "amount_paid": 0 # Credit purchase, payments are separate
        }
        
        res = requests.post(f"{BASE_URL}/purchases", json=payload)
        if res.status_code == 200:
            data = res.json()
            print(f"Purchased {qty_ton} Ton of {crop_name} from {supplier_name} - Total: {data['total_cost']}")
        else:
            print(f"Failed Purchase: {crop_name} - {res.text}")

    # 6. Supplier Payments
    print_step("Processing Supplier Payments")
    payments = [
        ("الحاج أحمد عبد العاطي", 200000),
        ("شركة النيل للتوريدات الزراعية", 300000),
        ("حسن القط", 100000)
    ]
    
    for supplier_name, amount in payments:
        supplier_id = id_map['suppliers'].get(supplier_name)
        if not supplier_id: continue
        
        payload = {
            "payment_date": "2025-05-05",
            "amount": amount,
            "contact_id": supplier_id,
            "description": f"Payment to {supplier_name}"
        }
        res = requests.post(f"{BASE_URL}/treasury/cash-payment", json=payload)
        if res.status_code == 200:
            print(f"Paid {amount} to {supplier_name}")
        else:
            print(f"Failed Payment to {supplier_name}: {res.text}")

    # 7. Process Sales
    print_step("Processing Sales")
    for crop_name, customer_name, qty_ton, price_per_ton in SALES_SCENARIO:
        crop_id = id_map['crops'].get(crop_name)
        customer_id = id_map['customers'].get(customer_name)
        
        if not crop_id or not customer_id:
            print(f"Skipping sale: Missing ID for {crop_name} or {customer_name}")
            continue
            
        payload = {
            "crop_id": crop_id,
            "customer_id": customer_id,
            "sale_date": "2025-06-01",
            "quantity_sold_kg": qty_ton * 1000,
            "selling_unit_price": price_per_ton,
            "selling_pricing_unit": "ton",
            "specific_selling_factor": 1000,
            "amount_received": 0 # Credit sale
        }
        res = requests.post(f"{BASE_URL}/sales", json=payload)
        if res.status_code == 200:
            data = res.json()
            print(f"Sold {qty_ton} Ton of {crop_name} to {customer_name} - Total: {data['total_sale_amount']}")
        else:
            print(f"Failed Sale: {crop_name} - {res.text}")

    # 8. Customer Collections
    print_step("Processing Customer Collections")
    collections = [
        ("شركة شيبسي للصناعات الغذائية", 350000),
        ("وكالة الأمانة", 100000),
        ("شركة الرواد للتصدير", 200000)
    ]
    
    for customer_name, amount in collections:
        customer_id = id_map['customers'].get(customer_name)
        if not customer_id: continue
        
        payload = {
            "receipt_date": "2025-06-05",
            "amount": amount,
            "contact_id": customer_id,
            "description": f"Collection from {customer_name}"
        }
        res = requests.post(f"{BASE_URL}/treasury/cash-receipt", json=payload)
        if res.status_code == 200:
            print(f"Collected {amount} from {customer_name}")
        else:
            print(f"Failed Collection from {customer_name}: {res.text}")

    # 9. Expenses
    print_step("Processing Expenses")
    expenses = [
        (5000, "نولون نقل مشتريات (بطاطس)", "نقل"),
        (2000, "عمالة تعتيق وتحميل", "عمالة"),
        (15000, "إيجار مخزن (مايو)", "إيجار"),
        (500, "إكراميات ومشال", "نثريات"),
        (1200, "كهرباء ومياه", "مرافق")
    ]
    
    for amount, desc, category in expenses:
        payload = {
            "expense_date": "2025-05-15",
            "amount": amount,
            "description": desc,
            "category": category
        }
        res = requests.post(f"{BASE_URL}/treasury/quick-expense", json=payload)
        if res.status_code == 200:
            print(f"Recorded Expense: {desc} ({amount})")
        else:
            print(f"Failed Expense {desc}: {res.text}")

    print("\n[SUCCESS] Seeding Completed!")

if __name__ == "__main__":
    main()
