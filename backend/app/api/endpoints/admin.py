from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from app.auth.admin_dependencies import get_current_admin_user

router = APIRouter()

@router.get("/users", response_model=list[schemas.User])
def list_users(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    users = db.query(models.User).all()
    return users

@router.post("/users/{user_id}/toggle_role")
def toggle_role(user_id: int, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        user.role = "user"
    elif user.role == "warehouse_owner":
        user.role = "user"
    else:
        user.role = "warehouse_owner"  # Toggle to warehouse_owner, not admin
    db.add(user)
    db.commit()
    return {"id": user.id, "role": user.role}

@router.put("/users/{user_id}")
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.username and payload.username != user.username:
        existing = db.query(models.User).filter(models.User.username == payload.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
    if payload.email and payload.email != user.email:
        existing = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
    if payload.username:
        user.username = payload.username
    if payload.email:
        user.email = payload.email
    if payload.role is not None:
        user.role = payload.role
    if payload.location is not None:
        user.location = payload.location
    db.commit()
    return {"id": user.id, "username": user.username, "email": user.email, "role": user.role, "location": user.location}

@router.get("/analytics/global")
def global_analytics(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    # Total users, warehouses, products, stock movements
    total_users = db.query(func.count(models.User.id)).scalar()
    total_warehouses = db.query(func.count(models.Warehouse.id)).scalar()
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_movements = db.query(func.count(models.StockMovement.id)).scalar()
    # Total value in stock
    total_value = db.query(func.sum(models.StockMovement.quantity * models.Product.price)).join(
        models.Product, models.StockMovement.product_id == models.Product.id
    ).filter(models.StockMovement.quantity > 0).scalar() or 0
    return {
        "total_users": total_users,
        "total_warehouses": total_warehouses,
        "total_products": total_products,
        "total_movements": total_movements,
        "total_value": float(total_value)
    }

@router.get("/warehouses/{warehouse_id}/users")
def get_warehouse_user_usage(warehouse_id: int, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    # Get users who have movements in this warehouse, with total quantity and value
    usage_query = db.query(
        models.User.username.label("user_name"),
        models.User.id.label("user_id"),
        func.sum(models.StockMovement.quantity).label("total_quantity"),
        func.sum(models.StockMovement.quantity * models.Product.price).label("total_value")
    ).join(
        models.StockMovement, models.User.id == models.StockMovement.user_id
    ).join(
        models.Product, models.StockMovement.product_id == models.Product.id
    ).filter(
        models.StockMovement.warehouse_id == warehouse_id
    ).group_by(
        models.User.id, models.User.username
    ).all()

    return {
        "warehouse_id": warehouse_id,
        "warehouse_name": warehouse.name,
        "users": [
            {
                "user_id": u.user_id,
                "user_name": u.user_name,
                "total_quantity": int(u.total_quantity),
                "total_value": float(u.total_value)
            } for u in usage_query
        ]
    }
