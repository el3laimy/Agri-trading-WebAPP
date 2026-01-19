"""
اختبارات عمليات CRUD للمحاصيل
Crop CRUD Operations Tests
"""
import pytest
from decimal import Decimal
from app import models, schemas
from app.crud import crops


# Fixtures are imported from conftest.py automatically


class TestCropCRUD:
    """اختبارات CRUD للمحاصيل"""
    
    def test_create_simple_crop(self, db_session):
        """التأكد من إنشاء محصول بسيط"""
        crop_data = schemas.CropCreate(
            crop_name="بطاطس اختبار",
            allowed_pricing_units=["kg", "ton"],
            conversion_factors={"kg": 1, "ton": 1000},
            is_active=True,
            is_complex_unit=False
        )
        
        result = crops.create_crop(db_session, crop_data)
        
        assert result is not None
        assert result.crop_name == "بطاطس اختبار"
        assert result.is_complex_unit == False
        
        # Cleanup
        db_session.delete(result)
        db_session.commit()
    
    def test_create_complex_crop(self, db_session):
        """التأكد من إنشاء محصول معقد مع وزن الطرحة"""
        crop_data = schemas.CropCreate(
            crop_name="بصل معقد اختبار",
            allowed_pricing_units=["kg", "ton", "bag"],
            conversion_factors={"kg": 1, "ton": 1000, "bag": 50},
            is_active=True,
            is_complex_unit=True,
            default_tare_per_bag=Decimal("2.5"),
            standard_unit_weight=Decimal("50")
        )
        
        result = crops.create_crop(db_session, crop_data)
        
        assert result is not None
        assert result.crop_name == "بصل معقد اختبار"
        assert result.is_complex_unit == True
        assert result.default_tare_per_bag == Decimal("2.5")
        
        # Cleanup
        db_session.delete(result)
        db_session.commit()
    
    def test_get_crops(self, db_session, test_crop):
        """التأكد من جلب قائمة المحاصيل"""
        result = crops.get_crops(db_session)
        
        assert result is not None
        assert len(result) >= 1
    
    def test_get_crop_by_id(self, db_session, test_crop):
        """التأكد من جلب محصول بالـ ID"""
        result = crops.get_crop(db_session, test_crop.crop_id)
        
        assert result is not None
        assert result.crop_id == test_crop.crop_id
    
    def test_delete_crop(self, db_session):
        """التأكد من حذف المحصول"""
        # إنشاء محصول
        crop = models.Crop(
            crop_name="محصول للحذف",
            allowed_pricing_units='["kg"]',
            conversion_factors='{"kg": 1}',
            is_active=True
        )
        db_session.add(crop)
        db_session.commit()
        db_session.refresh(crop)
        
        crop_id = crop.crop_id
        
        # حذف
        crops.delete_crop(db_session, crop_id)
        
        assert crops.get_crop(db_session, crop_id) is None


class TestCropDependencies:
    """اختبارات تبعيات المحاصيل"""
    
    def test_get_crop_dependencies(self, db_session, test_crop):
        """التأكد من فحص تبعيات محصول بدون بيانات"""
        deps = crops.get_crop_dependencies(db_session, test_crop.crop_id)
        
        assert "purchases" in deps
        assert "sales" in deps
        assert "inventory" in deps
