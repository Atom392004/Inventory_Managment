from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# -- Warehouse --
class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None
    is_available: Optional[bool] = True
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseInDB(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
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
