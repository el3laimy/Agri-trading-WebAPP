"""
Contact CRUD Operations
"""
from sqlalchemy.orm import Session
from app import models, schemas


def get_contact(db: Session, contact_id: int):
    return db.query(models.Contact).filter(models.Contact.contact_id == contact_id).first()


def get_contacts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Contact).offset(skip).limit(limit).all()


def create_contact(db: Session, contact: schemas.ContactCreate):
    db_contact = models.Contact(**contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


def get_contact_dependencies(db: Session, contact_id: int) -> dict:
    """فحص السجلات المرتبطة بجهة التعامل في الجداول المختلفة"""
    dependencies = {
        "sales": db.query(models.Sale).filter(models.Sale.customer_id == contact_id).count(),
        "purchases": db.query(models.Purchase).filter(models.Purchase.supplier_id == contact_id).count(),
        "payments": db.query(models.Payment).filter(models.Payment.contact_id == contact_id).count(),
        "inventory_batches": db.query(models.InventoryBatch).filter(models.InventoryBatch.supplier_id == contact_id).count(),
        "expenses": db.query(models.Expense).filter(models.Expense.supplier_id == contact_id).count(),
        "supply_contracts": db.query(models.SupplyContract).filter(models.SupplyContract.supplier_id == contact_id).count(),
        "supplier_ratings": db.query(models.SupplierRating).filter(models.SupplierRating.supplier_id == contact_id).count(),
    }
    return dependencies


def migrate_contact_data(db: Session, old_contact_id: int, new_contact_id: int):
    """نقل جميع البيانات المرتبطة من جهة التعامل القديمة إلى الجديدة"""
    
    # تحديث جداول المبيعات (العميل)
    db.query(models.Sale).filter(models.Sale.customer_id == old_contact_id).update({"customer_id": new_contact_id})
    
    # تحديث جداول المشتريات (المورد)
    db.query(models.Purchase).filter(models.Purchase.supplier_id == old_contact_id).update({"supplier_id": new_contact_id})
    
    # تحديث المدفوعات
    db.query(models.Payment).filter(models.Payment.contact_id == old_contact_id).update({"contact_id": new_contact_id})
    
    # تحديث دفعات المخزون
    db.query(models.InventoryBatch).filter(models.InventoryBatch.supplier_id == old_contact_id).update({"supplier_id": new_contact_id})
    
    # تحديث المصروفات
    db.query(models.Expense).filter(models.Expense.supplier_id == old_contact_id).update({"supplier_id": new_contact_id})
    
    # تحديث عقود التوريد
    db.query(models.SupplyContract).filter(models.SupplyContract.supplier_id == old_contact_id).update({"supplier_id": new_contact_id})
    
    # تحديث تقييمات الموردين
    db.query(models.SupplierRating).filter(models.SupplierRating.supplier_id == old_contact_id).update({"supplier_id": new_contact_id})
    
    db.commit()
    
    # حذف جهة التعامل القديمة
    delete_contact(db, old_contact_id)


def delete_contact(db: Session, contact_id: int):
    """حذف جهة التعامل (الحذف الأساسي)"""
    db_contact = get_contact(db, contact_id)
    if db_contact:
        db.delete(db_contact)
        db.commit()
    return db_contact


def delete_contact_with_dependencies(db: Session, contact_id: int):
    """حذف جهة التعامل وجميع البيانات المرتبطة بها (حذف إجباري)"""
    
    # حذف السجلات المرتبطة أولاً
    db.query(models.Sale).filter(models.Sale.customer_id == contact_id).delete()
    db.query(models.Purchase).filter(models.Purchase.supplier_id == contact_id).delete()
    db.query(models.Payment).filter(models.Payment.contact_id == contact_id).delete()
    db.query(models.InventoryBatch).filter(models.InventoryBatch.supplier_id == contact_id).delete()
    db.query(models.Expense).filter(models.Expense.supplier_id == contact_id).delete()
    db.query(models.SupplyContract).filter(models.SupplyContract.supplier_id == contact_id).delete()
    db.query(models.SupplierRating).filter(models.SupplierRating.supplier_id == contact_id).delete()
    
    db.commit()
    
    # حذف جهة التعامل
    delete_contact(db, contact_id)
