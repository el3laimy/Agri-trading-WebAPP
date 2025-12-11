from app.database import SessionLocal
from app import crud
import json

def debug_inventory_json():
    db = SessionLocal()
    try:
        print("Fetching inventory levels...")
        levels = crud.get_inventory_levels(db)
        print(f"Components found: {len(levels)}")
        for inv in levels:
            print(f"- {inv.crop.crop_name}: {inv.current_stock_kg} kg")
            print(f"  Raw Units: {inv.crop.allowed_pricing_units}")
            print(f"  Raw Factors: {inv.crop.conversion_factors}")
            
            try:
                units = json.loads(inv.crop.allowed_pricing_units)
                factors = json.loads(inv.crop.conversion_factors)
                print("  JSON Parse OK")
            except Exception as e:
                print(f"  JSON Parse Failed: {e}")

    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_inventory_json()
