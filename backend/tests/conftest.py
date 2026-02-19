"""
Shared Test Fixtures - conftest.py
يحتوي على الـ fixtures المشتركة لجميع الاختبارات
"""
import pytest
import uuid
from datetime import date, timedelta
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


@pytest.fixture
def test_season(db_session):
    """إنشاء موسم اختباري"""
    season = models.Season(
        name=get_unique_name("موسم"),
        start_date=date.today(),
        end_date=date.today() + timedelta(days=90),
        status="ACTIVE",
        description="موسم اختباري"
    )
    db_session.add(season)
    db_session.commit()
    db_session.refresh(season)
    return season


@pytest.fixture
def test_financial_accounts(db_session):
    """التأكد من وجود الحسابات المالية الأساسية"""
    from app.core.bootstrap import bootstrap_financial_accounts
    bootstrap_financial_accounts(db_session)
    print("DEBUG: Fetching Financial Accounts...")
    cash = db_session.query(models.FinancialAccount).filter(models.FinancialAccount.account_name == "الخزنة الرئيسية").first()
    print(f"DEBUG: Cash: {cash}")
    inventory = db_session.query(models.FinancialAccount).filter(models.FinancialAccount.account_name == "المخزون").first()
    print(f"DEBUG: Inventory: {inventory}")
    receivables = db_session.query(models.FinancialAccount).filter(models.FinancialAccount.account_name == "الذمم المدينة (العملاء)").first()
    print(f"DEBUG: Receivables: {receivables}")
    payables = db_session.query(models.FinancialAccount).filter(models.FinancialAccount.account_name == "الذمم الدائنة (الموردين)").first()
    print(f"DEBUG: Payables: {payables}")

    accounts = {
        "cash": cash,
        "inventory": inventory,
        "receivables": receivables,
        "payables": payables,
    }
    return accounts


@pytest.fixture
def test_inventory(db_session, test_crop):
    """إنشاء سجل مخزون اختباري"""
    inventory = db_session.query(models.Inventory).filter(
        models.Inventory.crop_id == test_crop.crop_id
    ).first()
    if not inventory:
        inventory = models.Inventory(
            crop_id=test_crop.crop_id,
            current_stock_kg=0.0,
            low_stock_threshold=100.0
        )
        db_session.add(inventory)
        db_session.commit()
        db_session.refresh(inventory)
    return inventory
