import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models, schemas, crud
from app.services import sales, purchasing, inventory
from datetime import date
from decimal import Decimal

# Setup in-memory DB for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Create Dummy User and Settings if needed
    user = models.User(username="test", password_hash="test", full_name="Test", role_id=1)
    session.add(user)
    
    # Create Accounts
    accounts = [
        models.FinancialAccount(account_id=1, account_name="Cash", account_type="CASH"),
        models.FinancialAccount(account_id=2, account_name="Inventory", account_type="INVENTORY"),
        models.FinancialAccount(account_id=3, account_name="Sales Revenue", account_type="REVENUE"),
        models.FinancialAccount(account_id=4, account_name="COGS", account_type="EXPENSE"),
        models.FinancialAccount(account_id=5, account_name="Accounts Receivable", account_type="RECEIVABLE"),
        models.FinancialAccount(account_id=6, account_name="Accounts Payable", account_type="PAYABLE"),
    ]
    session.add_all(accounts)
    
    # Add Settings
    settings = [
        models.Settings(key="CASH_ACCOUNT_ID", value="1"),
        models.Settings(key="INVENTORY_ACCOUNT_ID", value="2"),
        models.Settings(key="SALES_REVENUE_ACCOUNT_ID", value="3"),
        models.Settings(key="COGS_ACCOUNT_ID", value="4"),
        models.Settings(key="ACCOUNTS_RECEIVABLE_ID", value="5"),
        models.Settings(key="ACCOUNTS_PAYABLE_ID", value="6"),
    ]
    session.add_all(settings)
    session.commit()
    
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_physical_stock_flow(db):
    # 1. Setup Data
    crop = models.Crop(
        crop_name="Wheat", 
        allowed_pricing_units='["kg", "bag"]', 
        conversion_factors='{"kg": 1, "bag": 50}'
    )
    supplier = models.Contact(name="Supplier 1", is_supplier=True)
    customer = models.Contact(name="Customer 1", is_customer=True)
    season = models.Season(name="Season 1", start_date=date.today(), end_date=date.today(), status="ACTIVE")
    
    db.add_all([crop, supplier, customer, season])
    db.commit()
    
    # 2. PURCHASE: 1000kg Gross, 50kg Tare, 950kg Net. 20 Bags.
    # Expected: Inventory should have Gross=1000, Net=950, Bags=20
    purchase_data = schemas.PurchaseCreate(
        crop_id=crop.crop_id,
        supplier_id=supplier.contact_id,
        purchase_date=date.today(),
        quantity_kg=Decimal(950), # Net
        unit_price=Decimal(10),
        gross_quantity=Decimal(1000), # Gross
        tare_weight=Decimal(50),
        bag_count=20,
        notes="Test Purchase",
        purchasing_pricing_unit="kg",
        conversion_factor=Decimal(1)
    )
    
    print("\n--- Executing Purchase ---")
    purchasing.create_new_purchase(db, purchase_data, user_id=1)
    
    inv = db.query(models.Inventory).filter_by(crop_id=crop.crop_id).first()
    print(f"Inventory After Purchase: Net={inv.net_stock_kg}, Gross={inv.gross_stock_kg}, Bags={inv.bag_count}")
    
    # VERIFY PURCHASE IMPACT
    assert inv.net_stock_kg == 950
    # Current BUG in purchasing.py: uses quantity_kg (950) as gross, and ignores tare/bags usually or defaults wrong
    # We expect these assertions to FAIL before the fix
    assert inv.gross_stock_kg == 1000 
    assert inv.bag_count == 20
    
    # 3. SALE: 475kg Net. 500kg Gross. 10 Bags.
    # Expected: Inventory should reduce by these amounts.
    sale_data = schemas.SaleCreate(
        crop_id=crop.crop_id,
        customer_id=customer.contact_id,
        sale_date=date.today(),
        quantity_sold_kg=Decimal(475), # Net
        selling_unit_price=Decimal(15),
        selling_pricing_unit="kg",
        specific_selling_factor=Decimal(1),
        gross_quantity=Decimal(500),
        tare_weight=Decimal(25),
        bag_count=10,
        total_sale_amount=Decimal(475*15)
    )
    
    print("\n--- Executing Sale ---")
    sales.create_new_sale(db, sale_data, user_id=1)
    
    db.refresh(inv)
    print(f"Inventory After Sale: Net={inv.net_stock_kg}, Gross={inv.gross_stock_kg}, Bags={inv.bag_count}")
    
    # VERIFY SALE IMPACT
    assert inv.net_stock_kg == 950 - 475 # 475
    # Current BUG in sales.py: does not reduce gross/bags
    assert inv.gross_stock_kg == 1000 - 500 # 500
    assert inv.bag_count == 20 - 10 # 10
