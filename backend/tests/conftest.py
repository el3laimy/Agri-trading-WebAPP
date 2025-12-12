"""
Shared Test Fixtures - conftest.py
يحتوي على الـ fixtures المشتركة لجميع الاختبارات
"""
import pytest
import uuid
from datetime import date
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models


def get_unique_name(prefix: str) -> str:
    """إنشاء اسم فريد باستخدام UUID"""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="function")
def db_session():
    """إنشاء جلسة قاعدة بيانات للاختبار"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Import inside to avoid circular import issues
    from app.core.bootstrap import bootstrap_financial_accounts
    bootstrap_financial_accounts(db)
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture
def test_crop(db_session):
    """إنشاء محصول اختباري بأسم فريد"""
    crop = models.Crop(
        crop_name=get_unique_name("محصول"),
        allowed_pricing_units='["kg", "ton"]',
        conversion_factors='{"kg": 1, "ton": 1000}',
        is_active=True
    )
    db_session.add(crop)
    db_session.commit()
    db_session.refresh(crop)
    return crop


@pytest.fixture
def test_customer(db_session):
    """إنشاء عميل اختباري بأسم فريد"""
    customer = models.Contact(
        name=get_unique_name("عميل"),
        is_customer=True,
        phone=f"010{uuid.uuid4().hex[:8]}"
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer


@pytest.fixture
def test_supplier(db_session):
    """إنشاء مورد اختباري بأسم فريد"""
    supplier = models.Contact(
        name=get_unique_name("مورد"),
        is_supplier=True,
        phone=f"011{uuid.uuid4().hex[:8]}"
    )
    db_session.add(supplier)
    db_session.commit()
    db_session.refresh(supplier)
    return supplier
