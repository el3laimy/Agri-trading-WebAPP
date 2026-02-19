from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models import Notification, Inventory, Crop, Sale, Payment
from typing import List

def create_notification(db: Session, title: str, message: str, type: str, user_id: int = None, action_url: str = None):
    """Create a new notification."""
    notif = Notification(
        title=title,
        message=message,
        type=type,
        user_id=user_id,
        action_url=action_url
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def check_low_stock(db: Session) -> List[Notification]:
    """
    Check for inventory items below the threshold and generate notifications.
    Returns list of generated notifications.
    """
    low_stock_items = db.query(Inventory).filter(
        Inventory.current_stock_kg <= Inventory.low_stock_threshold
    ).all()
    
    generated_alerts = []
    
    for item in low_stock_items:
        # Check if an unread alert already exists for this crop to avoid spam
        existing_alert = db.query(Notification).filter(
            Notification.type == "LOW_STOCK",
            Notification.is_read == False,
            Notification.message.contains(item.crop.crop_name)
        ).first()
        
        if not existing_alert:
            notif = create_notification(
                db=db,
                title="تنبيه مخزون منخفض",
                message=f"مخزون {item.crop.crop_name} وصل إلى {item.current_stock_kg} كجم (الحد الأدنى: {item.low_stock_threshold} كجم)",
                type="LOW_STOCK",
                action_url="/inventory"
            )
            generated_alerts.append(notif)
            
    return generated_alerts

def check_overdue_debts(db: Session, days_threshold: int = 30) -> List[Notification]:
    """
    Check for unpaid sales older than `days_threshold` days.
    """
    overdue_date = datetime.now().date() - timedelta(days=days_threshold)
    
    overdue_sales = db.query(Sale).filter(
        Sale.payment_status != "PAID",
        Sale.sale_date <= overdue_date
    ).all()
    
    generated_alerts = []
    
    for sale in overdue_sales:
        remaining_amount = sale.total_sale_amount - sale.amount_received
        if remaining_amount > 0:
            existing_alert = db.query(Notification).filter(
                Notification.type == "OVERDUE_DEBT",
                Notification.is_read == False,
                Notification.message.contains(f"بيع #{sale.sale_id}")
            ).first()
            
            if not existing_alert:
                customer_name = sale.customer.name if sale.customer else "عميل"
                notif = create_notification(
                    db=db,
                    title="ديون متأخرة",
                    message=f"فاتورة بيع #{sale.sale_id} للعميل {customer_name} متاخرة منذ {sale.sale_date}. المبلغ المتبقي: {remaining_amount}",
                    type="OVERDUE_DEBT",
                    action_url=f"/sales" # Could be deep link to detail
                )
                generated_alerts.append(notif)
                
    return generated_alerts

def mark_as_read(db: Session, notification_id: int):
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
        return True
    return False

def mark_all_as_read(db: Session, user_id: int = None):
    query = db.query(Notification).filter(Notification.is_read == False)
    if user_id:
        query = query.filter((Notification.user_id == user_id) | (Notification.user_id == None))
    
    notifications = query.all()
    for notif in notifications:
        notif.is_read = True
    
    db.commit()
    return len(notifications)
