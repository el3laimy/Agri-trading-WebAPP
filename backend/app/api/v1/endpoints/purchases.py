from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app import crud, schemas
from app.api.v1.endpoints.crops import get_db # Reuse the get_db dependency
from app.services import purchasing
from app.core.idempotency import check_idempotency

router = APIRouter()

from app.auth.dependencies import get_current_user, require_write_permission
from app import models

@router.get("/last-price/{crop_id}/{supplier_id}")
def get_last_purchase_price(
    crop_id: int,
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """
    الحصول على آخر سعر شراء لمحصول معين من مورد معين
    مفيد لتعبئة السعر الافتراضي في النموذج
    """
    last_purchase = db.query(models.Purchase).filter(
        models.Purchase.crop_id == crop_id,
        models.Purchase.supplier_id == supplier_id
    ).order_by(models.Purchase.purchase_date.desc()).first()
    
    if last_purchase:
        return {
            "unit_price": str(last_purchase.unit_price),
            "purchase_date": last_purchase.purchase_date.isoformat() if last_purchase.purchase_date else None,
            "quantity_kg": str(last_purchase.quantity_kg) if last_purchase.quantity_kg else None
        }
    return {"unit_price": None, "purchase_date": None, "quantity_kg": None}

@router.post("/", response_model=schemas.PurchaseRead, dependencies=[Depends(check_idempotency)])
def create_purchase(
    purchase: schemas.PurchaseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_write_permission('purchases'))
):
    """
    Create a new purchase.
    The business logic is handled by the purchasing service.
    Protected by Idempotency Key to prevent duplicate entries.
    """
    return purchasing.create_new_purchase(db=db, purchase=purchase, user_id=current_user.user_id)

@router.get("/", response_model=List[schemas.PurchaseRead])
def read_purchases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of purchases with crop and supplier details.
    This function now manually constructs the response to handle nested JSON strings.
    """
    db_purchases = crud.get_purchases(db, skip=skip, limit=limit)
    
    response_purchases = []
    for p in db_purchases:
        # Create a new Pydantic model for the response, parsing JSON fields correctly
        response_crop = schemas.Crop(
            crop_id=p.crop.crop_id,
            crop_name=p.crop.crop_name,
            is_active=p.crop.is_active,
            allowed_pricing_units=json.loads(p.crop.allowed_pricing_units),
            conversion_factors=json.loads(p.crop.conversion_factors)
        )
        response_supplier = schemas.Contact.model_validate(p.supplier)

        purchase_response = schemas.PurchaseRead(
            purchase_id=p.purchase_id,
            crop_id=p.crop_id,
            supplier_id=p.supplier_id,
            purchase_date=p.purchase_date,
            quantity_kg=p.quantity_kg,
            unit_price=p.unit_price,
            total_cost=p.total_cost,
            amount_paid=p.amount_paid,
            payment_status=p.payment_status,
            crop=response_crop,
            supplier=response_supplier
        )
        response_purchases.append(purchase_response)
        
    return response_purchases

@router.put("/{purchase_id}", response_model=schemas.PurchaseRead)
def update_purchase(
    purchase_id: int,
    purchase_update: schemas.PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تعديل عملية شراء"""
    db_purchase = db.query(models.Purchase).filter(models.Purchase.purchase_id == purchase_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="عملية الشراء غير موجودة")
    
    # Update purchase fields
    db_purchase.crop_id = purchase_update.crop_id
    db_purchase.supplier_id = purchase_update.supplier_id
    db_purchase.purchase_date = purchase_update.purchase_date
    db_purchase.quantity_kg = purchase_update.quantity_kg
    db_purchase.unit_price = purchase_update.unit_price
    db_purchase.total_cost = purchase_update.total_cost
    
    db.commit()
    db.refresh(db_purchase)
    
    return db_purchase

@router.delete("/{purchase_id}")
def delete_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """حذف عملية شراء"""
    db_purchase = db.query(models.Purchase).filter(models.Purchase.purchase_id == purchase_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="عملية الشراء غير موجودة")
    
    # Delete related dependencies to avoid Foreign Key violations
    
    # 1. Delete Inventory Batches derived from this purchase
    db.query(models.InventoryBatch).filter(models.InventoryBatch.purchase_id == purchase_id).delete()
    
    # 2. Delete Purchase Returns linked to this purchase
    db.query(models.PurchaseReturn).filter(models.PurchaseReturn.purchase_id == purchase_id).delete()
    
    # 3. Delete related Payments (Optional: depends on business logic, but safer to clean uporphan payments)
    # Note: Payment has no FK to purchase, but we should clean it up to avoid data inconsistencies
    db.query(models.Payment).filter(
        models.Payment.transaction_type == 'PURCHASE', 
        models.Payment.transaction_id == purchase_id
    ).delete()

    # 4. Delete related General Ledger entries (General Ledger)
    db.query(models.GeneralLedger).filter(
        models.GeneralLedger.source_type == 'PURCHASE',
        models.GeneralLedger.source_id == purchase_id
    ).delete()
    
    # Delete the purchase
    db.delete(db_purchase)
    db.commit()
    
    return {"message": "تم حذف عملية الشراء بنجاح"}
