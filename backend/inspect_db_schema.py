import sqlite3
import os

db_path = r'd:\gemini\AgriculturalAccounting_Improved-test1\agricultural_accounting.db'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(sales)")
    columns = cursor.fetchall()
    print("Columns in 'sales' table:")
    for col in columns:
        print(col)
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
