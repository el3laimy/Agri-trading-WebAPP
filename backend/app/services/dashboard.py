from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from app import models
from app.core.bootstrap import CASH_ACCOUNT_ID, ACCOUNTS_RECEIVABLE_ID, ACCOUNTS_PAYABLE_ID


from app.services.account_statement import get_all_customers_balances, get_all_suppliers_balances

def get_dashboard_kpis(db: Session):
    """الحصول على مؤشرات الأداء الرئيسية للوحة التحكم"""
    
    # الإيرادات الإجمالية
    total_revenue = db.query(func.sum(models.Sale.total_sale_amount)).scalar() or 0
    
    # تكلفة البضاعة المباعة
    total_cogs = db.query(func.sum(models.GeneralLedger.debit)).filter(
        models.GeneralLedger.account_id == 50101
    ).scalar() or 0
    
    # قيمة المخزون
    inventory_value = db.query(
        func.sum(models.Inventory.current_stock_kg * models.Inventory.average_cost_per_kg)
    ).scalar() or 0
    
    # عدد المبيعات
    sales_count = db.query(func.count(models.Sale.sale_id)).scalar() or 0
    
    # عدد المشتريات
    purchases_count = db.query(func.count(models.Purchase.purchase_id)).scalar() or 0
    
    # رصيد الخزينة
    cash_account = db.query(models.FinancialAccount).filter(
        models.FinancialAccount.account_id == CASH_ACCOUNT_ID
    ).first()
    cash_balance = cash_account.current_balance if cash_account else 0
    
    # إجمالي الذمم المدينة (ديون العملاء)
    # استخدام المنطق الموحد في account_statement لضمان تطابق الأرقام مع التقارير
    customers_balances = get_all_customers_balances(db)
    total_receivables = sum(c['balance'] for c in customers_balances if c['balance'] > 0)
    
    # إجمالي الذمم الدائنة (ديون الموردين)
    suppliers_balances = get_all_suppliers_balances(db)
    # الملاحظة: في get_all_suppliers_balances، الرصيد السالب يعني علينا له (دائن)
    # لكن الدالة تعيد balance_due كما هو.
    # في get_contact_summary للموردين: balance_due = -supplier_balance (سالب يعني علينا)
    # لذا نجمع القيم السالبة ونحولها لموجب للعرض كـ "مطلوبات"
    total_payables = sum(abs(s['balance']) for s in suppliers_balances if s['balance'] < 0)
    
    # إجمالي المصروفات
    total_expenses = db.query(func.sum(models.Expense.amount)).scalar() or 0
    
    # صافي الربح
    net_profit = total_revenue - total_cogs - total_expenses
    
    # هامش الربح الإجمالي
    gross_margin = ((total_revenue - total_cogs) / total_revenue * 100) if total_revenue > 0 else 0
    
    # إجمالي كمية المخزون
    total_stock_kg = db.query(func.sum(models.Inventory.current_stock_kg)).scalar() or 0
    
    # مبيعات اليوم
    today = date.today()
    today_sales = db.query(func.sum(models.Sale.total_sale_amount)).filter(
        models.Sale.sale_date == today
    ).scalar() or 0
    
    # تحصيلات اليوم
    today_collections = db.query(func.sum(models.GeneralLedger.debit)).filter(
        and_(
            models.GeneralLedger.account_id == CASH_ACCOUNT_ID,
            models.GeneralLedger.entry_date == today
        )
    ).scalar() or 0
    
    # عدد العملاء
    customers_count = db.query(func.count(models.Contact.contact_id)).filter(
        models.Contact.is_customer == True
    ).scalar() or 0
    
    # عدد الموردين
    suppliers_count = db.query(func.count(models.Contact.contact_id)).filter(
        models.Contact.is_supplier == True
    ).scalar() or 0
    
    # عدد المحاصيل
    crops_count = db.query(func.count(models.Crop.crop_id)).filter(
        models.Crop.is_active == True
    ).scalar() or 0
    
    return {
        # KPIs الرئيسية
        "total_revenue": round(total_revenue, 2),
        "gross_profit": round(total_revenue - total_cogs, 2),
        "net_profit": round(net_profit, 2),
        "gross_margin": round(gross_margin, 1),
        
        # المخزون
        "inventory_value": round(inventory_value, 2),
        "total_stock_kg": round(total_stock_kg, 2),
        
        # النقدية
        "cash_balance": round(cash_balance, 2),
        "total_receivables": round(total_receivables, 2),
        "total_payables": round(total_payables, 2),
        
        # المصروفات
        "total_expenses": round(total_expenses, 2),
        
        # الأعداد
        "sales_count": sales_count,
        "purchases_count": purchases_count,
        "customers_count": customers_count,
        "suppliers_count": suppliers_count,
        "crops_count": crops_count,
        
        # اليوم
        "today_sales": round(today_sales, 2),
        "today_collections": round(today_collections, 2),
    }


def get_dashboard_alerts(db: Session):
    """الحصول على التنبيهات الذكية"""
    alerts = []
    
    # تنبيه المخزون المنخفض
    low_stock_items = db.query(models.Inventory).filter(
        models.Inventory.current_stock_kg < 100
    ).all()
    
    for item in low_stock_items:
        if item.crop:
            alerts.append({
                "type": "warning",
                "title": "مخزون منخفض",
                "message": f"مخزون {item.crop.crop_name} أقل من 100 كجم ({item.current_stock_kg:.0f} كجم)",
                "icon": "bi-exclamation-triangle"
            })
    
    # تنبيه الديون المتأخرة
    overdue_receivables = db.query(
        func.sum(models.Sale.total_sale_amount - models.Sale.amount_received)
    ).filter(
        and_(
            models.Sale.payment_status != 'PAID',
            models.Sale.sale_date < date.today() - timedelta(days=30)
        )
    ).scalar() or 0
    
    if overdue_receivables > 0:
        alerts.append({
            "type": "danger",
            "title": "ديون متأخرة",
            "message": f"يوجد ديون متأخرة بقيمة {overdue_receivables:.2f} ج.م",
            "icon": "bi-exclamation-circle"
        })
    
    # تنبيه رصيد الخزينة
    cash_account = db.query(models.FinancialAccount).filter(
        models.FinancialAccount.account_id == CASH_ACCOUNT_ID
    ).first()
    
    if cash_account and cash_account.current_balance < 1000:
        alerts.append({
            "type": "warning",
            "title": "رصيد منخفض",
            "message": f"رصيد الخزينة منخفض: {cash_account.current_balance:.2f} ج.م",
            "icon": "bi-wallet"
        })
    
    # تنبيه إيجابي
    if not alerts:
        alerts.append({
            "type": "success",
            "title": "كل شيء على ما يرام",
            "message": "لا توجد تنبيهات عاجلة حالياً",
            "icon": "bi-check-circle"
        })
    
    return alerts


def get_sales_by_crop(db: Session):
    """الحصول على توزيع المبيعات حسب المحصول"""
    results = db.query(
        models.Crop.crop_name,
        func.sum(models.Sale.total_sale_amount).label('total')
    ).join(models.Sale, models.Sale.crop_id == models.Crop.crop_id)\
     .group_by(models.Crop.crop_name)\
     .all()
    
    return [{"crop": r.crop_name, "total": round(r.total or 0, 2)} for r in results]

