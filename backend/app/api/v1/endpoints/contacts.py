from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app import crud, schemas
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
        raise HTTPException(status_code=404, detail="جهة التعامل غير موجودة")
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
        raise HTTPException(status_code=404, detail="جهة التعامل غير موجودة")
    
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
        raise HTTPException(status_code=404, detail="جهة التعامل غير موجودة")
    
    # فحص التبعيات
    dependencies = crud.get_contact_dependencies(db, contact_id)
    
    total_conflicts = sum(dependencies.values())
    
    if total_conflicts > 0:
        # إرجاع خطأ 409 Conflict مع تفاصيل التعارضات
        return JSONResponse(
            status_code=409,
            content={
                "detail": "لا يمكن حذف جهة التعامل لأنها مرتبطة بعمليات أخرى",
                "conflicts": dependencies
            }
        )
    
    db.delete(db_contact)
    db.commit()
    
    return {"message": "تم حذف جهة التعامل بنجاح"}

@router.post("/{contact_id}/migrate-and-delete")
def migrate_and_delete_contact(
    contact_id: int, 
    migration_request: schemas.ContactMigrationRequest,
    db: Session = Depends(get_db)
):
    """
    نقل البيانات من جهة التعامل المراد حذفها إلى جهة تعامل أخرى ثم حذف الأصلية
    """
    source_contact = crud.get_contact(db, contact_id)
    if not source_contact:
        raise HTTPException(status_code=404, detail="جهة التعامل المراد حذفها غير موجودة")
        
    target_contact = crud.get_contact(db, migration_request.target_contact_id)
    if not target_contact:
        raise HTTPException(status_code=404, detail="جهة التعامل الهدف غير موجودة")
        
    if contact_id == migration_request.target_contact_id:
        raise HTTPException(status_code=400, detail="لا يمكن النقل لنفس جهة التعامل")
        
    crud.migrate_contact_data(db, contact_id, migration_request.target_contact_id)
    
    return {"message": f"تم نقل البيانات إلى {target_contact.name} وحذف جهة التعامل القديمة بنجاح"}

@router.delete("/{contact_id}/force")
def force_delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """
    حذف إجباري: حذف جهة التعامل وجميع السجلات المرتبطة
    """
    db_contact = crud.get_contact(db, contact_id=contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="جهة التعامل غير موجودة")
        
    crud.delete_contact_with_dependencies(db, contact_id)
    
    return {"message": "تم حذف جهة التعامل وجميع السجلات المرتبطة بها بنجاح"}


