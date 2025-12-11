from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.api.v1.endpoints.auth import get_current_user, UserResponse
from app.services import alerts

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """عرض التنبيهات للمستخدم الحالي"""
    query = db.query(alerts.Notification)
    
    # Filter by user (specific or system-wide)
    query = query.filter((alerts.Notification.user_id == current_user.user_id) | (alerts.Notification.user_id == None))
    
    if unread_only:
        query = query.filter(alerts.Notification.is_read == False)
        
    notifications = query.order_by(alerts.Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": n.notification_id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
            "action_url": n.action_url
        }
        for n in notifications
    ]

@router.post("/check")
def trigger_alert_check(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """تشغيل فحص التنبيهات يدوياً"""
    stock_alerts = alerts.check_low_stock(db)
    debt_alerts = alerts.check_overdue_debts(db)
    
    total_new = len(stock_alerts) + len(debt_alerts)
    return {"message": "Alert check completed", "new_alerts": total_new}

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """تحديد تنبيه كمقروء"""
    success = alerts.mark_as_read(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """تحديد الكل كمقروء"""
    count = alerts.mark_all_as_read(db, user_id=current_user.user_id)
    return {"read_count": count}

@router.get("/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """عدد التنبيهات غير المقروءة"""
    count = db.query(alerts.Notification).filter(
        (alerts.Notification.user_id == current_user.user_id) | (alerts.Notification.user_id == None),
        alerts.Notification.is_read == False
    ).count()
    return {"count": count}
