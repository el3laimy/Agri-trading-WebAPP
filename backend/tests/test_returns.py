"""
اختبارات شاملة للمرتجعات وتسويات المخزون
Returns and Inventory Adjustments Tests
"""
import pytest
from datetime import date
from app import models, schemas, crud
from app.services import sales, purchasing


# Fixtures are imported from conftest.py automatically


@pytest.fixture
def sale_with_inventory(db_session, test_crop, test_customer, test_supplier):
    """إنشاء مبيعة مع مخزون متاح"""
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
        selling_unit_price=20.0,
        selling_pricing_unit="kg",
        specific_selling_factor=1.0,
        amount_received=0.0
    )
    sale = sales.create_new_sale(db_session, sale_data)
    return sale


class TestSaleReturns:
    """اختبارات مرتجعات المبيعات"""
    
    def test_sale_return_restores_inventory(self, db_session, sale_with_inventory, test_crop):
        """التأكد من أن المرتجع يُعيد الكمية للمخزون"""
        inventory_before = db_session.query(models.Inventory).filter(
            models.Inventory.crop_id == test_crop.crop_id
        ).first()
        assert inventory_before.current_stock_kg == 800.0
        
        return_data = schemas.SaleReturnCreate(
            sale_id=sale_with_inventory.sale_id,
            return_date=date.today(),
            quantity_kg=50.0,
            return_reason="جودة غير مناسبة"
        )
        
        sale_return = crud.create_sale_return(db_session, return_data)
        
        assert sale_return is not None
        assert sale_return.quantity_kg == 50.0
        
        db_session.refresh(inventory_before)
        assert inventory_before.current_stock_kg == 850.0
    
    def test_sale_return_creates_ledger_entries(self, db_session, sale_with_inventory):
        """التأكد من إنشاء قيود محاسبية للمرتجع"""
        return_data = schemas.SaleReturnCreate(
            sale_id=sale_with_inventory.sale_id,
            return_date=date.today(),
            quantity_kg=30.0,
            return_reason="تالف"
        )
        
        sale_return = crud.create_sale_return(db_session, return_data)
        
        ledger_entries = db_session.query(models.GeneralLedger).filter(
            models.GeneralLedger.source_type == "SALE_RETURN",
            models.GeneralLedger.source_id == sale_return.return_id
        ).all()
        
        assert len(ledger_entries) >= 2


class TestPurchaseReturns:
    """اختبارات مرتجعات المشتريات"""
    
    def test_purchase_return_deducts_inventory(self, db_session, test_crop, test_supplier):
        """التأكد من أن مرتجع المشتريات يخصم من المخزون"""
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=500.0,
            unit_price=15.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=0.0
        )
        purchase = purchasing.create_new_purchase(db_session, purchase_data)
        
        inventory = db_session.query(models.Inventory).filter(
            models.Inventory.crop_id == test_crop.crop_id
        ).first()
        assert inventory.current_stock_kg == 500.0
        
        return_data = schemas.PurchaseReturnCreate(
            purchase_id=purchase.purchase_id,
            return_date=date.today(),
            quantity_kg=100.0,
            return_reason="جودة رديئة"
        )
        
        crud.create_purchase_return(db_session, return_data)
        
        db_session.refresh(inventory)
        assert inventory.current_stock_kg == 400.0
    
    def test_purchase_return_creates_ledger_entries(self, db_session, test_crop, test_supplier):
        """التأكد من إنشاء قيود للمرتجع"""
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=300.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=0.0
        )
        purchase = purchasing.create_new_purchase(db_session, purchase_data)
        
        return_data = schemas.PurchaseReturnCreate(
            purchase_id=purchase.purchase_id,
            return_date=date.today(),
            quantity_kg=50.0,
            return_reason="اختبار قيود"
        )
        
        purchase_return = crud.create_purchase_return(db_session, return_data)
        
        ledger_entries = db_session.query(models.GeneralLedger).filter(
            models.GeneralLedger.source_type == "PURCHASE_RETURN",
            models.GeneralLedger.source_id == purchase_return.return_id
        ).all()
        
        assert len(ledger_entries) >= 2


class TestInventoryAdjustments:
    """اختبارات تسويات المخزون"""
    
    def test_inventory_loss_creates_expense(self, db_session, test_crop, test_supplier):
        """التأكد من أن العجز ينشئ قيد خسارة"""
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
        
        adjustment_data = schemas.InventoryAdjustmentCreate(
            crop_id=test_crop.crop_id,
            adjustment_date=date.today(),
            adjustment_type="SHORTAGE",
            quantity_kg=-50.0,
            notes="عجز بسبب التالف"
        )
        
        adjustment = crud.create_inventory_adjustment(db_session, adjustment_data)
        
        assert adjustment is not None
        assert adjustment.quantity_kg == -50.0
        
        ledger_entries = db_session.query(models.GeneralLedger).filter(
            models.GeneralLedger.source_type == "ADJUSTMENT",
            models.GeneralLedger.source_id == adjustment.adjustment_id
        ).all()
        
        assert len(ledger_entries) >= 2
