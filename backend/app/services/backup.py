import shutil
import os
import sqlite3
from datetime import datetime
from fastapi import HTTPException
from app.core.config import settings

# تحديد مسار قاعدة البيانات والنسخ الاحتياطي
DB_PATH = "../agricultural_accounting.db"
BACKUP_DIR = "backups"

def ensure_backup_dir():
    """Ensure the backup directory exists."""
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)

def create_backup():
    """
    Creates a backup of the current SQLite database.
    Uses sqlite3.backup API for a safe hot backup.
    """
    ensure_backup_dir()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"backup_{timestamp}.db"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    try:
        # الاتصال بقاعدة البيانات الحالية
        src_conn = sqlite3.connect(DB_PATH)
        # الاتصال بملف النسخة الاحتياطية (سيتم إنشاؤه)
        dst_conn = sqlite3.connect(backup_path)
        
        # تنفيذ النسخ الاحتياطي
        with src_conn:
            src_conn.backup(dst_conn)
            
        dst_conn.close()
        src_conn.close()
        
        return {
            "filename": backup_filename,
            "path": backup_path,
            "size": os.path.getsize(backup_path),
            "created_at": timestamp
        }
    except Exception as e:
        if os.path.exists(backup_path):
            os.remove(backup_path)
        raise Exception(f"Failed to create backup: {str(e)}")

def list_backups():
    """Lists all available backup files."""
    ensure_backup_dir()
    
    backups = []
    for filename in os.listdir(BACKUP_DIR):
        if filename.endswith(".db"):
            path = os.path.join(BACKUP_DIR, filename)
            stat = os.stat(path)
            backups.append({
                "filename": filename,
                "size": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
            
    # ترتيب تنازلي (الأحدث أولاً)
    return sorted(backups, key=lambda x: x['created_at'], reverse=True)

def restore_backup(filename: str):
    """
    Restores the database from a backup file.
    WARNING: This overwrites the current database.
    """
    backup_path = os.path.join(BACKUP_DIR, filename)
    
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file {filename} not found")
        
    # أولاً، نأخذ نسخة احتياطية للحالة الحالية للأمان
    try:
        current_backup = create_backup()
        print(f"Safety backup created before restore: {current_backup['filename']}")
    except:
        print("Warning: Could not create safety backup before restore")
    
    try:
        # إغلاق أي اتصالات مفتوحة هو أمر صعب في تطبيق ويب،
        # لكن sqlite3.backup يعمل عادة بشكل جيد.
        # للاستعادة، سنقوم بعكس العملية: من النسخة إلى الملف الأصلي
        
        src_conn = sqlite3.connect(backup_path)
        dst_conn = sqlite3.connect(DB_PATH)
        
        with src_conn:
            src_conn.backup(dst_conn)
            
        dst_conn.close()
        src_conn.close()
        
        return True
    except Exception as e:
        raise Exception(f"Failed to restore backup: {str(e)}")

def delete_backup(filename: str):
    """Deletes a backup file."""
    backup_path = os.path.join(BACKUP_DIR, filename)
    
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file {filename} not found")
        
    os.remove(backup_path)
    return True
