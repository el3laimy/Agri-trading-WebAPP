from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List
import os
import shutil
from app.services import backup as backup_service
from app.api.v1.endpoints.auth import require_admin, UserResponse

router = APIRouter()

@router.get("/", response_model=List[dict])
def list_backups(
    current_user: UserResponse = Depends(require_admin)
):
    """عرض قائمة النسخ الاحتياطية"""
    try:
        return backup_service.list_backups()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
def create_backup(
    current_user: UserResponse = Depends(require_admin)
):
    """إنشاء نسخة احتياطية جديدة"""
    try:
        result = backup_service.create_backup()
        return {"message": "تم إنشاء النسخة الاحتياطية بنجاح", "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore/{filename}")
def restore_backup(
    filename: str,
    current_user: UserResponse = Depends(require_admin)
):
    """استعادة النظام من نسخة احتياطية"""
    try:
        backup_service.restore_backup(filename)
        return {"message": "تم استعادة النظام بنجاح"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="ملف النسخة الاحتياطية غير موجود")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{filename}")
def delete_backup(
    filename: str,
    current_user: UserResponse = Depends(require_admin)
):
    """حذف نسخة احتياطية"""
    try:
        backup_service.delete_backup(filename)
        return {"message": "تم حذف النسخة الاحتياطية بنجاح"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="ملف النسخة الاحتياطية غير موجود")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
def download_backup(
    filename: str,
    current_user: UserResponse = Depends(require_admin)
):
    """تحميل ملف النسخة الاحتياطية"""
    file_path = os.path.join(backup_service.BACKUP_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

@router.post("/upload")
def upload_backup(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(require_admin)
):
    """رفع ملف نسخة احتياطية خارجي"""
    if not file.filename.endswith('.db'):
        raise HTTPException(status_code=400, detail="Allowed file types: .db")
        
    backup_service.ensure_backup_dir()
    file_path = os.path.join(backup_service.BACKUP_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"message": "تم رفع ملف النسخة الاحتياطية بنجاح", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
