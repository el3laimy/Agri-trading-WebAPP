import sys
import os

# Ensure backend directory is in python path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app import models
from app.auth.jwt import get_password_hash

def reset_password():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if user:
            print(f"Found user: {user.username}")
            user.password_hash = get_password_hash("admin123")
            db.commit()
            print("Password successfully reset to: admin123")
        else:
            print("User 'admin' not found!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
