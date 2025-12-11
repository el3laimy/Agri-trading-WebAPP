from app.database import SessionLocal
from app.models import User
from app.auth.jwt import verify_password, get_password_hash

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == "admin").first()
    if user:
        print(f"User found: {user.username}")
        print(f"Hash: {user.password_hash}")
        
        # Test verification
        is_valid = verify_password("admin123", user.password_hash)
        print(f"Password 'admin123' valid? {is_valid}")
        
        # Test new hash
        new_hash = get_password_hash("admin123")
        print(f"New hash for 'admin123': {new_hash}")
        print(f"New hash valid? {verify_password('admin123', new_hash)}")
    else:
        print("User 'admin' not found!")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
