from fastapi import Depends, HTTPException, status
from app.api.endpoints.auth import get_current_user
from app import models

def get_current_admin_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user
