from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from app import models
from app.core.settings import get_setting


from app.services.account_statement import get_all_customers_balances, get_all_suppliers_balances

def get_dashboard_kpis(db: Session):
    """الحصول على مؤشرات الأداء الرئيسية للوحة التحكم"""
    
    # الإيرادات الإجمالية
    total_revenue = db.query(func.sum(models.Sale.total_sale_amount)).scalar() or 0
    
    # تكلفة البضاعة المباعة
    cogs_id = int(get_setting(db, "COGS_ACCOUNT_ID"))
    total_cogs = db.query(func.sum(models.GeneralLedger.debit)).filter(
        models.GeneralLedger.account_id == cogs_id
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
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))
    cash_account = db.query(models.FinancialAccount).filter(
        models.FinancialAccount.account_id == cash_id
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
            models.GeneralLedger.account_id == cash_id,
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
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))
    cash_account = db.query(models.FinancialAccount).filter(
        models.FinancialAccount.account_id == cash_id
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
    """الحصول على توزيع المبيعات حسب المحصول (القيمة والكمية)"""
    results = db.query(
        models.Crop.crop_name,
        func.sum(models.Sale.total_sale_amount).label('total_value'),
        func.sum(models.Sale.quantity_sold_kg).label('total_volume'),
        func.count(models.Sale.sale_id).label('transaction_count')
    ).join(models.Sale, models.Sale.crop_id == models.Crop.crop_id)\
     .group_by(models.Crop.crop_name)\
     .all()
    
    return [{
        "crop": r.crop_name, 
        "total": round(r.total_value or 0, 2), # Keep key 'total' for backward compatibility
        "value": round(r.total_value or 0, 2),
        "volume": round(r.total_volume or 0, 2),
        "count": r.transaction_count
    } for r in results]






def get_recent_activities(db: Session, limit: int = 10):
    """آخر العمليات (مبيعات ومشتريات) - بيانات حقيقية"""
    from datetime import datetime
    
    activities = []
    
    # جلب آخر المبيعات
    sales = db.query(models.Sale).order_by(models.Sale.sale_date.desc()).limit(limit).all()
    
    for sale in sales:
        activities.append({
            "id": f"sale_{sale.sale_id}",
            "type": "sale",
            "title": f"بيع {sale.crop.crop_name}" if sale.crop else "عملية بيع",
            "contact": sale.customer.name if sale.customer else "غير محدد",  # Sale uses 'customer' relationship
            "amount": str(sale.total_sale_amount or 0),
            "timestamp": sale.sale_date.isoformat() if sale.sale_date else datetime.now().isoformat(),
            "icon": "bi-cart-check"
        })
    
    # جلب آخر المشتريات
    purchases = db.query(models.Purchase).order_by(models.Purchase.purchase_date.desc()).limit(limit).all()
    
    for purchase in purchases:
        activities.append({
            "id": f"purchase_{purchase.purchase_id}",
            "type": "purchase",
            "title": f"شراء {purchase.crop.crop_name}" if purchase.crop else "عملية شراء",
            "contact": purchase.supplier.name if purchase.supplier else "غير محدد",  # Purchase uses 'supplier' relationship
            "amount": str(purchase.total_cost or 0),
            "timestamp": purchase.purchase_date.isoformat() if purchase.purchase_date else datetime.now().isoformat(),
            "icon": "bi-bag"
        })
    
    # ترتيب حسب التاريخ (الأحدث أولاً)
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return activities[:limit]



def get_current_season_summary(db: Session):
    """معلومات الموسم الحالي مع نسبة التقدم"""
    # Season uses 'status' column with values: 'UPCOMING', 'ACTIVE', 'COMPLETED'
    season = db.query(models.Season).filter(
        models.Season.status == 'ACTIVE'
    ).first()
    
    if not season:
        return None
    
    today = date.today()
    total_days = (season.end_date - season.start_date).days if season.end_date and season.start_date else 0
    elapsed_days = (today - season.start_date).days if season.start_date else 0
    progress = min(100, max(0, (elapsed_days / total_days) * 100)) if total_days > 0 else 0
    days_remaining = max(0, (season.end_date - today).days) if season.end_date else 0
    
    return {
        "id": season.season_id,
        "name": season.name,  # Column is 'name' not 'season_name'
        "start_date": season.start_date.isoformat() if season.start_date else None,
        "end_date": season.end_date.isoformat() if season.end_date else None,
        "progress": round(progress, 1),
        "days_remaining": days_remaining,
        "elapsed_days": elapsed_days,
        "total_days": total_days,
        "is_active": season.status == 'ACTIVE'
    }


def get_advanced_chart_data(
    db: Session,
    start_date: date,
    end_date: date,
    compare_start_date: date = None,
    compare_end_date: date = None,
    crop_id: int = None,
    include_expenses: bool = False
):
    """
    جلب بيانات الرسم البياني المتقدم مع إمكانية المقارنة والفلترة
    """
    
    # helper to fetch daily data
    def fetch_daily_data(s_date, e_date):
        # 1. Sales
        sales_query = db.query(
            models.Sale.sale_date.label('date'),
            func.sum(models.Sale.total_sale_amount).label('amount')
        ).filter(
            models.Sale.sale_date >= s_date,
            models.Sale.sale_date <= e_date
        )
        if crop_id:
            sales_query = sales_query.filter(models.Sale.crop_id == crop_id)
        
        sales_data = {r.date: str(r.amount or 0) for r in sales_query.group_by(models.Sale.sale_date).all()}

        # 2. Purchases
        purchases_query = db.query(
            models.Purchase.purchase_date.label('date'),
            func.sum(models.Purchase.total_cost).label('amount')
        ).filter(
            models.Purchase.purchase_date >= s_date,
            models.Purchase.purchase_date <= e_date
        )
        if crop_id:
            purchases_query = purchases_query.filter(models.Purchase.crop_id == crop_id)
            
        purchases_data = {r.date: str(r.amount or 0) for r in purchases_query.group_by(models.Purchase.purchase_date).all()}

        # 3. Expenses (Optional)
        expenses_data = {}
        if include_expenses:
            expenses_query = db.query(
                models.Expense.expense_date.label('date'),
                func.sum(models.Expense.amount).label('amount')
            ).filter(
                models.Expense.expense_date >= s_date,
                models.Expense.expense_date <= e_date
            )
            # expenses generally don't have crop_id, but some might if related to season
            # for now, we include general expenses implicitly or filter if schema supported it better
            expenses_data = {r.date: str(r.amount or 0) for r in expenses_query.group_by(models.Expense.expense_date).all()}
            
        return sales_data, purchases_data, expenses_data

    # Fetch Main Data
    sales_curr, purchases_curr, expenses_curr = fetch_daily_data(start_date, end_date)
    
    # Fetch Comparison Data (if requested)
    sales_comp, purchases_comp, expenses_comp = ({}, {}, {})
    if compare_start_date and compare_end_date:
        sales_comp, purchases_comp, expenses_comp = fetch_daily_data(compare_start_date, compare_end_date)

    # Generate Labels and Datasets
    labels = []
    datasets = {
        "sales": [], "purchases": [], "expenses": [],
        "sales_compare": [], "purchases_compare": [], "expenses_compare": []
    }
    
    delta_days = (end_date - start_date).days
    
    for i in range(delta_days + 1):
        # Current Period Date
        curr_day = start_date + timedelta(days=i)
        date_str = curr_day.isoformat()
        
        # Add to labels (formatting could be done in frontend, but ISO is safe)
        labels.append(date_str)
        
        # Add Current Data
        datasets["sales"].append(sales_curr.get(curr_day, 0))
        datasets["purchases"].append(purchases_curr.get(curr_day, 0))
        if include_expenses:
            datasets["expenses"].append(expenses_curr.get(curr_day, 0))
            
        # Add Comparison Data (Index matching)
        if compare_start_date:
            comp_day = compare_start_date + timedelta(days=i)
            # if comp_day exceeds compare_end_date, we fill 0 or stop? 
            # Usually strict comparison ranges match in length
            if comp_day <= compare_end_date:
                datasets["sales_compare"].append(sales_comp.get(comp_day, 0))
                datasets["purchases_compare"].append(purchases_comp.get(comp_day, 0))
                if include_expenses:
                    datasets["expenses_compare"].append(expenses_comp.get(comp_day, 0))
            else:
                datasets["sales_compare"].append(0)
                datasets["purchases_compare"].append(0)
                if include_expenses:
                    datasets["expenses_compare"].append(0)

    # Calculate Summaries
    summary = {
        "total_sales": sum(datasets["sales"]),
        "total_purchases": sum(datasets["purchases"]),
        "total_expenses": sum(datasets.get("expenses", [])),
    }
    
    if compare_start_date:
        total_sales_comp = sum(datasets["sales_compare"])
        # Calculate Percentage Change
        if total_sales_comp > 0:
            change = ((summary["total_sales"] - total_sales_comp) / total_sales_comp) * 100
            summary["sales_change"] = round(change, 1)
        else:
            summary["sales_change"] = 100 if summary["total_sales"] > 0 else 0

    return {
        "labels": labels,
        "datasets": datasets,
        "summary": summary
    }




