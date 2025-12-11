import sqlite3
import os

db_path = r'd:\gemini\AgriculturalAccounting_Improved-test1\agricultural_accounting.db'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT * FROM sales ORDER BY sale_id DESC LIMIT 1")
    sale = cursor.fetchone()
    if sale:
        print("Latest Sale:", sale)
    else:
        print("No sales found.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
