from pydantic import BaseModel, ConfigDict, field_validator
import json
from typing import Optional, Dict, List
from datetime import date
from decimal import Decimal

# --- Base Schemas ---
class CropBase(BaseModel):
    crop_name: str
    is_active: Optional[bool] = True
    # New Fields
    is_complex_unit: Optional[bool] = False
    default_tare_per_bag: Optional[Decimal] = Decimal(0)
    standard_unit_weight: Optional[Decimal] = None

class ContactBase(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    is_supplier: Optional[bool] = False
    is_customer: Optional[bool] = False

class UserSummary(BaseModel):
    user_id: int
    full_name: str
    username: str
    model_config = ConfigDict(from_attributes=True)

# --- Crop Schemas ---
class CropCreate(CropBase):
    allowed_pricing_units: List[str]
    conversion_factors: Dict[str, float] # Keep float for simple factors in JSON, or custom validator

class Crop(CropBase):
    crop_id: int
    allowed_pricing_units: List[str]
    conversion_factors: Dict[str, float]
    model_config = ConfigDict(from_attributes=True)

    @field_validator('allowed_pricing_units', 'conversion_factors', mode='before')
    @classmethod
    def parse_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return v
        return v

class CropMigrationRequest(BaseModel):
    target_crop_id: int

# --- Contact Schemas ---
class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    contact_id: int
    model_config = ConfigDict(from_attributes=True)

class ContactMigrationRequest(BaseModel):
    target_contact_id: int

# --- Financial Account Schemas ---
class FinancialAccountBase(BaseModel):
    account_name: str
    account_type: str

class FinancialAccountCreate(FinancialAccountBase):
    current_balance: Decimal = Decimal(0.0)

class FinancialAccountUpdate(FinancialAccountBase):
    is_active: Optional[bool] = None

class FinancialAccount(FinancialAccountBase):
    account_id: int
    current_balance: Decimal
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

# --- General Ledger Schemas ---
class GeneralLedgerBase(BaseModel):
    entry_date: date
    account_id: int
    debit: Decimal = Decimal(0.0)
    credit: Decimal = Decimal(0.0)
    description: Optional[str] = None

class GeneralLedgerCreate(GeneralLedgerBase):
    pass

class GeneralLedger(GeneralLedgerBase):
    entry_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Purchase Schemas ---
class PurchaseBase(BaseModel):
    crop_id: int
    supplier_id: int
    purchase_date: date
    quantity_kg: Decimal
    unit_price: Decimal
    purchasing_pricing_unit: str = 'kg'
    conversion_factor: Decimal = Decimal(1.0)
    notes: Optional[str] = None
    # New Fields
    bag_count: Optional[int] = 0
    tare_weight: Optional[Decimal] = Decimal(0)
    gross_quantity: Optional[Decimal] = None
    calculation_formula: Optional[str] = None
    custom_conversion_factor: Optional[Decimal] = None

class PurchaseCreate(PurchaseBase):
    amount_paid: Optional[Decimal] = Decimal(0.0)

class PurchaseRead(PurchaseBase):
    purchase_id: int
    total_cost: Decimal
    amount_paid: Decimal
    payment_status: str
    crop: Crop
    supplier: Contact
    creator: Optional[UserSummary] = None
    model_config = ConfigDict(from_attributes=True)


# --- Sale Schemas ---
class SaleBase(BaseModel):
    crop_id: int
    customer_id: int
    sale_date: date
    quantity_sold_kg: Decimal
    selling_unit_price: Decimal
    selling_pricing_unit: str
    specific_selling_factor: Decimal
    # New Fields
    bag_count: Optional[int] = 0
    tare_weight: Optional[Decimal] = Decimal(0)
    gross_quantity: Optional[Decimal] = None
    calculation_formula: Optional[str] = None
    custom_conversion_factor: Optional[Decimal] = None

class SaleCreate(SaleBase):
    amount_received: Optional[Decimal] = Decimal(0.0)

class SaleRead(SaleBase):
    sale_id: int
    total_sale_amount: Decimal
    amount_received: Decimal
    payment_status: str
    crop: Crop
    customer: Contact
    creator: Optional[UserSummary] = None
    model_config = ConfigDict(from_attributes=True)

# --- Expense Schemas ---
class ExpenseBase(BaseModel):
    expense_date: date
    description: str
    amount: Decimal
    credit_account_id: int
    debit_account_id: int
    supplier_id: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseRead(ExpenseBase):
    expense_id: int
    credit_account: FinancialAccount
    debit_account: FinancialAccount
    supplier: Optional[Contact] = None
    model_config = ConfigDict(from_attributes=True)

# --- Payment Schemas ---
class PaymentBase(BaseModel):
    payment_date: date
    amount: Decimal
    contact_id: int
    payment_method: str
    credit_account_id: int
    debit_account_id: int
    transaction_type: str
    transaction_id: int

class PaymentCreate(PaymentBase):
    pass

class PaymentRead(PaymentBase):
    payment_id: int
    contact: Contact
    credit_account: FinancialAccount
    debit_account: FinancialAccount
    model_config = ConfigDict(from_attributes=True)

# --- Inventory Schemas ---
class InventoryRead(BaseModel):
    current_stock_kg: Decimal
    average_cost_per_kg: Decimal
    # New Fields
    gross_stock_kg: Decimal = Decimal(0)
    net_stock_kg: Decimal = Decimal(0)
    bag_count: int = 0
    
    crop: Crop
    model_config = ConfigDict(from_attributes=True)

# --- Inventory Adjustment Schemas ---
class InventoryAdjustmentBase(BaseModel):
    crop_id: int
    adjustment_date: date
    adjustment_type: str
    quantity_kg: Decimal
    notes: Optional[str] = None

class InventoryAdjustmentCreate(InventoryAdjustmentBase):
    pass

class InventoryAdjustmentRead(InventoryAdjustmentBase):
    adjustment_id: int
    cost_per_kg: Decimal
    total_value: Decimal
    crop: Crop
    model_config = ConfigDict(from_attributes=True)

# --- Season Schemas ---
class SeasonBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    status: str  # 'UPCOMING', 'ACTIVE', 'COMPLETED'

class SeasonCreate(SeasonBase):
    pass

class SeasonUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class SeasonRead(SeasonBase):
    season_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Sale Return Schemas ---
class SaleReturnBase(BaseModel):
    sale_id: int
    return_date: date
    quantity_kg: Decimal
    return_reason: Optional[str] = None

class SaleReturnCreate(SaleReturnBase):
    pass

class SaleReturnRead(SaleReturnBase):
    return_id: int
    refund_amount: Decimal
    sale: SaleRead
    model_config = ConfigDict(from_attributes=True)

# --- Purchase Return Schemas ---
class PurchaseReturnBase(BaseModel):
    purchase_id: int
    return_date: date
    quantity_kg: Decimal
    return_reason: Optional[str] = None

class PurchaseReturnCreate(PurchaseReturnBase):
    pass

class PurchaseReturnRead(PurchaseReturnBase):
    return_id: int
    returned_cost: Decimal
    purchase: PurchaseRead
    model_config = ConfigDict(from_attributes=True)

# --- Daily Price Schemas ---
class DailyPriceBase(BaseModel):
    crop_id: int
    price_date: date
    opening_price: Decimal
    high_price: Decimal
    low_price: Decimal
    closing_price: Decimal
    average_price: Decimal
    trading_volume: Optional[Decimal] = Decimal(0.0)
    market_condition: Optional[str] = None
    notes: Optional[str] = None

class DailyPriceCreate(DailyPriceBase):
    pass

class DailyPriceRead(DailyPriceBase):
    price_id: int
    crop: Crop
    model_config = ConfigDict(from_attributes=True)

class TreasurySummary(BaseModel):
    opening_balance: Decimal
    total_in_today: Decimal
    total_out_today: Decimal
    closing_balance: Decimal
    current_balance: Decimal 

class TreasuryTransaction(BaseModel):
    transaction_id: int
    date: date
    description: str
    amount: Decimal
    type: str  # 'IN' or 'OUT'
    source: Optional[str] = None
    contact_name: Optional[str] = None

class AccountStatementEntry(BaseModel):
    """سطر واحد في كشف الحساب"""
    date: date
    description: str
    reference_type: str  # 'SALE', 'PURCHASE', 'PAYMENT', 'OPENING'
    reference_id: Optional[int] = None
    debit: Decimal = Decimal(0.0)
    credit: Decimal = Decimal(0.0)
    balance: Decimal = Decimal(0.0)
    
    crop_name: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    unit: Optional[str] = None

class ContactSummary(BaseModel):
    """ملخص مالي لجهة التعامل"""
    contact_id: int
    contact_name: str
    contact_type: str  # 'CUSTOMER', 'SUPPLIER', 'BOTH'
    total_sales: Decimal = Decimal(0.0)
    total_purchases: Decimal = Decimal(0.0)
    total_received: Decimal = Decimal(0.0)
    total_paid: Decimal = Decimal(0.0)
    balance_due: Decimal = Decimal(0.0)

class AccountStatement(BaseModel):
    """كشف حساب كامل"""
    contact: Contact
    summary: ContactSummary
    opening_balance: Decimal
    entries: List[AccountStatementEntry]
    closing_balance: Decimal
    start_date: date
    end_date: date

# --- Capital Distribution Schemas ---
class CapitalDistributionReport(BaseModel):
    """تقرير توزيع رأس المال"""
    report_date: date
    
    # الجانب الأيمن (استخدامات التمويل)
    cash_in_hand: Decimal = Decimal(0.0)
    inventory_value: Decimal = Decimal(0.0)
    accounts_receivable: Decimal = Decimal(0.0)
    total_assets: Decimal = Decimal(0.0)
    
    # الجانب الأيسر (مصادر التمويل)
    owner_capital: Decimal = Decimal(0.0)
    net_profit: Decimal = Decimal(0.0)
    accounts_payable: Decimal = Decimal(0.0)
    total_liabilities_and_equity: Decimal = Decimal(0.0)
    
    # التحقق من التوازن
    is_balanced: bool = False
    difference: Decimal = Decimal(0.0)

# --- Treasury Quick Actions Schemas ---
class CashReceiptCreate(BaseModel):
    """إيصال قبض نقدي"""
    receipt_date: date
    amount: Decimal
    contact_id: Optional[int] = None
    description: str
    reference_number: Optional[str] = None

class CashPaymentCreate(BaseModel):
    """إيصال صرف نقدي"""
    payment_date: date
    amount: Decimal
    contact_id: Optional[int] = None
    description: str
    reference_number: Optional[str] = None

class QuickExpenseCreate(BaseModel):
    """تسجيل مصروف سريع"""
    expense_date: date
    amount: Decimal
    description: str
    category: Optional[str] = None

class TreasuryVoucher(BaseModel):
    """إيصال الخزينة"""
    voucher_id: int
    voucher_type: str  # 'RECEIPT' or 'PAYMENT'
    voucher_date: date
    amount: Decimal
    description: str
    contact_name: Optional[str] = None
    reference_number: Optional[str] = None
    created_at: Optional[date] = None


# --- Supplier Contract Schemas ---
class SupplyContractBase(BaseModel):
    supplier_id: int
    crop_id: int
    contract_date: date
    delivery_date: date
    quantity_kg: Decimal
    price_per_kg: Decimal
    status: Optional[str] = 'ACTIVE'
    notes: Optional[str] = None

class SupplyContractCreate(SupplyContractBase):
    pass

class SupplyContractRead(SupplyContractBase):
    contract_id: int
    total_amount: Decimal
    supplier: Contact
    crop: Crop
    model_config = ConfigDict(from_attributes=True)

# --- Supplier Rating Schemas ---
class SupplierRatingBase(BaseModel):
    supplier_id: int
    rating_date: date
    quality_score: int
    delivery_score: int
    price_score: int
    notes: Optional[str] = None

class SupplierRatingCreate(SupplierRatingBase):
    pass

class SupplierRatingRead(SupplierRatingBase):
    rating_id: int
    supplier: Contact
    model_config = ConfigDict(from_attributes=True)

# --- Capital Management Schemas ---
class CapitalTransactionCreate(BaseModel):
    """بيانات حركة رأس المال"""
    transaction_date: date
    type: str # 'CONTRIBUTION' or 'WITHDRAWAL'
    amount: Decimal
    description: str
    owner_name: str
    reference_number: Optional[str] = None
    season_id: Optional[int] = None

    @field_validator('type')
    def validate_type(cls, v):
        if v not in ('CONTRIBUTION', 'WITHDRAWAL'):
            raise ValueError('يجب أن يكون النوع مساهمة (CONTRIBUTION) أو سحب (WITHDRAWAL)')
        return v
