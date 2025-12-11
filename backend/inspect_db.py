import sqlite3
import os

db_path = 'agricultural_accounting.db'
if not os.path.exists(db_path):
    print(f"Database file {db_path} not found!")
else:
    print(f"Inspecting {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(contacts)")
        columns = cursor.fetchall()
        if not columns:
            print("Table 'contacts' not found!")
        else:
            print("Columns in 'contacts' table:")
            for col in columns:
                print(col)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
