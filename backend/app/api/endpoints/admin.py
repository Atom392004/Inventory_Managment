from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth.admin_dependencies import get_current_admin_user

router = APIRouter()

@router.get("/admin/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    users = db.query(models.User).all()
    return users

@router.post("/admin/users/{user_id}/toggle_admin")
def toggle_admin(user_id: int, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = not bool(user.is_admin)
    db.add(user)
    db.commit()
    return {"id": user.id, "is_admin": user.is_admin}