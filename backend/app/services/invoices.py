from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
import qrcode
import io
import os
from datetime import datetime

# Try to register a font that supports Arabic if possible, otherwise fallback
# For now, we'll try to use a standard font or skip Arabic specific shaping if libraries aren't present
# In a real production env, we'd include a font file like 'Cairo-Regular.ttf'

def generate_qr_code(data):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    return img

def generate_invoice_pdf(sale_data):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Register Font (Placeholder - assumes Arial or similar might be available, or defaults)
    # If we had a font file: pdfmetrics.registerFont(TTFont('Arabic', 'path/to/font.ttf'))
    
    # Header
    p.setFont("Helvetica-Bold", 16)
    p.drawString(2 * cm, height - 2 * cm, "Agri-Trading Invoice")
    
    p.setFont("Helvetica", 10)
    p.drawString(2 * cm, height - 2.5 * cm, f"Invoice #: {sale_data['sale_id']}")
    p.drawString(2 * cm, height - 3 * cm, f"Date: {sale_data['date']}")
    
    # Supplier/Company Info (Right side)
    p.drawRightString(width - 2 * cm, height - 2 * cm, "El-Alaimy Agri-Trade")
    p.drawRightString(width - 2 * cm, height - 2.5 * cm, "123 Agriculture Rd.")
    p.drawRightString(width - 2 * cm, height - 3 * cm, "Cairo, Egypt")

    # Customer Info
    p.drawString(2 * cm, height - 5 * cm, "Bill To:")
    p.drawString(2 * cm, height - 5.5 * cm, f"{sale_data['customer_name']}")
    if sale_data.get('customer_phone'):
        p.drawString(2 * cm, height - 6 * cm, f"Phone: {sale_data['customer_phone']}")

    # Table Header
    y = height - 8 * cm
    p.line(2 * cm, y, width - 2 * cm, y)
    y -= 0.5 * cm
    p.setFont("Helvetica-Bold", 10)
    p.drawString(2.5 * cm, y, "Item")
    p.drawString(8 * cm, y, "Quantity")
    p.drawString(11 * cm, y, "Unit")
    p.drawString(14 * cm, y, "Price")
    p.drawRightString(width - 2.5 * cm, y, "Total")
    y -= 0.5 * cm
    p.line(2 * cm, y, width - 2 * cm, y)
    
    # Items
    y -= 1 * cm
    p.setFont("Helvetica", 10)
    
    # Assuming single item per sale for now based on current schema, but can loop if multiple
    p.drawString(2.5 * cm, y, str(sale_data['crop_name']))
    p.drawString(8 * cm, y, str(sale_data['quantity']))
    p.drawString(11 * cm, y, str(sale_data['unit']))
    p.drawString(14 * cm, y, f"{sale_data['price']:.2f}")
    p.drawRightString(width - 2.5 * cm, y, f"{sale_data['total_amount']:.2f}")
    
    # Totals
    y -= 2 * cm
    p.line(2 * cm, y, width - 2 * cm, y)
    y -= 1 * cm
    p.setFont("Helvetica-Bold", 12)
    p.drawString(12 * cm, y, "Total Amount:")
    p.drawRightString(width - 2.5 * cm, y, f"{sale_data['total_amount']:.2f} EGP")
    
    if sale_data.get('amount_received'):
        y -= 0.7 * cm
        p.setFont("Helvetica", 10)
        p.drawString(12 * cm, y, "Paid:")
        p.drawRightString(width - 2.5 * cm, y, f"{sale_data['amount_received']:.2f} EGP")
        
        y -= 0.7 * cm
        p.drawString(12 * cm, y, "Balance Due:")
        balance = sale_data['total_amount'] - sale_data['amount_received']
        p.drawRightString(width - 2.5 * cm, y, f"{balance:.2f} EGP")

    # QR Code
    qr_data = f"Invoice:{sale_data['sale_id']}|Amt:{sale_data['total_amount']}|Date:{sale_data['date']}"
    qr_img = generate_qr_code(qr_data)
    
    # Save QR to temp file to draw (ReportLab needs file path or ImageReader)
    # Using a temporary file approach
    qr_path = f"temp_qr_{sale_data['sale_id']}.png"
    qr_img.save(qr_path)
    
    p.drawImage(qr_path, 2 * cm, 2 * cm, width=4*cm, height=4*cm)
    os.remove(qr_path) # Clean up

    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer
