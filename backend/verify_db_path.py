"""
Verify and fix database path issue - run a complete migration
"""
import sqlite3
import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

# Get the exact database path from settings
from app.core.config import settings
print(f"DATABASE_URL from settings: {settings.DATABASE_URL}")

# Parse the SQLite path
db_url = settings.DATABASE_URL
# SQLite URL format: sqlite:///path/to/db.db
db_path = db_url.replace("sqlite:///", "")
# Handle relative paths
if not os.path.isabs(db_path):
    # Relative paths are relative to the app/core directory
    db_path = os.path.join(os.path.dirname(__file__), "app", "core", db_path)
    db_path = os.path.normpath(db_path)

print(f"Resolved database path: {db_path}")
print(f"File exists: {os.path.exists(db_path)}")

if not os.path.exists(db_path):
    # Try relative to current directory
    alt_path = db_url.replace("sqlite:///", "")
    if not os.path.isabs(alt_path):
        alt_path = os.path.join(os.getcwd(), alt_path)
        alt_path = os.path.normpath(alt_path)
    print(f"Alternative path: {alt_path}")
    print(f"Alternative exists: {os.path.exists(alt_path)}")
    if os.path.exists(alt_path):
        db_path = alt_path

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check expenses table structure
    cursor.execute("PRAGMA table_info(expenses)")
    columns = {col[1]: col for col in cursor.fetchall()}
    print(f"\nCurrent expenses columns: {list(columns.keys())}")
    
    # All required columns from the Expense model
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
    
    changes = 0
    for col_name, col_type in required_columns.items():
        if col_name not in columns:
            print(f"Adding missing column: {col_name}")
            try:
                cursor.execute(f"ALTER TABLE expenses ADD COLUMN {col_name} {col_type}")
                changes += 1
            except Exception as e:
                print(f"  Error: {e}")
    
    conn.commit()
    
    # Verify
    cursor.execute("PRAGMA table_info(expenses)")
    final_columns = [col[1] for col in cursor.fetchall()]
    print(f"\nFinal columns: {final_columns}")
    print(f"\n✅ Migration complete! {changes} column(s) added.")
    
    conn.close()
else:
    print("ERROR: Database file not found!")
