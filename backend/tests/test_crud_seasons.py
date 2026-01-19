"""
اختبارات عمليات CRUD للمواسم
Season CRUD Operations Tests
"""
import pytest
from datetime import date, timedelta
from app import models, schemas
from app.crud import seasons


# Fixtures are imported from conftest.py automatically


class TestSeasonCRUD:
    """اختبارات CRUD للمواسم"""
    
    def test_create_season(self, db_session):
        """التأكد من إنشاء موسم جديد"""
        season_data = schemas.SeasonCreate(
            name="موسم صيف 2024 اختبار",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=90),
            status="ACTIVE",
            description="موسم اختباري"
        )
        
        result = seasons.create_season(db_session, season_data)
        
        assert result is not None
        assert result.name == "موسم صيف 2024 اختبار"
        assert result.status == "ACTIVE"
        
        # Cleanup
        db_session.delete(result)
        db_session.commit()
    
    def test_get_seasons(self, db_session, test_season):
        """التأكد من جلب قائمة المواسم"""
        result = seasons.get_seasons(db_session)
        
        assert result is not None
        assert len(result) >= 1
    
    def test_get_season_by_id(self, db_session, test_season):
        """التأكد من جلب موسم بالـ ID"""
        result = seasons.get_season(db_session, test_season.season_id)
        
        assert result is not None
        assert result.season_id == test_season.season_id
    
    def test_update_season(self, db_session, test_season):
        """التأكد من تحديث بيانات الموسم"""
        update_data = schemas.SeasonUpdate(status="COMPLETED")
        result = seasons.update_season(db_session, test_season.season_id, update_data)
        
        assert result.status == "COMPLETED"
    
    def test_delete_season(self, db_session):
        """التأكد من حذف موسم"""
        # إنشاء موسم للحذف
        season = models.Season(
            name="موسم للحذف",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status="DRAFT"
        )
        db_session.add(season)
        db_session.commit()
        db_session.refresh(season)
        
        season_id = season.season_id
        
        seasons.delete_season(db_session, season_id)
        
        assert seasons.get_season(db_session, season_id) is None


class TestDailyPrice:
    """اختبارات الأسعار اليومية"""
    
    def test_create_daily_price(self, db_session, test_crop):
        """التأكد من إنشاء سعر يومي"""
        price_data = schemas.DailyPriceCreate(
            crop_id=test_crop.crop_id,
            price_date=date.today(),
            price_per_kg=15.50,
            notes="سعر اختباري"
        )
        
        result = seasons.create_daily_price(db_session, price_data)
        
        assert result is not None
        assert float(result.price_per_kg) == 15.50
        
        # Cleanup
        db_session.delete(result)
        db_session.commit()
    
    def test_get_daily_prices(self, db_session, test_crop):
        """التأكد من جلب الأسعار اليومية"""
        result = seasons.get_daily_prices(db_session, crop_id=test_crop.crop_id)
        
        assert result is not None
        assert isinstance(result, list)
