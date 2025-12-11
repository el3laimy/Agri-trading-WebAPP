import sqlite3
import os

db_path = r'../agricultural_accounting.db'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("--- Purchases ---")
    cursor.execute("SELECT purchase_id, crop_id, quantity_kg, total_cost FROM purchases")
    for row in cursor.fetchall():
        print(row)

    print("\n--- Sales ---")
    cursor.execute("SELECT sale_id, crop_id, quantity_sold_kg, total_sale_amount FROM sales")
    for row in cursor.fetchall():
        print(row)

    print("\n--- Inventory ---")
    cursor.execute("SELECT inventory_id, crop_id, current_stock_kg FROM inventory")
    for row in cursor.fetchall():
        print(row)

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
