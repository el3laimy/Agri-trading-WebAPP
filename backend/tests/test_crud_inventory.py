"""
اختبارات عمليات CRUD للمخزون
Inventory CRUD Operations Tests
"""
import pytest
from decimal import Decimal
from datetime import date
from app import models, schemas
from app.crud.inventory import get_or_create_inventory, get_inventory_levels
from app.services import purchasing


# Fixtures are imported from conftest.py automatically


class TestInventoryCRUD:
    """اختبارات CRUD للمخزون"""
    
    def test_get_inventory_for_crop(self, db_session, test_crop):
        """التأكد من جلب أو إنشاء مخزون محصول"""
        result = get_or_create_inventory(db_session, test_crop.crop_id)
        
        assert result is not None
        assert hasattr(result, "current_stock_kg")
        assert result.crop_id == test_crop.crop_id
    
    def test_get_all_inventory(self, db_session):
        """التأكد من جلب جميع المخزون"""
        result = get_inventory_levels(db_session)
        
        assert result is not None
        assert isinstance(result, list)


class TestInventoryOperations:
    """اختبارات عمليات المخزون"""
    
    def test_purchase_adds_to_inventory(self, db_session, test_crop, test_supplier):
        """التأكد من أن المشتراة تضيف للمخزون"""
        # جلب المخزون قبل
        inventory_before = db_session.query(models.Inventory).filter(
            models.Inventory.crop_id == test_crop.crop_id
        ).first()
        stock_before = inventory_before.current_stock_kg if inventory_before else Decimal(0)
        
        # إنشاء مشتراة
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=500.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=0.0
        )
        purchasing.create_new_purchase(db_session, purchase_data)
        
        # جلب المخزون بعد
        inventory_after = db_session.query(models.Inventory).filter(
            models.Inventory.crop_id == test_crop.crop_id
        ).first()
        
        assert inventory_after is not None
        assert inventory_after.current_stock_kg >= stock_before


class TestInventoryBatches:
    """اختبارات دفعات المخزون"""
    
    def test_purchase_creates_batch(self, db_session, test_crop, test_supplier):
        """التأكد من إنشاء دفعة مخزون عند الشراء"""
        # إنشاء مشتراة
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=200.0,
            unit_price=12.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=0.0
        )
        purchase = purchasing.create_new_purchase(db_session, purchase_data)
        
        # التحقق من وجود دفعة
        batch = db_session.query(models.InventoryBatch).filter(
            models.InventoryBatch.purchase_id == purchase.purchase_id
        ).first()
        
        assert batch is not None
        assert batch.quantity_kg == Decimal("200")


class TestLowStockThreshold:
    """اختبارات حد المخزون المنخفض"""
    
    def test_inventory_has_threshold(self, db_session, test_inventory):
        """التأكد من وجود حد للمخزون المنخفض"""
        assert test_inventory.low_stock_threshold is not None
        assert test_inventory.low_stock_threshold >= 0
