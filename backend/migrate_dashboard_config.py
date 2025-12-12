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
        print("Adding dashboard_config column to users table...")
        # Check if column exists first
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "dashboard_config" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN dashboard_config TEXT")
            print("Column 'dashboard_config' added successfully.")
        else:
            print("Column 'dashboard_config' already exists.")

        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
