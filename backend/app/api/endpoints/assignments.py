from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.api.endpoints.auth import get_current_admin, get_current_user

router = APIRouter()

@router.post("", response_model=schemas.UserWarehouseAssignmentInDB, status_code=201)
def assign_user_to_warehouse(payload: schemas.UserWarehouseAssignmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Only admins and warehouse_owners can assign
    if current_user.role not in ["admin", "warehouse_owner"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Check warehouse ownership
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == payload.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if current_user.role == "warehouse_owner" and warehouse.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Check user exists
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Check not already assigned
    existing = db.query(models.UserWarehouseAssignment).filter(
        models.UserWarehouseAssignment.user_id == payload.user_id,
        models.UserWarehouseAssignment.warehouse_id == payload.warehouse_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already assigned to this warehouse")
    assignment = models.UserWarehouseAssignment(user_id=payload.user_id, warehouse_id=payload.warehouse_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/warehouse/{warehouse_id}", response_model=list[schemas.UserWarehouseAssignmentInDB])
def list_assignments_for_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if current_user.role not in ["admin", "warehouse_owner"] or (current_user.role == "warehouse_owner" and warehouse.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    assignments = db.query(models.UserWarehouseAssignment).filter(models.UserWarehouseAssignment.warehouse_id == warehouse_id).all()
    return assignments

@router.delete("/{assignment_id}", status_code=204)
def remove_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assignment = db.query(models.UserWarehouseAssignment).filter(models.UserWarehouseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == assignment.warehouse_id).first()
    if current_user.role not in ["admin", "warehouse_owner"] or (current_user.role == "warehouse_owner" and warehouse.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(assignment)
    db.commit()
