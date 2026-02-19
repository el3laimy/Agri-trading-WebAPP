from app.database import SessionLocal
from app import crud, models, schemas
import json

def setup_data():
    db = SessionLocal()
    try:
        # 1. Ensure Potato Crop
        crop = crud.get_crop_by_name(db, "بطاطس")
        if not crop:
            print("Creating Potato...")
            c_data = schemas.CropCreate(
                crop_name="بطاطس",
                allowed_pricing_units=["kg", "ton"],
                conversion_factors={},
                is_active=True
            )
            crud.create_crop(db, c_data)
        else:
            print("Potato exists.")

        # 2. Ensure Supplier
        supplier = db.query(models.Contact).filter(models.Contact.is_supplier == True).first()
        if not supplier:
            print("Creating Supplier...")
            s_data = schemas.ContactCreate(
                name="Test Supplier",
                is_supplier=True,
                is_customer=False
            )
            crud.create_contact(db, s_data)
        else:
            print("Supplier exists.")

        # 3. Ensure Customer
        customer = db.query(models.Contact).filter(models.Contact.is_customer == True).first()
        if not customer:
            print("Creating Customer...")
            cust_data = schemas.ContactCreate(
                name="Test Customer",
                is_supplier=False,
                is_customer=True
            )
            crud.create_contact(db, cust_data)
        else:
            print("Customer exists.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_data()
