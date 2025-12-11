import sqlite3
import os

DB_PATH = "../agricultural_accounting.db"

def fix_schema():
    print(f"Connecting to {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(inventory)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "low_stock_threshold" not in columns:
            print("Column 'low_stock_threshold' missing. Adding it...")
            cursor.execute("ALTER TABLE inventory ADD COLUMN low_stock_threshold FLOAT DEFAULT 100.0")
            print("Column added.")
        else:
            print("Column 'low_stock_threshold' already exists.")

        # Check notification table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
        if not cursor.fetchone():
            print("Table 'notifications' missing. Creating it...")
            cursor.execute("""
            CREATE TABLE notifications (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                type VARCHAR NOT NULL,
                title VARCHAR NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                action_url VARCHAR,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            )
            """)
            print("Table created.")
        else:
            print("Table 'notifications' already exists.")
            
        conn.commit()
        conn.close()
        print("Schema fix complete.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_schema()
