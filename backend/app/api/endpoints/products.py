
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime
import uuid

from app import models, schemas
from app.database import get_db
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.post("", response_model=schemas.ProductInDB, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing_sku = db.query(models.Product).filter(models.Product.sku == product.sku, models.Product.owner_id == current_user.id).first()
    if existing_sku:
        raise HTTPException(status_code=400, detail="A product with this SKU already exists.")

    existing_name = db.query(models.Product).filter(models.Product.name == product.name, models.Product.owner_id == current_user.id).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="A product with this name already exists.")

    db_product = models.Product(**product.model_dump(), owner_id=current_user.id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("", response_model=List[schemas.ProductSummary])
def list_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at_desc", pattern="^(name|sku|price|created_at)_(asc|desc)$"),
    search: Optional[str] = None,
    created_from_date: Optional[datetime] = None,
    created_to_date: Optional[datetime] = None,
    include_inactive: bool = Query(False),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(
        models.Product,
        func.coalesce(func.sum(models.StockMovement.quantity), 0).label("total_stock")
    ).outerjoin(
        models.StockMovement, models.Product.id == models.StockMovement.product_id
    )

    # filter active unless include_inactive
    if not include_inactive:
        query = query.filter(models.Product.is_active == True)

    # non-admin users see only their products
    if not current_user.is_admin:
        query = query.filter(models.Product.owner_id == current_user.id)

    if search:
        query = query.filter(or_(
            models.Product.name.ilike(f"%{search}%"),
            models.Product.sku.ilike(f"%{search}%")
        ))

    if created_from_date:
        query = query.filter(models.Product.created_at >= created_from_date)

    if created_to_date:
        query = query.filter(models.Product.created_at <= created_to_date)

    # Apply sorting
    sort_column, sort_order = sort_by.rsplit('_', 1)
    if sort_column == 'price':
        sort_field = models.Product.price
    elif sort_column == 'stock':
        sort_field = func.coalesce(func.sum(models.StockMovement.quantity), 0)
    else:
        sort_field = getattr(models.Product, sort_column)

    if sort_order == 'desc':
        query = query.order_by(sort_field.desc())
    else:
        query = query.order_by(sort_field.asc())

    query = query.group_by(models.Product.id)

    products_with_stock = query.offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for product, total_stock in products_with_stock:
        product_summary = schemas.ProductSummary.model_validate(product)
        product_summary.total_stock = int(total_stock)
        results.append(product_summary)

    return results

@router.get("/{id}", response_model=schemas.ProductDetails)
def get_product_details(id: int = Path(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == id, models.Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or is inactive.")
    if not current_user.is_admin and product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Calculate stock distribution per warehouse
    stock_distribution = db.query(
        models.Warehouse.id.label("warehouse_id"),
        models.Warehouse.name.label("warehouse_name"),
        func.coalesce(func.sum(models.StockMovement.quantity), 0).label("stock")
    ).join(
        models.StockMovement, models.Warehouse.id == models.StockMovement.warehouse_id
    ).filter(
        models.StockMovement.product_id == id
    ).group_by(
        models.Warehouse.id, models.Warehouse.name
    ).all()

    # Get ledger history
    ledger_history = db.query(models.StockMovement).filter(models.StockMovement.product_id == id).order_by(models.StockMovement.created_at.desc()).all()

    response = schemas.ProductDetails.model_validate(product)
    response.stock_distribution = [
        {"warehouse_id":d.warehouse_id, "warehouse_name":d.warehouse_name, "stock":int(d.stock)}
        for d in stock_distribution
    ]
    response.ledger_history = [schemas.StockMovementInDB.model_validate(m) for m in ledger_history]

    return response

@router.put("/{id}", response_model=schemas.ProductInDB)
def update_product(
    id: int,
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_product = db.query(models.Product).filter(models.Product.id == id, models.Product.is_active == True).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found or is inactive.")
    if not current_user.is_admin and db_product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Check for SKU conflict, excluding the current product
    if product.sku != db_product.sku:
        existing_sku = db.query(models.Product).filter(models.Product.sku == product.sku, models.Product.owner_id == current_user.id).first()
        if existing_sku:
            raise HTTPException(status_code=400, detail="SKU already exists.")

    # Check for name conflict, excluding the current product
    if product.name != db_product.name:
        existing_name = db.query(models.Product).filter(models.Product.name == product.name, models.Product.owner_id == current_user.id).first()
        if existing_name:
            raise HTTPException(status_code=400, detail="A product with this name already exists.")

    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{id}", status_code=204)
def delete_product(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_product = db.query(models.Product).filter(models.Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if not current_user.is_admin and db_product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Delete associated stock movements first
    db.query(models.StockMovement).filter(models.StockMovement.product_id == id).delete()
    # Then delete the product
    db.delete(db_product)
    db.commit()
    return
