from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, aliased
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

# --- Request a stock movement (in/out) ---
@router.post("/", status_code=status.HTTP_201_CREATED)
def request_stock_movement(
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
        # Allow normal users to request stock movements
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

    # Check if warehouse has an owner for approval
    if not warehouse.owner_id:
        raise HTTPException(status_code=400, detail="Warehouse has no owner to approve the request.")

    db_request = models.StockMovementRequest(
        product_id=movement.product_id,
        warehouse_id=movement.warehouse_id,
        movement_type=movement.movement_type,
        quantity=quantity,
        notes=movement.notes,
        user_id=current_user.id,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return {"message": "Stock movement request submitted successfully", "request_id": db_request.id}


# --- Request a stock transfer (between warehouses) ---
@router.post("/transfers", status_code=status.HTTP_201_CREATED)
def request_stock_transfer(
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
        # Allow normal users to request stock transfers
        pass

    # Check access for to_warehouse
    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner" and to_wh.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "user":
        # Allow normal users to request stock transfers
        pass

    # Validate stock in from_warehouse
    current_stock = get_current_stock(db, transfer.product_id, transfer.from_warehouse_id)
    if current_stock < transfer.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock in source warehouse. Current stock: {current_stock}, requested: {transfer.quantity}"
        )

    # Check if destination warehouse has an owner for approval
    if not to_wh.owner_id:
        raise HTTPException(status_code=400, detail="Destination warehouse has no owner to approve the transfer request.")

    db_request = models.StockMovementRequest(
        product_id=transfer.product_id,
        from_warehouse_id=transfer.from_warehouse_id,
        to_warehouse_id=transfer.to_warehouse_id,
        movement_type="transfer",
        quantity=transfer.quantity,
        notes=transfer.notes,
        user_id=current_user.id,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return {"message": "Stock transfer request submitted successfully", "request_id": db_request.id}


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


# --- List pending stock movement requests for warehouse owners ---
@router.get("/requests")
def list_pending_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "warehouse_owner"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Define warehouse aliases for joins
    warehouse_alias = aliased(models.Warehouse)
    from_warehouse_alias = aliased(models.Warehouse)
    to_warehouse_alias = aliased(models.Warehouse)

    query = db.query(
        models.StockMovementRequest,
        models.Product.name.label("product_name"),
        models.User.username.label("requester_username"),
        warehouse_alias.name.label("warehouse_name"),
        from_warehouse_alias.name.label("from_warehouse_name"),
        to_warehouse_alias.name.label("to_warehouse_name")
    ).select_from(models.StockMovementRequest).join(
        models.Product, models.StockMovementRequest.product_id == models.Product.id
    ).join(
        models.User, models.StockMovementRequest.user_id == models.User.id
    ).outerjoin(
        warehouse_alias, models.StockMovementRequest.warehouse_id == warehouse_alias.id
    ).outerjoin(
        from_warehouse_alias, models.StockMovementRequest.from_warehouse_id == from_warehouse_alias.id
    ).outerjoin(
        to_warehouse_alias, models.StockMovementRequest.to_warehouse_id == to_warehouse_alias.id
    )

    if current_user.role == "admin":
        pass
    else:  # warehouse_owner
        # Requests where the warehouse owner needs to approve
        warehouse_ids = select(models.Warehouse.id).where(models.Warehouse.owner_id == current_user.id)
        query = query.filter(
            or_(
                models.StockMovementRequest.warehouse_id.in_(warehouse_ids),  # for in/out
                models.StockMovementRequest.to_warehouse_id.in_(warehouse_ids)  # for transfers
            )
        )

    query = query.filter(models.StockMovementRequest.status == "pending").order_by(models.StockMovementRequest.created_at.desc())

    requests_with_details = query.all()

    results = []
    for request, product_name, requester_username, warehouse_name, from_warehouse_name, to_warehouse_name in requests_with_details:
        request_dict = schemas.StockMovementRequestInDB.model_validate(request).model_dump()
        request_dict["product_name"] = product_name
        request_dict["requester_username"] = requester_username
        # Add warehouse names
        request_dict["warehouse_name"] = warehouse_name
        request_dict["from_warehouse_name"] = from_warehouse_name
        request_dict["to_warehouse_name"] = to_warehouse_name
        results.append(request_dict)

    return results

# --- List user's own stock movement requests ---
@router.get("/my-requests")
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Define warehouse aliases for joins
    warehouse_alias = aliased(models.Warehouse)
    from_warehouse_alias = aliased(models.Warehouse)
    to_warehouse_alias = aliased(models.Warehouse)

    query = db.query(
        models.StockMovementRequest,
        models.Product.name.label("product_name"),
        warehouse_alias.name.label("warehouse_name"),
        from_warehouse_alias.name.label("from_warehouse_name"),
        to_warehouse_alias.name.label("to_warehouse_name")
    ).select_from(models.StockMovementRequest).join(
        models.Product, models.StockMovementRequest.product_id == models.Product.id
    ).outerjoin(
        warehouse_alias, models.StockMovementRequest.warehouse_id == warehouse_alias.id
    ).outerjoin(
        from_warehouse_alias, models.StockMovementRequest.from_warehouse_id == from_warehouse_alias.id
    ).outerjoin(
        to_warehouse_alias, models.StockMovementRequest.to_warehouse_id == to_warehouse_alias.id
    ).filter(models.StockMovementRequest.user_id == current_user.id).order_by(models.StockMovementRequest.created_at.desc())

    requests_with_details = query.all()

    results = []
    for request, product_name, warehouse_name, from_warehouse_name, to_warehouse_name in requests_with_details:
        request_dict = schemas.StockMovementRequestInDB.model_validate(request).model_dump()
        request_dict["product_name"] = product_name
        # Add warehouse names
        request_dict["warehouse_name"] = warehouse_name
        request_dict["from_warehouse_name"] = from_warehouse_name
        request_dict["to_warehouse_name"] = to_warehouse_name
        results.append(request_dict)

    return results

# --- Approve or reject a stock movement request ---
@router.post("/requests/{request_id}/approve")
def approve_request(
    request_id: int,
    approve: schemas.ApproveRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "warehouse_owner"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    request = db.query(models.StockMovementRequest).filter(models.StockMovementRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending.")

    # Check if current user can approve
    can_approve = False
    if current_user.role == "admin":
        can_approve = True
    elif current_user.role == "warehouse_owner":
        if request.movement_type in ["in", "out"] and request.warehouse and request.warehouse.owner_id == current_user.id:
            can_approve = True
        elif request.movement_type == "transfer" and request.to_warehouse and request.to_warehouse.owner_id == current_user.id:
            can_approve = True

    if not can_approve:
        raise HTTPException(status_code=403, detail="Forbidden")

    action = approve.action
    if action == "approve":
        # Create the actual stock movements
        if request.movement_type in ["in", "out"]:
            db_movement = models.StockMovement(
                product_id=request.product_id,
                warehouse_id=request.warehouse_id,
                quantity=request.quantity,
                movement_type=request.movement_type,
                notes=request.notes,
                user_id=request.user_id
            )
            db.add(db_movement)
        elif request.movement_type == "transfer":
            ref = str(uuid.uuid4())
            out_m = models.StockMovement(
                product_id=request.product_id,
                warehouse_id=request.from_warehouse_id,
                quantity=-abs(request.quantity),
                movement_type="transfer_out",
                reference_id=ref,
                notes=request.notes,
                user_id=request.user_id
            )
            in_m = models.StockMovement(
                product_id=request.product_id,
                warehouse_id=request.to_warehouse_id,
                quantity=abs(request.quantity),
                movement_type="transfer_in",
                reference_id=ref,
                notes=request.notes,
                user_id=request.user_id
            )
            db.add_all([out_m, in_m])

        request.status = "approved"
        request.approved_by = current_user.id
        request.approved_at = func.now()
    elif action == "reject":
        request.status = "rejected"
        request.rejection_reason = approve.reason
        request.approved_by = current_user.id
        request.approved_at = func.now()
    else:
        raise HTTPException(status_code=400, detail="Invalid action.")

    db.commit()
    return {"message": f"Request {action}d successfully"}

# --- Cancel a pending stock movement request ---
@router.delete("/my-requests/{request_id}")
def cancel_my_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    request = db.query(models.StockMovementRequest).filter(
        models.StockMovementRequest.id == request_id,
        models.StockMovementRequest.user_id == current_user.id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")
    if request.status not in ["pending", "rejected"]:
        raise HTTPException(status_code=400, detail="Only pending or rejected requests can be cancelled.")

    db.delete(request)
    db.commit()
    return {"message": "Request cancelled successfully"}

# --- Clear all pending requests (admin only) ---
@router.delete("/requests/clear-all")
def clear_all_pending_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    deleted_count = db.query(models.StockMovementRequest).filter(
        models.StockMovementRequest.status == "pending"
    ).delete()
    db.commit()
    return {"message": f"Cleared {deleted_count} pending requests"}

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
