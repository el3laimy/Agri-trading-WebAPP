import sys
import os
from datetime import date
from decimal import Decimal

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal, engine, Base
from app import schemas, crud
from app.services import purchasing
from app.models import Crop, Contact

def verify():
    db = SessionLocal()
    try:
        print("Verifying Complex Purchase Logic...")

        # 1. Create a Complex Crop (Cotton)
        print("Creating Cotton Crop...")
        cotton = db.query(Crop).filter(Crop.crop_name == "Cotton Test").first()
        if not cotton:
            cotton = Crop(
                crop_name="Cotton Test",
                allowed_pricing_units='["Qantar"]',
                conversion_factors='{"Qantar": 157.5}',
                is_complex_unit=True,
                default_tare_per_bag=Decimal("2.0"),
                standard_unit_weight=Decimal("157.5")
            )
            db.add(cotton)
            db.commit()
            db.refresh(cotton)
        
        # 2. Create Supplier
        supplier = db.query(Contact).filter(Contact.name == "Supplier Test").first()
        if not supplier:
            supplier = Contact(name="Supplier Test", is_supplier=True)
            db.add(supplier)
            db.commit()
            db.refresh(supplier)

        # 3. Simulate Purchase (Government Scenario: 2400 Gross, 10 Bags, 2kg Tare/Bag)
        # Net Reference = 2380 kg
        gross_qty = Decimal("2400.0000")
        bag_count = 10
        tare_weight_total = Decimal("20.0000") # 10 * 2
        net_reference = gross_qty - tare_weight_total # 2380
        
        price_per_kg = Decimal("50.0000")
        
        purchase_data = schemas.PurchaseCreate(
            crop_id=cotton.crop_id,
            supplier_id=supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=net_reference, # 2380
            unit_price=price_per_kg,
            gross_quantity=gross_qty, # 2400
            bag_count=bag_count,
            tare_weight=tare_weight_total,
            calculation_formula="government",
            purchasing_pricing_unit="kg",
            conversion_factor=Decimal(1.0),
            notes="Test Complex Purchase"
        )
        
        print(f"Recording Purchase: Gross={gross_qty}, Tare={tare_weight_total}, NetRef={net_reference}...")
        purchase = purchasing.create_new_purchase(db, purchase_data, user_id=1)
        
        print(f"Purchase Created ID: {purchase.purchase_id}")
        
        # 4. Verify Inventory
        from app.models import Inventory
        inv = db.query(Inventory).filter(Inventory.crop_id == cotton.crop_id).first()
        
        print(f"Inventory Status:")
        print(f"  Gross Stock: {inv.gross_stock_kg}")
        print(f"  Net Stock: {inv.net_stock_kg}")
        print(f"  Bag Count: {inv.bag_count}")
        print(f"  Avg Cost: {inv.average_cost_per_kg}")
        
        # Assertions
        assert inv.gross_stock_kg >= gross_qty
        assert inv.net_stock_kg >= net_reference
        assert inv.bag_count >= bag_count
        
        print("✅ Verification Successful!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify()
