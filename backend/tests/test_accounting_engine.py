"""
اختبارات محرك المحاسبة الذكي
Accounting Engine Tests
"""
import pytest
from decimal import Decimal
from datetime import date
from app import models
from app.services.accounting_engine import AccountingEngine, LedgerEntry, AccountingError


# Fixtures are imported from conftest.py automatically


class TestAccountingEngineValidation:
    """اختبارات التحقق من توازن القيود"""
    
    def test_balanced_entries_are_valid(self, db_session, test_financial_accounts):
        """التأكد من قبول القيود المتوازنة"""
        engine = AccountingEngine(db_session)
        
        entries = [
            LedgerEntry(
                account_id=test_financial_accounts["cash"].account_id,
                debit=Decimal("1000"),
                credit=Decimal("0"),
                description="مدين"
            ),
            LedgerEntry(
                account_id=test_financial_accounts["receivables"].account_id,
                debit=Decimal("0"),
                credit=Decimal("1000"),
                description="دائن"
            )
        ]
        
        is_valid, error = engine.validate_entries(entries)
        
        assert is_valid == True
        assert error is None
    
    def test_unbalanced_entries_are_rejected(self, db_session, test_financial_accounts):
        """التأكد من رفض القيود غير المتوازنة"""
        engine = AccountingEngine(db_session)
        
        entries = [
            LedgerEntry(
                account_id=test_financial_accounts["cash"].account_id,
                debit=Decimal("1000"),
                credit=Decimal("0"),
                description="مدين"
            ),
            LedgerEntry(
                account_id=test_financial_accounts["receivables"].account_id,
                debit=Decimal("0"),
                credit=Decimal("500"),  # غير متوازن!
                description="دائن"
            )
        ]
        
        is_valid, error = engine.validate_entries(entries)
        
        assert is_valid == False
        assert error is not None


class TestAccountingEngineOperations:
    """اختبارات عمليات محرك المحاسبة"""
    
    def test_create_balanced_entry(self, db_session, test_financial_accounts):
        """التأكد من إنشاء قيد متوازن"""
        engine = AccountingEngine(db_session)
        
        entries = [
            LedgerEntry(
                account_id=test_financial_accounts["cash"].account_id,
                debit=Decimal("500"),
                credit=Decimal("0"),
                description="قبض نقدية"
            ),
            LedgerEntry(
                account_id=test_financial_accounts["receivables"].account_id,
                debit=Decimal("0"),
                credit=Decimal("500"),
                description="تحصيل من عميل"
            )
        ]
        
        result = engine.create_balanced_entry(
            entries=entries,
            entry_date=date.today(),
            source_type="TEST",
            source_id=999
        )
        
        assert result is not None
        assert len(result) == 2
        
        # Cleanup - حذف القيود الاختبارية
        for entry in result:
            db_session.delete(entry)
        db_session.commit()
    
    def test_create_balanced_entry_fails_when_unbalanced(self, db_session, test_financial_accounts):
        """التأكد من فشل إنشاء قيد غير متوازن"""
        engine = AccountingEngine(db_session)
        
        entries = [
            LedgerEntry(
                account_id=test_financial_accounts["cash"].account_id,
                debit=Decimal("1000"),
                credit=Decimal("0"),
                description="مدين"
            ),
            LedgerEntry(
                account_id=test_financial_accounts["receivables"].account_id,
                debit=Decimal("0"),
                credit=Decimal("800"),  # غير متوازن
                description="دائن"
            )
        ]
        
        with pytest.raises(AccountingError):
            engine.create_balanced_entry(
                entries=entries,
                entry_date=date.today(),
                source_type="TEST",
                source_id=999
            )


class TestSystemBalance:
    """اختبارات توازن النظام الكلي"""
    
    def test_validate_system_balance(self, db_session, test_financial_accounts):
        """التأكد من التحقق من توازن النظام"""
        engine = AccountingEngine(db_session)
        
        report = engine.validate_system_balance()
        
        assert report is not None
        assert hasattr(report, "is_balanced")
        assert hasattr(report, "difference")
        assert hasattr(report, "total_assets")
        assert hasattr(report, "total_liabilities_and_equity")
