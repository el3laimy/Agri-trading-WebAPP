from app.database import SessionLocal
from app.models import Crop
import json

def fix_crop_json():
    db = SessionLocal()
    try:
        crops = db.query(Crop).all()
        for crop in crops:
            print(f"Checking crop: {crop.crop_name}")
            
            # Fix allowed_pricing_units
            try:
                json.loads(crop.allowed_pricing_units)
            except:
                print(f"  Fixing units: {crop.allowed_pricing_units} -> JSON")
                # Assume it's a single unit string if not JSON
                crop.allowed_pricing_units = json.dumps([crop.allowed_pricing_units])
                
            # Fix conversion_factors
            try:
                json.loads(crop.conversion_factors)
            except:
                print(f"  Fixing factors: {crop.conversion_factors} -> JSON")
                crop.conversion_factors = json.dumps({})
                
        db.commit()
        print("Fix complete.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_crop_json()
