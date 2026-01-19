"""
محرك المحاسبة الذكي - Smart Accounting Engine
يضمن توازن كل المعاملات ويمنع أخطاء المحاسبة

Features:
- يرفض أي قيد غير متوازن مع رسالة واضحة
- يستخدم Decimal فقط لتجنب أخطاء التقريب
- يوفر دالة موحدة لتحديث الأرصدة
- يتحقق من توازن النظام
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

from app import models
from app.core.settings import get_setting


@dataclass
class LedgerEntry:
    """قيد محاسبي واحد"""
    account_id: int
    debit: Decimal = Decimal("0")
    credit: Decimal = Decimal("0")
    description: str = ""


@dataclass
class BalanceReport:
    """تقرير توازن النظام"""
    is_balanced: bool
    difference: Decimal
    total_assets: Decimal
    total_liabilities_and_equity: Decimal
    checked_at: datetime
    details: Dict = None


class AccountingError(Exception):
    """خطأ محاسبي مع رسالة واضحة"""
    def __init__(self, message: str, details: Dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class AccountingEngine:
    """
    محرك المحاسبة الذكي
    
    يضمن:
    1. كل قيد متوازن (مدين = دائن)
    2. استخدام Decimal في كل الحسابات
    3. رسائل خطأ واضحة بالعربية
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._precision = Decimal("0.01")  # دقة الحساب
    
    def _to_decimal(self, value) -> Decimal:
        """تحويل أي قيمة إلى Decimal بشكل آمن"""
        if isinstance(value, Decimal):
            return value
        return Decimal(str(value)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    
    def validate_entries(self, entries: List[LedgerEntry]) -> Tuple[bool, str]:
        """
        التحقق من توازن القيود
        
        Returns:
            (is_valid, error_message)
        """
        if not entries:
            return False, "❌ لا توجد قيود للتسجيل"
        
        total_debit = sum(self._to_decimal(e.debit) for e in entries)
        total_credit = sum(self._to_decimal(e.credit) for e in entries)
        difference = abs(total_debit - total_credit)
        
        if difference > self._precision:
            return False, (
                f"❌ القيد غير متوازن!\n"
                f"   إجمالي المدين: {total_debit:,.2f} ج.م\n"
                f"   إجمالي الدائن: {total_credit:,.2f} ج.م\n"
                f"   الفرق: {difference:,.2f} ج.م\n"
                f"   يجب أن يكون إجمالي المدين = إجمالي الدائن"
            )
        
        # التحقق من وجود الحسابات
        for entry in entries:
            account = self.db.query(models.FinancialAccount).filter(
                models.FinancialAccount.account_id == entry.account_id
            ).first()
            if not account:
                return False, f"❌ الحساب رقم {entry.account_id} غير موجود"
            if not account.is_active:
                return False, f"❌ الحساب '{account.account_name}' غير نشط"
        
        return True, "✅ القيد متوازن وصحيح"
    
    def create_balanced_entry(
        self,
        entries: List[LedgerEntry],
        entry_date: date,
        source_type: str,
        source_id: int,
        created_by: int = None
    ) -> List[models.GeneralLedger]:
        """
        إنشاء قيد متوازن مع التحقق
        
        Raises:
            AccountingError: إذا كان القيد غير متوازن
        """
        # التحقق من التوازن
        is_valid, message = self.validate_entries(entries)
        if not is_valid:
            raise AccountingError(message, {
                "entries": [
                    {"account_id": e.account_id, "debit": float(e.debit), "credit": float(e.credit)}
                    for e in entries
                ],
                "source_type": source_type,
                "source_id": source_id
            })
        
        # إنشاء القيود
        created_entries = []
        for entry in entries:
            gl_entry = models.GeneralLedger(
                entry_date=entry_date,
                account_id=entry.account_id,
                debit=self._to_decimal(entry.debit),
                credit=self._to_decimal(entry.credit),
                description=entry.description,
                source_type=source_type,
                source_id=source_id,
                created_by=created_by
            )
            self.db.add(gl_entry)
            created_entries.append(gl_entry)
            
            # تحديث رصيد الحساب
            self._update_account_balance(
                entry.account_id,
                self._to_decimal(entry.debit),
                self._to_decimal(entry.credit)
            )
        
        return created_entries
    
    def _update_account_balance(
        self,
        account_id: int,
        debit: Decimal,
        credit: Decimal
    ):
        """
        تحديث رصيد الحساب بناءً على طبيعته
        
        الحسابات المدينة (Assets, Expenses):
            الرصيد = المدين - الدائن
        الحسابات الدائنة (Liabilities, Equity, Revenue):
            الرصيد = الدائن - المدين
        """
        account = self.db.query(models.FinancialAccount).filter(
            models.FinancialAccount.account_id == account_id
        ).first()
        
        if not account:
            return
        
        # تحديد طبيعة الحساب
        is_debit_nature = account.account_type in [
            'ASSET', 'CASH', 'EXPENSE', 'RECEIVABLE', 'INVENTORY'
        ]
        
        if is_debit_nature:
            # الأصول والمصروفات: الرصيد يزيد بالمدين وينقص بالدائن
            change = debit - credit
        else:
            # الخصوم والإيرادات وحقوق الملكية: الرصيد يزيد بالدائن وينقص بالمدين
            change = credit - debit
        
        account.current_balance = self._to_decimal(account.current_balance) + change
        self.db.add(account)
    
    def reverse_transaction(
        self,
        source_type: str,
        source_id: int,
        reversal_date: date = None,
        created_by: int = None
    ) -> List[models.GeneralLedger]:
        """
        عكس معاملة كاملة بقيد عكسي
        
        بدلاً من حذف القيود، ننشئ قيداً عكسياً للتتبع
        """
        if not reversal_date:
            reversal_date = date.today()
        
        # جلب القيود الأصلية
        original_entries = self.db.query(models.GeneralLedger).filter(
            models.GeneralLedger.source_type == source_type,
            models.GeneralLedger.source_id == source_id
        ).all()
        
        if not original_entries:
            raise AccountingError(
                f"❌ لا توجد قيود للمعاملة {source_type}#{source_id}"
            )
        
        # إنشاء قيود عكسية
        reversal_entries = []
        for orig in original_entries:
            reversal_entries.append(LedgerEntry(
                account_id=orig.account_id,
                debit=self._to_decimal(orig.credit),  # عكس
                credit=self._to_decimal(orig.debit),  # عكس
                description=f"عكس: {orig.description}"
            ))
        
        return self.create_balanced_entry(
            entries=reversal_entries,
            entry_date=reversal_date,
            source_type=f"{source_type}_REVERSAL",
            source_id=source_id,
            created_by=created_by
        )
    
    def validate_system_balance(self) -> BalanceReport:
        """
        التحقق من توازن النظام الكلي
        
        المعادلة: الأصول = الخصوم + حقوق الملكية
        """
        checked_at = datetime.now()
        
        # حساب الأصول
        cash_id = get_setting(self.db, "CASH_ACCOUNT_ID")
        cash_account = self.db.query(models.FinancialAccount).filter(
            models.FinancialAccount.account_id == int(cash_id) if cash_id else 0
        ).first()
        cash_balance = self._to_decimal(cash_account.current_balance) if cash_account else Decimal("0")
        
        # قيمة المخزون
        inventory_value = self.db.query(
            func.sum(models.Inventory.current_stock_kg * models.Inventory.average_cost_per_kg)
        ).scalar() or Decimal("0")
        inventory_value = self._to_decimal(inventory_value)
        
        # الذمم المدينة (من العملاء)
        total_sales = self._to_decimal(
            self.db.query(func.sum(models.Sale.total_sale_amount)).scalar() or 0
        )
        sale_returns = self._to_decimal(
            self.db.query(func.sum(models.SaleReturn.refund_amount)).scalar() or 0
        )
        customer_payments = self._to_decimal(
            self.db.query(func.sum(models.Payment.amount)).join(
                models.Contact, models.Payment.contact_id == models.Contact.contact_id
            ).filter(models.Contact.is_customer == True).scalar() or 0
        )
        accounts_receivable = total_sales - sale_returns - customer_payments
        
        total_assets = cash_balance + inventory_value + accounts_receivable
        
        # حساب الخصوم وحقوق الملكية
        equity_id = get_setting(self.db, "OWNER_EQUITY_ID")
        equity_account = self.db.query(models.FinancialAccount).filter(
            models.FinancialAccount.account_id == int(equity_id) if equity_id else 0
        ).first()
        owner_capital = abs(self._to_decimal(equity_account.current_balance)) if equity_account else Decimal("0")
        
        # صافي الربح
        from app.services.reporting import generate_income_statement
        try:
            income_stmt = generate_income_statement(self.db, date(2000, 1, 1), date.today())
            net_profit = self._to_decimal(income_stmt.get('net_income', 0))
        except:
            net_profit = Decimal("0")
        
        # الذمم الدائنة (للموردين)
        total_purchases = self._to_decimal(
            self.db.query(func.sum(models.Purchase.total_cost)).scalar() or 0
        )
        purchase_returns = self._to_decimal(
            self.db.query(func.sum(models.PurchaseReturn.returned_cost)).scalar() or 0
        )
        supplier_payments = self._to_decimal(
            self.db.query(func.sum(models.Payment.amount)).join(
                models.Contact, models.Payment.contact_id == models.Contact.contact_id
            ).filter(models.Contact.is_supplier == True).scalar() or 0
        )
        accounts_payable = total_purchases - purchase_returns - supplier_payments
        
        total_liabilities_and_equity = owner_capital + net_profit + accounts_payable
        
        # حساب الفرق
        difference = total_assets - total_liabilities_and_equity
        is_balanced = abs(difference) < Decimal("1.00")  # هامش 1 جنيه
        
        return BalanceReport(
            is_balanced=is_balanced,
            difference=difference.quantize(Decimal("0.01")),
            total_assets=total_assets.quantize(Decimal("0.01")),
            total_liabilities_and_equity=total_liabilities_and_equity.quantize(Decimal("0.01")),
            checked_at=checked_at,
            details={
                "cash": float(cash_balance),
                "inventory": float(inventory_value),
                "receivables": float(accounts_receivable),
                "capital": float(owner_capital),
                "profit": float(net_profit),
                "payables": float(accounts_payable)
            }
        )


# Helper function للوصول السريع
def get_engine(db: Session) -> AccountingEngine:
    """الحصول على محرك المحاسبة"""
    return AccountingEngine(db)
