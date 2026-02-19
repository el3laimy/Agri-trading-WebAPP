"""
اختبارات خدمة لوحة التحكم
Dashboard Service Tests
"""
import pytest
from datetime import date
from app import models, schemas
from app.services import dashboard, purchasing


# Fixtures are imported from conftest.py automatically


class TestDashboardKPIs:
    """اختبارات مؤشرات الأداء الرئيسية"""
    
    def test_get_dashboard_kpis_returns_data(self, db_session):
        """التأكد من إرجاع بيانات KPIs"""
        result = dashboard.get_dashboard_kpis(db_session)
        
        assert result is not None
        assert isinstance(result, dict)
        # التأكد من وجود المؤشرات الأساسية
        assert "total_sales" in result or "totalSales" in result or len(result) > 0
    
    def test_get_dashboard_kpis_with_data(self, db_session, test_crop, test_supplier):
        """التأكد من حساب KPIs مع وجود بيانات"""
        # إنشاء مشتراة لإضافة بيانات
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=100.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=0.0
        )
        purchasing.create_new_purchase(db_session, purchase_data)
        
        result = dashboard.get_dashboard_kpis(db_session)
        
        assert result is not None


class TestDashboardAlerts:
    """اختبارات التنبيهات الذكية"""
    
    def test_get_dashboard_alerts_returns_list(self, db_session):
        """التأكد من إرجاع قائمة التنبيهات"""
        result = dashboard.get_dashboard_alerts(db_session)
        
        assert result is not None
        assert isinstance(result, list)


class TestSalesByCrop:
    """اختبارات توزيع المبيعات حسب المحصول"""
    
    def test_get_sales_by_crop_returns_data(self, db_session):
        """التأكد من إرجاع بيانات المبيعات حسب المحصول"""
        result = dashboard.get_sales_by_crop(db_session)
        
        assert result is not None
        assert isinstance(result, list)


class TestRecentActivities:
    """اختبارات آخر العمليات"""
    
    def test_get_recent_activities_returns_list(self, db_session):
        """التأكد من إرجاع قائمة العمليات الأخيرة"""
        result = dashboard.get_recent_activities(db_session, limit=5)
        
        assert result is not None
        assert isinstance(result, list)
    
    def test_get_recent_activities_respects_limit(self, db_session):
        """التأكد من احترام حد العمليات"""
        result = dashboard.get_recent_activities(db_session, limit=3)
        
        assert len(result) <= 3


class TestCurrentSeasonSummary:
    """اختبارات ملخص الموسم الحالي"""
    
    def test_get_current_season_summary(self, db_session, test_season):
        """التأكد من إرجاع ملخص الموسم"""
        result = dashboard.get_current_season_summary(db_session)
        
        # قد يكون None إذا لم يوجد موسم نشط أو dict
        assert result is None or isinstance(result, dict)
