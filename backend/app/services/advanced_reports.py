from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from datetime import date, timedelta
from typing import List, Dict, Any
from app.models import Sale, Purchase, Crop, Contact, Season, GeneralLedger, InventoryBatch

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
    return db.query(
        Contact.name,
        func.count(Sale.sale_id).label('transaction_count'),
        func.sum(Sale.total_sale_amount).label('total_sales')
    ).join(Sale, Sale.customer_id == Contact.contact_id)\
     .group_by(Contact.name)\
     .order_by(desc('total_sales'))\
     .limit(limit).all()

def get_season_comparison(db: Session):
    """مقارنة أداء المواسم"""
    # This assumes we have a way to link sales/purchases to seasons directly or via date
    # Simple approach: Group sales by year/month or if season_id exists on transactions using dates
    pass

def get_debt_report(db: Session):
    """
    تقرير المديونية (Aging Report)
    الديون المستحقة لنا (العملاء) والديون المستحقة علينا (الموردين)
    """
    # 1. Customers (Receivables)
    customers = db.query(
        Contact.name,
        Contact.phone,
        func.sum(Sale.total_sale_amount).label('total_sales'),
        func.sum(Sale.amount_received).label('total_received')
    ).join(Sale, Sale.customer_id == Contact.contact_id)\
     .filter(Contact.is_customer == True)\
     .group_by(Contact.contact_id).all()
     
    receivables = []
    for c in customers:
        balance = (c.total_sales or 0) - (c.total_received or 0)
        if balance > 1: # Only show debts > 1
             receivables.append({
                 "name": c.name,
                 "phone": c.phone,
                 "total_amount": c.total_sales,
                 "paid_amount": c.total_received,
                 "balance_due": balance
             })

    # 2. Suppliers (Payables)
    suppliers = db.query(
        Contact.name,
        Contact.phone,
        func.sum(Purchase.total_cost).label('total_purchases'),
        func.sum(Purchase.amount_paid).label('total_paid')
    ).join(Purchase, Purchase.supplier_id == Contact.contact_id)\
     .filter(Contact.is_supplier == True)\
     .group_by(Contact.contact_id).all()

    payables = []
    for s in suppliers:
        balance = (s.total_purchases or 0) - (s.total_paid or 0)
        if balance > 1:
            payables.append({
                "name": s.name,
                "phone": s.phone,
                "total_amount": s.total_purchases,
                "paid_amount": s.total_paid,
                "balance_due": balance
            })
            
    return {"receivables": receivables, "payables": payables}
