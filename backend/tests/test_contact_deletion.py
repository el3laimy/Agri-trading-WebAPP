
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app import models, crud
from app.api.v1.endpoints import contacts

def test_delete_contact_integrity(db_session: Session, test_customer: models.Contact, test_crop: models.Crop):
    """Test that a contact cannot be deleted if they have related records"""

    from datetime import date
    # 1. Create a Sale for this customer
    sale = models.Sale(
        crop_id=test_crop.crop_id,
        customer_id=test_customer.contact_id,
        sale_date=date(2024, 1, 1),
        quantity_sold_kg=100,
        selling_unit_price=10,
        selling_pricing_unit="kg",
        specific_selling_factor=1,
        total_sale_amount=1000
    )
    db_session.add(sale)
    db_session.commit()

    # 2. Try to delete the contact - should fail
    try:
        contacts.delete_contact(contact_id=test_customer.contact_id, db=db_session)
        pytest.fail("Should have raised HTTPException")
    except HTTPException as e:
        assert e.status_code == 400
        assert "لا يمكن حذف العميل" in e.detail

    # 3. Delete the sale
    db_session.delete(sale)
    db_session.commit()

    # 4. Try to delete again - should succeed
    response = contacts.delete_contact(contact_id=test_customer.contact_id, db=db_session)
    assert response["message"] == "تم حذف جهة التعامل بنجاح"

    # Verify deletion
    contact = db_session.query(models.Contact).filter(models.Contact.contact_id == test_customer.contact_id).first()
    assert contact is None
