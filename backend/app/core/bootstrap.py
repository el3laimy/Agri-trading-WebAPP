from sqlalchemy.orm import Session
from app import models, crud
import json
from app.auth.jwt import get_password_hash

from app.core.settings import initialize_default_settings, get_setting

# تعريف أرقام الحسابات الأساسية كمتغيرات ثابتة لسهولة الوصول إليها
# DEPRECATED: Use settings service instead
INVENTORY_ACCOUNT_ID = 10103
ACCOUNTS_PAYABLE_ID = 20101
CASH_ACCOUNT_ID = 10101
SALES_REVENUE_ACCOUNT_ID = 40101
COGS_ACCOUNT_ID = 50101
ACCOUNTS_RECEIVABLE_ID = 10104
INVENTORY_LOSS_ACCOUNT_ID = 50102
INVENTORY_GAIN_ACCOUNT_ID = 40102
OWNER_EQUITY_ID = 30101  # رأس المال

def bootstrap_system(db: Session):
    """
    تهيئة النظام بالكامل: الإعدادات، الحسابات، المستخدمين
    """
    # 1. Initialize Settings
    initialize_default_settings(db)
    
    # 2. Bootstrap Financial Accounts
    bootstrap_financial_accounts(db)
    
    # 3. Bootstrap Roles & Users
    bootstrap_roles_and_users(db)


def bootstrap_financial_accounts(db: Session):
    """
    Checks for and creates the default financial accounts if they don't exist.
    """
    # Get IDs from settings
    inventory_id = get_setting(db, "INVENTORY_ACCOUNT_ID", INVENTORY_ACCOUNT_ID)
    accounts_payable_id = get_setting(db, "ACCOUNTS_PAYABLE_ID", ACCOUNTS_PAYABLE_ID)
    cash_id = get_setting(db, "CASH_ACCOUNT_ID", CASH_ACCOUNT_ID)
    sales_revenue_id = get_setting(db, "SALES_REVENUE_ACCOUNT_ID", SALES_REVENUE_ACCOUNT_ID)
    cogs_id = get_setting(db, "COGS_ACCOUNT_ID", COGS_ACCOUNT_ID)
    accounts_receivable_id = get_setting(db, "ACCOUNTS_RECEIVABLE_ID", ACCOUNTS_RECEIVABLE_ID)
    
    # These might not be in default settings yet, so we use constants as fallback
    inventory_loss_id = 50102
    inventory_gain_id = 40102
    owner_equity_id = 30101

    accounts_to_create = [
        {'account_id': inventory_id, 'account_name': 'المخزون', 'account_type': 'ASSET'},
        {'account_id': accounts_payable_id, 'account_name': 'الذمم الدائنة (الموردين)', 'account_type': 'LIABILITY'},
        {'account_id': cash_id, 'account_name': 'الخزنة الرئيسية', 'account_type': 'ASSET'},
        {'account_id': sales_revenue_id, 'account_name': 'إيرادات المبيعات', 'account_type': 'REVENUE'},
        {'account_id': cogs_id, 'account_name': 'تكلفة البضاعة المباعة', 'account_type': 'EXPENSE'},
        {'account_id': accounts_receivable_id, 'account_name': 'الذمم المدينة (العملاء)', 'account_type': 'ASSET'},
        {'account_id': inventory_loss_id, 'account_name': 'خسائر المخزون (تالف/عجز)', 'account_type': 'EXPENSE'},
        {'account_id': inventory_gain_id, 'account_name': 'أرباح فروقات المخزون', 'account_type': 'REVENUE'},
        {'account_id': owner_equity_id, 'account_name': 'رأس المال', 'account_type': 'EQUITY'},
    ]

    for acc_data in accounts_to_create:
        acc = crud.get_financial_account(db, account_id=acc_data['account_id'])
        if not acc:
            new_acc = models.FinancialAccount(**acc_data)
            db.add(new_acc)
            db.commit()
            db.refresh(new_acc)


def bootstrap_roles_and_users(db: Session):
    """
    Checks for and creates the default roles and admin user if they don't exist.
    """
    try:
        # Check if roles exist
        existing_roles = db.query(models.Role).count()
        
        if existing_roles == 0:
            print("Creating default roles...")
            
            # Admin Role
            admin_role = models.Role(
                name="admin", # Keep English name for code reference
                name_ar="مدير النظام",
                description="صلاحيات كاملة على جميع أجزاء النظام",
                permissions=json.dumps([
                    "dashboard:view",
                    "sales:read", "sales:write", "sales:delete",
                    "purchases:read", "purchases:write", "purchases:delete",
                    "inventory:read", "inventory:write",
                    "treasury:read", "treasury:write",
                    "expenses:read", "expenses:write", "expenses:delete",
                    "contacts:read", "contacts:write", "contacts:delete",
                    "reports:view", "reports:export",
                    "settings:manage",
                    "users:read", "users:write", "users:delete"
                ])
            )
            db.add(admin_role)
            
            # Accountant Role
            accountant_role = models.Role(
                name="accountant",
                name_ar="محاسب",
                description="صلاحيات المحاسبة والتقارير",
                permissions=json.dumps([
                    "dashboard:view",
                    "sales:read", "sales:write",
                    "purchases:read", "purchases:write",
                    "inventory:read",
                    "treasury:read", "treasury:write",
                    "expenses:read", "expenses:write",
                    "contacts:read",
                    "reports:view", "reports:export"
                ])
            )
            db.add(accountant_role)
            
            # Sales Role
            sales_role = models.Role(
                name="sales",
                name_ar="موظف مبيعات",
                description="صلاحيات المبيعات فقط",
                permissions=json.dumps([
                    "dashboard:view",
                    "sales:read", "sales:write",
                    "inventory:read",
                    "contacts:read"
                ])
            )
            db.add(sales_role)
            
            # Purchasing Role
            purchasing_role = models.Role(
                name="purchasing",
                name_ar="موظف مشتريات",
                description="صلاحيات المشتريات فقط",
                permissions=json.dumps([
                    "dashboard:view",
                    "purchases:read", "purchases:write",
                    "inventory:read",
                    "contacts:read"
                ])
            )
            db.add(purchasing_role)
            
            # Viewer Role
            viewer_role = models.Role(
                name="viewer",
                name_ar="مشاهد",
                description="مشاهدة فقط بدون تعديل",
                permissions=json.dumps([
                    "dashboard:view",
                    "sales:read",
                    "purchases:read",
                    "inventory:read",
                    "contacts:read",
                    "reports:view"
                ])
            )
            db.add(viewer_role)
            
            db.commit()
            print("✅ Default roles created")
        
        # Check if Admin user exists
        admin_user = db.query(models.User).filter(
            models.User.username == "admin"
        ).first()
        
        if not admin_user:
            print("Creating Admin user...")
            
            # Get admin role
            admin_role = db.query(models.Role).filter(
                models.Role.name == "admin"
            ).first()
            
            if admin_role:
                admin_user = models.User(
                    username="admin",
                    password_hash=get_password_hash("admin123"),
                    full_name="مدير النظام",
                    email="admin@example.com",
                    role_id=admin_role.role_id,
                    is_active=True,
                    is_superuser=True
                )
                db.add(admin_user)
                db.commit()
                print("✅ Admin user created (admin/admin123)")
        
    except Exception as e:
        print(f"❌ Error bootstrapping roles/users: {e}")
        db.rollback()
