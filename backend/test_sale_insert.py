import sys
import os
from datetime import date

# Add backend directory to sys.path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Sale

def test_add_sale():
    db = SessionLocal()
    try:
        # Create a dummy sale
        # Assuming crop_id=1 and customer_id=2 exist (based on previous logs)
        new_sale = Sale(
            crop_id=1,
            customer_id=2,
            sale_date=date(2025, 11, 29),
            quantity_sold_kg=100.0,
            selling_unit_price=50.0,
            selling_pricing_unit='kg',
            specific_selling_factor=1.0,
            total_sale_amount=5000.0,
            amount_received=0.0,
            payment_status='PENDING'
        )
        db.add(new_sale)
        db.commit()
        print("Sale added successfully via SQLAlchemy!")
        print(f"Sale ID: {new_sale.sale_id}")
    except Exception as e:
        print(f"Error adding sale: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_add_sale()
