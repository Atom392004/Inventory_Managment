from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# -- Auth / User --
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_admin: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# -- Product --
class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float = 0.0
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductInDB(ProductBase):
    id: int
    is_active: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    owner_id: Optional[int]

    class Config:
        from_attributes = True

class ProductSummary(ProductInDB):
    total_stock: int = 0

class ProductDetails(ProductInDB):
    stock_distribution: Optional[List[dict]] = []
    ledger_history: Optional[List[dict]] = []

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

class WarehouseDetails(WarehouseInDB):
    products_in_stock: Optional[List[dict]] = []
    recent_movements: Optional[List[dict]] = []
    total_value: Optional[float] = 0.0
