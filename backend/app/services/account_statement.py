"""
Account Statement Service
خدمة كشوفات حسابات العملاء والموردين
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import date
from typing import Optional, List

from app import models, schemas
from app.core.settings import get_setting
from decimal import Decimal


def get_contact_summary(db: Session, contact_id: int) -> schemas.ContactSummary:
    """
    الحصول على ملخص مالي لجهة التعامل
    يعتمد الآن على منطق موحد: (المدين - الدائن)
    الرصيد المستحق (لنا) = (المبيعات + المدفوعات له) - (المشتريات + المقبوضات منه)
    """
    contact = db.query(models.Contact).filter(models.Contact.contact_id == contact_id).first()
    if not contact:
        raise ValueError(f"Contact with id {contact_id} not found")
    
    # تحديد نوع جهة التعامل
    if contact.is_customer and contact.is_supplier:
        contact_type = "BOTH"
    elif contact.is_customer:
        contact_type = "CUSTOMER"
    else:
        contact_type = "SUPPLIER"
    
    # ---------------------------------------------------------
    # 1. الجانب المدين (لنا) - Increases Receivable
    # ---------------------------------------------------------
    
    # أ) المبيعات الآجلة
    total_sales = db.query(func.sum(models.Sale.total_sale_amount)).filter(
        models.Sale.customer_id == contact_id
    ).scalar() or Decimal(0)
    
    # ب) الأموال التي دفعناها للطرف الآخر (Cash Out)
    # تشمل: دفعات لمورد (Purchase Payment) أو صرف نقدية لعميل (General Payment)
    # الشرط: credit_account_id == CASH (خرجت من عندنا)
    cash_paid_out = db.query(func.sum(models.Payment.amount)).filter(
        and_(
            models.Payment.contact_id == contact_id,
            models.Payment.credit_account_id == int(get_setting(db, "CASH_ACCOUNT_ID"))
        )
    ).scalar() or Decimal(0)

    total_debit = total_sales + cash_paid_out

    # ---------------------------------------------------------
    # 2. الجانب الدائن (علينا) - Increases Payable / Decreases Receivable
    # ---------------------------------------------------------

    # أ) المشتريات الآجلة
    total_purchases = db.query(func.sum(models.Purchase.total_cost)).filter(
        models.Purchase.supplier_id == contact_id
    ).scalar() or Decimal(0)

    # ب) الأموال التي استلمناها من الطرف الآخر (Cash In)
    # تشمل: تحصيل من عميل (Sale Payment) أو استلام نقدية من مورد (General Receipt)
    # الشرط: debit_account_id == CASH (دخلت عندنا)
    cash_received_in = db.query(func.sum(models.Payment.amount)).filter(
        and_(
            models.Payment.contact_id == contact_id,
            models.Payment.debit_account_id == int(get_setting(db, "CASH_ACCOUNT_ID"))
        )
    ).scalar() or Decimal(0)

    total_credit = total_purchases + cash_received_in

    # ---------------------------------------------------------
    # 3. حساب الرصيد
    # ---------------------------------------------------------
    
    # موجب (+) = لنا (مدين)
    # سالب (-) = علينا (دائن)
    balance_due = total_debit - total_credit
    
    # توحيد المسميات للعرض في الواجهة الأمامية
    # total_paid: ما دفعناه للطرف الآخر (سواء سداد مشتريات أو إقراض)
    # total_received: ما قبضناه من الطرف الآخر (سواء تحصيل مبيعات أو اقتراض)
    
    return schemas.ContactSummary(
        contact_id=contact_id,
        contact_name=contact.name,
        contact_type=contact_type,
        total_sales=total_sales,
        total_purchases=total_purchases,
        total_received=cash_received_in, # المدفوعات الواردة (Receipts)
        total_paid=cash_paid_out,        # المدفوعات الصادرة (Payments)
        balance_due=balance_due
    )


def get_account_statement(
    db: Session, 
    contact_id: int, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> schemas.AccountStatement:
    """
    الحصول على كشف حساب تفصيلي لجهة التعامل
    """
    contact = db.query(models.Contact).filter(models.Contact.contact_id == contact_id).first()
    if not contact:
        raise ValueError(f"Contact with id {contact_id} not found")
    
    # التواريخ الافتراضية
    if not end_date:
        end_date = date.today()
    if not start_date:
        # افتراضياً أول السنة
        start_date = date(end_date.year, 1, 1)
    
    entries: List[schemas.AccountStatementEntry] = []
    running_balance = 0.0
    
    # حساب الرصيد الافتتاحي (قبل تاريخ البداية)
    opening_balance = _calculate_opening_balance(db, contact_id, start_date)
    running_balance = opening_balance
    
    # جمع جميع المعاملات
    transactions = []
    
    # المبيعات (للعملاء)
    if contact.is_customer:
        sales = db.query(models.Sale).filter(
            and_(
                models.Sale.customer_id == contact_id,
                models.Sale.sale_date >= start_date,
                models.Sale.sale_date <= end_date
            )
        ).all()
        
        for sale in sales:
            crop_name = sale.crop.crop_name if sale.crop else "محصول"
            # حساب الكمية بالوحدة الأصلية
            original_unit = sale.selling_pricing_unit or 'kg'
            factor = sale.specific_selling_factor or 1.0
            original_qty = (sale.quantity_sold_kg or 0) / factor
            original_price = (sale.selling_unit_price or 0) * factor
            
            transactions.append({
                'date': sale.sale_date,
                'description': f"صادر له بضاعة - {crop_name}",
                'reference_type': 'SALE',
                'reference_id': sale.sale_id,
                'debit': sale.total_sale_amount,  # مدين = العميل مدين لنا
                'credit': 0.0,
                'crop_name': crop_name,
                'quantity': original_qty,
                'unit_price': original_price,
                'unit': original_unit
            })
    
    # المشتريات (للموردين)
    if contact.is_supplier:
        purchases = db.query(models.Purchase).filter(
            and_(
                models.Purchase.supplier_id == contact_id,
                models.Purchase.purchase_date >= start_date,
                models.Purchase.purchase_date <= end_date
            )
        ).all()
        
        for purchase in purchases:
            crop_name = purchase.crop.crop_name if purchase.crop else "محصول"
            # حساب الكمية بالوحدة الأصلية
            original_unit = purchase.purchasing_pricing_unit or 'kg'
            factor = purchase.conversion_factor or 1.0
            original_qty = (purchase.quantity_kg or 0) / factor
            original_price = (purchase.unit_price or 0) * factor
            
            transactions.append({
                'date': purchase.purchase_date,
                'description': f"وارد منه بضاعة - {crop_name}",
                'reference_type': 'PURCHASE',
                'reference_id': purchase.purchase_id,
                'debit': 0.0,
                'credit': purchase.total_cost,  # دائن = نحن مدينون للمورد
                'crop_name': crop_name,
                'quantity': original_qty,
                'unit_price': original_price,
                'unit': original_unit
            })
    
    # المدفوعات
    payments = db.query(models.Payment).filter(
        and_(
            models.Payment.contact_id == contact_id,
            models.Payment.payment_date >= start_date,
            models.Payment.payment_date <= end_date
        )
    ).all()
    
    for payment in payments:
        if payment.transaction_type == 'SALE':
            # تحصيل من عميل (مربوط بفاتورة)
            transactions.append({
                'date': payment.payment_date,
                'description': f"واصل منه نقدية - {payment.payment_method}",
                'reference_type': 'PAYMENT',
                'reference_id': payment.payment_id,
                'debit': 0.0,
                'credit': payment.amount,  # دائن = قلل دين العميل
                'crop_name': None,
                'quantity': None,
                'unit_price': None,
                'unit': None
            })
        elif payment.transaction_type == 'PURCHASE':
            # دفع لمورد (مربوط بفاتورة)
            transactions.append({
                'date': payment.payment_date,
                'description': f"صادر له نقدية - {payment.payment_method}",
                'reference_type': 'PAYMENT',
                'reference_id': payment.payment_id,
                'debit': payment.amount,  # مدين = قلل دينا للمورد
                'credit': 0.0,
                'crop_name': None,
                'quantity': None,
                'unit_price': None,
                'unit': None
            })
        elif payment.transaction_type == 'GENERAL':
            # قبض/صرف عام على الحساب (من الخزينة)
            # تحديد اتجاه الحركة بناءً على نوع جهة الاتصال
            if contact.is_customer:
                # قبض من عميل - دائن
                transactions.append({
                    'date': payment.payment_date,
                    'description': f"واصل منه نقدية (عام) - {payment.payment_method}",
                    'reference_type': 'PAYMENT',
                    'reference_id': payment.payment_id,
                    'debit': 0.0,
                    'credit': payment.amount,
                    'crop_name': None,
                    'quantity': None,
                    'unit_price': None,
                    'unit': None
                })
            elif contact.is_supplier:
                # صرف لمورد - مدين
                transactions.append({
                    'date': payment.payment_date,
                    'description': f"صادر له نقدية (عام) - {payment.payment_method}",
                    'reference_type': 'PAYMENT',
                    'reference_id': payment.payment_id,
                    'debit': payment.amount,
                    'credit': 0.0,
                    'crop_name': None,
                    'quantity': None,
                    'unit_price': None,
                    'unit': None
                })
    
    # ترتيب المعاملات حسب التاريخ
    transactions.sort(key=lambda x: x['date'])
    
    # بناء الإدخالات مع الرصيد التراكمي
    for t in transactions:
        running_balance = running_balance + t['debit'] - t['credit']
        entries.append(schemas.AccountStatementEntry(
            date=t['date'],
            description=t['description'],
            reference_type=t['reference_type'],
            reference_id=t['reference_id'],
            debit=t['debit'],
            credit=t['credit'],
            balance=running_balance,
            crop_name=t.get('crop_name'),
            quantity=t.get('quantity'),
            unit_price=t.get('unit_price'),
            unit=t.get('unit')
        ))
    
    # الملخص المالي
    summary = get_contact_summary(db, contact_id)
    
    return schemas.AccountStatement(
        contact=schemas.Contact.model_validate(contact),
        summary=summary,
        opening_balance=opening_balance,
        entries=entries,
        closing_balance=running_balance,
        start_date=start_date,
        end_date=end_date
    )


def _calculate_opening_balance(db: Session, contact_id: int, before_date: date) -> float:
    """
    حساب الرصيد الافتتاحي قبل تاريخ معين
    """
    contact = db.query(models.Contact).filter(models.Contact.contact_id == contact_id).first()
    if not contact:
        return 0.0
    
    balance = Decimal(0)
    
    # المبيعات قبل التاريخ (للعملاء)
    if contact.is_customer:
        sales_total = db.query(func.sum(models.Sale.total_sale_amount)).filter(
            and_(
                models.Sale.customer_id == contact_id,
                models.Sale.sale_date < before_date
            )
        ).scalar() or Decimal(0)
        balance += sales_total
        
        # التحصيلات قبل التاريخ
        received = db.query(func.sum(models.Payment.amount)).filter(
            and_(
                models.Payment.contact_id == contact_id,
                models.Payment.transaction_type == 'SALE',
                models.Payment.payment_date < before_date
            )
        ).scalar() or Decimal(0)
        balance -= received
    
    # المشتريات قبل التاريخ (للموردين)
    if contact.is_supplier:
        purchases_total = db.query(func.sum(models.Purchase.total_cost)).filter(
            and_(
                models.Purchase.supplier_id == contact_id,
                models.Purchase.purchase_date < before_date
            )
        ).scalar() or Decimal(0)
        balance -= purchases_total  # سالب = علينا له
        
        # المدفوعات قبل التاريخ
        paid = db.query(func.sum(models.Payment.amount)).filter(
            and_(
                models.Payment.contact_id == contact_id,
                models.Payment.transaction_type == 'PURCHASE',
                models.Payment.payment_date < before_date
            )
        ).scalar() or Decimal(0)
        balance += paid
    
    return balance


def get_all_customers_balances(db: Session) -> List[dict]:
    """
    الحصول على أرصدة جميع العملاء
    """
    customers = db.query(models.Contact).filter(models.Contact.is_customer == True).all()
    
    balances = []
    for customer in customers:
        summary = get_contact_summary(db, customer.contact_id)
        balances.append({
            'contact_id': customer.contact_id,
            'name': customer.name,
            'total_sales': summary.total_sales,
            'total_received': summary.total_received,
            'balance': summary.balance_due
        })
    
    return balances


def get_all_suppliers_balances(db: Session) -> List[dict]:
    """
    الحصول على أرصدة جميع الموردين
    """
    suppliers = db.query(models.Contact).filter(models.Contact.is_supplier == True).all()
    
    balances = []
    for supplier in suppliers:
        summary = get_contact_summary(db, supplier.contact_id)
        balances.append({
            'contact_id': supplier.contact_id,
            'name': supplier.name,
            'total_purchases': summary.total_purchases,
            'total_paid': summary.total_paid,
            'balance': summary.balance_due
        })
    
    return balances
