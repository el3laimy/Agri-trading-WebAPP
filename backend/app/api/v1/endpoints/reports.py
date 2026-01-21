from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Any, Dict, Optional
from datetime import date

from app.services import reporting, dashboard
from app.services import capital_distribution
from app.services.accounting_engine import get_engine
from app.api.v1.endpoints.crops import get_db
from app.schemas import GeneralLedger, FinancialAccount, BaseModel, CapitalDistributionReport

router = APIRouter()

class TrialBalanceEntry(BaseModel):
    account_id: int
    account_name: str
    total_debit: float
    total_credit: float

class GeneralLedgerRead(GeneralLedger):
    account: FinancialAccount

class IncomeStatementAccountEntry(BaseModel):
    account_name: str
    amount: float

class IncomeStatementResponse(BaseModel):
    start_date: date
    end_date: date
    revenues: List[IncomeStatementAccountEntry]
    total_revenue: float
    expenses: List[IncomeStatementAccountEntry]
    total_expense: float
    net_income: float

class BalanceSheetAccountEntry(BaseModel):
    account_name: str
    balance: float

class BalanceSheetResponse(BaseModel):
    end_date: date
    assets: List[BalanceSheetAccountEntry]
    total_assets: float
    liabilities: List[BalanceSheetAccountEntry]
    total_liabilities: float
    equity: List[BalanceSheetAccountEntry]
    total_equity: float
    total_liabilities_and_equity: float

class EquityStatementResponse(BaseModel):
    start_date: date
    end_date: date
    beginning_equity: float
    net_income: float
    owner_contributions: float
    owner_draws: float
    ending_equity: float

@router.get("/general-ledger", response_model=List[GeneralLedgerRead])
def get_general_ledger(db: Session = Depends(get_db)):
    return reporting.get_general_ledger_entries(db)

@router.get("/trial-balance", response_model=List[TrialBalanceEntry])
def get_trial_balance(db: Session = Depends(get_db)):
    return reporting.generate_trial_balance(db)

@router.get("/income-statement", response_model=IncomeStatementResponse)
def get_income_statement(
    start_date: date = Query(..., description="Start date for the report, format YYYY-MM-DD"), 
    end_date: date = Query(..., description="End date for the report, format YYYY-MM-DD"), 
    db: Session = Depends(get_db)
):
    return reporting.generate_income_statement(db, start_date=start_date, end_date=end_date)

@router.get("/balance-sheet", response_model=BalanceSheetResponse)
def get_balance_sheet(
    end_date: date = Query(..., description="The date for the balance sheet snapshot, format YYYY-MM-DD"), 
    db: Session = Depends(get_db)
):
    return reporting.generate_balance_sheet(db, end_date=end_date)

@router.get("/equity-statement", response_model=EquityStatementResponse)
def get_equity_statement(
    start_date: date = Query(..., description="Start date for the report, format YYYY-MM-DD"), 
    end_date: date = Query(..., description="End date for the report, format YYYY-MM-DD"), 
    db: Session = Depends(get_db)
):
    return reporting.generate_equity_statement(db, start_date=start_date, end_date=end_date)

@router.get("/dashboard-kpis")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    return dashboard.get_dashboard_kpis(db)

@router.get("/dashboard-alerts")
def get_dashboard_alerts(db: Session = Depends(get_db)):
    """الحصول على التنبيهات الذكية للوحة التحكم"""
    return dashboard.get_dashboard_alerts(db)

@router.get("/sales-by-crop")
def get_sales_by_crop(db: Session = Depends(get_db)):
    """الحصول على توزيع المبيعات حسب المحصول"""
    return dashboard.get_sales_by_crop(db)


@router.get("/capital-distribution", response_model=CapitalDistributionReport)
def get_capital_distribution(
    report_date: Optional[date] = Query(None, description="تاريخ التقرير"),
    start_date: Optional[date] = Query(None, description="تاريخ بداية الفترة لحساب الأرباح"),
    db: Session = Depends(get_db)
):
    """
    تقرير توزيع رأس المال
    
    المعادلة: رأس المال + الأرباح + الديون علينا = النقدية + المخزون + الديون لنا
    """
    return capital_distribution.generate_capital_distribution(db, report_date, start_date)

@router.get("/capital-breakdown")
def get_capital_breakdown(db: Session = Depends(get_db)):
    """تفصيل توزيع رأس المال حسب الفئات للرسم البياني"""
    return capital_distribution.get_capital_breakdown_by_category(db)


@router.get("/balance-check")
def check_system_balance(db: Session = Depends(get_db)):
    """
    التحقق المزدوج من توازن النظام المحاسبي
    
    Returns:
        ledger_balance: التوازن الدفتري (من أرصدة الحسابات) - يتطابق مع ميزان المراجعة
        physical_balance: التوازن الفعلي (من المخزون الحقيقي)
        has_discrepancy: هل يوجد فرق بين المخزون الدفتري والفعلي
        discrepancy_amount: قيمة الفرق في المخزون
    """
    engine = get_engine(db)
    dual_report = engine.validate_dual_balance()
    
    ledger = dual_report.ledger_balance
    physical = dual_report.physical_balance
    
    return {
        # التوازن الدفتري (الأساسي - يتطابق مع ميزان المراجعة)
        "is_balanced": ledger.is_balanced,
        "difference": float(ledger.difference),
        "total_assets": float(ledger.total_assets),
        "total_liabilities_and_equity": float(ledger.total_liabilities_and_equity),
        "details": ledger.details,
        "status": "متوازن ✅" if ledger.is_balanced else f"غير متوازن ❌ (الفرق: {ledger.difference} ج.م)",
        
        # معلومات إضافية عن التوازن الفعلي
        "physical_balance": {
            "is_balanced": physical.is_balanced,
            "difference": float(physical.difference),
            "total_assets": float(physical.total_assets),
            "total_liabilities_and_equity": float(physical.total_liabilities_and_equity),
            "details": physical.details,
        },
        
        # الفرق بين المخزون الدفتري والفعلي
        "inventory_discrepancy": {
            "has_discrepancy": dual_report.has_discrepancy,
            "amount": float(dual_report.discrepancy_amount),
            "ledger_inventory": ledger.details.get("inventory", 0),
            "physical_inventory": physical.details.get("inventory", 0),
            "message": f"فرق المخزون: {dual_report.discrepancy_amount} ج.م" if dual_report.has_discrepancy else "المخزون متطابق ✅"
        },
        
        "checked_at": dual_report.checked_at.isoformat()
    }


# --- تقرير التدفقات النقدية ---
from app.services import cash_flow

@router.get("/cash-flow")
def get_cash_flow(
    start_date: date = Query(..., description="تاريخ البداية"),
    end_date: date = Query(..., description="تاريخ النهاية"),
    db: Session = Depends(get_db)
):
    """
    تقرير التدفقات النقدية
    يُظهر مصادر واستخدامات النقدية خلال فترة محددة
    """
    return cash_flow.get_cash_flow_report(db, start_date, end_date)


@router.get("/cash-flow-details")
def get_cash_flow_details(
    start_date: date = Query(..., description="تاريخ البداية"),
    end_date: date = Query(..., description="تاريخ النهاية"),
    category: Optional[str] = Query(None, description="الفئة: operating, investing, financing"),
    db: Session = Depends(get_db)
):
    """تفاصيل حركات النقدية"""
    return cash_flow.get_cash_flow_details(db, start_date, end_date, category)

# --- التقارير المتقدمة (Advanced Reports) ---
from app.services import advanced_reports

@router.get("/crop-profitability")
def get_crop_profitability(
    season_id: Optional[int] = Query(None, description="معرف الموسم (اختياري)"),
    db: Session = Depends(get_db)
):
    """
    تقرير ربحية المحاصيل
    يظهر: الإيرادات، التكاليف التقريبية، والربح لكل محصول
    """
    return advanced_reports.get_crop_profitability(db, season_id)

@router.get("/top-customers")
def get_top_customers(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """تحليل أفضل العملاء حسب حجم التعامل"""
    return advanced_reports.get_top_customers(db, limit)

@router.get("/debt-analysis")
def get_debt_analysis(db: Session = Depends(get_db)):
    """
    تقرير المديونية
    يظهر: ديون العملاء (لنا) وديون الموردين (علينا)
    """
    return advanced_reports.get_debt_report(db)

@router.get("/expenses-stats")
def get_expenses_stats(db: Session = Depends(get_db)):
    """
    إحصائيات المصروفات
    """
    return advanced_reports.get_expenses_stats(db)


# --- Dashboard Enhanced Endpoints ---



@router.get("/dashboard/recent-activities")
def get_recent_activities(
    limit: int = Query(10, description="عدد العمليات"),
    db: Session = Depends(get_db)
):
    """آخر العمليات (مبيعات ومشتريات)"""
    return dashboard.get_recent_activities(db, limit)


@router.get("/dashboard/season-summary")
def get_season_summary(db: Session = Depends(get_db)):
    """ملخص الموسم الحالي مع نسبة التقدم"""
    return dashboard.get_current_season_summary(db)


@router.get("/dashboard/advanced-chart")
def get_advanced_chart(
    start_date: date,
    end_date: date,
    compare_start_date: Optional[date] = None,
    compare_end_date: Optional[date] = None,
    crop_id: Optional[int] = None,
    include_expenses: bool = False,
    db: Session = Depends(get_db)
):
    """
    بيانات الرسم البياني المتقدم
    - يدعم نطاق تاريخ مخصص
    - يدعم المقارنة بفترة سابقة
    - يدعم فلترة المحصول
    - يدعم عرض المصاريف
    """
    return dashboard.get_advanced_chart_data(
        db, 
        start_date, 
        end_date, 
        compare_start_date, 
        compare_end_date, 
        crop_id, 
        include_expenses
    )

