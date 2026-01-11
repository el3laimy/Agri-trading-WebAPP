from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app import crud, schemas, models
from app.api.v1.endpoints.crops import get_db
from app.services import account_statement

router = APIRouter()

@router.post("/", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    return crud.create_contact(db=db, contact=contact)

@router.get("/", response_model=List[schemas.Contact])
def read_contacts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    contacts = crud.get_contacts(db, skip=skip, limit=limit)
    return contacts

@router.get("/customers/balances")
def get_customers_balances(db: Session = Depends(get_db)):
    """الحصول على أرصدة جميع العملاء"""
    return account_statement.get_all_customers_balances(db)

@router.get("/suppliers/balances")
def get_suppliers_balances(db: Session = Depends(get_db)):
    """الحصول على أرصدة جميع الموردين"""
    return account_statement.get_all_suppliers_balances(db)

@router.get("/{contact_id}", response_model=schemas.Contact)
def read_contact(contact_id: int, db: Session = Depends(get_db)):
    db_contact = crud.get_contact(db, contact_id=contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return db_contact

@router.get("/{contact_id}/summary", response_model=schemas.ContactSummary)
def get_contact_summary(contact_id: int, db: Session = Depends(get_db)):
    """الحصول على ملخص مالي لجهة التعامل"""
    try:
        return account_statement.get_contact_summary(db, contact_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{contact_id}/statement", response_model=schemas.AccountStatement)
def get_contact_statement(
    contact_id: int,
    start_date: Optional[date] = Query(None, description="تاريخ بداية الفترة"),
    end_date: Optional[date] = Query(None, description="تاريخ نهاية الفترة"),
    db: Session = Depends(get_db)
):
    """الحصول على كشف حساب تفصيلي لجهة التعامل"""
    try:
        return account_statement.get_account_statement(db, contact_id, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{contact_id}", response_model=schemas.Contact)
def update_contact(contact_id: int, contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    db_contact = crud.get_contact(db, contact_id=contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Update contact fields
    db_contact.name = contact.name
    db_contact.phone = contact.phone
    db_contact.address = contact.address
    db_contact.email = contact.email
    db_contact.is_supplier = contact.is_supplier
    db_contact.is_customer = contact.is_customer
    
    db.commit()
    db.refresh(db_contact)
    
    return db_contact

@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    db_contact = crud.get_contact(db, contact_id=contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Check for related records to ensure data integrity
    # 1. Sales
    has_sales = db.query(models.Sale).filter(models.Sale.customer_id == contact_id).first()
    if has_sales:
        raise HTTPException(status_code=400, detail="لا يمكن حذف العميل لوجود عمليات بيع مرتبطة به.")

    # 2. Purchases
    has_purchases = db.query(models.Purchase).filter(models.Purchase.supplier_id == contact_id).first()
    if has_purchases:
        raise HTTPException(status_code=400, detail="لا يمكن حذف المورد لوجود عمليات شراء مرتبطة به.")

    # 3. Payments
    has_payments = db.query(models.Payment).filter(models.Payment.contact_id == contact_id).first()
    if has_payments:
        raise HTTPException(status_code=400, detail="لا يمكن حذف جهة التعامل لوجود مدفوعات مرتبطة بها.")

    # 4. Expenses
    has_expenses = db.query(models.Expense).filter(models.Expense.supplier_id == contact_id).first()
    if has_expenses:
        raise HTTPException(status_code=400, detail="لا يمكن حذف المورد لوجود مصروفات مرتبطة به.")

    # 5. Inventory Batches (Supplied by)
    has_batches = db.query(models.InventoryBatch).filter(models.InventoryBatch.supplier_id == contact_id).first()
    if has_batches:
        raise HTTPException(status_code=400, detail="لا يمكن حذف المورد لوجود دفعات مخزون مرتبطة به.")

    db.delete(db_contact)
    db.commit()
    
    return {"message": "تم حذف جهة التعامل بنجاح"}

