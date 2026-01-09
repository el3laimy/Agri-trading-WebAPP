from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from datetime import date, timedelta
from typing import List, Dict, Any
from app.models import Sale, Purchase, Crop, Contact, Season, GeneralLedger, InventoryBatch, Expense
from sqlalchemy import extract

def get_crop_profitability(db: Session, season_id: int):
    """
    تقرير ربحية المحاصيل لموسم محدد
    يحسب: الإيرادات، التكاليف (الشراء + مصروفات مباشرة)، والربح الصافي لكل محصول
    """
    # 1. المبيعات (Revenue)
    sales_query = db.query(
        Crop.crop_name,
        func.sum(Sale.total_sale_amount).label('total_revenue'),
        func.sum(Sale.quantity_sold_kg).label('total_sold_kg')
    ).join(Sale.crop).filter(
        Sale.season_id == season_id if hasattr(Sale, 'season_id') else True # Fallback if season_id not directly on Sale
    ).group_by(Crop.crop_name).all()

    # 2. المشتريات (Cost of Goods Sold - approximation)
    # We can approximate cost based on purchases for that crop
    purchases_query = db.query(
        Crop.crop_name,
        func.sum(Purchase.total_cost).label('total_purchase_cost'),
        func.sum(Purchase.quantity_kg).label('total_purchased_kg')
    ).join(Purchase.crop).filter(
        Purchase.season_id == season_id if hasattr(Purchase, 'season_id') else True
    ).group_by(Crop.crop_name).all()
    
    # Merge data
    report_data = {}
    
    for s in sales_query:
        report_data[s.crop_name] = {
            "revenue": s.total_revenue or 0,
            "sold_kg": s.total_sold_kg or 0,
            "cost": 0,
            "purchased_kg": 0,
            "profit": 0,
            "margin": 0
        }
        
    for p in purchases_query:
        if p.crop_name not in report_data:
            report_data[p.crop_name] = {
                "revenue": 0,
                "sold_kg": 0,
                "cost": 0,
                "purchased_kg": 0,
                "profit": 0,
                "margin": 0
            }
        report_data[p.crop_name]["cost"] = p.total_purchase_cost or 0
        report_data[p.crop_name]["purchased_kg"] = p.total_purchased_kg or 0

    # Calculate profit
    results = []
    for crop_name, data in report_data.items():
        data["profit"] = data["revenue"] - data["cost"]
        if data["revenue"] > 0:
            data["margin"] = (data["profit"] / data["revenue"]) * 100
        results.append({"crop_name": crop_name, **data})
        
    return sorted(results, key=lambda x: x['profit'], reverse=True)

def get_top_customers(db: Session, limit: int = 10):
    """تحليل أفضل العملاء من حيث حجم المبيعات"""
    results = db.query(
        Contact.name,
        func.count(Sale.sale_id).label('transaction_count'),
        func.sum(Sale.total_sale_amount).label('total_sales')
    ).join(Sale, Sale.customer_id == Contact.contact_id)\
     .group_by(Contact.name)\
     .order_by(desc('total_sales'))\
     .limit(limit).all()
     
    return [{"name": r.name, "transaction_count": r.transaction_count, "total_sales": float(r.total_sales or 0)} for r in results]

def get_season_comparison(db: Session):
    """مقارنة أداء المواسم"""
    # This assumes we have a way to link sales/purchases to seasons directly or via date
    # Simple approach: Group sales by year/month or if season_id exists on transactions using dates
    pass

def get_debt_report(db: Session):
    """
    تقرير المديونية (Statement of Detbs)
    يحسب الرصيد الفعلي: (المبيعات - المرتجعات - كل المدفوعات بما فيها العامة)
    """
    from app.models import SaleReturn, PurchaseReturn, Payment

    # 1. Customers (Receivables)
    # Total Sales per Customer
    customers_sales = db.query(
        Sale.customer_id.label('contact_id'),
        func.sum(Sale.total_sale_amount).label('total_sales')
    ).group_by(Sale.customer_id).subquery()
    
    # Total Returns per Customer
    customers_returns = db.query(
        Sale.customer_id.label('contact_id'),
        func.sum(SaleReturn.refund_amount).label('total_returns')
    ).join(Sale, SaleReturn.sale_id == Sale.sale_id)\
     .group_by(Sale.customer_id).subquery()
    
    # Total Payments per Customer (Linked + General)
    customers_payments = db.query(
        Payment.contact_id,
        func.sum(Payment.amount).label('total_paid')
    ).join(Contact, Payment.contact_id == Contact.contact_id)\
     .filter(Contact.is_customer == True)\
     .group_by(Payment.contact_id).subquery()
     
    # Combine results
    customers = db.query(
        Contact.contact_id,
        Contact.name,
        Contact.phone,
        func.coalesce(customers_sales.c.total_sales, 0).label('total_sales'),
        func.coalesce(customers_returns.c.total_returns, 0).label('total_returns'),
        func.coalesce(customers_payments.c.total_paid, 0).label('total_paid')
    ).outerjoin(customers_sales, Contact.contact_id == customers_sales.c.contact_id)\
     .outerjoin(customers_returns, Contact.contact_id == customers_returns.c.contact_id)\
     .outerjoin(customers_payments, Contact.contact_id == customers_payments.c.contact_id)\
     .filter(Contact.is_customer == True).all()

    receivables = []
    for c in customers:
        # Balance = Sales - Returns - Payments
        net_sales = c.total_sales - c.total_returns
        balance = net_sales - c.total_paid
        
        # Only show if there is significant balance (> 1 or < -1)
        if abs(balance) > 1:
             receivables.append({
                 "contact_id": c.contact_id,
                 "name": c.name,
                 "phone": c.phone,
                 "total_amount": net_sales,
                 "paid_amount": c.total_paid,
                 "balance_due": balance
             })

    # 2. Suppliers (Payables)
    # Total Purchases
    suppliers_purchases = db.query(
        Purchase.supplier_id.label('contact_id'),
        func.sum(Purchase.total_cost).label('total_purchases')
    ).group_by(Purchase.supplier_id).subquery()

    # Total Purchase Returns
    suppliers_returns = db.query(
        Purchase.supplier_id.label('contact_id'),
        func.sum(PurchaseReturn.returned_cost).label('total_returns')
    ).join(Purchase, PurchaseReturn.purchase_id == Purchase.purchase_id)\
     .group_by(Purchase.supplier_id).subquery()

    # Total Payments (Paid to Supplier)
    suppliers_payments = db.query(
        Payment.contact_id,
        func.sum(Payment.amount).label('total_paid')
    ).join(Contact, Payment.contact_id == Contact.contact_id)\
     .filter(Contact.is_supplier == True)\
     .group_by(Payment.contact_id).subquery()

    suppliers = db.query(
        Contact.contact_id,
        Contact.name,
        Contact.phone,
        func.coalesce(suppliers_purchases.c.total_purchases, 0).label('total_purchases'),
        func.coalesce(suppliers_returns.c.total_returns, 0).label('total_returns'),
        func.coalesce(suppliers_payments.c.total_paid, 0).label('total_paid')
    ).outerjoin(suppliers_purchases, Contact.contact_id == suppliers_purchases.c.contact_id)\
     .outerjoin(suppliers_returns, Contact.contact_id == suppliers_returns.c.contact_id)\
     .outerjoin(suppliers_payments, Contact.contact_id == suppliers_payments.c.contact_id)\
     .filter(Contact.is_supplier == True).all()

    payables = []
    for s in suppliers:
        net_purchases = s.total_purchases - s.total_returns
        balance = net_purchases - s.total_paid
        
        if abs(balance) > 1:
            payables.append({
                "contact_id": s.contact_id,
                "name": s.name,
                "phone": s.phone,
                "total_amount": net_purchases,
                "paid_amount": s.total_paid,
                "balance_due": balance
            })
            
    return {"receivables": receivables, "payables": payables}

def get_expenses_stats(db: Session):
    """
    إحصائيات المصروفات للوحة التحكم
    """
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    # Queries
    total_today = db.query(func.sum(Expense.amount)).filter(Expense.expense_date == today).scalar() or 0
    total_week = db.query(func.sum(Expense.amount)).filter(Expense.expense_date >= start_of_week).scalar() or 0
    total_month = db.query(func.sum(Expense.amount)).filter(Expense.expense_date >= start_of_month).scalar() or 0
    total_all_time = db.query(func.sum(Expense.amount)).scalar() or 0

    # Category Distribution (Group by Debit Account Name)
    # Assuming Expense has relationship to debit_account
    from app.models import FinancialAccount
    distribution_query = db.query(
        FinancialAccount.account_name.label('category'),
        func.sum(Expense.amount).label('total')
    ).join(Expense, Expense.debit_account_id == FinancialAccount.account_id)\
     .group_by(FinancialAccount.account_name)\
     .order_by(desc('total'))\
     .all()

    distribution = [{"category": row.category, "amount": row.total} for row in distribution_query]

    return {
        "total_today": total_today,
        "total_week": total_week,
        "total_month": total_month,
        "total_all_time": total_all_time,
        "distribution": distribution
    }
