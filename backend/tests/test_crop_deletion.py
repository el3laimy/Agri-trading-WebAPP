
import pytest
from app import crud, schemas, models
from app.database import SessionLocal

@pytest.fixture(scope="module")
def db():
    db = SessionLocal()
    yield db
    db.close()

def test_crop_deletion_logic(db):
    # 1. Setup Data
    # Create Crop A and Crop B
    crop_a = crud.create_crop(db, schemas.CropCreate(
        crop_name="Crop A Deletion Test",
        allowed_pricing_units=["kg"],
        conversion_factors={"kg": 1}
    ))
    crop_b = crud.create_crop(db, schemas.CropCreate(
        crop_name="Crop B Deletion Test",
        allowed_pricing_units=["kg"],
        conversion_factors={"kg": 1}
    ))
    
    # Create a dummy supplier
    supplier = crud.create_contact(db, schemas.ContactCreate(name="Supplier Deletion Test", is_supplier=True))

    # Create a purchase for Crop A
    purchase_data = {
        "crop_id": crop_a.crop_id,
        "supplier_id": supplier.contact_id,
        "purchase_date": "2024-01-01",
        "quantity_kg": 100,
        "unit_price": 10,
        "total_cost": 1000,
        "created_by": 1 # Assume admin exists
    }
    crud.create_purchase_record(db, purchase_data)
    
    # 2. Test Conflict Detection
    dependencies = crud.get_crop_dependencies(db, crop_a.crop_id)
    assert dependencies["purchases"] > 0
    assert sum(dependencies.values()) > 0
    
    # 3. Test Migration (Crop A -> Crop B)
    crud.migrate_crop_data(db, old_crop_id=crop_a.crop_id, new_crop_id=crop_b.crop_id)
    
    # Verify Crop A is deleted
    assert crud.get_crop(db, crop_a.crop_id) is None
    
    # Verify Purchase is now linked to Crop B
    # Get the purchase (we need to find it, but we didn't save the ID. Let's query by logic)
    # Actually we can check dependencies of Crop B
    deps_b = crud.get_crop_dependencies(db, crop_b.crop_id)
    assert deps_b["purchases"] > 0
    
    # 4. Test Force Delete (Crop B)
    # Create another purchase for Crop B just to be sure
    crud.create_purchase_record(db, {
        "crop_id": crop_b.crop_id,
        "supplier_id": supplier.contact_id,
        "purchase_date": "2024-01-02",
        "quantity_kg": 50,
        "unit_price": 10,
        "total_cost": 500
    })
    
    crud.delete_crop_with_dependencies(db, crop_b.crop_id)
    
    assert crud.get_crop(db, crop_b.crop_id) is None
    # Verify related records are gone
    purchases = db.query(models.Purchase).filter(models.Purchase.crop_id == crop_b.crop_id).all()
    assert len(purchases) == 0
    
    # Cleanup Supplier
    db.delete(supplier)
    db.commit()
