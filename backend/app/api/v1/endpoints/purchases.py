from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app import crud, schemas
from app.api.v1.endpoints.crops import get_db # Reuse the get_db dependency
from app.services import purchasing

router = APIRouter()

@router.post("/", response_model=schemas.PurchaseRead)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    """
    Create a new purchase.
    The business logic is handled by the purchasing service.
    """
    return purchasing.create_new_purchase(db=db, purchase=purchase)

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
