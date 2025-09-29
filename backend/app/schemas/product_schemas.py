from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
