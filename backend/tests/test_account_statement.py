"""
اختبارات شاملة لكشف الحساب وتقرير المديونية
Account Statement and Debt Report Tests
"""
import pytest
from datetime import date
from app import models, schemas
from app.services import account_statement, advanced_reports, treasury, sales, purchasing


# Fixtures are imported from conftest.py automatically


class TestAccountStatement:
    """اختبارات كشف الحساب"""
    
    def test_statement_includes_general_payment(self, db_session, test_customer):
        """التأكد من ظهور الدفعات العامة في كشف الحساب"""
        receipt_data = schemas.CashReceiptCreate(
            amount=500.0,
            receipt_date=date.today(),
            description="قبض عام للاختبار",
            contact_id=test_customer.contact_id
        )
        treasury.create_cash_receipt(db_session, receipt_data)
        
        statement = account_statement.get_account_statement(
            db_session, 
            contact_id=test_customer.contact_id
        )
        
        general_payments = [
            e for e in statement.entries 
            if "عام" in e.description
        ]
        
        assert len(general_payments) >= 1
        assert general_payments[0].credit == 500.0
    
    def test_statement_includes_sale(self, db_session, test_crop, test_customer, test_supplier):
        """التأكد من ظهور المبيعات في كشف الحساب"""
        # إضافة مخزون
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=500.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=5000.0
        )
        purchasing.create_new_purchase(db_session, purchase_data)
        
        # إنشاء مبيعة
        sale_data = schemas.SaleCreate(
            crop_id=test_crop.crop_id,
            customer_id=test_customer.contact_id,
            sale_date=date.today(),
            quantity_sold_kg=100.0,
            selling_unit_price=15.0,
            selling_pricing_unit="kg",
            specific_selling_factor=1.0,
            amount_received=0.0
        )
        sales.create_new_sale(db_session, sale_data)
        
        statement = account_statement.get_account_statement(
            db_session,
            contact_id=test_customer.contact_id
        )
        
        sale_entries = [
            e for e in statement.entries
            if e.reference_type == "SALE"
        ]
        
        assert len(sale_entries) >= 1
        assert sale_entries[0].debit == 1500.0


class TestDebtReport:
    """اختبارات تقرير المديونية"""
    
    def test_debt_report_includes_customer(self, db_session, test_crop, test_customer, test_supplier):
        """التأكد من ظهور العميل المدين في التقرير"""
        # إضافة مخزون
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=500.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=5000.0
        )
        purchasing.create_new_purchase(db_session, purchase_data)
        
        # مبيعة آجلة
        sale_data = schemas.SaleCreate(
            crop_id=test_crop.crop_id,
            customer_id=test_customer.contact_id,
            sale_date=date.today(),
            quantity_sold_kg=100.0,
            selling_unit_price=30.0,
            selling_pricing_unit="kg",
            specific_selling_factor=1.0,
            amount_received=0.0
        )
        sales.create_new_sale(db_session, sale_data)
        
        report = advanced_reports.get_debt_report(db_session)
        
        customer_debts = [
            r for r in report["receivables"]
            if r["contact_id"] == test_customer.contact_id
        ]
        
        assert len(customer_debts) == 1
        assert customer_debts[0]["balance_due"] == 3000.0
    
    def test_debt_report_deducts_payments(self, db_session, test_crop, test_customer, test_supplier):
        """التأكد من خصم الدفعات العامة من المديونية"""
        # إضافة مخزون
        purchase_data = schemas.PurchaseCreate(
            crop_id=test_crop.crop_id,
            supplier_id=test_supplier.contact_id,
            purchase_date=date.today(),
            quantity_kg=500.0,
            unit_price=10.0,
            purchasing_pricing_unit="kg",
            conversion_factor=1.0,
            amount_paid=5000.0
        )
        purchasing.create_new_purchase(db_session, purchase_data)
        
        # مبيعة بـ 1000
        sale_data = schemas.SaleCreate(
            crop_id=test_crop.crop_id,
            customer_id=test_customer.contact_id,
            sale_date=date.today(),
            quantity_sold_kg=50.0,
            selling_unit_price=20.0,
            selling_pricing_unit="kg",
            specific_selling_factor=1.0,
            amount_received=0.0
        )
        sales.create_new_sale(db_session, sale_data)
        
        # قبض عام 400
        receipt_data = schemas.CashReceiptCreate(
            amount=400.0,
            receipt_date=date.today(),
            description="دفعة جزئية",
            contact_id=test_customer.contact_id
        )
        treasury.create_cash_receipt(db_session, receipt_data)
        
        report = advanced_reports.get_debt_report(db_session)
        
        customer_debts = [
            r for r in report["receivables"]
            if r["contact_id"] == test_customer.contact_id
        ]
        
        assert len(customer_debts) == 1
        assert customer_debts[0]["balance_due"] == 600.0
