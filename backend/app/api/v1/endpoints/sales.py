from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app import crud, schemas
from app.api.v1.endpoints.crops import get_db # Reuse the get_db dependency
from app.services import sales as sales_service

router = APIRouter()

@router.post("/", response_model=schemas.SaleRead)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    return sales_service.create_new_sale(db=db, sale=sale)

@router.get("/", response_model=List[schemas.SaleRead])
def read_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_sales = crud.get_sales(db, skip=skip, limit=limit)
    
    # This is the fix from the purchases endpoint to prevent the same error.
    # I am applying it here from the start.
    response_sales = []
    for s in db_sales:
        response_crop = schemas.Crop(
            crop_id=s.crop.crop_id,
            crop_name=s.crop.crop_name,
            is_active=s.crop.is_active,
            allowed_pricing_units=json.loads(s.crop.allowed_pricing_units),
            conversion_factors=json.loads(s.crop.conversion_factors)
        )
        response_customer = schemas.Contact.model_validate(s.customer)

        sale_response = schemas.SaleRead(
            sale_id=s.sale_id,
            crop_id=s.crop_id,
            customer_id=s.customer_id,
            sale_date=s.sale_date,
            quantity_sold_kg=s.quantity_sold_kg,
            selling_unit_price=s.selling_unit_price,
            selling_pricing_unit=s.selling_pricing_unit,
            specific_selling_factor=s.specific_selling_factor,
            total_sale_amount=s.total_sale_amount,
            amount_received=s.amount_received,
            payment_status=s.payment_status,
            crop=response_crop,
            customer=response_customer
        )
        response_sales.append(sale_response)
        
    return response_sales
