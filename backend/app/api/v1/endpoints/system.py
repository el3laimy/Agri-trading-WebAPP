from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import require_admin
import os
import signal
import sys
import threading
import time

router = APIRouter()

def shutdown_server():
    """Function to shut down the server safely"""
    time.sleep(1) # Give time for the response to be sent
    print("Shutting down server...")
    os.kill(os.getpid(), signal.SIGTERM)

@router.post("/shutdown")
async def shutdown(current_user = Depends(require_admin)):
    """
    Shuts down the application server.
    Only accessible by superusers/admins.
    """
    # Run shutdown in a separate thread to allow sending the response first
    threading.Thread(target=shutdown_server).start()
    return {"message": "جاري إيقاف تشغيل النظام..."}
