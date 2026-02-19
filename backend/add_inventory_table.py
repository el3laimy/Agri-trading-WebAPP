import sqlite3
import os

DB_PATH = "../agricultural_accounting.db"

def add_inventory_batch_table():
    print(f"Connecting to {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_batches'")
        if not cursor.fetchone():
            print("Table 'inventory_batches' missing. Creating it...")
            cursor.execute("""
            CREATE TABLE inventory_batches (
                batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
                crop_id INTEGER NOT NULL,
                purchase_id INTEGER,
                quantity_kg FLOAT NOT NULL,
                original_quantity_kg FLOAT NOT NULL,
                cost_per_kg FLOAT NOT NULL,
                purchase_date DATE NOT NULL,
                expiry_date DATE,
                supplier_id INTEGER,
                notes TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(crop_id) REFERENCES crops(crop_id),
                FOREIGN KEY(purchase_id) REFERENCES purchases(purchase_id),
                FOREIGN KEY(supplier_id) REFERENCES contacts(contact_id)
            )
            """)
            print("Table created.")
            
            # Create index
            cursor.execute("CREATE INDEX ix_inventory_batches_batch_id ON inventory_batches (batch_id)")
            cursor.execute("CREATE INDEX ix_inventory_batches_crop_active ON inventory_batches (crop_id, is_active)")
            
        else:
            print("Table 'inventory_batches' already exists.")
            
        conn.commit()
        conn.close()
        print("Schema update complete.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_inventory_batch_table()
