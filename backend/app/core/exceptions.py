"""
Application Exceptions Module

Provides custom exception classes and global exception handlers for the FastAPI application.
"""
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError


class AppException(Exception):
    """Base exception for application-specific errors"""
    def __init__(self, message: str, status_code: int = 400, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "APP_ERROR"
        super().__init__(self.message)


class NotFoundError(AppException):
    """Resource not found exception"""
    def __init__(self, resource: str, id: int = None, identifier: str = None):
        if id:
            message = f"{resource} with id {id} not found"
        elif identifier:
            message = f"{resource} '{identifier}' not found"
        else:
            message = f"{resource} not found"
        super().__init__(message, status_code=404, error_code="NOT_FOUND")


class DuplicateError(AppException):
    """Duplicate resource exception"""
    def __init__(self, resource: str, field: str = None):
        if field:
            message = f"{resource} with this {field} already exists"
        else:
            message = f"{resource} already exists"
        super().__init__(message, status_code=409, error_code="DUPLICATE")


class ValidationError(AppException):
    """Validation error exception"""
    def __init__(self, message: str, field: str = None):
        super().__init__(message, status_code=422, error_code="VALIDATION_ERROR")
        self.field = field


class PermissionError(AppException):
    """Permission denied exception"""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status_code=403, error_code="PERMISSION_DENIED")


class BusinessRuleError(AppException):
    """Business rule violation exception"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400, error_code="BUSINESS_RULE_VIOLATION")


# Exception Handlers for FastAPI

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handler for custom application exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "error_code": exc.error_code,
        }
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Handler for SQLAlchemy integrity errors (foreign key, unique constraints)"""
    return JSONResponse(
        status_code=409,
        content={
            "detail": "Database integrity error. This record may already exist or is referenced by other records.",
            "error_code": "INTEGRITY_ERROR",
        }
    )


async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handler for general SQLAlchemy errors"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Database error occurred. Please try again later.",
            "error_code": "DATABASE_ERROR",
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler for unhandled exceptions"""
    # Log the error here in production
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "error_code": "INTERNAL_ERROR",
        }
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app"""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    # Note: Be careful with general exception handlers in production
    # app.add_exception_handler(Exception, general_exception_handler)
