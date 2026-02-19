import sqlite3
import os

DB_PATH = "agricultural_accounting.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Create supply_contracts table
        print("Creating supply_contracts table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS supply_contracts (
            contract_id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER NOT NULL,
            crop_id INTEGER NOT NULL,
            contract_date DATE NOT NULL,
            delivery_date DATE NOT NULL,
            quantity_kg REAL NOT NULL,
            price_per_kg REAL NOT NULL,
            total_amount REAL NOT NULL,
            status VARCHAR DEFAULT 'ACTIVE',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES contacts (contact_id),
            FOREIGN KEY (crop_id) REFERENCES crops (crop_id)
        )
        """)

        # Create supplier_ratings table
        print("Creating supplier_ratings table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS supplier_ratings (
            rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER NOT NULL,
            rating_date DATE DEFAULT (DATE('now')),
            quality_score INTEGER NOT NULL,
            delivery_score INTEGER NOT NULL,
            price_score INTEGER NOT NULL,
            notes TEXT,
            FOREIGN KEY (supplier_id) REFERENCES contacts (contact_id)
        )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON supply_contracts(supplier_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ratings_supplier ON supplier_ratings(supplier_id)")

        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
