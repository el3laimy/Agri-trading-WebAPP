from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import InventoryBatch, Crop, Inventory
from datetime import date

def seed_batches():
    db = SessionLocal()
    try:
        crop = db.query(Crop).filter(Crop.crop_name == "بطاطس").first()
        if not crop:
            print("Potaoto crop not found")
            return

        print(f"Seeding batches for {crop.crop_name}...")
        
        # Check if batches exist
        existing = db.query(InventoryBatch).filter(InventoryBatch.crop_id == crop.crop_id).count()
        if existing > 0:
            print("Batches already exist.")
        else:
            # Create a couple of batches
            batch1 = InventoryBatch(
                crop_id=crop.crop_id,
                quantity_kg=30.0,
                original_quantity_kg=100.0,
                cost_per_kg=5.0,
                purchase_date=date(2023, 10, 1),
                is_active=True,
                notes="دفعة قديمة"
            )
            batch2 = InventoryBatch(
                crop_id=crop.crop_id,
                quantity_kg=20.0,
                original_quantity_kg=20.0,
                cost_per_kg=6.0,
                purchase_date=date(2023, 10, 15),
                is_active=True,
                notes="دفعة جديدة"
            )
            db.add(batch1)
            db.add(batch2)
            
            # Sync Inventory Aggregate
            inv = db.query(Inventory).filter(Inventory.crop_id == crop.crop_id).first()
            inv.current_stock_kg = 50.0 # 30 + 20
            # Weighted avg: ((30*5) + (20*6)) / 50 = (150 + 120) / 50 = 270 / 50 = 5.4
            inv.average_cost_per_kg = 5.4
            
            db.commit()
            print("Batches created and inventory synced.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_batches()
