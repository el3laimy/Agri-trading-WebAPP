import sys
import os
from decimal import Decimal
from datetime import date
import json

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models, schemas, crud
from app.auth.sessions import get_password_hash
from app.auth import sessions as session_service

client = TestClient(app)

def setup_test_data(db: Session):
    # 1. Ensure Roles exist
    from init_users import init_roles_and_admin
    init_roles_and_admin()
    
    # 2. Create a Viewer user
    viewer_role = db.query(models.Role).filter(models.Role.name == "viewer").first()
    viewer_user = db.query(models.User).filter(models.User.username == "test_viewer").first()
    if not viewer_user:
        viewer_user = models.User(
            username="test_viewer",
            password_hash=get_password_hash("viewer123"),
            full_name="Test Viewer",
            role_id=viewer_role.role_id,
            is_active=True
        )
        db.add(viewer_user)
        db.commit()
        db.refresh(viewer_user)
    
    # 3. Create a Supplier
    supplier = db.query(models.Contact).filter(models.Contact.name == "Test Supplier").first()
    if not supplier:
        supplier = models.Contact(name="Test Supplier", is_supplier=True)
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        
    # 4. Create a Cotton Crop (Complex)
    cotton = db.query(models.Crop).filter(models.Crop.crop_name == "القطن").first()
    if not cotton:
        cotton = models.Crop(
            crop_name="القطن",
            is_complex_unit=True,
            allowed_pricing_units=json.dumps(["kg", "qantar_government", "qantar_baladi"]),
            conversion_factors=json.dumps({"qantar_government": 157.5, "qantar_baladi": 160.0})
        )
        db.add(cotton)
        db.commit()
        db.refresh(cotton)
    
    # 5. Ensure System Settings for accounts
    from app.core.bootstrap import bootstrap_system
    bootstrap_system(db)
    
    return viewer_user, supplier, cotton

def run_test():
    db = SessionLocal()
    try:
        viewer_user, supplier, cotton = setup_test_data(db)
        
        # --- Scenario 1: Viewer trying to POST purchase (Should FAIL) ---
        print("\n[Scenario 1] Testing Viewer Authorization...")
        # Create a session for viewer
        viewer_token = session_service.create_session(db, viewer_user.user_id, "127.0.0.1", "TestAgent")
        
        purchase_data = {
            "crop_id": cotton.crop_id,
            "supplier_id": supplier.contact_id,
            "purchase_date": str(date.today()),
            "quantity_kg": 2400,
            "unit_price": 8000,
            "calculation_formula": "qantar_government",
            "bag_count": 10,
            "tare_weight": 25 # 2.5 * 10
        }
        
        response = client.post(
            "/api/v1/purchases/",
            json=purchase_data,
            headers={"X-Session-Token": viewer_token}
        )
        
        if response.status_code == 403:
            print("✅ Success: Viewer blocked from creating purchase.")
        else:
            print(f"❌ Failure: Unexpected status code {response.status_code}")
            print(response.json())

        # --- Scenario 2: Admin performing Cotton Purchase Calculation ---
        print("\n[Scenario 2] Testing Cotton Purchase Calculation...")
        # Get admin user and token
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        admin_token = session_service.create_session(db, admin_user.user_id, "127.0.0.1", "TestAgent")
        
        # Expected calculation:
        # Gross = 2400, Tare = 25
        # Net Invoice (Gov) = Gross - Tare = 2375
        # Qty in unit = 2375 / 157.5 = 15.079365...
        # Total Cost = 15.079365... * 8000 = 120634.920634...
        
        response = client.post(
            "/api/v1/purchases/",
            json=purchase_data,
            headers={"X-Session-Token": admin_token}
        )
        
        if response.status_code == 200:
            result = response.json()
            total_cost = Decimal(str(result['total_cost']))
            expected_cost = Decimal("120634.9206")
            
            # Use quantize for precision comparison if needed, or check if it matches exactly as returned
            if total_cost == expected_cost:
                print(f"✅ Success: Total cost {total_cost} matches expected {expected_cost} exactly.")
            else:
                print(f"❌ Failure: Total cost {total_cost} does not match expected {expected_cost}")
        else:
            print(f"❌ Failure: Could not create purchase (Status {response.status_code})")
            print(response.json())

        # --- Scenario 3: Inventory Balances Check ---
        print("\n[Scenario 3] Checking Inventory Balances...")
        inventory = db.query(models.Inventory).filter(models.Inventory.crop_id == cotton.crop_id).first()
        
        if inventory:
            print(f"Physical Stock (Gross): {inventory.gross_stock_kg}")
            print(f"Logical Stock (Net): {inventory.net_stock_kg}")
            
            # Expectations:
            # gross_stock_kg should increase by 2400
            # net_stock_kg should increase by 2375
            if inventory.gross_stock_kg >= 2400 and inventory.net_stock_kg >= 2375:
                print("✅ Success: Inventory balances updated correctly.")
            else:
                print("❌ Failure: Inventory balances incorrect.")
        else:
            print("❌ Failure: Inventory record not found.")

        # --- Scenario 4: Audit Log Check ---
        print("\n[Scenario 4] Checking Audit Logs...")
        audit_log = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).first()
        
        if audit_log:
            print(f"Log ID: {audit_log.log_id}, Action: {audit_log.action_type}, Table: {audit_log.table_name}")
            print(f"User ID from Log: {audit_log.user_id}")
            if audit_log.user_id == admin_user.user_id:
                print(f"✅ Success: Audit log contains correct User ID ({admin_user.user_id}).")
            else:
                print(f"❌ Failure: Audit log has wrong User ID. Expected {admin_user.user_id}, got {audit_log.user_id}")
        else:
            print("❌ Failure: Audit log entry not found.")

    finally:
        db.close()

if __name__ == "__main__":
    run_test()
