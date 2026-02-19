import sqlite3
import shutil
import datetime
import os
import decimal

# Configure Global Decimal Context
decimal.getcontext().rounding = decimal.ROUND_HALF_UP

DB_PATH = "../agricultural_accounting.db"
BACKUP_DIR = "backups"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database file {DB_PATH} not found!")
        return

    # 1. Backup
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        
    backup_path = os.path.join(BACKUP_DIR, f"agri_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
    print(f"Backing up database to {backup_path}...")
    shutil.copyfile(DB_PATH, backup_path)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 2. Add Columns (Idempotent check)
    tables_columns = {
        "crops": [
            ("is_complex_unit", "BOOLEAN DEFAULT 0"),
            ("default_tare_per_bag", "NUMERIC(18, 4) DEFAULT 0"),
            ("standard_unit_weight", "NUMERIC(18, 4)")
        ],
        "purchases": [
            ("bag_count", "INTEGER DEFAULT 0"),
            ("tare_weight", "NUMERIC(18, 4) DEFAULT 0"),
            ("gross_quantity", "NUMERIC(18, 4)"),
            ("calculation_formula", "TEXT"),
            ("custom_conversion_factor", "NUMERIC(18, 4)")
        ],
        "sales": [
            ("bag_count", "INTEGER DEFAULT 0"),
            ("tare_weight", "NUMERIC(18, 4) DEFAULT 0"),
            ("gross_quantity", "NUMERIC(18, 4)"),
            ("calculation_formula", "TEXT"),
            ("custom_conversion_factor", "NUMERIC(18, 4)")
        ],
        "inventory": [
             ("gross_stock_kg", "NUMERIC(18, 4) DEFAULT 0"),
             ("net_stock_kg", "NUMERIC(18, 4) DEFAULT 0"),
             ("bag_count", "INTEGER DEFAULT 0")
        ],
        "inventory_batches": [
             ("gross_quantity_kg", "NUMERIC(18, 4) DEFAULT 0"),
             ("bag_count", "INTEGER DEFAULT 0")
        ]
    }

    for table, columns in tables_columns.items():
        print(f"Updating table {table}...")
        for col_name, col_type in columns:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
                print(f"  Added {col_name}")
            except sqlite3.OperationalError as e:
                # Check for various 'duplicate column' error messages from SQLite
                if "duplicate column name" in str(e).lower():
                    print(f"  Column {col_name} already exists.")
                else:
                    print(f"  Error adding {col_name}: {e}")
                    # Decide whether to raise or continue. For now, we continue if it's just a column add issue.
                    # But if table doesn't exist, it will fail differently.
    
    # 3. Data Initialization
    print("Initializing Data...")
    
    try:
        # Inventory: Set gross and net to current_stock
        # Using simple SQL update. Logic: If gross is 0 (default), set it to current.
        # But caution: what if real gross is actually 0? 
        # Better: Set gross = current for ALL rows where we just added the column (which defaults to 0).
        # Since we're migrating, we assume previous data didn't have gross/net separation.
        
        print("Migrating Inventory...")
        cursor.execute("""
            UPDATE inventory 
            SET gross_stock_kg = current_stock_kg, 
                net_stock_kg = current_stock_kg 
            WHERE gross_stock_kg = 0 AND current_stock_kg != 0
        """)
        
        print("Migrating Inventory Batches...")
        cursor.execute("""
            UPDATE inventory_batches 
            SET gross_quantity_kg = quantity_kg 
            WHERE gross_quantity_kg = 0 AND quantity_kg != 0
        """)
        
        # Determine if we need to update Sales/Purchases?
        # For old purchases, gross = quantity_kg (net).
        print("Migrating Purchases...")
        cursor.execute("""
            UPDATE purchases 
            SET gross_quantity = quantity_kg 
            WHERE gross_quantity IS NULL OR gross_quantity = 0
        """)

        print("Migrating Sales...")
        cursor.execute("""
            UPDATE sales 
            SET gross_quantity = quantity_sold_kg 
            WHERE gross_quantity IS NULL OR gross_quantity = 0
        """)

        conn.commit()
        print("Data Initialization Completed.")

    except Exception as e:
        print(f"Error during data initialization: {e}")
        conn.rollback()
        raise e

    conn.close()
    print("Migration Completed Successfully.")

if __name__ == "__main__":
    migrate()
