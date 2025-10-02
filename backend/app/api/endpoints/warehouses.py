from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_, select
from typing import List

from app import models, schemas
from app.database import get_db
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.post("", response_model=schemas.WarehouseInDB, status_code=201)
def create_warehouse(payload: schemas.WarehouseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "warehouse_owner"]:
        raise HTTPException(status_code=403, detail="Only admins and warehouse owners can create warehouses")

    existing = db.query(models.Warehouse).filter(models.Warehouse.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse name already exists")

    wh = models.Warehouse(name=payload.name, location=payload.location, is_available=payload.is_available, latitude=payload.latitude, longitude=payload.longitude, owner_id=current_user.id)
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

@router.get("", response_model=List[schemas.WarehouseInDB])
def list_warehouses(db: Session = Depends(get_db), page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), current_user: models.User = Depends(get_current_user)):
    # Get net stock per product per warehouse using subquery
    stock_subq = db.query(
        models.StockMovement.warehouse_id,
        models.StockMovement.product_id,
        func.coalesce(func.sum(models.StockMovement.quantity), 0).label("net_stock")
    ).group_by(
        models.StockMovement.warehouse_id, models.StockMovement.product_id
    ).subquery()

    # Get warehouses with product count (distinct products with net_stock > 0) and total value
    warehouses_query = db.query(
        models.Warehouse,
        func.count(func.distinct(case((stock_subq.c.net_stock > 0, stock_subq.c.product_id), else_=None))).label("product_count"),
        func.coalesce(func.sum(case((stock_subq.c.net_stock > 0, stock_subq.c.net_stock * models.Product.price), else_=0)), 0).label("total_value")
    ).outerjoin(
        stock_subq, models.Warehouse.id == stock_subq.c.warehouse_id
    ).outerjoin(
        models.Product, stock_subq.c.product_id == models.Product.id
    )

    if current_user.role == "user":
        # Normal users see all warehouses
        warehouses_query = warehouses_query.filter(
            or_(models.Product.id.is_(None), models.Product.is_active == True)
        )
    else:  # admin and warehouse_owner see all warehouses
        warehouses_query = warehouses_query.filter(
            or_(models.Product.id.is_(None), models.Product.is_active == True)
        )

    warehouses_query = warehouses_query.group_by(models.Warehouse.id).order_by(models.Warehouse.created_at.desc())

    warehouses_with_stats = warehouses_query.offset((page - 1) * page_size).limit(page_size).all()

    # Convert to response format
    results = []
    for warehouse, product_count, total_value in warehouses_with_stats:
        warehouse_dict = schemas.WarehouseInDB.model_validate(warehouse).model_dump()
        warehouse_dict["product_count"] = int(product_count)
        warehouse_dict["total_value"] = float(total_value)
        results.append(warehouse_dict)

    return results

@router.get("/{warehouse_id}", response_model=schemas.WarehouseInDB)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner" and wh.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "user":
        assigned = db.query(models.UserWarehouseAssignment).filter(
            models.UserWarehouseAssignment.user_id == current_user.id,
            models.UserWarehouseAssignment.warehouse_id == warehouse_id
        ).first()
        if wh.location != current_user.location and not assigned:
            raise HTTPException(status_code=403, detail="Forbidden")
    return wh

@router.put("/{warehouse_id}", response_model=schemas.WarehouseInDB)
def update_warehouse(warehouse_id: int, payload: schemas.WarehouseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if current_user.role not in ["admin", "warehouse_owner"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if current_user.role == "warehouse_owner" and wh.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # unique name constraint
    conflict = db.query(models.Warehouse).filter(models.Warehouse.name == payload.name, models.Warehouse.id != warehouse_id).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Warehouse name already exists")
    wh.name = payload.name
    wh.location = payload.location
    wh.is_available = payload.is_available
    wh.latitude = payload.latitude
    wh.longitude = payload.longitude
    db.commit()
    db.refresh(wh)
    return wh

@router.delete("/{warehouse_id}", status_code=204)
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if current_user.role not in ["admin", "warehouse_owner"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if current_user.role == "warehouse_owner" and wh.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Delete associated stock movements before deleting the warehouse
    db.query(models.StockMovement).filter(models.StockMovement.warehouse_id == warehouse_id).delete()
    db.delete(wh)
    db.commit()
    return

@router.patch("/{warehouse_id}/availability", response_model=schemas.WarehouseInDB)
def toggle_warehouse_availability(warehouse_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner" and wh.owner_id == current_user.id:
        pass
    else:
        raise HTTPException(status_code=403, detail="Forbidden")

    wh.is_available = not wh.is_available
    db.commit()
    db.refresh(wh)
    return wh

@router.get("/{warehouse_id}/details", response_model=schemas.WarehouseDetails)
def get_warehouse_details(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner" and wh.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "user":
        assigned = db.query(models.UserWarehouseAssignment).filter(
            models.UserWarehouseAssignment.user_id == current_user.id,
            models.UserWarehouseAssignment.warehouse_id == warehouse_id
        ).first()
        if wh.location != current_user.location and not assigned:
            raise HTTPException(status_code=403, detail="Forbidden")

    # Products in stock > 0 for this warehouse using subquery
    stock_subq = db.query(
        models.StockMovement.product_id,
        func.coalesce(func.sum(models.StockMovement.quantity), 0).label("stock")
    ).filter(
        models.StockMovement.warehouse_id == warehouse_id
    ).group_by(
        models.StockMovement.product_id
    ).subquery()

    products_in_stock = db.query(
        models.Product.id,
        models.Product.name,
        models.Product.sku,
        models.Product.price,
        func.coalesce(stock_subq.c.stock, 0).label("stock")
    ).outerjoin(
        stock_subq, models.Product.id == stock_subq.c.product_id
    ).filter(
        models.Product.is_active == True,
        func.coalesce(stock_subq.c.stock, 0) > 0
    )

    if current_user.role == "user":
        products_in_stock = products_in_stock.filter(models.Product.owner_id == current_user.id)

    products_in_stock = products_in_stock.order_by(models.Product.name).all()

    products_list = [
        {
            "id": id,
            "name": name,
            "sku": sku,
            "price": float(price),
            "stock": int(stock)
        } for id, name, sku, price, stock in products_in_stock
    ]

    # Recent movements: last 10 for this warehouse, filtered by user's products
    recent_movements_query = db.query(
        models.StockMovement,
        models.Product.name.label("product_name"),
        models.User.username.label("user_name")
    ).join(
        models.Product, models.StockMovement.product_id == models.Product.id
    ).outerjoin(
        models.User, models.StockMovement.user_id == models.User.id
    ).filter(
        models.StockMovement.warehouse_id == warehouse_id,
        models.Product.is_active == True
    )

    if current_user.role == "user":
        recent_movements_query = recent_movements_query.filter(
            models.Product.owner_id == current_user.id
        )

    recent_movements = recent_movements_query.order_by(models.StockMovement.created_at.desc()).limit(10).all()

    movements_list = [
        {
            "id": m.id,
            "product_id": m.product_id,
            "product_name": product_name,
            "warehouse_id": m.warehouse_id,
            "movement_type": m.movement_type,
            "quantity": m.quantity,
            "notes": m.notes,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "reference_id": m.reference_id,
            "user_id": m.user_id,
            "user_name": user_name or "Unknown"
        } for m, product_name, user_name in recent_movements
    ]

    # Calculate total value
    total_value = sum(p["price"] * p["stock"] for p in products_list)

    response = schemas.WarehouseDetails.model_validate(wh)
    response.product_count = len(products_list)
    response.products_in_stock = products_list
    response.recent_movements = movements_list
    response.total_value = total_value
    return response
