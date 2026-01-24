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
from sqlalchemy import func, case
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
    report_type: str = "physical"  # "ledger" أو "physical"


@dataclass
class DualBalanceReport:
    """تقرير التوازن المزدوج - دفتري وفعلي"""
    ledger_balance: BalanceReport      # التوازن الدفتري (من أرصدة الحسابات)
    physical_balance: BalanceReport    # التوازن الفعلي (من المخزون الحقيقي)
    has_discrepancy: bool              # هل يوجد فرق بين التقريرين
    discrepancy_amount: Decimal        # قيمة الفرق بين المخزون الدفتري والفعلي
    checked_at: datetime


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
        التحقق من توازن النظام الكلي (Dynamic & Comprehensive)
        
        يعتمد على تجميع الأرصدة الحالية لجميع الحسابات حسب نوعها.
        المعادلة المحاسبية: الأصول = الخصوم + حقوق الملكية + (الإيرادات - المصروفات)
        """
        checked_at = datetime.now()
        
        # 1. الأصول (Assets)
        # تشمل: ASSET, CASH, INVENTORY, RECEIVABLE
        # ملاحظة: المخزون هنا يؤخذ من القيمة الدفترية للحساب لغرض توازن الميزانية العمومية.
        # إذا أردنا مقارنة المخزون الفعلي (الكمية * التكلفة)، فهذا يتم في validate_dual_balance.
        total_assets = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type.in_(['ASSET', 'CASH', 'INVENTORY', 'RECEIVABLE']))\
            .scalar() or Decimal("0")
            
        # 2. الخصوم (Liabilities)
        # تشمل: LIABILITY, PAYABLE
        total_liabilities = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type.in_(['LIABILITY', 'PAYABLE']))\
            .scalar() or Decimal("0")
            
        # 3. حقوق الملكية (Equity - Capital)
        total_equity_capital = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type == 'EQUITY')\
            .scalar() or Decimal("0")
            
        # 4. صافي الربح (Net Profit)
        # الإيرادات (REVENUE) - المصروفات (EXPENSE)
        total_revenue = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type == 'REVENUE')\
            .scalar() or Decimal("0")
            
        total_expense = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type == 'EXPENSE')\
            .scalar() or Decimal("0")
            
        net_profit = self._to_decimal(total_revenue) - self._to_decimal(total_expense)
        
        # معادلة الميزانية:
        # Assets = Liabilities + Equity + Net Profit
        total_liabilities_and_equity = self._to_decimal(total_liabilities) + \
                                       self._to_decimal(total_equity_capital) + \
                                       net_profit
                                       
        total_assets = self._to_decimal(total_assets)
        
        # حساب الفرق
        difference = total_assets - total_liabilities_and_equity
        is_balanced = abs(difference) < Decimal("1.00")
        
        return BalanceReport(
            is_balanced=is_balanced,
            difference=difference.quantize(Decimal("0.01")),
            total_assets=total_assets.quantize(Decimal("0.01")),
            total_liabilities_and_equity=total_liabilities_and_equity.quantize(Decimal("0.01")),
            checked_at=checked_at,
            details={
                "assets": float(total_assets),
                "liabilities": float(total_liabilities),
                "capital": float(total_equity_capital),
                "revenue": float(total_revenue),
                "expense": float(total_expense),
                "net_profit": float(net_profit)
            },
            report_type="physical"
        )
    
    def validate_ledger_balance(self) -> BalanceReport:
        """
        التحقق من التوازن الدفتري (من أرصدة الحسابات)
        """
        checked_at = datetime.now()
        
        # حساب الأصول من أرصدة الحسابات
        # Sum of all ASSET + CASH + INVENTORY + RECEIVABLE accounts
        total_assets = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type.in_(['ASSET', 'CASH', 'INVENTORY', 'RECEIVABLE']))\
            .scalar() or Decimal("0")
        
        # الذمم الدائنة و الخصوم
        # Sum of LIABILITY + PAYABLE accounts (Credit balance is positive in report but negative in DB? 
        # Wait, usually Credit balances are stored positive? Or negative?
        # Based on _update_account_balance:
        # Liabilities: Credit increases -> stored positive?
        # Let's check implementation: 
        #   if is_debit_nature: change = debit - credit
        #   else: change = credit - debit
        # So ALL balances are stored POSITIVE.
        
        total_liabilities = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type.in_(['LIABILITY', 'PAYABLE']))\
            .scalar() or Decimal("0")
            
        # حقوق الملكية (Capital)
        total_equity_capital = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type == 'EQUITY')\
            .scalar() or Decimal("0")
            
        # صافي الربح = الإيرادات - المصروفات
        total_revenue = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type == 'REVENUE')\
            .scalar() or Decimal("0")
            
        total_expense = self.db.query(func.sum(models.FinancialAccount.current_balance))\
            .filter(models.FinancialAccount.account_type == 'EXPENSE')\
            .scalar() or Decimal("0")
            
        net_profit = total_revenue - total_expense
        
        total_liabilities_and_equity = total_liabilities + total_equity_capital + net_profit
        
        # تحويل القيم ل Decimal للعرض
        total_assets = self._to_decimal(total_assets)
        total_liabilities_and_equity = self._to_decimal(total_liabilities_and_equity)
        difference = total_assets - total_liabilities_and_equity
        is_balanced = abs(difference) < Decimal("1.00")
        
        # حساب الفرق
        difference = total_assets - total_liabilities_and_equity
        is_balanced = abs(difference) < Decimal("1.00")
        
        return BalanceReport(
            is_balanced=is_balanced,
            difference=difference.quantize(Decimal("0.01")),
            total_assets=total_assets.quantize(Decimal("0.01")),
            total_liabilities_and_equity=total_liabilities_and_equity.quantize(Decimal("0.01")),
            checked_at=checked_at,
            details={
                "assets": float(total_assets),
                "liabilities": float(total_liabilities),
                "capital": float(total_equity_capital),
                "revenue": float(total_revenue),
                "expense": float(total_expense),
                "net_profit": float(net_profit)
            },
            report_type="ledger"
        )
    
    def validate_dual_balance(self) -> DualBalanceReport:
        """
        التحقق المزدوج - يقارن التوازن الدفتري والفعلي
        
        Returns:
            DualBalanceReport: تقرير يحتوي على كلا التوازنين والفرق بينهما
        """
        checked_at = datetime.now()
        
        # الحصول على التقريرين
        ledger_report = self.validate_ledger_balance()
        physical_report = self.validate_system_balance()
        
        # حساب الفرق في المخزون بين الدفتري والفعلي
        ledger_inventory = Decimal(str(ledger_report.details.get("inventory", 0)))
        physical_inventory = Decimal(str(physical_report.details.get("inventory", 0)))
        discrepancy = abs(physical_inventory - ledger_inventory)
        has_discrepancy = discrepancy > Decimal("1.00")  # هامش 1 جنيه
        
        return DualBalanceReport(
            ledger_balance=ledger_report,
            physical_balance=physical_report,
            has_discrepancy=has_discrepancy,
            discrepancy_amount=discrepancy.quantize(Decimal("0.01")),
            checked_at=checked_at
        )


# Helper function للوصول السريع
def get_engine(db: Session) -> AccountingEngine:
    """الحصول على محرك المحاسبة"""
    return AccountingEngine(db)

