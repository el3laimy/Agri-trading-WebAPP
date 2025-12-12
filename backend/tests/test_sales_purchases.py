"""
اختبارات شاملة لعمليات المبيعات والمشتريات
Sales and Purchases Tests
"""
import pytest
from datetime import date
from app import models, schemas
from app.services import sales, purchasing


# Fixtures are imported from conftest.py automatically


class TestPurchases:
    """اختبارات المشتريات"""
    
    def test_create_purchase_adds_inventory(self, db_session, test_crop, test_supplier):
        """التأكد من أن المشتراة تضيف للمخزون"""
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=1000.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=0.0
        )
        
        result = purchasing.create_new_purchase(db_session, purchase_data)
        
        assert result is not None
        assert result.total_cost == 10000.0
        assert result.payment_status == "PENDING"
        
        inventory = db_session.query(models.Inventory).filter(
            models.Inventory.crop_id == test_crop.crop_id
        ).first()
        
        assert inventory is not None
        assert inventory.current_stock_kg == 1000.0
    
    def test_create_purchase_with_payment(self, db_session, test_crop, test_supplier):
        """التأكد من المشتراة مع دفع جزئي"""
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=500.0,
            unit_price=20.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=5000.0
        )
        
        result = purchasing.create_new_purchase(db_session, purchase_data)
        
        assert result.total_cost == 10000.0
        assert result.amount_paid == 5000.0
        assert result.payment_status == "PARTIAL"


class TestSales:
    """اختبارات المبيعات"""
    
    def test_create_sale_deducts_inventory(self, db_session, test_crop, test_customer, test_supplier):
        """التأكد من أن المبيعة تخصم من المخزون"""
        # إضافة مخزون
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=1000.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=10000.0
        )
        purchasing.create_new_purchase(db_session, purchase_data)
        
        # إنشاء مبيعة
        sale_data = schemas.SaleCreate(
            crop_id=test_crop.crop_id,
            customer_id=test_customer.contact_id,
            sale_date=date.today(),
            quantity_sold_kg=200.0,
            selling_unit_price=15.0,
            selling_pricing_unit="kg",
            specific_selling_factor=1.0,
            amount_received=0.0
        )
        
        result = sales.create_new_sale(db_session, sale_data)
        
        assert result is not None
        assert result.total_sale_amount == 3000.0
        
        inventory = db_session.query(models.Inventory).filter(
            models.Inventory.crop_id == test_crop.crop_id
        ).first()
        
        assert inventory.current_stock_kg == 800.0
    
    def test_sale_fails_without_inventory(self, db_session, test_crop, test_customer):
        """التأكد من فشل المبيعة إذا لم يكن هناك مخزون كافي"""
        sale_data = schemas.SaleCreate(
            crop_id=test_crop.crop_id,
            customer_id=test_customer.contact_id,
            sale_date=date.today(),
            quantity_sold_kg=1000.0,
            selling_unit_price=15.0,
            selling_pricing_unit="kg",
            specific_selling_factor=1.0,
            amount_received=0.0
        )
        
        with pytest.raises(ValueError):
            sales.create_new_sale(db_session, sale_data)
