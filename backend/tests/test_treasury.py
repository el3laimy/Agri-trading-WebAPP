"""
اختبارات شاملة لعمليات الخزينة
Treasury Operations Tests
"""
import pytest
from datetime import date
from app import models, schemas
from app.services import treasury


# Fixtures are imported from conftest.py automatically


class TestCashReceipt:
    """اختبارات قبض النقدية"""
    
    def test_cash_receipt_creates_payment_record(self, db_session, test_customer):
        """التأكد من أن قبض النقدية ينشئ سجل Payment"""
        receipt_data = schemas.CashReceiptCreate(
            amount=1000.0,
            receipt_date=date.today(),
            description="اختبار قبض نقدية",
            contact_id=test_customer.contact_id
        )
        
        result = treasury.create_cash_receipt(db_session, receipt_data)
        
        assert result["success"] == True
        assert result["payment_id"] is not None
        
        payment = db_session.query(models.Payment).filter(
            models.Payment.payment_id == result["payment_id"]
        ).first()
        
        assert payment is not None
        assert payment.amount == 1000.0
        assert payment.contact_id == test_customer.contact_id
        assert payment.transaction_type == "GENERAL"
    
    def test_cash_receipt_creates_ledger_entries(self, db_session, test_customer):
        """التأكد من إنشاء قيود دفتر الأستاذ"""
        receipt_data = schemas.CashReceiptCreate(
            amount=500.0,
            receipt_date=date.today(),
            description="اختبار قيود",
            contact_id=test_customer.contact_id
        )
        
        result = treasury.create_cash_receipt(db_session, receipt_data)
        
        ledger_entries = db_session.query(models.GeneralLedger).filter(
            models.GeneralLedger.source_type == "CASH_RECEIPT",
            models.GeneralLedger.source_id == result["payment_id"]
        ).all()
        
        assert len(ledger_entries) >= 2
    
    def test_cash_receipt_without_contact(self, db_session):
        """التأكد من أن القبض بدون عميل لا ينشئ Payment"""
        receipt_data = schemas.CashReceiptCreate(
            amount=200.0,
            receipt_date=date.today(),
            description="قبض عام بدون عميل",
            contact_id=None
        )
        
        result = treasury.create_cash_receipt(db_session, receipt_data)
        
        assert result["success"] == True
        assert result["payment_id"] is None


class TestCashPayment:
    """اختبارات صرف النقدية"""
    
    def test_cash_payment_creates_payment_record(self, db_session, test_supplier):
        """التأكد من أن صرف النقدية ينشئ سجل Payment"""
        payment_data = schemas.CashPaymentCreate(
            amount=2000.0,
            payment_date=date.today(),
            description="اختبار صرف نقدية",
            contact_id=test_supplier.contact_id
        )
        
        result = treasury.create_cash_payment(db_session, payment_data)
        
        assert result["success"] == True
        assert result["payment_id"] is not None
        
        payment = db_session.query(models.Payment).filter(
            models.Payment.payment_id == result["payment_id"]
        ).first()
        
        assert payment is not None
        assert payment.amount == 2000.0
        assert payment.transaction_type == "GENERAL"


class TestQuickExpense:
    """اختبارات المصروفات السريعة"""
    
    def test_quick_expense_creates_expense_record(self, db_session):
        """التأكد من إنشاء سجل Expense"""
        expense_data = schemas.QuickExpenseCreate(
            amount=150.0,
            expense_date=date.today(),
            description="مصروف اختباري",
            category="transport"
        )
        
        result = treasury.create_quick_expense(db_session, expense_data)
        
        assert result["success"] == True
        assert result["expense_id"] is not None
        
        expense = db_session.query(models.Expense).filter(
            models.Expense.expense_id == result["expense_id"]
        ).first()
        
        assert expense is not None
        assert expense.amount == 150.0
