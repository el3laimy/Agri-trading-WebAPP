"""
Comprehensive migration script to add ALL missing columns to expenses table
Based on Expense model in models.py lines 186-220
"""
import sqlite3
import os

# The correct database path
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'agricultural_accounting.db')
print(f"Database path: {db_path}")

if not os.path.exists(db_path):
    print(f"ERROR: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check expenses table structure
cursor.execute("PRAGMA table_info(expenses)")
existing_columns = {col[1]: col for col in cursor.fetchall()}
print(f"Existing expenses columns: {list(existing_columns.keys())}")

# All columns that should exist based on the Expense model
# expense_id, expense_date, description, amount are already there (core columns)
required_columns = {
    'expense_type': "TEXT DEFAULT 'INDIRECT'",
    'category': "TEXT",
    'crop_id': "INTEGER",
    'season_id': "INTEGER",
    'credit_account_id': "INTEGER",
    'debit_account_id': "INTEGER",
    'supplier_id': "INTEGER",
    'created_by': "INTEGER",
    'created_at': "DATETIME"
}

changes_made = 0
for col_name, col_type in required_columns.items():
    if col_name not in existing_columns:
        print(f"Adding column: {col_name} ({col_type})...")
        try:
            cursor.execute(f"ALTER TABLE expenses ADD COLUMN {col_name} {col_type}")
            print(f"  ✅ {col_name} added successfully!")
            changes_made += 1
        except Exception as e:
            print(f"  ❌ Error adding {col_name}: {e}")
    else:
        print(f"Column {col_name} already exists")

conn.commit()
print(f"\n{'='*50}")
print(f"✅ Migration complete! {changes_made} column(s) added.")

# Verify final structure
cursor.execute("PRAGMA table_info(expenses)")
final_columns = [col[1] for col in cursor.fetchall()]
print(f"Final columns: {final_columns}")

conn.close()
