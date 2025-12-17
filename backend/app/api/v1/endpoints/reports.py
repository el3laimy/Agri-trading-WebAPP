from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Any, Dict, Optional
from datetime import date

from app.services import reporting, dashboard
from app.services import capital_distribution
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
