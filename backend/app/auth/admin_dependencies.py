from fastapi import Depends, HTTPException, status
from app.auth.dependencies import get_current_active_user
from app.models import User

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user