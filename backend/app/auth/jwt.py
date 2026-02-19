"""
JWT Authentication Configuration
إعدادات المصادقة باستخدام JWT
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# إعدادات الأمان
SECRET_KEY = "your-secret-key-change-in-production-مفتاح-سري-للانتاج"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 ساعة


# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class Token(BaseModel):
    """نموذج الـ Token"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """بيانات الـ Token"""
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
    permissions: Optional[list] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """التحقق من كلمة المرور"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """تشفير كلمة المرور"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """إنشاء JWT token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """فك تشفير الـ token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        permissions: list = payload.get("permissions", [])
        
        if username is None:
            return None
            
        return TokenData(
            username=username,
            user_id=user_id,
            role=role,
            permissions=permissions
        )
    except JWTError:
        return None
