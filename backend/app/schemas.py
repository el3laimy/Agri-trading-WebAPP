from pydantic import BaseModel, ConfigDict, field_validator
import json
from typing import Optional, Dict, List
from datetime import date

# --- Base Schemas ---
class CropBase(BaseModel):
    crop_name: str
    is_active: Optional[bool] = True

class ContactBase(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    is_supplier: Optional[bool] = False
    is_customer: Optional[bool] = False

# --- Crop Schemas ---
class CropCreate(CropBase):
    allowed_pricing_units: List[str]
    conversion_factors: Dict[str, float]

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

# --- Contact Schemas ---
class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    contact_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Financial Account Schemas ---
class FinancialAccountBase(BaseModel):
    account_name: str
    account_type: str

class FinancialAccountCreate(FinancialAccountBase):
    current_balance: float = 0.0

class FinancialAccountUpdate(FinancialAccountBase):
    is_active: Optional[bool] = None

class FinancialAccount(FinancialAccountBase):
    account_id: int
    current_balance: float
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

# --- General Ledger Schemas ---
class GeneralLedgerBase(BaseModel):
    entry_date: date
    account_id: int
    debit: float = 0.0
    credit: float = 0.0
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
    quantity_kg: float
    unit_price: float
    purchasing_pricing_unit: str = 'kg'
    conversion_factor: float = 1.0
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    amount_paid: Optional[float] = 0.0

class PurchaseRead(PurchaseBase):
    purchase_id: int
    total_cost: float
    amount_paid: float
    payment_status: str
    crop: Crop
    supplier: Contact
    model_config = ConfigDict(from_attributes=True)


# --- Sale Schemas ---
class SaleBase(BaseModel):
    crop_id: int
    customer_id: int
    sale_date: date
    quantity_sold_kg: float
    selling_unit_price: float
    selling_pricing_unit: str
    specific_selling_factor: float

class SaleCreate(SaleBase):
    amount_received: Optional[float] = 0.0

class SaleRead(SaleBase):
    sale_id: int
    total_sale_amount: float
    amount_received: float
    payment_status: str
    crop: Crop
    customer: Contact
    model_config = ConfigDict(from_attributes=True)

# --- Expense Schemas ---
class ExpenseBase(BaseModel):
    expense_date: date
    description: str
    amount: float
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
    amount: float
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
    current_stock_kg: float
    average_cost_per_kg: float
    crop: Crop
    model_config = ConfigDict(from_attributes=True)

# --- Inventory Adjustment Schemas ---
class InventoryAdjustmentBase(BaseModel):
    crop_id: int
    adjustment_date: date
    adjustment_type: str
    quantity_kg: float
    notes: Optional[str] = None

class InventoryAdjustmentCreate(InventoryAdjustmentBase):
    pass

class InventoryAdjustmentRead(InventoryAdjustmentBase):
    adjustment_id: int
    cost_per_kg: float
    total_value: float
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
    quantity_kg: float
    return_reason: Optional[str] = None

class SaleReturnCreate(SaleReturnBase):
    pass

class SaleReturnRead(SaleReturnBase):
    return_id: int
    refund_amount: float
    sale: SaleRead
    model_config = ConfigDict(from_attributes=True)

# --- Purchase Return Schemas ---
class PurchaseReturnBase(BaseModel):
    purchase_id: int
    return_date: date
    quantity_kg: float
    return_reason: Optional[str] = None

class PurchaseReturnCreate(PurchaseReturnBase):
    pass

class PurchaseReturnRead(PurchaseReturnBase):
    return_id: int
    returned_cost: float
    purchase: PurchaseRead
    model_config = ConfigDict(from_attributes=True)

# --- Daily Price Schemas ---
class DailyPriceBase(BaseModel):
    crop_id: int
    price_date: date
    opening_price: float
    high_price: float
    low_price: float
    closing_price: float
    average_price: float
    trading_volume: Optional[float] = 0.0
    market_condition: Optional[str] = None
    notes: Optional[str] = None

class DailyPriceCreate(DailyPriceBase):
    pass

class DailyPriceRead(DailyPriceBase):
    price_id: int
    crop: Crop
    model_config = ConfigDict(from_attributes=True)

class TreasurySummary(BaseModel):
    opening_balance: float
    total_in_today: float
    total_out_today: float
    closing_balance: float
    current_balance: float # Kept for backward compatibility or general status

class TreasuryTransaction(BaseModel):
    transaction_id: int
    date: date
    description: str
    amount: float
    type: str  # 'IN' or 'OUT'
    source: Optional[str] = None

class AccountStatementEntry(BaseModel):
    """سطر واحد في كشف الحساب"""
    date: date
    description: str
    reference_type: str  # 'SALE', 'PURCHASE', 'PAYMENT', 'OPENING'
    reference_id: Optional[int] = None
    debit: float = 0.0
    credit: float = 0.0
    balance: float = 0.0
    # الحقول الجديدة لتفاصيل المعاملة
    crop_name: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    unit: Optional[str] = None

class ContactSummary(BaseModel):
    """ملخص مالي لجهة التعامل"""
    contact_id: int
    contact_name: str
    contact_type: str  # 'CUSTOMER', 'SUPPLIER', 'BOTH'
    total_sales: float = 0.0
    total_purchases: float = 0.0
    total_received: float = 0.0
    total_paid: float = 0.0
    balance_due: float = 0.0  # المستحق علينا أو لنا

class AccountStatement(BaseModel):
    """كشف حساب كامل"""
    contact: Contact
    summary: ContactSummary
    opening_balance: float
    entries: List[AccountStatementEntry]
    closing_balance: float
    start_date: date
    end_date: date

# --- Capital Distribution Schemas ---
class CapitalDistributionReport(BaseModel):
    """تقرير توزيع رأس المال"""
    report_date: date
    
    # الجانب الأيمن (استخدامات التمويل)
    cash_in_hand: float = 0.0           # النقدية
    inventory_value: float = 0.0        # قيمة المخزون
    accounts_receivable: float = 0.0    # ديون لنا (العملاء)
    total_assets: float = 0.0           # إجمالي الأصول
    
    # الجانب الأيسر (مصادر التمويل)
    owner_capital: float = 0.0          # رأس المال الأصلي
    net_profit: float = 0.0             # صافي الربح
    accounts_payable: float = 0.0       # الديون علينا (الموردين)
    total_liabilities_and_equity: float = 0.0
    
    # التحقق من التوازن
    is_balanced: bool = False
    difference: float = 0.0

# --- Treasury Quick Actions Schemas ---
class CashReceiptCreate(BaseModel):
    """إيصال قبض نقدي"""
    receipt_date: date
    amount: float
    contact_id: Optional[int] = None
    description: str
    reference_number: Optional[str] = None

class CashPaymentCreate(BaseModel):
    """إيصال صرف نقدي"""
    payment_date: date
    amount: float
    contact_id: Optional[int] = None
    description: str
    reference_number: Optional[str] = None

class QuickExpenseCreate(BaseModel):
    """تسجيل مصروف سريع"""
    expense_date: date
    amount: float
    description: str
    category: Optional[str] = None

class TreasuryVoucher(BaseModel):
    """إيصال الخزينة"""
    voucher_id: int
    voucher_type: str  # 'RECEIPT' or 'PAYMENT'
    voucher_date: date
    amount: float
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
    quantity_kg: float
    price_per_kg: float
    status: Optional[str] = 'ACTIVE'
    notes: Optional[str] = None

class SupplyContractCreate(SupplyContractBase):
    pass

class SupplyContractRead(SupplyContractBase):
    contract_id: int
    total_amount: float
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
    amount: float
    description: str
    owner_name: str
    reference_number: Optional[str] = None
    season_id: Optional[int] = None

    @field_validator('type')
    def validate_type(cls, v):
        if v not in ('CONTRIBUTION', 'WITHDRAWAL'):
            raise ValueError('يجب أن يكون النوع مساهمة (CONTRIBUTION) أو سحب (WITHDRAWAL)')
        return v

