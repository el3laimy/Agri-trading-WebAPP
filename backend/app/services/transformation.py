"""
خدمة التحويل (Transformation Service)
تحويل محصول خام إلى منتجات نهائية مع توزيع التكلفة
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
from typing import List

from app import schemas
from app.models import Transformation, TransformationOutput, Crop, Inventory
from app.services.inventory import consume_stock, add_stock_batch


def create_transformation(
    db: Session,
    transformation_data: schemas.TransformationCreate,
    user_id: int = None
) -> Transformation:
    """
    إنشاء عملية تحويل جديدة
    
    العملية:
    1. التحقق من وجود المحصول المصدر ومخزونه
    2. سحب الكمية من المخزون (consume_stock)
    3. حساب التكلفة الإجمالية
    4. التحقق من أن مجموع نسب التوزيع ≤ 100%
    5. إضافة المخرجات للمخزون (ما عدا الهالك)
    6. إنشاء القيود المحاسبية
    """
    
    # 1. التحقق من المحصول المصدر
    source_crop = db.query(Crop).filter(Crop.crop_id == transformation_data.source_crop_id).first()
    if not source_crop:
        raise HTTPException(status_code=404, detail="المحصول المصدر غير موجود")
    
    # التحقق من المخزون
    inventory = db.query(Inventory).filter(Inventory.crop_id == transformation_data.source_crop_id).first()
    if not inventory or inventory.current_stock_kg < transformation_data.source_quantity_kg:
        available = inventory.current_stock_kg if inventory else 0
        raise HTTPException(
            status_code=400,
            detail=f"المخزون غير كافٍ. المتاح: {available} كجم، المطلوب: {transformation_data.source_quantity_kg} كجم"
        )
    
    # 2. التحقق من نسب التوزيع
    total_ratio = sum(output.cost_allocation_ratio for output in transformation_data.outputs)
    if total_ratio > Decimal("1.0"):
        raise HTTPException(
            status_code=400,
            detail=f"مجموع نسب التوزيع ({total_ratio}) يتجاوز 100%"
        )
    
    # 3. التحقق من المحاصيل الناتجة
    for output in transformation_data.outputs:
        output_crop = db.query(Crop).filter(Crop.crop_id == output.output_crop_id).first()
        if not output_crop:
            raise HTTPException(status_code=404, detail=f"المحصول الناتج {output.output_crop_id} غير موجود")

    try:
        # 4. سحب الكمية من المخزون
        source_quantity = Decimal(str(transformation_data.source_quantity_kg))
        consumed = consume_stock(
            db=db,
            crop_id=transformation_data.source_crop_id,
            quantity_kg=source_quantity
        )
        
        source_cost_per_kg = consumed['average_cost_per_kg']
        source_total_cost = consumed['total_cogs']
        
        # 5. حساب التكلفة الإجمالية
        processing_cost = Decimal(str(transformation_data.processing_cost))
        total_cost = source_total_cost + processing_cost
        
        # 6. إنشاء سجل التحويل
        db_transformation = Transformation(
            source_crop_id=transformation_data.source_crop_id,
            source_quantity_kg=source_quantity,
            source_cost_per_kg=source_cost_per_kg,
            source_total_cost=source_total_cost,
            processing_cost=processing_cost,
            total_cost=total_cost,
            transformation_date=transformation_data.transformation_date,
            notes=transformation_data.notes,
            season_id=transformation_data.season_id,
            created_by=user_id
        )
        db.add(db_transformation)
        db.flush()
        
        # 7. إنشاء المخرجات
        for output_data in transformation_data.outputs:
            ratio = Decimal(str(output_data.cost_allocation_ratio))
            allocated_cost = total_cost * ratio
            output_quantity = Decimal(str(output_data.output_quantity_kg))
            cost_per_kg = allocated_cost / output_quantity if output_quantity > 0 else Decimal(0)
            
            db_output = TransformationOutput(
                transformation_id=db_transformation.transformation_id,
                output_crop_id=output_data.output_crop_id,
                output_quantity_kg=output_quantity,
                cost_allocation_ratio=ratio,
                allocated_cost=allocated_cost,
                cost_per_kg=cost_per_kg,
                is_waste=output_data.is_waste,
                notes=output_data.notes
            )
            db.add(db_output)
            
            # 8. إضافة للمخزون (إذا لم يكن هالك)
            if not output_data.is_waste:
                add_stock_batch(
                    db=db,
                    crop_id=output_data.output_crop_id,
                    quantity_kg=output_quantity,
                    cost_per_kg=cost_per_kg,
                    purchase_date=transformation_data.transformation_date,
                    purchase_id=None,  # ليس من شراء
                    supplier_id=None,
                    notes=f"ناتج تحويل من {source_crop.crop_name}",
                    gross_quantity_kg=output_quantity,
                    bag_count=0
                )
        
        # 9. القيود المحاسبية
        # TODO: إضافة قيد محاسبي للهالك إذا وجد
        
        db.commit()
        db.refresh(db_transformation)
        
        return db_transformation
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"خطأ أثناء التحويل: {str(e)}")


def get_transformations(db: Session, skip: int = 0, limit: int = 100) -> List[Transformation]:
    """قائمة عمليات التحويل"""
    return db.query(Transformation).order_by(Transformation.transformation_id.desc()).offset(skip).limit(limit).all()


def get_transformation(db: Session, transformation_id: int) -> Transformation:
    """الحصول على عملية تحويل واحدة"""
    transformation = db.query(Transformation).filter(
        Transformation.transformation_id == transformation_id
    ).first()
    if not transformation:
        raise HTTPException(status_code=404, detail="عملية التحويل غير موجودة")
    return transformation


def delete_transformation(db: Session, transformation_id: int) -> bool:
    """
    حذف عملية تحويل (عكس العملية)
    - إرجاع المخرجات من المخزون
    - إضافة الخام للمخزون
    """
    transformation = get_transformation(db, transformation_id)
    
    # TODO: عكس عمليات المخزون
    # هذا يتطلب منطق معقد لعكس العملية
    
    db.delete(transformation)
    db.commit()
    return True
