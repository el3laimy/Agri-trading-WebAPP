from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Inventory, Notification, Crop

def debug_notifications():
    db = SessionLocal()
    try:
        # Check Inventory
        print("=== INVENTORY ===")
        items = db.query(Inventory).all()
        for item in items:
            crop_name = item.crop.crop_name if item.crop else "Unknown"
            print(f"Crop: {crop_name}, Stock: {item.current_stock_kg}, Threshold: {item.low_stock_threshold}")

        # Check Notifications
        print("\n=== NOTIFICATIONS ===")
        notifs = db.query(Notification).all()
        if not notifs:
            print("No notifications found.")
        for n in notifs:
            print(f"ID: {n.notification_id}, Type: {n.type}, Msg: {n.message}, Read: {n.is_read}, UserID: {n.user_id}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_notifications()
