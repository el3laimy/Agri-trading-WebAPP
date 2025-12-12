from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration for Email
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "your_email@gmail.com"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "your_password"),
    MAIL_FROM = os.getenv("MAIL_FROM", "your_email@gmail.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_invoice_email(
    email_to: str,
    subject: str,
    body: str,
    pdf_buffer: bytes,
    pdf_filename: str
):
    """
    Sends an email with the invoice PDF attached.
    """
    if not email_to:
        print("No email provided for notification.")
        return False

    try:
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            body=body,
            subtype=MessageType.html,
            attachments=[
                {
                    "file": pdf_buffer,
                    "filename": pdf_filename,
                    "mime_type": "application/pdf",
                    "headers": {}
                }
            ]
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def generate_whatsapp_link(phone: str, message: str) -> str:
    """
    Generates a WhatsApp web link.
    """
    if not phone:
        return ""
    
    # Basic cleanup for phone number (assuming Egypt for now or taking raw)
    # Ideally should be international format without + or 00, but wa.me handles some.
    # Let's strip special chars.
    clean_phone = ''.join(filter(str.isdigit, phone))
    
    # If number starts with '01', assume Egyptian local mobile and add '20'
    if clean_phone.startswith('01') and len(clean_phone) == 11:
        clean_phone = '2' + clean_phone
    
    from urllib.parse import quote
    encoded_message = quote(message)
    
    return f"https://wa.me/{clean_phone}?text={encoded_message}"
