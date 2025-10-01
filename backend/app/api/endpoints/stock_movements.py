from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, select
import uuid

from app import models, schemas
from app.database import get_db
from app.api.endpoints.auth import get_current_user

router = APIRouter()

def get_current_stock(db: Session, product_id: int, warehouse_id: int) -> int:
    """Calculate current stock for a product in a warehouse."""
    result = db.query(func.coalesce(func.sum(models.StockMovement.quantity), 0)).filter(
        models.StockMovement.product_id == product_id,
        models.StockMovement.warehouse_id == warehouse_id
    ).scalar()
    return int(result)

# --- Record a stock movement (in/out) ---
@router.post("/", status_code=status.HTTP_201_CREATED)
def record_stock_movement(
    movement: schemas.StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).filter(
        models.Product.id == movement.product_id,
        models.Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or is inactive.")

    if current_user.role != "admin" and product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    warehouse = db.query(models.Warehouse).filter(
        models.Warehouse.id == movement.warehouse_id
    ).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found.")

    if movement.movement_type == "in" and not warehouse.is_available:
        raise HTTPException(status_code=400, detail="Cannot stock in to an unavailable warehouse.")

    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner" and warehouse.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "user":
        # Allow normal users to record stock movements
        pass

    # Adjust quantity based on movement_type
    if movement.movement_type == "out":
        quantity = -abs(movement.quantity)
    else:
        quantity = abs(movement.quantity)

    # Validate stock for outgoing movements
    if quantity < 0:
        current_stock = get_current_stock(db, movement.product_id, movement.warehouse_id)
        if current_stock < abs(quantity):
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Current stock: {current_stock}, requested: {abs(quantity)}"
            )

    db_movement = models.StockMovement(
        product_id=movement.product_id,
        warehouse_id=movement.warehouse_id,
        quantity=quantity,
        movement_type=movement.movement_type,
        notes=movement.notes,
        user_id=current_user.id
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return {"message": "Stock movement recorded successfully", "movement_id": db_movement.id}


# --- Record a stock transfer (between warehouses) ---
@router.post("/transfers", status_code=status.HTTP_201_CREATED)
def record_stock_transfer(
    transfer: schemas.StockTransferCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if transfer.from_warehouse_id == transfer.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouses cannot be the same.")

    product = db.query(models.Product).filter(
        models.Product.id == transfer.product_id,
        models.Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or is inactive.")

    if current_user.role != "admin" and product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    from_wh = db.query(models.Warehouse).filter(models.Warehouse.id == transfer.from_warehouse_id).first()
    to_wh = db.query(models.Warehouse).filter(models.Warehouse.id == transfer.to_warehouse_id).first()
    if not from_wh or not to_wh:
        raise HTTPException(status_code=404, detail="One or both warehouses not found.")

    if not from_wh.is_available:
        raise HTTPException(status_code=400, detail="Cannot transfer from an unavailable warehouse.")

    if not to_wh.is_available:
        raise HTTPException(status_code=400, detail="Cannot transfer to an unavailable warehouse.")

    # Check access for from_warehouse
    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner" and from_wh.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "user":
        # Allow normal users to record stock transfers
        pass

    # Check access for to_warehouse
    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner" and to_wh.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "user":
        # Allow normal users to record stock transfers
        pass

    # Validate stock in from_warehouse
    current_stock = get_current_stock(db, transfer.product_id, transfer.from_warehouse_id)
    if current_stock < transfer.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock in source warehouse. Current stock: {current_stock}, requested: {transfer.quantity}"
        )

    ref = str(uuid.uuid4())

    out_m = models.StockMovement(
        product_id=transfer.product_id,
        warehouse_id=transfer.from_warehouse_id,
        quantity=-abs(transfer.quantity),
        movement_type="transfer_out",
        reference_id=ref,
        notes=transfer.notes,
        user_id=current_user.id
    )
    in_m = models.StockMovement(
        product_id=transfer.product_id,
        warehouse_id=transfer.to_warehouse_id,
        quantity=abs(transfer.quantity),
        movement_type="transfer_in",
        reference_id=ref,
        notes=transfer.notes,
        user_id=current_user.id
    )

    db.add_all([out_m, in_m])
    db.commit()

    return {
        "message": "Stock transfer recorded successfully",
        "reference_id": ref,
        "from_id": out_m.id,
        "to_id": in_m.id
    }


# --- Get product stock distribution across warehouses ---
@router.get("/stock/{product_id}", response_model=dict)
def get_product_stock_distribution(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or is inactive.")

    if current_user.role != "admin" and product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Get accessible warehouses
    if current_user.role == "admin":
        warehouses = db.query(models.Warehouse).all()
    elif current_user.role == "warehouse_owner":
        warehouses = db.query(models.Warehouse).filter(models.Warehouse.owner_id == current_user.id).all()
    else:  # USER
        assigned_warehouse_ids = select(models.UserWarehouseAssignment.warehouse_id).where(models.UserWarehouseAssignment.user_id == current_user.id)
        warehouses = db.query(models.Warehouse).filter(
            or_(
                models.Warehouse.location == current_user.location,
                models.Warehouse.id.in_(assigned_warehouse_ids)
            )
        ).all()

    # Get stock for accessible warehouses
    stock_distribution = {}
    for warehouse in warehouses:
        current_stock = get_current_stock(db, product_id, warehouse.id)
        if current_stock > 0:
            stock_distribution[warehouse.id] = {
                "name": warehouse.name,
                "stock": current_stock
            }

    return {
        "product_id": product_id,
        "stock_distribution": stock_distribution,
        "total_stock": sum(d["stock"] for d in stock_distribution.values())
    }


# --- Get all stock movements ---
@router.get("/")
def list_stock_movements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    warehouse_id: int = Query(None),
    product_id: int = Query(None),
    movement_type: str = Query(None)
):
    query = db.query(
        models.StockMovement,
        models.Product.name.label("product_name"),
        models.User.username.label("username")
    ).select_from(models.StockMovement).join(models.Product, models.StockMovement.product_id == models.Product.id).outerjoin(models.User, models.StockMovement.user_id == models.User.id)

    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner":
        # Warehouse owners see movements to their warehouses
        warehouse_ids = select(models.Warehouse.id).where(models.Warehouse.owner_id == current_user.id)
        query = query.filter(models.StockMovement.warehouse_id.in_(warehouse_ids))
    else:  # USER
        # Normal users see movements they created
        query = query.filter(models.StockMovement.user_id == current_user.id)

    if warehouse_id:
        query = query.filter(models.StockMovement.warehouse_id == warehouse_id)
    if product_id:
        query = query.filter(models.StockMovement.product_id == product_id)
    if movement_type:
        query = query.filter(models.StockMovement.movement_type == movement_type)

    movements_with_users = query.order_by(models.StockMovement.created_at.desc()).all()

    results = []
    for movement, product_name, username in movements_with_users:
        movement_dict = schemas.StockMovementInDB.model_validate(movement).model_dump()
        movement_dict["product_name"] = product_name
        movement_dict["username"] = username or "Unknown"
        results.append(movement_dict)

    return results
