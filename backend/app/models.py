from sqlalchemy import Column, Integer, String, Boolean, Text, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Crop(Base):
    __tablename__ = "crops"

    crop_id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String, unique=True, nullable=False, index=True)
    allowed_pricing_units = Column(Text, nullable=False)
    conversion_factors = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)

class Contact(Base):
    __tablename__ = "contacts"

    contact_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_supplier = Column(Boolean, default=False)
    is_customer = Column(Boolean, default=False)

class FinancialAccount(Base):
    __tablename__ = "financial_accounts"

    account_id = Column(Integer, primary_key=True, index=True)
    account_name = Column(String, unique=True, nullable=False)
    account_type = Column(String, nullable=False)
    current_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

class Purchase(Base):
    __tablename__ = "purchases"

    purchase_id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("contacts.contact_id"), nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.season_id"), nullable=True)  # إضافة الموسم
    purchase_date = Column(Date, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    payment_status = Column(String, default='PENDING')
    notes = Column(Text, nullable=True)  # ملاحظات إضافية

    purchasing_pricing_unit = Column(String, nullable=False, default='kg')
    conversion_factor = Column(Float, nullable=False, default=1.0)

    crop = relationship("Crop")
    supplier = relationship("Contact")
    season = relationship("Season")

class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False, unique=True)
    current_stock_kg = Column(Float, default=0.0)
    average_cost_per_kg = Column(Float, default=0.0)
    low_stock_threshold = Column(Float, default=100.0)  # حد التنبيه للمخزون المنخفض

    crop = relationship("Crop")

class InventoryBatch(Base):
    """نموذج دفعات المخزون - لتتبع التكلفة والتواريخ لكل دفعة"""
    __tablename__ = "inventory_batches"

    batch_id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False)
    purchase_id = Column(Integer, ForeignKey("purchases.purchase_id"), nullable=True)  # اختياري، قد تكون رصيد افتتاحي
    
    quantity_kg = Column(Float, nullable=False)  # الكمية المتبقية الحالية
    original_quantity_kg = Column(Float, nullable=False)  # الكمية الأصلية
    cost_per_kg = Column(Float, nullable=False)  # التكلفة لكل كجم لهذه الدفعة
    
    purchase_date = Column(Date, nullable=False)  # تاريخ الشراء/الإضافة
    expiry_date = Column(Date, nullable=True)  # تاريخ الصلاحية
    
    supplier_id = Column(Integer, ForeignKey("contacts.contact_id"), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)  # تصبح False عندما تنفد الكمية
    created_at = Column(DateTime, default=datetime.utcnow)

    crop = relationship("Crop")
    purchase = relationship("Purchase")
    supplier = relationship("Contact")

class Sale(Base):
    __tablename__ = "sales"

    sale_id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("contacts.contact_id"), nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.season_id"), nullable=True)  # إضافة الموسم
    sale_date = Column(Date, nullable=False)
    quantity_sold_kg = Column(Float, nullable=False)
    selling_unit_price = Column(Float, nullable=False)
    selling_pricing_unit = Column(String, nullable=False)
    specific_selling_factor = Column(Float, nullable=False)
    total_sale_amount = Column(Float, nullable=False)
    amount_received = Column(Float, default=0.0)
    payment_status = Column(String, default='PENDING')
    notes = Column(Text, nullable=True)  # ملاحظات إضافية

    crop = relationship("Crop")
    customer = relationship("Contact")
    season = relationship("Season")

class GeneralLedger(Base):
    __tablename__ = "general_ledger"

    entry_id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, nullable=False)
    account_id = Column(Integer, ForeignKey("financial_accounts.account_id"), nullable=False)
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    description = Column(String)
    source_type = Column(String) # e.g., 'PURCHASE', 'SALE', 'CASH_RECEIPT', 'CASH_PAYMENT'
    source_id = Column(Integer) # e.g., purchase_id, sale_id
    created_at = Column(DateTime, default=datetime.utcnow)  # وقت الإنشاء

    account = relationship("FinancialAccount")

class Expense(Base):
    __tablename__ = "expenses"

    expense_id = Column(Integer, primary_key=True, index=True)
    expense_date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.season_id"), nullable=True)  # إضافة الموسم
    category = Column(String, nullable=True)  # فئة المصروف
    
    # The account that was credited (e.g., Cash, Bank)
    credit_account_id = Column(Integer, ForeignKey("financial_accounts.account_id"), nullable=False)
    # The expense account that was debited (e.g., Rent Expense, Fuel Expense)
    debit_account_id = Column(Integer, ForeignKey("financial_accounts.account_id"), nullable=False)
    
    supplier_id = Column(Integer, ForeignKey("contacts.contact_id"), nullable=True)

    credit_account = relationship("FinancialAccount", foreign_keys=[credit_account_id])
    debit_account = relationship("FinancialAccount", foreign_keys=[debit_account_id])
    supplier = relationship("Contact")
    season = relationship("Season")

class Payment(Base):
    """نموذج المدفوعات المحسّن"""
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    payment_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.contact_id"), nullable=False)
    payment_method = Column(String, nullable=False) # e.g., Cash, Bank Transfer, Check
    
    # حقول إضافية للتتبع
    reference_number = Column(String, nullable=True)  # رقم المرجع (شيك، حوالة)
    notes = Column(Text, nullable=True)  # ملاحظات
    created_at = Column(DateTime, default=datetime.utcnow)  # وقت الإنشاء

    # The account that was credited (e.g., Accounts Receivable)
    credit_account_id = Column(Integer, ForeignKey("financial_accounts.account_id"), nullable=False)
    # The account that was debited (e.g., Cash, Bank)
    debit_account_id = Column(Integer, ForeignKey("financial_accounts.account_id"), nullable=False)

    # Polymorphic relationship to link to either a Sale or a Purchase
    transaction_type = Column(String) # 'SALE' or 'PURCHASE'
    transaction_id = Column(Integer)

    contact = relationship("Contact")
    credit_account = relationship("FinancialAccount", foreign_keys=[credit_account_id])
    debit_account = relationship("FinancialAccount", foreign_keys=[debit_account_id])


class InventoryAdjustment(Base):
    __tablename__ = "inventory_adjustments"

    adjustment_id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False)
    adjustment_date = Column(Date, nullable=False)
    adjustment_type = Column(String, nullable=False) # 'SPOILAGE', 'SHORTAGE', 'SURPLUS'
    quantity_kg = Column(Float, nullable=False) # Negative for loss, Positive for gain
    cost_per_kg = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    notes = Column(String, nullable=True)

    crop = relationship("Crop")

class Season(Base):
    __tablename__ = "seasons"

    season_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False) # 'UPCOMING', 'ACTIVE', 'COMPLETED'
    description = Column(Text, nullable=True)  # وصف الموسم
    created_at = Column(DateTime, default=datetime.utcnow)

class SaleReturn(Base):
    __tablename__ = "sale_returns"

    return_id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.sale_id"), nullable=False)
    return_date = Column(Date, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    return_reason = Column(String, nullable=True)
    refund_amount = Column(Float, nullable=False)

    sale = relationship("Sale")

class PurchaseReturn(Base):
    __tablename__ = "purchase_returns"

    return_id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.purchase_id"), nullable=False)
    return_date = Column(Date, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    return_reason = Column(String, nullable=True)
    returned_cost = Column(Float, nullable=False)

    purchase = relationship("Purchase")

class DailyPrice(Base):
    __tablename__ = "daily_prices"

    price_id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False)
    price_date = Column(Date, nullable=False, index=True)
    opening_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    closing_price = Column(Float, nullable=False)
    average_price = Column(Float, nullable=False)
    trading_volume = Column(Float, default=0.0)
    market_condition = Column(String, nullable=True) # 'مرتفع', 'منخفض', 'مستقر'
    notes = Column(String, nullable=True)

    crop = relationship("Crop")


class CapitalAllocation(Base):
    """نموذج تخصيص رأس المال - لتتبع مساهمات وسحوبات الملاك"""
    __tablename__ = "capital_allocations"

    allocation_id = Column(Integer, primary_key=True, index=True)
    allocation_date = Column(Date, nullable=False)
    allocation_type = Column(String, nullable=False)  # 'CONTRIBUTION' or 'WITHDRAWAL'
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    reference_number = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)  # اسم المالك (للشركات المتعددة الملاك)
    season_id = Column(Integer, ForeignKey("seasons.season_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    season = relationship("Season")


class AuditLog(Base):
    """سجل التدقيق - لتتبع جميع العمليات المهمة"""
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, nullable=False)  # CREATE, UPDATE, DELETE
    table_name = Column(String, nullable=False)
    record_id = Column(Integer, nullable=False)
    old_values = Column(Text, nullable=True)  # JSON string
    new_values = Column(Text, nullable=True)  # JSON string
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)

    user = relationship("User", back_populates="audit_logs")


class Notification(Base):
    """نموذج التنبيهات"""
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Null means system-wide or for all admins
    type = Column(String, nullable=False)  # LOW_STOCK, OVERDUE_DEBT, EXPIRY, SYSTEM
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ============================================
# نظام المستخدمين والصلاحيات
# ============================================

class Role(Base):
    """نموذج الأدوار - لتحديد صلاحيات المستخدمين"""
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # admin, accountant, sales
    name_ar = Column(String, nullable=False)  # الاسم بالعربية
    description = Column(Text, nullable=True)
    permissions = Column(Text, nullable=False)  # JSON: ["sales:read", "sales:write", ...]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="role")


class User(Base):
    """نموذج المستخدمين"""
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    dashboard_config = Column(Text, nullable=True) # JSON: {"widgets": [...], "layout": ...}

    role = relationship("Role", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


class SupplyContract(Base):
    __tablename__ = "supply_contracts"

    contract_id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("contacts.contact_id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False)
    contract_date = Column(Date, nullable=False)
    delivery_date = Column(Date, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default='ACTIVE')  # ACTIVE, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Contact")
    crop = relationship("Crop")


class SupplierRating(Base):
    __tablename__ = "supplier_ratings"

    rating_id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("contacts.contact_id"), nullable=False)
    rating_date = Column(Date, default=datetime.utcnow)
    quality_score = Column(Integer, nullable=False)  # 1-5
    delivery_score = Column(Integer, nullable=False) # 1-5
    price_score = Column(Integer, nullable=False)    # 1-5
    notes = Column(Text, nullable=True)

    supplier = relationship("Contact")

