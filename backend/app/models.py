from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from .database import Base

class UserRole(Enum):
    ADMIN = "admin"
    WAREHOUSE_OWNER = "warehouse_owner"
    USER = "user"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum("admin", "warehouse_owner", "user", name="userrole"), default="user", nullable=False)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="owner")
    warehouses = relationship("Warehouse", back_populates="owner")
    stock_movements = relationship("StockMovement", back_populates="user")
    warehouse_assignments = relationship("UserWarehouseAssignment", back_populates="user")

    @property
    def is_admin(self):
        return self.role == "admin"

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(50), nullable=False)
    description = Column(Text)
    price = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="products")

    __table_args__ = (
        UniqueConstraint('sku', 'owner_id', name='unique_product_sku_per_owner'),
        UniqueConstraint('name', 'owner_id', name='unique_product_name_per_owner'),
    )

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="warehouses")
    assigned_users = relationship("UserWarehouseAssignment", back_populates="warehouse")

class UserWarehouseAssignment(Base):
    __tablename__ = "user_warehouse_assignments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="warehouse_assignments")
    warehouse = relationship("Warehouse", back_populates="assigned_users")

    __table_args__ = (
        UniqueConstraint('user_id', 'warehouse_id', name='unique_user_warehouse_assignment'),
    )

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    movement_type = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reference_id = Column(String(36), index=True, nullable=True)

    product = relationship("Product")
    warehouse = relationship("Warehouse")

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="stock_movements")
