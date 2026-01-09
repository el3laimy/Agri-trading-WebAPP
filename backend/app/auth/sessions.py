"""
Session Management Service
خدمة إدارة الجلسات المحلية - بديل عن JWT للبيئة المحلية
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session as DBSession
from passlib.context import CryptContext

from app import models

# إعدادات الجلسات
SESSION_EXPIRE_HOURS = 24  # مدة صلاحية الجلسة بالساعات

# Password hashing (نفس الإعدادات من jwt.py)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """التحقق من كلمة المرور"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """تشفير كلمة المرور"""
    return pwd_context.hash(password)


def create_session(
    db: DBSession,
    user_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> str:
    """
    إنشاء جلسة جديدة للمستخدم
    
    Args:
        db: جلسة قاعدة البيانات
        user_id: معرف المستخدم
        ip_address: عنوان IP اختياري
        user_agent: معلومات المتصفح اختيارية
    
    Returns:
        session_token: رمز الجلسة الفريد
    """
    # إنشاء token فريد
    session_token = str(uuid.uuid4())
    
    # حساب تاريخ الانتهاء
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
    
    # إنشاء سجل الجلسة
    new_session = models.Session(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
        is_active=True
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # تحديث آخر تسجيل دخول للمستخدم
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if user:
        user.last_login = datetime.utcnow()
        db.commit()
    
    return session_token


def validate_session(db: DBSession, session_token: str) -> Optional[models.User]:
    """
    التحقق من صلاحية الجلسة وإرجاع المستخدم
    
    Args:
        db: جلسة قاعدة البيانات
        session_token: رمز الجلسة
    
    Returns:
        User: كائن المستخدم إذا كانت الجلسة صالحة، None خلاف ذلك
    """
    if not session_token:
        return None
    
    # البحث عن الجلسة
    session = db.query(models.Session).filter(
        models.Session.session_token == session_token,
        models.Session.is_active == True
    ).first()
    
    if not session:
        return None
    
    # التحقق من انتهاء الصلاحية
    if session.expires_at < datetime.utcnow():
        # الجلسة منتهية الصلاحية - إلغاء تفعيلها
        session.is_active = False
        db.commit()
        return None
    
    # تحديث آخر نشاط
    session.last_activity = datetime.utcnow()
    db.commit()
    
    # الحصول على المستخدم
    user = db.query(models.User).filter(
        models.User.user_id == session.user_id,
        models.User.is_active == True
    ).first()
    
    return user


def delete_session(db: DBSession, session_token: str) -> bool:
    """
    حذف/إلغاء جلسة (تسجيل الخروج)
    
    Args:
        db: جلسة قاعدة البيانات
        session_token: رمز الجلسة
    
    Returns:
        bool: True إذا تم الحذف بنجاح
    """
    session = db.query(models.Session).filter(
        models.Session.session_token == session_token
    ).first()
    
    if session:
        session.is_active = False
        db.commit()
        return True
    
    return False


def delete_all_user_sessions(db: DBSession, user_id: int) -> int:
    """
    حذف جميع جلسات المستخدم (تسجيل الخروج من جميع الأجهزة)
    
    Args:
        db: جلسة قاعدة البيانات
        user_id: معرف المستخدم
    
    Returns:
        int: عدد الجلسات المحذوفة
    """
    count = db.query(models.Session).filter(
        models.Session.user_id == user_id,
        models.Session.is_active == True
    ).update({"is_active": False})
    
    db.commit()
    return count


def cleanup_expired_sessions(db: DBSession) -> int:
    """
    تنظيف الجلسات المنتهية الصلاحية
    
    Args:
        db: جلسة قاعدة البيانات
    
    Returns:
        int: عدد الجلسات المحذوفة
    """
    count = db.query(models.Session).filter(
        models.Session.expires_at < datetime.utcnow()
    ).delete()
    
    db.commit()
    return count


def get_active_sessions_count(db: DBSession, user_id: int) -> int:
    """
    الحصول على عدد الجلسات النشطة للمستخدم
    
    Args:
        db: جلسة قاعدة البيانات
        user_id: معرف المستخدم
    
    Returns:
        int: عدد الجلسات النشطة
    """
    return db.query(models.Session).filter(
        models.Session.user_id == user_id,
        models.Session.is_active == True,
        models.Session.expires_at > datetime.utcnow()
    ).count()


def authenticate_user(db: DBSession, username: str, password: str) -> Optional[models.User]:
    """
    التحقق من بيانات المستخدم
    
    Args:
        db: جلسة قاعدة البيانات
        username: اسم المستخدم
        password: كلمة المرور
    
    Returns:
        User: كائن المستخدم إذا كانت البيانات صحيحة، None خلاف ذلك
    """
    user = db.query(models.User).filter(
        models.User.username == username,
        models.User.is_active == True
    ).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user
