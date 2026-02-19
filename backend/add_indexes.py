from sqlalchemy import create_engine, text, inspect
from app.database import SQLALCHEMY_DATABASE_URL

def add_index_if_not_exists(connection, table_name, index_name, column_name):
    inspector = inspect(connection)
    indexes = inspector.get_indexes(table_name)
    existing_index_names = [idx['name'] for idx in indexes]

    if index_name not in existing_index_names:
        print(f"Adding index {index_name} to table {table_name} on column {column_name}...")
        try:
            connection.execute(text(f"CREATE INDEX {index_name} ON {table_name} ({column_name});"))
            print(f"Index {index_name} added successfully.")
        except Exception as e:
            print(f"Failed to add index {index_name}: {e}")
    else:
        print(f"Index {index_name} already exists on {table_name}.")

def main():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        # Transactions: Date is critical for reporting
        add_index_if_not_exists(connection, "sales", "ix_sales_sale_date", "sale_date")
        add_index_if_not_exists(connection, "purchases", "ix_purchases_purchase_date", "purchase_date")
        add_index_if_not_exists(connection, "expenses", "ix_expenses_expense_date", "expense_date")
        add_index_if_not_exists(connection, "payments", "ix_payments_payment_date", "payment_date")
        
        # Foreign Keys often used in filtering/grouping (some DBs index these auto, but explicit is good)
        add_index_if_not_exists(connection, "sales", "ix_sales_customer_id", "customer_id")
        add_index_if_not_exists(connection, "purchases", "ix_purchases_supplier_id", "supplier_id")
        add_index_if_not_exists(connection, "expenses", "ix_expenses_category", "category")
        
        # Financial Accounts
        add_index_if_not_exists(connection, "financial_accounts", "ix_financial_accounts_account_type", "account_type")
        
        # Inventory
        # crop_id is usually indexed by FK or unique constraint, but checking anyway if strict filtering by crop is heavy
        # Base model has crop_id indexed on Crop table, but not implicitly on child tables for non-FK lookups? 
        # Actually FK creates constraint, but index helps.
        add_index_if_not_exists(connection, "inventory_batches", "ix_inventory_batches_expiry_date", "expiry_date")

        connection.commit()
    print("Index optimization complete.")

if __name__ == "__main__":
    main()
