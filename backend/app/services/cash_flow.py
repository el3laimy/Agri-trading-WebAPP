"""
خدمة تقرير التدفقات النقدية
Cash Flow Statement Service
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from typing import Optional

from app import models
from app.core.settings import get_setting


def get_cash_flow_report(db: Session, start_date: date, end_date: date):
    """
    إنشاء تقرير التدفقات النقدية
    يُظهر مصادر واستخدامات النقدية خلال فترة محددة
    """
    
    # 1. رصيد البداية
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))

    opening_balance = db.query(
        func.sum(models.GeneralLedger.debit - models.GeneralLedger.credit)
    ).filter(
        models.GeneralLedger.account_id == cash_id,
        models.GeneralLedger.entry_date < start_date
    ).scalar() or 0.0
    
    # 2. التدفقات النقدية من الأنشطة التشغيلية
    
    # 2.1 تحصيلات من العملاء
    customer_collections = db.query(
        func.sum(models.GeneralLedger.debit)
    ).filter(
        models.GeneralLedger.account_id == cash_id,
        models.GeneralLedger.entry_date.between(start_date, end_date),
        models.GeneralLedger.source_type.in_(['SALE', 'SALE_PAYMENT', 'CASH_RECEIPT'])
    ).scalar() or 0.0
    
    # 2.2 مدفوعات للموردين
    supplier_payments = db.query(
        func.sum(models.GeneralLedger.credit)
    ).filter(
        models.GeneralLedger.account_id == cash_id,
        models.GeneralLedger.entry_date.between(start_date, end_date),
        models.GeneralLedger.source_type.in_(['PURCHASE', 'PURCHASE_PAYMENT', 'CASH_PAYMENT'])
    ).scalar() or 0.0
    
    # 2.3 مدفوعات مصروفات تشغيلية
    operating_expenses = db.query(
        func.sum(models.GeneralLedger.credit)
    ).filter(
        models.GeneralLedger.account_id == cash_id,
        models.GeneralLedger.entry_date.between(start_date, end_date),
        models.GeneralLedger.source_type.in_(['EXPENSE', 'QUICK_EXPENSE'])
    ).scalar() or 0.0
    
    # صافي التدفق من الأنشطة التشغيلية
    operating_cash_flow = customer_collections - supplier_payments - operating_expenses
    
    # 3. التدفقات النقدية من الأنشطة الاستثمارية (حالياً فارغة)
    investing_inflow = 0.0
    investing_outflow = 0.0
    investing_cash_flow = investing_inflow - investing_outflow
    
    # 4. التدفقات النقدية من الأنشطة التمويلية
    
    # 4.1 مساهمات رأس المال
    capital_contributions = db.query(
        func.sum(models.CapitalAllocation.amount)
    ).filter(
        models.CapitalAllocation.allocation_date.between(start_date, end_date),
        models.CapitalAllocation.allocation_type == 'CONTRIBUTION'
    ).scalar() or 0.0
    
    # 4.2 سحوبات رأس المال
    capital_withdrawals = db.query(
        func.sum(models.CapitalAllocation.amount)
    ).filter(
        models.CapitalAllocation.allocation_date.between(start_date, end_date),
        models.CapitalAllocation.allocation_type == 'WITHDRAWAL'
    ).scalar() or 0.0
    
    financing_cash_flow = capital_contributions - capital_withdrawals
    
    # 5. صافي التغير في النقدية
    net_cash_change = operating_cash_flow + investing_cash_flow + financing_cash_flow
    
    # 6. رصيد الإغلاق
    closing_balance = opening_balance + net_cash_change
    
    # 7. الرصيد الفعلي للتحقق
    actual_balance = db.query(
        func.sum(models.GeneralLedger.debit - models.GeneralLedger.credit)
    ).filter(
        models.GeneralLedger.account_id == cash_id,
        models.GeneralLedger.entry_date <= end_date
    ).scalar() or 0.0
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "opening_balance": round(opening_balance, 2),
        
        "operating_activities": {
            "customer_collections": round(customer_collections, 2),
            "supplier_payments": round(supplier_payments, 2),
            "operating_expenses": round(operating_expenses, 2),
            "net_operating_cash_flow": round(operating_cash_flow, 2)
        },
        
        "investing_activities": {
            "inflows": round(investing_inflow, 2),
            "outflows": round(investing_outflow, 2),
            "net_investing_cash_flow": round(investing_cash_flow, 2)
        },
        
        "financing_activities": {
            "capital_contributions": round(capital_contributions, 2),
            "capital_withdrawals": round(capital_withdrawals, 2),
            "net_financing_cash_flow": round(financing_cash_flow, 2)
        },
        
        "net_cash_change": round(net_cash_change, 2),
        "closing_balance": round(closing_balance, 2),
        "actual_balance": round(actual_balance, 2),
        "is_balanced": abs(closing_balance - actual_balance) < 0.01
    }


def get_cash_flow_details(db: Session, start_date: date, end_date: date, category: str = None):
    """
    """
    cash_id = int(get_setting(db, "CASH_ACCOUNT_ID"))

    query = db.query(models.GeneralLedger).filter(
        models.GeneralLedger.account_id == cash_id,
        models.GeneralLedger.entry_date.between(start_date, end_date)
    )
    
    if category == "operating":
        query = query.filter(
            models.GeneralLedger.source_type.in_([
                'SALE', 'SALE_PAYMENT', 'CASH_RECEIPT',
                'PURCHASE', 'PURCHASE_PAYMENT', 'CASH_PAYMENT',
                'EXPENSE', 'QUICK_EXPENSE'
            ])
        )
    elif category == "financing":
        query = query.filter(
            models.GeneralLedger.source_type.in_(['CAPITAL_CONTRIBUTION', 'CAPITAL_WITHDRAWAL'])
        )
    
    entries = query.order_by(models.GeneralLedger.entry_date.desc()).all()
    
    result = []
    for entry in entries:
        flow_type = "IN" if entry.debit > 0 else "OUT"
        amount = entry.debit if entry.debit > 0 else entry.credit
        
        result.append({
            "date": entry.entry_date.isoformat(),
            "description": entry.description,
            "source_type": entry.source_type,
            "flow_type": flow_type,
            "amount": round(amount, 2)
        })
    
    return result
