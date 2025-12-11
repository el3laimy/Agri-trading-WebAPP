from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.alerts import check_low_stock, check_overdue_debts
from app.models import Notification

def debug_trigger():
    db = SessionLocal()
    try:
        print("Running check_low_stock...")
        alerts = check_low_stock(db)
        print(f"Generated {len(alerts)} stock alerts.")
        for a in alerts:
            print(f"- {a.title}: {a.message}")
            
        print("\nChecking existing notifications in DB:")
        notifs = db.query(Notification).all()
        for n in notifs:
            print(f"[ID: {n.notification_id}] {n.title} (Read: {n.is_read})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_trigger()
