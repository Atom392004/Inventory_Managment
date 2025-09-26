# app/schemas/auth_schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
