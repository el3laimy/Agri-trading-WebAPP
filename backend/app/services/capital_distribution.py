"""
Capital Distribution Service
خدمة تقرير توزيع رأس المال
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date
from typing import Optional

from app import models, schemas
from app.core.settings import get_setting
from app.services.reporting import generate_income_statement


def generate_capital_distribution(
    db: Session, 
    report_date: Optional[date] = None,
    start_date: Optional[date] = None
) -> schemas.CapitalDistributionReport:
    """
    تقرير توزيع رأس المال
    
    المعادلة: رأس المال + الأرباح + الديون علينا = النقدية + قيمة المخزون + الديون لنا
    
    الجانب الأيسر (مصادر التمويل):
    - رأس المال الأصلي (Owner's Equity)
    - صافي الربح (Net Profit)
    - الديون علينا / الالتزامات (Accounts Payable)
    
    الجانب الأيمن (استخدامات التمويل):
    - النقدية (Cash)
    - قيمة المخزون (Inventory)
    - الديون لنا / المستحقات (Accounts Receivable)
    """
    if not report_date:
        report_date = date.today()
    
    # ============ الجانب الأيمن (الأصول / استخدامات التمويل) ============
    
    # 1. النقدية (رصيد حساب الخزينة)
    cash_id = get_setting(db, "CASH_ACCOUNT_ID")
    if cash_id:
        cash_account = db.query(models.FinancialAccount).filter(
            models.FinancialAccount.account_id == int(cash_id)
        ).first()
        cash_in_hand = float(cash_account.current_balance) if cash_account else 0.0
    else:
        cash_in_hand = 0.0
    
    # 2. قيمة المخزون (من جدول المخزون)
    inventory_value = db.query(
        func.sum(models.Inventory.current_stock_kg * models.Inventory.average_cost_per_kg)
    ).scalar() or 0.0
    inventory_value = float(inventory_value)
    
    # 3. الديون لنا (من العملاء) - نفس منطق تقرير الديون
    # المبيعات - المرتجعات - المدفوعات
    total_sales = db.query(func.sum(models.Sale.total_sale_amount)).scalar() or 0.0
    total_sales = float(total_sales)
    
    # مرتجعات المبيعات
    sale_returns = db.query(func.sum(models.SaleReturn.refund_amount)).scalar() or 0.0
    sale_returns = float(sale_returns)
    
    # المدفوعات المستلمة من العملاء (صافي التدفق النقدي الوارد)
    # نعتمد على حركة الخزينة: دخلت (+) - خرجت (-)
    c_id_val = int(cash_id) if cash_id else 0
    customer_payments = db.query(
        func.sum(
            case(
                (models.Payment.debit_account_id == c_id_val, models.Payment.amount),   # استلام (يقلل الدين)
                (models.Payment.credit_account_id == c_id_val, -models.Payment.amount), # دفع (يزيد الدين)
                else_=0
            )
        )
    ).join(
        models.Contact, models.Payment.contact_id == models.Contact.contact_id
    ).filter(models.Contact.is_customer == True).scalar() or 0.0
    customer_payments = float(customer_payments)
    
    accounts_receivable = total_sales - sale_returns - customer_payments
    
    # إجمالي الأصول
    total_assets = cash_in_hand + inventory_value + accounts_receivable
    
    # ============ الجانب الأيسر (مصادر التمويل) ============
    
    # 1. رأس المال الأصلي
    equity_id = get_setting(db, "OWNER_EQUITY_ID")
    if equity_id:
        equity_account = db.query(models.FinancialAccount).filter(
            models.FinancialAccount.account_id == int(equity_id)
        ).first()
        owner_capital = abs(float(equity_account.current_balance)) if equity_account else 0.0
    else:
        owner_capital = 0.0
    
    # 2. صافي الربح (من قائمة الدخل - من البداية للتوازن)
    try:
        all_time_start = date(2000, 1, 1)
        income_statement = generate_income_statement(db, all_time_start, report_date)
        net_profit = float(income_statement.get('net_income', 0.0))
    except Exception:
        net_profit = 0.0
    
    # 3. الديون علينا (للموردين) - نفس منطق تقرير الديون
    # المشتريات - المرتجعات - المدفوعات
    total_purchases = db.query(func.sum(models.Purchase.total_cost)).scalar() or 0.0
    total_purchases = float(total_purchases)
    
    # مرتجعات المشتريات
    purchase_returns = db.query(func.sum(models.PurchaseReturn.returned_cost)).scalar() or 0.0
    purchase_returns = float(purchase_returns)
    
    # المدفوعات للموردين (صافي التدفق النقدي الصادر)
    # نعتمد على حركة الخزينة: خرجت (+) - دخلت (-)
    supplier_payments = db.query(
        func.sum(
            case(
                (models.Payment.credit_account_id == c_id_val, models.Payment.amount),  # دفع (يقلل الدين)
                (models.Payment.debit_account_id == c_id_val, -models.Payment.amount),  # استرداد (يزيد الدين)
                else_=0
            )
        )
    ).join(
        models.Contact, models.Payment.contact_id == models.Contact.contact_id
    ).filter(models.Contact.is_supplier == True).scalar() or 0.0
    supplier_payments = float(supplier_payments)
    
    accounts_payable = total_purchases - purchase_returns - supplier_payments
    
    # إجمالي مصادر التمويل
    total_liabilities_and_equity = owner_capital + net_profit + accounts_payable
    
    # ============ التحقق من التوازن ============
    difference = total_assets - total_liabilities_and_equity
    is_balanced = abs(difference) < 0.01  # هامش خطأ صغير
    
    return schemas.CapitalDistributionReport(
        report_date=report_date,
        # الأصول
        cash_in_hand=round(cash_in_hand, 2),
        inventory_value=round(inventory_value, 2),
        accounts_receivable=round(accounts_receivable, 2),
        total_assets=round(total_assets, 2),
        # مصادر التمويل
        owner_capital=round(owner_capital, 2),
        net_profit=round(net_profit, 2),
        accounts_payable=round(accounts_payable, 2),
        total_liabilities_and_equity=round(total_liabilities_and_equity, 2),
        # التوازن
        is_balanced=is_balanced,
        difference=round(difference, 2)
    )


def get_capital_breakdown_by_category(db: Session) -> dict:
    """
    تفصيل توزيع رأس المال حسب الفئات
    """
    report = generate_capital_distribution(db)
    
    total = report.total_assets if report.total_assets > 0 else 1  # تجنب القسمة على صفر
    
    return {
        'categories': [
            {
                'name': 'النقدية',
                'name_en': 'Cash',
                'value': report.cash_in_hand,
                'percentage': round((report.cash_in_hand / total) * 100, 1),
                'color': '#28A745'
            },
            {
                'name': 'المخزون',
                'name_en': 'Inventory',
                'value': report.inventory_value,
                'percentage': round((report.inventory_value / total) * 100, 1),
                'color': '#FFC107'
            },
            {
                'name': 'ديون العملاء',
                'name_en': 'Receivables',
                'value': report.accounts_receivable,
                'percentage': round((report.accounts_receivable / total) * 100, 1),
                'color': '#17A2B8'
            }
        ],
        'total_assets': report.total_assets,
        'sources': [
            {
                'name': 'رأس المال',
                'value': report.owner_capital
            },
            {
                'name': 'الأرباح',
                'value': report.net_profit
            },
            {
                'name': 'ديون الموردين',
                'value': report.accounts_payable
            }
        ],
        'total_sources': report.total_liabilities_and_equity,
        'is_balanced': report.is_balanced,
        'difference': report.difference
    }
