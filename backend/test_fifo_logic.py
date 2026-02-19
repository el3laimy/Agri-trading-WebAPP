from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import crud, models, schemas
from app.services import purchasing, sales, inventory
from app.models import Crop, Contact
from datetime import date, timedelta

def test_fifo():
    db = SessionLocal()
    try:
        # 1. Setup Data: Get 'Potato' crop and a Supplier
        crop = db.query(Crop).filter(Crop.crop_name == "بطاطس").first()
        supplier = db.query(Contact).filter(Contact.is_supplier == True).first()
        customer = db.query(Contact).filter(Contact.is_customer == True).first()
        
        if not crop or not supplier or not customer:
            print("Missing master data (Potato, Supplier, or Customer).")
            return

        print(f"Testing FIFO for {crop.crop_name}...")
        
        # Clear existing batches/inventory for clean test (optional, but good for logic check)
        # For safety in this live env, I'll just add new distinct batches.
        
        # 2. Create Two Purchases with different prices
        # Batch A: 10kg @ 10.0 LE (Oldest)
        p1_data = schemas.PurchaseCreate(
            crop_id=crop.crop_id,
            supplier_id=supplier.contact_id,
            purchase_date=date.today() - timedelta(days=5),
            quantity_kg=10.0,
            unit_price=10.0,
            payment_status='PENDING',
            notes="FIFO Test Batch A"
        )
        print("Creating Purchase A (10kg @ 10)...")
        purchasing.create_new_purchase(db, p1_data)
        
        # Batch B: 10kg @ 20.0 LE (Newer)
        p2_data = schemas.PurchaseCreate(
            crop_id=crop.crop_id,
            supplier_id=supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=10.0,
            unit_price=20.0, # Higher price
            payment_status='PENDING',
            notes="FIFO Test Batch B"
        )
        print("Creating Purchase B (10kg @ 20)...")
        purchasing.create_new_purchase(db, p2_data)
        
        # 3. Verify Batches Exist
        batches = inventory.consume_stock(db, crop.crop_id, 0) # Just to check availability logic or use direct query
        # Actually consume_stock(0) is not standard. Let's query.
        inv_batches = db.query(models.InventoryBatch).filter(models.InventoryBatch.crop_id == crop.crop_id, models.InventoryBatch.is_active == True).all()
        print(f"Active Batches: {len(inv_batches)}")
        for b in inv_batches:
            print(f"  - Batch {b.batch_id}: {b.quantity_kg}kg @ {b.cost_per_kg} (Date: {b.purchase_date})")

        # 4. Create a Sale that consumes part of Batch A and part of Batch B
        # Sale: 15kg. Should take 10kg from A (@10) and 5kg from B (@20)
        # Expected COGS = (10 * 10) + (5 * 20) = 100 + 100 = 200.
        
        s_data = schemas.SaleCreate(
            crop_id=crop.crop_id,
            customer_id=customer.contact_id,
            sale_date=date.today(),
            quantity_sold_kg=15.0,
            selling_unit_price=30.0, # Revenue = 450
            selling_pricing_unit='kg',
            specific_selling_factor=1.0,
            payment_status='PENDING'
        )
        
        print("\nCreating Sale (15kg)... Expecting consumption from Oldest first.")
        db_sale = sales.create_new_sale(db, s_data)
        
        print(f"Sale Created ID: {db_sale.sale_id}")
        
        # Verify COGS in General Ledger
        # Find COGS entry for this sale
        from app.core.bootstrap import COGS_ACCOUNT_ID
        cogs_entry = db.query(models.GeneralLedger).filter(
            models.GeneralLedger.source_id == db_sale.sale_id,
            models.GeneralLedger.source_type == 'SALE',
            models.GeneralLedger.account_id == COGS_ACCOUNT_ID
        ).first()
        
        if cogs_entry:
            print(f"COGS Ledger Entry: {cogs_entry.debit}")
            if abs(cogs_entry.debit - 200.0) < 0.1:
                print("SUCCESS: COGS calculated correctly using FIFO (10@10 + 5@20 = 200).")
            else:
                print(f"FAILURE: COGS mismatch. Expected 200, got {cogs_entry.debit}")
        else:
            print("FAILURE: COGS entry not found.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_fifo()
