"""
خدمة الشراء المبسطة
Simplified Purchasing Service
- كل العمليات بالكيلوجرام داخلياً
- السعر يُحسب مباشرة: الكمية × السعر
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal

from app import crud, schemas
from app.core.settings import get_setting
from app.services import payments as payment_service

def create_new_purchase(db: Session, purchase: schemas.PurchaseCreate, user_id: int = None):
    """
    إنشاء عملية شراء جديدة (مبسطة)
    
    المدخلات:
    - quantity_kg: الكمية بالكيلوجرام (التحويل يحدث في الواجهة)
    - unit_price: سعر الكيلو
    
    المخرجات:
    - تحديث المخزون
    - قيد محاسبي (مخزون ← مورد)
    """
    # التحقق من صحة البيانات
    crop = crud.get_crop(db, purchase.crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"المحصول رقم {purchase.crop_id} غير موجود.")
    
    supplier = crud.get_contact(db, purchase.supplier_id)
    if not supplier or not supplier.is_supplier:
        raise HTTPException(status_code=404, detail=f"المورد رقم {purchase.supplier_id} غير موجود.")

    # حساب التكلفة الإجمالية (بسيط)
    quantity_kg = Decimal(str(purchase.quantity_kg))
    unit_price = Decimal(str(purchase.unit_price))
    total_cost = quantity_kg * unit_price

    try:
        # 1. إنشاء سجل الشراء
        purchase_data = purchase.model_dump()
        purchase_data['total_cost'] = total_cost
        purchase_data['created_by'] = user_id
        # للتوافق مع الحقول القديمة
        purchase_data['gross_quantity'] = quantity_kg
        purchase_data['tare_weight'] = Decimal(0)
        
        db_purchase = crud.create_purchase_record(db, purchase_data=purchase_data)
        db.flush()

        # 2. تحديث المخزون
        from app.services.inventory import add_stock_batch
        
        add_stock_batch(
            db=db,
            crop_id=purchase.crop_id,
            quantity_kg=quantity_kg,
            cost_per_kg=unit_price,
            purchase_date=purchase.purchase_date,
            purchase_id=db_purchase.purchase_id,
            supplier_id=purchase.supplier_id,
            notes=purchase.notes,
            gross_quantity_kg=quantity_kg,
            bag_count=purchase.bag_count or 0
        )

        # 3. إنشاء القيود المحاسبية
        from app.services.accounting_engine import get_engine, LedgerEntry
        
        ledger_description = f"شراء {quantity_kg} كجم {crop.crop_name} من {supplier.name}"
        
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))
        accounts_payable_id = int(get_setting(db, "ACCOUNTS_PAYABLE_ID"))

        engine = get_engine(db)
        engine.create_balanced_entry(
            entries=[
                LedgerEntry(
                    account_id=inventory_id,
                    debit=total_cost,
                    credit=Decimal(0),
                    description=ledger_description
                ),
                LedgerEntry(
                    account_id=accounts_payable_id,
                    debit=Decimal(0),
                    credit=total_cost,
                    description=ledger_description
                )
            ],
            entry_date=purchase.purchase_date,
            source_type='PURCHASE',
            source_id=db_purchase.purchase_id,
            created_by=user_id
        )

        db.commit()
        db.refresh(db_purchase)

        # 4. معالجة الدفع الفوري (اختياري)
        if purchase.amount_paid and purchase.amount_paid > 0:
            payment_amount = Decimal(str(purchase.amount_paid))
            payment_data = schemas.PaymentCreate(
                payment_date=purchase.purchase_date,
                amount=payment_amount,
                contact_id=purchase.supplier_id,
                payment_method='Cash',
                credit_account_id=int(get_setting(db, "CASH_ACCOUNT_ID")),
                debit_account_id=accounts_payable_id,
                transaction_type='PURCHASE',
                transaction_id=db_purchase.purchase_id
            )
            payment_service.create_payment(db, payment_data, user_id=user_id)
            db.refresh(db_purchase)

        return db_purchase

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تسجيل العملية: {e}")
