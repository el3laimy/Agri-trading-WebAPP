import sys
import os

# نحن الآن داخل backend/
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.api.v1.endpoints.crops import get_db
from app.services import account_statement
from app import models
from datetime import date
from decimal import Decimal
import traceback

def debug_contact_statement():
    print(f"CWD: {os.getcwd()}")
    try:
        db_gen = get_db()
        db = next(db_gen)
    except Exception as e:
        print(f"Error getting DB session: {e}")
        return

    print("\n--- Checking Contact Statement ---")
    try:
        # Get first customer
        customer = db.query(models.Contact).filter(models.Contact.is_customer == True).first()
        if not customer:
            print("No customers found to test.")
            return
            
        print(f"Testing customer: {customer.name} (ID: {customer.contact_id})")
        
        statement = account_statement.get_account_statement(
            db, 
            customer.contact_id, 
            date(2025, 1, 1), 
            date(2026, 12, 31)
        )
        print("Success! Statement generated.")
        print(f"Closing Balance: {statement.closing_balance} (Type: {type(statement.closing_balance)})")
        print(f"Entries count: {len(statement.entries)}")
        
    except Exception as e:
        print(f"FAILED get_account_statement: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    debug_contact_statement()
