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
        # Check if columns exist
        cursor.execute("PRAGMA table_info(purchases)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "purchasing_pricing_unit" not in columns:
            print("Adding purchasing_pricing_unit column...")
            cursor.execute("ALTER TABLE purchases ADD COLUMN purchasing_pricing_unit TEXT DEFAULT 'kg' NOT NULL")
        else:
            print("purchasing_pricing_unit column already exists.")

        if "conversion_factor" not in columns:
            print("Adding conversion_factor column...")
            cursor.execute("ALTER TABLE purchases ADD COLUMN conversion_factor REAL DEFAULT 1.0 NOT NULL")
        else:
            print("conversion_factor column already exists.")

        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
