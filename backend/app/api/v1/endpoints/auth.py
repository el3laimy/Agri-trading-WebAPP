"""
Authentication API Endpoints
نقاط نهاية API للمصادقة
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import json

from app.database import SessionLocal
from app.auth.jwt import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    Token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.auth.dependencies import get_db, get_current_user, require_admin
from app import models


router = APIRouter()


# ============================================
# Schemas
# ============================================

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role_id: int


class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    role_id: int
    role_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login: Optional[datetime]
    dashboard_config: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    dashboard_config: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class RoleCreate(BaseModel):
    name: str
    name_ar: str
    description: Optional[str] = None
    permissions: List[str]


class RoleResponse(BaseModel):
    role_id: int
    name: str
    name_ar: str
    description: Optional[str]
    permissions: List[str]
    is_active: bool

    class Config:
        from_attributes = True


# ============================================
# Authentication Endpoints
# ============================================

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """تسجيل الدخول"""
    # البحث عن المستخدم
    user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # التحقق من كلمة المرور
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # التحقق من أن الحساب نشط
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="الحساب معطل"
        )
    
    # الحصول على صلاحيات الدور
    role = db.query(models.Role).filter(
        models.Role.role_id == user.role_id
    ).first()
    
    permissions = []
    role_name = ""
    if role:
        try:
            permissions = json.loads(role.permissions)
        except (json.JSONDecodeError, TypeError):
            permissions = []
        role_name = role.name
    
    # تحديث وقت آخر تسجيل دخول
    user.last_login = datetime.utcnow()
    db.commit()
    
    # إنشاء الـ token
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.user_id,
            "role": role_name,
            "permissions": permissions,
            "is_superuser": user.is_superuser
        }
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """الحصول على بيانات المستخدم الحالي"""
    role = db.query(models.Role).filter(
        models.Role.role_id == current_user.role_id
    ).first()
    
    return UserResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role_id=current_user.role_id,
        role_name=role.name_ar if role else None,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        dashboard_config=current_user.dashboard_config
    )

class DashboardConfigUpdate(BaseModel):
    dashboard_config: str

@router.put("/me/config")
async def update_my_dashboard_config(
    config_data: DashboardConfigUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """تحديث إعدادات لوحة التحكم للمستخدم الحالي"""
    current_user.dashboard_config = config_data.dashboard_config
    db.commit()
    return {"message": "تم تحديث الإعدادات بنجاح"}

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """تغيير كلمة المرور"""
    # التحقق من كلمة المرور الحالية
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمة المرور الحالية غير صحيحة"
        )
    
    # تحديث كلمة المرور
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "تم تغيير كلمة المرور بنجاح"}


# ============================================
# User Management Endpoints (Admin Only)
# ============================================

@router.get("/users", response_model=List[UserResponse])
async def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """الحصول على قائمة المستخدمين"""
    users = db.query(models.User).all()
    
    result = []
    for user in users:
        role = db.query(models.Role).filter(
            models.Role.role_id == user.role_id
        ).first()
        
        result.append(UserResponse(
            user_id=user.user_id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            role_id=user.role_id,
            role_name=role.name_ar if role else None,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            last_login=user.last_login
        ))
    
    return result


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """إنشاء مستخدم جديد"""
    # التحقق من عدم وجود المستخدم
    existing = db.query(models.User).filter(
        models.User.username == user_data.username
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="اسم المستخدم موجود بالفعل"
        )
    
    # التحقق من وجود الدور
    role = db.query(models.Role).filter(
        models.Role.role_id == user_data.role_id
    ).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الدور المحدد غير موجود"
        )
    
    # إنشاء المستخدم
    new_user = models.User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        email=user_data.email,
        phone=user_data.phone,
        role_id=user_data.role_id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        user_id=new_user.user_id,
        username=new_user.username,
        full_name=new_user.full_name,
        email=new_user.email,
        phone=new_user.phone,
        role_id=new_user.role_id,
        role_name=role.name_ar,
        is_active=new_user.is_active,
        is_superuser=new_user.is_superuser,
        created_at=new_user.created_at,
        last_login=new_user.last_login
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """تحديث بيانات مستخدم"""
    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود"
        )
    
    # تحديث الحقول
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.phone is not None:
        user.phone = user_data.phone
    if user_data.role_id is not None:
        user.role_id = user_data.role_id
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.dashboard_config is not None:
        user.dashboard_config = user_data.dashboard_config
    
    db.commit()
    db.refresh(user)
    
    role = db.query(models.Role).filter(
        models.Role.role_id == user.role_id
    ).first()
    
    return UserResponse(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role_id=user.role_id,
        role_name=role.name_ar if role else None,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        last_login=user.last_login,
        dashboard_config=user.dashboard_config
    )



@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """حذف مستخدم"""
    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود"
        )
    
    # منع حذف المستخدم المسؤول الرئيسي أو النفس
    if user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="لا يمكن حذف المستخدم المسؤول الرئيسي"
        )
    
    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="لا يمكنك حذف حسابك الخاص"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "تم حذف المستخدم بنجاح"}


# ============================================
# Role Management Endpoints
# ============================================

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """الحصول على قائمة الأدوار"""
    roles = db.query(models.Role).all()
    
    result = []
    for role in roles:
        try:
            permissions = json.loads(role.permissions)
        except (json.JSONDecodeError, TypeError):
            permissions = []
        
        result.append(RoleResponse(
            role_id=role.role_id,
            name=role.name,
            name_ar=role.name_ar,
            description=role.description,
            permissions=permissions,
            is_active=role.is_active
        ))
    
    return result


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """إنشاء دور جديد"""
    # التحقق من عدم وجود الدور
    existing = db.query(models.Role).filter(
        models.Role.name == role_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الدور موجود بالفعل"
        )
    
    new_role = models.Role(
        name=role_data.name,
        name_ar=role_data.name_ar,
        description=role_data.description,
        permissions=json.dumps(role_data.permissions)
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    return RoleResponse(
        role_id=new_role.role_id,
        name=new_role.name,
        name_ar=new_role.name_ar,
        description=new_role.description,
        permissions=role_data.permissions,
        is_active=new_role.is_active
    )
