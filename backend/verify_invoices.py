from app.services.invoices import generate_invoice_pdf
import os

def test_invoice_generation():
    mock_data = {
        "sale_id": 123,
        "date": "2023-10-27",
        "customer_name": "Test Customer",
        "customer_phone": "0123456789",
        "crop_name": "Wheat",
        "quantity": 100,
        "unit": "kg",
        "price": 50,
        "total_amount": 5000,
        "amount_received": 2000
    }

    try:
        pdf_buffer = generate_invoice_pdf(mock_data)
        content = pdf_buffer.getvalue()
        
        if content.startswith(b"%PDF"):
            print("SUCCESS: PDF generated successfully.")
            with open("test_invoice.pdf", "wb") as f:
                f.write(content)
            print("Saved test_invoice.pdf for inspection.")
        else:
            print("FAILURE: Output does not look like a PDF.")
            
    except Exception as e:
        print(f"FAILURE: Exception occurred: {e}")

if __name__ == "__main__":
    test_invoice_generation()
