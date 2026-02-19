"""
معالجة الأخطاء المركزية للتطبيق
Centralized Error Handling for the Application
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError
import logging
import traceback

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class AppException(Exception):
    """استثناء مخصص للتطبيق"""
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppException):
    """خطأ عدم وجود المورد"""
    def __init__(self, resource: str, resource_id: int = None):
        message = f"لم يتم العثور على {resource}"
        if resource_id:
            message += f" برقم {resource_id}"
        super().__init__(message, status_code=404)


class ValidationFailedError(AppException):
    """خطأ فشل التحقق"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=422, details=details)


class InsufficientBalanceError(AppException):
    """خطأ رصيد غير كافي"""
    def __init__(self, current_balance: float, required_amount: float):
        message = f"الرصيد غير كافي. الرصيد الحالي: {current_balance}, المطلوب: {required_amount}"
        super().__init__(message, status_code=400, details={
            "current_balance": current_balance,
            "required_amount": required_amount
        })


class InsufficientStockError(AppException):
    """خطأ مخزون غير كافي"""
    def __init__(self, crop_name: str, available: float, required: float):
        message = f"المخزون غير كافي من {crop_name}. المتاح: {available} كجم, المطلوب: {required} كجم"
        super().__init__(message, status_code=400, details={
            "crop_name": crop_name,
            "available": available,
            "required": required
        })


class DuplicateEntryError(AppException):
    """خطأ تكرار البيانات"""
    def __init__(self, field: str, value: str):
        message = f"القيمة '{value}' موجودة بالفعل في الحقل '{field}'"
        super().__init__(message, status_code=409)


def create_error_response(status_code: int, message: str, details: dict = None):
    """إنشاء استجابة خطأ موحدة"""
    content = {
        "success": False,
        "error": {
            "message": message,
            "status_code": status_code
        }
    }
    if details:
        content["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=content)


async def app_exception_handler(request: Request, exc: AppException):
    """معالج استثناءات التطبيق المخصصة"""
    logger.warning(f"AppException: {exc.message} - Details: {exc.details}")
    return create_error_response(exc.status_code, exc.message, exc.details)


async def http_exception_handler(request: Request, exc: HTTPException):
    """معالج استثناءات HTTP"""
    logger.warning(f"HTTPException: {exc.detail}")
    return create_error_response(exc.status_code, str(exc.detail))


async def validation_exception_handler(request: Request, exc: ValidationError):
    """معالج أخطاء التحقق من Pydantic"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    logger.warning(f"ValidationError: {errors}")
    return create_error_response(422, "خطأ في التحقق من البيانات", {"errors": errors})


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """معالج أخطاء قاعدة البيانات"""
    logger.error(f"SQLAlchemyError: {str(exc)}")
    
    if isinstance(exc, IntegrityError):
        # خطأ تكامل البيانات (مثل المفاتيح المكررة)
        return create_error_response(409, "خطأ في تكامل البيانات - قد تكون البيانات مكررة")
    
    return create_error_response(500, "خطأ في قاعدة البيانات")


async def general_exception_handler(request: Request, exc: Exception):
    """معالج الاستثناءات العامة"""
    logger.error(f"Unhandled Exception: {str(exc)}\n{traceback.format_exc()}")
    return create_error_response(500, "حدث خطأ غير متوقع")


def setup_exception_handlers(app):
    """إعداد معالجات الاستثناءات للتطبيق"""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)


# Helper functions for services
def validate_positive_amount(amount: float, field_name: str = "المبلغ"):
    """التحقق من أن المبلغ موجب"""
    if amount <= 0:
        raise ValidationFailedError(f"{field_name} يجب أن يكون أكبر من صفر")


def validate_not_empty(value: str, field_name: str):
    """التحقق من أن الحقل ليس فارغاً"""
    if not value or not value.strip():
        raise ValidationFailedError(f"{field_name} مطلوب ولا يمكن أن يكون فارغاً")


def validate_date_range(start_date, end_date):
    """التحقق من صحة نطاق التاريخ"""
    if start_date > end_date:
        raise ValidationFailedError("تاريخ البداية يجب أن يكون قبل تاريخ النهاية")
