from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date
import json

from app import crud, schemas
from app.api.v1.endpoints.crops import get_db
from app.models import Purchase, Sale, InventoryAdjustment, Transformation, TransformationOutput, Crop

router = APIRouter()

@router.get("/", response_model=List[schemas.InventoryRead])
def read_inventory_levels(db: Session = Depends(get_db)):
    inventory_levels = crud.get_inventory_levels(db)
    
    response_inventory = []
    for inv in inventory_levels:
        # We need to manually convert the JSON strings in Crop to objects
        # because the ORM model stores them as Text.
        # Note: Ideally this should be handled by a Pydantic validator or a model property.
        try:
            allowed_units = json.loads(inv.crop.allowed_pricing_units)
        except (json.JSONDecodeError, TypeError):
            allowed_units = [str(inv.crop.allowed_pricing_units)] if inv.crop.allowed_pricing_units else []

        try:
            factors = json.loads(inv.crop.conversion_factors)
        except (json.JSONDecodeError, TypeError):
            factors = {}

        response_crop = schemas.Crop(
            crop_id=inv.crop.crop_id,
            crop_name=inv.crop.crop_name,
            is_active=inv.crop.is_active,
            allowed_pricing_units=allowed_units,
            conversion_factors=factors
        )
        
        inv_response = schemas.InventoryRead(
            current_stock_kg=inv.current_stock_kg,
            average_cost_per_kg=inv.average_cost_per_kg,
            crop=response_crop
        )
        response_inventory.append(inv_response)
        
    return response_inventory

@router.post("/adjustments", response_model=schemas.InventoryAdjustmentRead)
def create_inventory_adjustment(adjustment: schemas.InventoryAdjustmentCreate, db: Session = Depends(get_db)):
    return crud.create_inventory_adjustment(db=db, adjustment=adjustment)

@router.get("/{crop_id}/batches")
def get_crop_batches(crop_id: int, db: Session = Depends(get_db)):
    """Get active batches for a specific crop"""
    from app.models import InventoryBatch
    batches = db.query(InventoryBatch).filter(
        InventoryBatch.crop_id == crop_id,
        InventoryBatch.is_active == True,
        InventoryBatch.quantity_kg > 0
    ).order_by(InventoryBatch.purchase_date.asc()).all()
    
    return [
        {
            "batch_id": b.batch_id,
            "quantity_kg": b.quantity_kg,
            "cost_per_kg": b.cost_per_kg,
            "purchase_date": b.purchase_date,
            "expiry_date": b.expiry_date,
            "supplier_name": b.supplier.name if b.supplier else "N/A"
        }
        for b in batches
    ]


@router.get("/{crop_id}/cardex")
def get_inventory_cardex(
    crop_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """
    كارديكس المخزون - تقرير حركة الصنف
    
    يعرض جميع الحركات على صنف معين:
    - المشتريات (وارد)
    - المبيعات (صادر)
    - تعديلات المخزون
    - التحويلات (وارد/صادر)
    
    مع حساب الرصيد التراكمي بعد كل حركة
    """
    
    # التحقق من وجود المحصول
    crop = db.query(Crop).filter(Crop.crop_id == crop_id).first()
    if not crop:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="المحصول غير موجود")
    
    movements = []
    
    # 1. المشتريات (وارد)
    purchases_query = db.query(Purchase).filter(Purchase.crop_id == crop_id)
    if start_date:
        purchases_query = purchases_query.filter(Purchase.purchase_date >= start_date)
    if end_date:
        purchases_query = purchases_query.filter(Purchase.purchase_date <= end_date)
    
    for p in purchases_query.all():
        movements.append({
            "date": str(p.purchase_date),
            "type": "PURCHASE",
            "type_ar": "شراء",
            "direction": "IN",
            "quantity_kg": float(p.quantity_kg),
            "unit_cost": float(p.unit_price),
            "total_value": float(p.total_cost),
            "reference": f"شراء #{p.purchase_id}",
            "supplier": p.supplier.name if p.supplier else "-",
            "notes": p.notes or ""
        })
    
    # 2. المبيعات (صادر)
    sales_query = db.query(Sale).filter(Sale.crop_id == crop_id)
    if start_date:
        sales_query = sales_query.filter(Sale.sale_date >= start_date)
    if end_date:
        sales_query = sales_query.filter(Sale.sale_date <= end_date)
    
    for s in sales_query.all():
        movements.append({
            "date": str(s.sale_date),
            "type": "SALE",
            "type_ar": "مبيعات",
            "direction": "OUT",
            "quantity_kg": float(s.quantity_sold_kg),
            "unit_cost": float(s.selling_unit_price),
            "total_value": float(s.total_sale_amount),
            "reference": f"بيع #{s.sale_id}",
            "supplier": s.customer.name if s.customer else "-",
            "notes": s.notes or ""
        })
    
    # 3. تعديلات المخزون
    adj_query = db.query(InventoryAdjustment).filter(InventoryAdjustment.crop_id == crop_id)
    if start_date:
        adj_query = adj_query.filter(InventoryAdjustment.adjustment_date >= start_date)
    if end_date:
        adj_query = adj_query.filter(InventoryAdjustment.adjustment_date <= end_date)
    
    for a in adj_query.all():
        direction = "IN" if a.adjustment_type == "SURPLUS" else "OUT"
        movements.append({
            "date": str(a.adjustment_date),
            "type": "ADJUSTMENT",
            "type_ar": "تسوية",
            "direction": direction,
            "quantity_kg": abs(float(a.quantity_kg)),
            "unit_cost": float(a.cost_per_kg),
            "total_value": abs(float(a.total_value)),
            "reference": f"تسوية: {a.adjustment_type}",
            "supplier": "-",
            "notes": a.notes or ""
        })
    
    # 4. التحويلات - كخام (صادر)
    trans_out_query = db.query(Transformation).filter(Transformation.source_crop_id == crop_id)
    if start_date:
        trans_out_query = trans_out_query.filter(Transformation.transformation_date >= start_date)
    if end_date:
        trans_out_query = trans_out_query.filter(Transformation.transformation_date <= end_date)
    
    for t in trans_out_query.all():
        movements.append({
            "date": str(t.transformation_date),
            "type": "TRANSFORM_OUT",
            "type_ar": "تحويل صادر",
            "direction": "OUT",
            "quantity_kg": float(t.source_quantity_kg),
            "unit_cost": float(t.source_cost_per_kg),
            "total_value": float(t.source_total_cost),
            "reference": f"تحويل #{t.transformation_id}",
            "supplier": "-",
            "notes": t.notes or ""
        })
    
    # 5. التحويلات - كمنتج (وارد)
    trans_in_query = db.query(TransformationOutput).filter(
        TransformationOutput.output_crop_id == crop_id,
        TransformationOutput.is_waste == False
    )
    
    for to in trans_in_query.all():
        t = to.transformation
        if start_date and t.transformation_date < start_date:
            continue
        if end_date and t.transformation_date > end_date:
            continue
        movements.append({
            "date": str(t.transformation_date),
            "type": "TRANSFORM_IN",
            "type_ar": "تحويل وارد",
            "direction": "IN",
            "quantity_kg": float(to.output_quantity_kg),
            "unit_cost": float(to.cost_per_kg),
            "total_value": float(to.allocated_cost),
            "reference": f"تحويل #{t.transformation_id}",
            "supplier": "-",
            "notes": to.notes or ""
        })
    
    # ترتيب بالتاريخ
    movements.sort(key=lambda x: x["date"])
    
    # حساب الرصيد التراكمي
    running_balance = 0.0
    for m in movements:
        if m["direction"] == "IN":
            running_balance += m["quantity_kg"]
        else:
            running_balance -= m["quantity_kg"]
        m["balance_kg"] = round(running_balance, 2)
    
    return {
        "crop_id": crop_id,
        "crop_name": crop.crop_name,
        "start_date": str(start_date) if start_date else None,
        "end_date": str(end_date) if end_date else None,
        "total_in": sum(m["quantity_kg"] for m in movements if m["direction"] == "IN"),
        "total_out": sum(m["quantity_kg"] for m in movements if m["direction"] == "OUT"),
        "current_balance": round(running_balance, 2),
        "movements_count": len(movements),
        "movements": movements
    }

