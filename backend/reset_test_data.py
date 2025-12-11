import sqlite3
import os

db_path = r'../agricultural_accounting.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Cleaning up test data...")
    # Delete dependent data first
    cursor.execute("DELETE FROM sales")
    cursor.execute("DELETE FROM purchases")
    cursor.execute("DELETE FROM inventory")
    cursor.execute("DELETE FROM inventory_adjustments")
    cursor.execute("DELETE FROM sale_returns")
    cursor.execute("DELETE FROM purchase_returns")
    cursor.execute("DELETE FROM daily_prices")
    
    # Delete master data
    cursor.execute("DELETE FROM crops")
    cursor.execute("DELETE FROM contacts")
    cursor.execute("DELETE FROM seasons")
    
    # Reset sequences (optional, skipped)
    # cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('sales', 'purchases', 'inventory', 'crops', 'contacts', 'seasons')")

    conn.commit()
    print("Cleanup successful.")

except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    conn.close()
