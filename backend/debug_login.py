
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import Base, SessionLocal
from app.models import User
from app.auth.jwt import verify_password
from app.core.config import settings

print(f"Database URL: {settings.DATABASE_URL}")

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == "admin").first()
    if not user:
        print("User 'admin' NOT FOUND in database!")
    else:
        print(f"User 'admin' found. ID: {user.user_id}")
        print(f"Stored Hash: {user.password_hash}")
        
        is_valid = verify_password("admin123", user.password_hash)
        print(f"Password 'admin123' valid? {is_valid}")
        
        if not is_valid:
            print("Trying to reset password...")
            from app.auth.jwt import get_password_hash
            new_hash = get_password_hash("admin123")
            user.password_hash = new_hash
            db.commit()
            print("Password reset. New Hash:", new_hash)
            
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
