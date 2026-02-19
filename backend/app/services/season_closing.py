"""
خدمة إغلاق الموسم (Season Closing Service)
ترحيل الأرباح وإغلاق حسابات الإيرادات والمصروفات
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
from datetime import date

from app.models import Season, GeneralLedger, FinancialAccount, Sale, Purchase, Expense
from app.services.accounting_engine import AccountingEngine


def close_season(db: Session, season_id: int) -> dict:
    """
    إغلاق الموسم وترحيل الأرباح
    
    العملية:
    1. التحقق من أن الموسم نشط
    2. حساب صافي الإيرادات للموسم
    3. حساب إجمالي المصروفات للموسم
    4. حساب صافي الربح أو الخسارة
    5. إنشاء قيد ترحيل الأرباح
    6. تغيير حالة الموسم إلى "COMPLETED"
    
    ملاحظة مهمة:
    - الأرصدة (ديون الموردين/العملاء، الخزينة، المخزون) لا تتأثر
    - فقط يتم ترحيل صافي الربح لحساب الأرباح المرحلة
    """
    
    # 1. التحقق من الموسم
    season = db.query(Season).filter(Season.season_id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="الموسم غير موجود")
    
    if season.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="الموسم مغلق بالفعل")
    
    # 2. حساب إجمالي المبيعات للموسم
    total_sales = db.query(Sale).filter(Sale.season_id == season_id).all()
    total_revenue = sum(Decimal(str(s.total_sale_amount)) for s in total_sales)
    
    # 3. حساب تكلفة البضاعة المباعة (COGS)
    # نحصل عليها من القيود المحاسبية
    cogs_entries = db.query(GeneralLedger).filter(
        GeneralLedger.source_type == "SALE",
        GeneralLedger.description.like("%تكلفة البضاعة المباعة%")
    ).all()
    total_cogs = sum(Decimal(str(e.debit)) for e in cogs_entries)
    
    # 4. حساب إجمالي المصروفات للموسم
    total_expenses = db.query(Expense).filter(Expense.season_id == season_id).all()
    total_expense_amount = sum(Decimal(str(e.amount)) for e in total_expenses)
    
    # 5. حساب إجمالي المشتريات للموسم
    total_purchases = db.query(Purchase).filter(Purchase.season_id == season_id).all()
    total_purchase_amount = sum(Decimal(str(p.total_cost)) for p in total_purchases)
    
    # 6. حساب صافي الربح
    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - total_expense_amount
    
    # 7. إنشاء قيد الإغلاق
    # البحث عن حساب الأرباح المرحلة أو إنشاؤه
    retained_earnings = db.query(FinancialAccount).filter(
        FinancialAccount.account_name == "أرباح مرحلة"
    ).first()
    
    if not retained_earnings:
        retained_earnings = FinancialAccount(
            account_name="أرباح مرحلة",
            account_type="EQUITY",
            initial_balance=Decimal(0)
        )
        db.add(retained_earnings)
        db.flush()
    
    # 8. قيد ترحيل الأرباح
    if net_profit != 0:
        closing_entry = GeneralLedger(
            entry_date=date.today(),
            account_id=retained_earnings.account_id,
            debit=Decimal(0) if net_profit > 0 else abs(net_profit),
            credit=net_profit if net_profit > 0 else Decimal(0),
            description=f"ترحيل أرباح موسم: {season.name}",
            source_type="SEASON_CLOSING",
            source_id=season_id
        )
        db.add(closing_entry)
    
    # 9. تغيير حالة الموسم
    season.status = "COMPLETED"
    
    db.commit()
    
    return {
        "season_id": season_id,
        "season_name": season.name,
        "status": "COMPLETED",
        "summary": {
            "total_revenue": str(total_revenue),
            "total_cogs": str(total_cogs),
            "gross_profit": str(gross_profit),
            "total_expenses": str(total_expense_amount),
            "net_profit": str(net_profit),
            "total_purchases": str(total_purchase_amount)
        },
        "message": "تم إغلاق الموسم بنجاح وترحيل الأرباح"
    }


def get_season_summary(db: Session, season_id: int) -> dict:
    """
    ملخص الموسم (قبل الإغلاق)
    """
    season = db.query(Season).filter(Season.season_id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="الموسم غير موجود")
    
    # حساب الإحصائيات
    total_sales = db.query(Sale).filter(Sale.season_id == season_id).all()
    total_revenue = sum(Decimal(str(s.total_sale_amount)) for s in total_sales)
    
    total_purchases = db.query(Purchase).filter(Purchase.season_id == season_id).all()
    total_purchase_amount = sum(Decimal(str(p.total_cost)) for p in total_purchases)
    
    total_expenses = db.query(Expense).filter(Expense.season_id == season_id).all()
    total_expense_amount = sum(Decimal(str(e.amount)) for e in total_expenses)
    
    return {
        "season_id": season_id,
        "season_name": season.name,
        "status": season.status,
        "start_date": str(season.start_date),
        "end_date": str(season.end_date),
        "statistics": {
            "sales_count": len(total_sales),
            "total_revenue": str(total_revenue),
            "purchases_count": len(total_purchases),
            "total_purchases": str(total_purchase_amount),
            "expenses_count": len(total_expenses),
            "total_expenses": str(total_expense_amount),
            "estimated_profit": str(total_revenue - total_purchase_amount - total_expense_amount)
        }
    }
