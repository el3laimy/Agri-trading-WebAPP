from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Inventory, Crop

def trigger_low_stock():
    db = SessionLocal()
    try:
        # Get first crop
        crop = db.query(Crop).first()
        if not crop:
            print("No crops found! Creating 'Potato'...")
            crop = Crop(
                crop_name="بطاطس",
                allowed_pricing_units="kg",
                conversion_factors="{}"
            )
            db.add(crop)
            db.commit()
            db.refresh(crop)

        print(f"Updating inventory for crop: {crop.crop_name}")
        
        # Get or create inventory
        inventory = db.query(Inventory).filter(Inventory.crop_id == crop.crop_id).first()
        if not inventory:
            inventory = Inventory(crop_id=crop.crop_id, current_stock_kg=500, low_stock_threshold=100)
            db.add(inventory)
        
        # Set to low stock
        inventory.current_stock_kg = 50.0
        inventory.low_stock_threshold = 100.0
        db.commit()
        
        print(f"Inventory updated: Stock={inventory.current_stock_kg}, "
              f"Threshold={inventory.low_stock_threshold}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    trigger_low_stock()
