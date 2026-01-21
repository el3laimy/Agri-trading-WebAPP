"""
API Endpoints for Transformations
تحويل المحاصيل الخام إلى منتجات نهائية
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import schemas, models
from app.services import transformation as transformation_service

router = APIRouter()


@router.post("/", response_model=schemas.TransformationRead, status_code=201)
def create_transformation(
    transformation: schemas.TransformationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    إنشاء عملية تحويل جديدة
    
    - سحب الخام من المخزون
    - توزيع التكلفة على المخرجات
    - إضافة المخرجات للمخزون
    """
    return transformation_service.create_transformation(db, transformation, current_user.user_id)


@router.get("/", response_model=List[schemas.TransformationRead])
def list_transformations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """قائمة عمليات التحويل"""
    return transformation_service.get_transformations(db, skip, limit)


@router.get("/{transformation_id}", response_model=schemas.TransformationRead)
def get_transformation(
    transformation_id: int,
    db: Session = Depends(get_db)
):
    """الحصول على عملية تحويل واحدة"""
    return transformation_service.get_transformation(db, transformation_id)


@router.delete("/{transformation_id}")
def delete_transformation(
    transformation_id: int,
    db: Session = Depends(get_db)
):
    """حذف عملية تحويل"""
    transformation_service.delete_transformation(db, transformation_id)
    return {"message": "تم حذف عملية التحويل بنجاح"}
