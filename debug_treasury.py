import sys
import os

# إضافة المسار الحالي للمسارات لكي نتمكن من استيراد الموديولات
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.api.v1.endpoints.crops import get_db
from app.services import treasury
from app.core.settings import get_setting
from app import models
from datetime import date
import traceback

def debug_treasury():
    db = next(get_db())
    print("--- Checking Database Connection ---")
    try:
        # فحص بسيط
        count = db.query(models.User).count()
        print(f"Users in DB: {count}")
    except Exception as e:
        print(f"DB Connection failed: {e}")
        return

    print("\n--- Checking Settings ---")
    try:
        cash_id = get_setting(db, "CASH_ACCOUNT_ID")
        print(f"CASH_ACCOUNT_ID setting value: {cash_id}")
        if cash_id:
             print(f"CASH_ACCOUNT_ID as int: {int(cash_id)}")
        else:
            print("WARNING: CASH_ACCOUNT_ID is None or Empty!")
    except Exception as e:
        print(f"Error getting setting: {e}")
        traceback.print_exc()

    print("\n--- Running get_treasury_summary ---")
    try:
        summary = treasury.get_treasury_summary(db, date.today())
        print("Summary Result:")
        print(summary)
    except Exception as e:
        print(f"FAILED get_treasury_summary: {e}")
        traceback.print_exc()
        
    print("\n--- Running get_treasury_transactions ---")
    try:
        txs = treasury.get_treasury_transactions(db, date.today(), 10)
        print(f"Transactions found: {len(txs)}")
    except Exception as e:
        print(f"FAILED get_treasury_transactions: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    debug_treasury()
