from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ScrapedProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    rating: Optional[float] = None
    image_url: Optional[str] = None
    availability: Optional[str] = None

class ScrapedProductInDB(ScrapedProductBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
