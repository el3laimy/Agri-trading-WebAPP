"""
Database Indexing Migration Script
Adds performance indexes to frequently queried columns
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_indexes():
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    
    indexes = [
        # Purchases table
        ("idx_purchases_purchase_date", "purchases", "purchase_date"),
        ("idx_purchases_crop_id", "purchases", "crop_id"),
        ("idx_purchases_supplier_id", "purchases", "supplier_id"),
        ("idx_purchases_payment_status", "purchases", "payment_status"),
        
        # Sales table
        ("idx_sales_sale_date", "sales", "sale_date"),
        ("idx_sales_crop_id", "sales", "crop_id"),
        ("idx_sales_customer_id", "sales", "customer_id"),
        ("idx_sales_payment_status", "sales", "payment_status"),
        
        # General Ledger table
        ("idx_general_ledger_entry_date", "general_ledger", "entry_date"),
        ("idx_general_ledger_account_id", "general_ledger", "account_id"),
        ("idx_general_ledger_source", "general_ledger", "source_type, source_id"),
        
        # Inventory Batches table
        ("idx_inventory_batches_crop_id", "inventory_batches", "crop_id"),
        ("idx_inventory_batches_purchase_date", "inventory_batches", "purchase_date"),
        ("idx_inventory_batches_is_active", "inventory_batches", "is_active"),
        
        # Payments table
        ("idx_payments_payment_date", "payments", "payment_date"),
        ("idx_payments_contact_id", "payments", "contact_id"),
        ("idx_payments_payment_type", "payments", "payment_type"),
        
        # Audit Logs table
        ("idx_audit_logs_created_at", "audit_logs", "created_at"),
        ("idx_audit_logs_table_name", "audit_logs", "table_name"),
        ("idx_audit_logs_user_id", "audit_logs", "user_id"),
    ]
    
    with engine.connect() as conn:
        for idx_name, table, columns in indexes:
            try:
                # Check if index exists
                result = conn.execute(text(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{idx_name}'"))
                if result.fetchone():
                    print(f"⏭️  Index {idx_name} already exists, skipping.")
                    continue
                
                # Create index
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({columns})"))
                print(f"✅ Created index {idx_name} on {table}({columns})")
            except Exception as e:
                print(f"❌ Failed to create index {idx_name}: {e}")
        
        conn.commit()
    
    print("\n🎉 Database indexing complete!")

if __name__ == "__main__":
    add_indexes()
