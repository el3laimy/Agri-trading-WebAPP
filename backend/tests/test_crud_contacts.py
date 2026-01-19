"""
اختبارات عمليات CRUD لجهات الاتصال
Contact CRUD Operations Tests
"""
import pytest
from datetime import date
from app import models, schemas
from app.crud import contacts


# Fixtures are imported from conftest.py automatically


class TestContactCRUD:
    """اختبارات CRUD لجهات الاتصال"""
    
    def test_create_contact_supplier(self, db_session):
        """التأكد من إنشاء مورد جديد"""
        contact_data = schemas.ContactCreate(
            name="مورد اختباري جديد",
            phone="01012345678",
            is_supplier=True,
            is_customer=False
        )
        
        result = contacts.create_contact(db_session, contact_data)
        
        assert result is not None
        assert result.name == "مورد اختباري جديد"
        assert result.is_supplier == True
        assert result.is_customer == False
        
        # Cleanup
        db_session.delete(result)
        db_session.commit()
    
    def test_create_contact_customer(self, db_session):
        """التأكد من إنشاء عميل جديد"""
        contact_data = schemas.ContactCreate(
            name="عميل اختباري جديد",
            phone="01098765432",
            address="القاهرة",
            is_supplier=False,
            is_customer=True
        )
        
        result = contacts.create_contact(db_session, contact_data)
        
        assert result is not None
        assert result.name == "عميل اختباري جديد"
        assert result.is_customer == True
        assert result.address == "القاهرة"
        
        # Cleanup
        db_session.delete(result)
        db_session.commit()
    
    def test_get_contacts(self, db_session, test_customer, test_supplier):
        """التأكد من جلب قائمة جهات الاتصال"""
        result = contacts.get_contacts(db_session)
        
        assert result is not None
        assert len(result) >= 2  # على الأقل العميل والمورد الاختباريين
    
    def test_get_contact_by_id(self, db_session, test_customer):
        """التأكد من جلب جهة اتصال بالـ ID"""
        result = contacts.get_contact(db_session, test_customer.contact_id)
        
        assert result is not None
        assert result.contact_id == test_customer.contact_id
        assert result.name == test_customer.name
    
    def test_get_contact_dependencies_empty(self, db_session, test_customer):
        """التأكد من فحص التبعيات لجهة اتصال بدون بيانات مرتبطة"""
        deps = contacts.get_contact_dependencies(db_session, test_customer.contact_id)
        
        assert "sales" in deps
        assert "purchases" in deps
        assert "payments" in deps
        assert deps["sales"] == 0


class TestContactMigration:
    """اختبارات ترحيل بيانات جهات الاتصال"""
    
    def test_migrate_contact_data(self, db_session):
        """التأكد من ترحيل البيانات من جهة اتصال إلى أخرى"""
        # إنشاء جهتي اتصال
        old_contact = models.Contact(
            name="جهة اتصال قديمة",
            is_customer=True
        )
        new_contact = models.Contact(
            name="جهة اتصال جديدة",
            is_customer=True
        )
        db_session.add(old_contact)
        db_session.add(new_contact)
        db_session.commit()
        db_session.refresh(old_contact)
        db_session.refresh(new_contact)
        
        old_id = old_contact.contact_id
        new_id = new_contact.contact_id
        
        # ترحيل البيانات
        contacts.migrate_contact_data(db_session, old_id, new_id)
        
        # التأكد من حذف الجهة القديمة
        assert contacts.get_contact(db_session, old_id) is None
        
        # Cleanup
        db_session.delete(new_contact)
        db_session.commit()


class TestContactDeletion:
    """اختبارات حذف جهات الاتصال"""
    
    def test_delete_contact_simple(self, db_session):
        """التأكد من حذف جهة اتصال بسيطة"""
        contact = models.Contact(
            name="جهة للحذف",
            is_supplier=True
        )
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)
        
        contact_id = contact.contact_id
        
        contacts.delete_contact(db_session, contact_id)
        
        assert contacts.get_contact(db_session, contact_id) is None
