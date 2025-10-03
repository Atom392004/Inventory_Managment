from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# -- Stock Movement --
class StockMovementBase(BaseModel):
    product_id: int
    warehouse_id: int
    movement_type: str
    quantity: int
    notes: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementInDB(StockMovementBase):
    id: int
    created_at: Optional[datetime]
    reference_id: Optional[str]
    user_id: Optional[int]

    class Config:
        from_attributes = True

# ✅ New schema for transfers
class StockTransferCreate(BaseModel):
    product_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: int
    notes: Optional[str] = None

# Schemas for StockMovementRequest
class StockMovementRequestBase(BaseModel):
    product_id: int
    warehouse_id: Optional[int] = None
    from_warehouse_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    movement_type: str
    quantity: int
    notes: Optional[str] = None

class StockMovementRequestCreate(StockMovementRequestBase):
    pass

class StockMovementRequestInDB(StockMovementRequestBase):
    id: int
    status: str
    rejection_reason: Optional[str]
    created_at: Optional[datetime]
    approved_at: Optional[datetime]
    user_id: int
    approved_by: Optional[int]

    class Config:
        from_attributes = True

class ApproveRequest(BaseModel):
    action: str
    reason: Optional[str] = None
