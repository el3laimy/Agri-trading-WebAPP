"""
Authentication Dependencies
اعتماديات المصادقة للـ endpoints
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, List
import json

from app.database import SessionLocal
from app.auth.jwt import decode_token, TokenData
from app import models


# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_db():
    """الحصول على جلسة قاعدة البيانات"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """الحصول على المستخدم الحالي (اختياري)"""
    if token is None:
        return None
    
    token_data = decode_token(token)
    if token_data is None:
        return None
    
    user = db.query(models.User).filter(
        models.User.username == token_data.username
    ).first()
    
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """الحصول على المستخدم الحالي (مطلوب)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="غير مصرح - يرجى تسجيل الدخول",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if token is None:
        raise credentials_exception
    
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception
    
    user = db.query(models.User).filter(
        models.User.username == token_data.username
    ).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="الحساب معطل"
        )
    
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """التأكد من أن المستخدم نشط"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="الحساب معطل"
        )
    return current_user


def require_permissions(required_permissions: List[str]):
    """التحقق من صلاحيات المستخدم"""
    async def permission_checker(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> models.User:
        # المدير لديه كل الصلاحيات
        if current_user.is_superuser:
            return current_user
        
        # الحصول على صلاحيات الدور
        role = db.query(models.Role).filter(
            models.Role.role_id == current_user.role_id
        ).first()
        
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="لا يوجد دور معين للمستخدم"
            )
        
        try:
            user_permissions = json.loads(role.permissions)
        except:
            user_permissions = []
        
        # التحقق من الصلاحيات المطلوبة
        for perm in required_permissions:
            if perm not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"ليس لديك صلاحية: {perm}"
                )
        
        return current_user
    
    return permission_checker


def require_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """التحقق من أن المستخدم مدير"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="هذا الإجراء يتطلب صلاحيات المدير"
        )
    return current_user
