from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# -- Warehouse --
class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseInDB(WarehouseBase):
    id: int
    created_at: Optional[datetime]
    owner_id: Optional[int]
    product_count: Optional[int] = 0
    total_value: Optional[float] = 0.0

    class Config:
        from_attributes = True

class WarehouseDetails(WarehouseInDB):
    products_in_stock: Optional[List[dict]] = []
    recent_movements: Optional[List[dict]] = []
    total_value: Optional[float] = 0.0
