"""
Settings Service
خدمة إدارة الإعدادات - تخزين واسترجاع القيم من قاعدة البيانات
"""

from sqlalchemy.orm import Session
from typing import Optional, Any
import json
from datetime import datetime

from app import models
from app.database import SessionLocal

# Cache for settings to reduce DB hits
_settings_cache = {}
_last_cache_update = datetime.min


def get_setting(db: Session, key: str, default: Any = None) -> Any:
    """
    الحصول على قيمة إعداد معين
    
    Args:
        db: جلسة قاعدة البيانات
        key: مفتاح الإعداد
        default: القيمة الافتراضية في حال عدم وجود الإعداد
        
    Returns:
        قيمة الإعداد أو القيمة الافتراضية
    """
    # Check cache first
    if key in _settings_cache:
        return _settings_cache[key]
    
    setting = db.query(models.Settings).filter(models.Settings.key == key).first()
    
    if setting:
        value = setting.value
        # Try to parse JSON/numbers
        try:
            if value.isdigit():
                value = int(value)
            elif value.replace('.', '', 1).isdigit():
                value = float(value)
            elif value.lower() == 'true':
                value = True
            elif value.lower() == 'false':
                value = False
            elif value.startswith('{') or value.startswith('['):
                value = json.loads(value)
        except (ValueError, json.JSONDecodeError):
            pass
            
        _settings_cache[key] = value
        return value
    
    return default


def set_setting(db: Session, key: str, value: Any, description: Optional[str] = None) -> models.Settings:
    """
    حفظ أو تحديث إعداد
    
    Args:
        db: جلسة قاعدة البيانات
        key: مفتاح الإعداد
        value: القيمة
        description: وصف الإعداد (اختياري)
        
    Returns:
        كائن الإعداد المحفوظ
    """
    # Convert value to string for storage
    str_value = str(value)
    if isinstance(value, (dict, list)):
        str_value = json.dumps(value)
    
    setting = db.query(models.Settings).filter(models.Settings.key == key).first()
    
    if setting:
        setting.value = str_value
        if description:
            setting.description = description
    else:
        setting = models.Settings(
            key=key,
            value=str_value,
            description=description
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    
    # Update cache
    _settings_cache[key] = value
    
    return setting


def initialize_default_settings(db: Session):
    """
    تهيئة الإعدادات الافتراضية إذا لم تكن موجودة
    """
    defaults = {
        "INVENTORY_ACCOUNT_ID": 10103,
        "ACCOUNTS_RECEIVABLE_ID": 10104,
        "ACCOUNTS_PAYABLE_ID": 20101,
        "SALES_REVENUE_ACCOUNT_ID": 40101,
        "PURCHASES_ACCOUNT_ID": 50101, # Using COGS/Purchases ID
        "COGS_ACCOUNT_ID": 50101,
        "CASH_ACCOUNT_ID": 10101,
        "CAPITAL_ACCOUNT_ID": 30101,
        "RETAINED_EARNINGS_ACCOUNT_ID": 30102, # Fallback
        "EXPENSES_ACCOUNT_ID_PREFIX": 502,
        "GENERAL_EXPENSES_ACCOUNT_ID": 50201,
        "OWNER_EQUITY_ID": 30101
    }
    
    for key, value in defaults.items():
        if get_setting(db, key) is None:
            set_setting(db, key, value, f"Default system ID for {key}")

