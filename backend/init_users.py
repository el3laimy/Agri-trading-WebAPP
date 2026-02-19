"""
سكريبت تهيئة نظام المستخدمين
يقوم بإنشاء الأدوار الافتراضية والمستخدم المدير
"""

import json
from app.database import SessionLocal, engine, Base
from app import models
from app.auth.jwt import get_password_hash


def init_roles_and_admin():
    """تهيئة الأدوار والمستخدم المدير"""
    db = SessionLocal()
    
    try:
        # التحقق من وجود الأدوار
        existing_roles = db.query(models.Role).count()
        
        if existing_roles == 0:
            print("إنشاء الأدوار الافتراضية...")
            
            # دور المدير
            admin_role = models.Role(
                name="admin",
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
            
            # دور المحاسب
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
            
            # دور موظف المبيعات
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
            
            # دور موظف المشتريات
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
            
            # دور المشاهد
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
            print("✅ تم إنشاء الأدوار الافتراضية")
        
        # التحقق من وجود المدير
        admin_user = db.query(models.User).filter(
            models.User.username == "admin"
        ).first()
        
        if not admin_user:
            print("إنشاء المستخدم المدير...")
            
            # الحصول على دور المدير
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
                print("✅ تم إنشاء المستخدم المدير")
                print("   اسم المستخدم: admin")
                print("   كلمة المرور: admin123")
                print("   ⚠️ يرجى تغيير كلمة المرور بعد تسجيل الدخول!")
        else:
            print("✅ المستخدم المدير موجود بالفعل")
            
    except Exception as e:
        print(f"❌ خطأ: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    # إنشاء الجداول إذا لم تكن موجودة
    Base.metadata.create_all(bind=engine)
    
    # تهيئة الأدوار والمدير
    init_roles_and_admin()
