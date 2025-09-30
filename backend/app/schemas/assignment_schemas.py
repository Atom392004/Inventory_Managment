from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserWarehouseAssignmentBase(BaseModel):
    user_id: int
    warehouse_id: int

class UserWarehouseAssignmentCreate(UserWarehouseAssignmentBase):
    pass

class UserWarehouseAssignmentInDB(UserWarehouseAssignmentBase):
    id: int
    assigned_at: Optional[datetime]

    class Config:
        from_attributes = True
