"""
Idempotency Middleware/Dependency
يوفر حماية من تكرار العمليات المالية

الاستخدام:
    @router.post("/", dependencies=[Depends(check_idempotency)])
    def create_purchase(...):
        ...
"""
from datetime import datetime, timedelta
from fastapi import Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
import json

from app.api.v1.endpoints.crops import get_db
from app import models


# مدة صلاحية المفتاح (24 ساعة)
IDEMPOTENCY_KEY_TTL = timedelta(hours=24)


async def check_idempotency(
    request: Request,
    idempotency_key: str = Header(None, alias="X-Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Dependency للتحقق من Idempotency Key
    
    - إذا لم يُرسل المفتاح: يمر الطلب عادياً (للتوافق مع الواجهات القديمة)
    - إذا أُرسل المفتاح ولم يكن موجوداً: يتم تسجيله
    - إذا أُرسل المفتاح وكان موجوداً: يُرجع الاستجابة السابقة أو خطأ 409
    """
    if not idempotency_key:
        # لا يوجد مفتاح - يمر الطلب عادياً
        return None
    
    # البحث عن المفتاح
    existing_key = db.query(models.IdempotencyKey).filter(
        models.IdempotencyKey.key == idempotency_key
    ).first()
    
    if existing_key:
        # تحقق من انتهاء الصلاحية
        if existing_key.expires_at < datetime.utcnow():
            # المفتاح منتهي الصلاحية - حذفه والسماح بالطلب
            db.delete(existing_key)
            db.commit()
        else:
            # المفتاح موجود ولم ينته
            if existing_key.response_body:
                # إذا كانت هناك استجابة سابقة، يتم تجاهلها ورفض الطلب
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error": "duplicate_request",
                        "message": "تم تنفيذ هذه العملية مسبقاً",
                        "original_response": json.loads(existing_key.response_body) if existing_key.response_body else None
                    }
                )
            else:
                # المفتاح موجود لكن العملية لم تكتمل بعد
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error": "request_in_progress",
                        "message": "هذه العملية قيد التنفيذ بالفعل"
                    }
                )
    
    # تسجيل المفتاح الجديد
    endpoint = request.url.path
    new_key = models.IdempotencyKey(
        key=idempotency_key,
        endpoint=endpoint,
        expires_at=datetime.utcnow() + IDEMPOTENCY_KEY_TTL
    )
    db.add(new_key)
    db.commit()
    
    # تخزين المفتاح في request state للتحديث لاحقاً
    request.state.idempotency_key = new_key.id
    
    return idempotency_key


def save_idempotency_response(db: Session, key_id: int, status_code: int, response_body: dict):
    """
    حفظ نتيجة العملية مع مفتاح Idempotency
    يُستدعى بعد نجاح العملية
    """
    key_record = db.query(models.IdempotencyKey).filter(
        models.IdempotencyKey.id == key_id
    ).first()
    
    if key_record:
        key_record.response_status = status_code
        key_record.response_body = json.dumps(response_body, default=str, ensure_ascii=False)
        db.commit()


def cleanup_expired_keys(db: Session):
    """
    حذف المفاتيح منتهية الصلاحية
    يمكن تشغيلها كـ background task
    """
    db.query(models.IdempotencyKey).filter(
        models.IdempotencyKey.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
