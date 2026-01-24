"""
Database Schema Audit Script
Compares SQLAlchemy Models with actual SQLite database schema
"""
import sqlite3
import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import inspect
from app.database import Base, engine
from app import models

# Get database path
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'agricultural_accounting.db')

print("=" * 70)
print("🔍 DATABASE SCHEMA AUDIT")
print("=" * 70)
print(f"\nDatabase: {db_path}")
print(f"Database exists: {os.path.exists(db_path)}")

if not os.path.exists(db_path):
    print("ERROR: Database file not found!")
    sys.exit(1)

# Get SQLAlchemy model definitions
print("\n" + "=" * 70)
print("📋 COMPARING MODELS WITH DATABASE")
print("=" * 70)

# Connect to SQLite
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables from database
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
db_tables = set([t[0] for t in cursor.fetchall()])
print(f"\n📊 Tables in database: {len(db_tables)}")

# Get all models from SQLAlchemy
inspector = inspect(engine)
model_tables = set(inspector.get_table_names())
print(f"📊 Tables from models: {len(model_tables)}")

# Compare tables
missing_in_db = model_tables - db_tables
extra_in_db = db_tables - model_tables

if missing_in_db:
    print(f"\n❌ Tables in Models but NOT in Database:")
    for t in missing_in_db:
        print(f"   - {t}")

if extra_in_db:
    print(f"\n⚠️  Tables in Database but NOT in Models:")
    for t in extra_in_db:
        print(f"   - {t}")

# Compare columns for each table
print("\n" + "=" * 70)
print("🔍 COLUMN COMPARISON BY TABLE")
print("=" * 70)

issues_found = []

# Get all model classes
model_classes = {}
for name in dir(models):
    obj = getattr(models, name)
    if hasattr(obj, '__tablename__'):
        model_classes[obj.__tablename__] = obj

for table_name in sorted(model_tables & db_tables):
    # Get columns from database
    cursor.execute(f"PRAGMA table_info({table_name})")
    db_columns = {col[1]: {'type': col[2], 'notnull': col[3], 'default': col[4]} for col in cursor.fetchall()}
    
    # Get columns from SQLAlchemy model
    if table_name in model_classes:
        model_class = model_classes[table_name]
        mapper = inspect(model_class)
        model_columns = {col.name: col for col in mapper.columns}
    else:
        print(f"\n⚠️  {table_name}: Model class not found")
        continue
    
    db_col_names = set(db_columns.keys())
    model_col_names = set(model_columns.keys())
    
    missing_in_db = model_col_names - db_col_names
    extra_in_db = db_col_names - model_col_names
    
    if missing_in_db or extra_in_db:
        print(f"\n📄 {table_name}:")
        if missing_in_db:
            for col in missing_in_db:
                issue = f"❌ {table_name}.{col} - Column in Model but NOT in Database"
                print(f"   {issue}")
                issues_found.append({
                    'table': table_name,
                    'column': col,
                    'type': 'MISSING_IN_DB',
                    'model_type': str(model_columns[col].type)
                })
        if extra_in_db:
            for col in extra_in_db:
                print(f"   ⚠️  {col} - Column in Database but NOT in Model")

conn.close()

# Summary
print("\n" + "=" * 70)
print("📊 SUMMARY")
print("=" * 70)

if issues_found:
    print(f"\n🚨 Found {len(issues_found)} column(s) missing in database:\n")
    for issue in issues_found:
        print(f"  • {issue['table']}.{issue['column']} ({issue['model_type']})")
    
    print("\n📝 SQL Commands to fix:")
    for issue in issues_found:
        sql_type = "TEXT"  # Default
        if "Integer" in issue['model_type']:
            sql_type = "INTEGER"
        elif "Numeric" in issue['model_type']:
            sql_type = "NUMERIC"
        elif "Date" in issue['model_type']:
            sql_type = "DATE"
        elif "DateTime" in issue['model_type']:
            sql_type = "DATETIME"
        elif "Boolean" in issue['model_type']:
            sql_type = "BOOLEAN"
        print(f"  ALTER TABLE {issue['table']} ADD COLUMN {issue['column']} {sql_type};")
else:
    print("\n✅ All model columns exist in the database!")
    print("   No schema mismatches found.")

print("\n" + "=" * 70)
