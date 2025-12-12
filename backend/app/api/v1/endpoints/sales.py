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

from fastapi.responses import StreamingResponse
from app.services import invoices
from app.models import Sale

@router.get("/{sale_id}/invoice")
def download_invoice(sale_id: int, db: Session = Depends(get_db)):
    """تحميل فاتورة البيع بصيغة PDF"""
    sale = db.query(Sale).filter(Sale.sale_id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="بيع غير موجود")
    
    # Prepare data
    sale_data = {
        "sale_id": sale.sale_id,
        "date": sale.sale_date,
        "customer_name": sale.customer.name if sale.customer else "عميل نقدي",
        "customer_phone": sale.customer.phone if sale.customer else "",
        "crop_name": sale.crop.crop_name,
        "quantity": sale.quantity_sold_kg,
        "unit": sale.selling_pricing_unit, # Or convert if needed
        "price": sale.selling_unit_price,
        "total_amount": sale.total_sale_amount,
        "amount_received": sale.amount_received
    }
    
    pdf_buffer = invoices.generate_invoice_pdf(sale_data)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{sale_id}.pdf"}
    )

from pydantic import BaseModel, EmailStr
from app.services import notifications_external

class EmailRequest(BaseModel):
    email: EmailStr

@router.post("/{sale_id}/share/email")
async def share_invoice_email(sale_id: int, request: EmailRequest, db: Session = Depends(get_db)):
    """إرسال الفاتورة عبر البريد الإلكتروني"""
    sale = db.query(Sale).filter(Sale.sale_id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="بيع غير موجود")

    # Prepare data (Reuse logic)
    sale_data = {
        "sale_id": sale.sale_id,
        "date": sale.sale_date,
        "customer_name": sale.customer.name if sale.customer else "عميل نقدي",
        "customer_phone": sale.customer.phone if sale.customer else "",
        "crop_name": sale.crop.crop_name,
        "quantity": sale.quantity_sold_kg,
        "unit": sale.selling_pricing_unit,
        "price": sale.selling_unit_price,
        "total_amount": sale.total_sale_amount,
        "amount_received": sale.amount_received
    }

    # Generate PDF
    pdf_buffer = invoices.generate_invoice_pdf(sale_data)
    pdf_bytes = pdf_buffer.getvalue()
    filename = f"invoice_{sale_id}.pdf"

    # Send Email
    subject = f"فاتورة مبيعات #{sale_id} - AgriTrade"
    body = f"""
    <h3>مرحباً {sale_data['customer_name']}</h3>
    <p>تجد مرفقاً فاتورة المبيعات الخاصة بك.</p>
    <p>شكراً لتعاملك معنا.</p>
    """

    success = await notifications_external.send_invoice_email(
        email_to=request.email,
        subject=subject,
        body=body,
        pdf_buffer=pdf_bytes,
        pdf_filename=filename
    )

    if not success:
        raise HTTPException(status_code=500, detail="فشل في إرسال البريد الإلكتروني")
    
    return {"message": "تم إرسال الفاتورة بنجاح"}

