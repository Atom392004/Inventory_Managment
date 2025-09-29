from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Product, Warehouse, StockMovement
from typing import List
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Base queries filtered by user if not admin
    product_query = db.query(Product)
    warehouse_query = db.query(Warehouse)
    movement_query = db.query(StockMovement).join(Product)
    if not current_user.is_admin:
        product_query = product_query.filter(Product.owner_id == current_user.id)
        warehouse_query = warehouse_query.filter(Warehouse.owner_id == current_user.id)
        movement_query = movement_query.filter(Product.owner_id == current_user.id)

    # Get basic counts
    total_products = product_query.count()
    total_warehouses = warehouse_query.count()

    # Calculate total stock across all warehouses
    total_stock = movement_query.with_entities(func.sum(StockMovement.quantity)).scalar() or 0

    # Get products with low stock (less than 20% of max stock)
    stock_per_product = db.query(
        Product.id,
        Product.name,
        func.sum(StockMovement.quantity).label('total_stock')
    ).join(StockMovement).group_by(Product.id)
    if not current_user.is_admin:
        stock_per_product = stock_per_product.filter(Product.owner_id == current_user.id)
    stock_per_product = stock_per_product.subquery()

    low_stock_products = db.query(
        Product,
        stock_per_product.c.total_stock
    ).join(
        stock_per_product,
        Product.id == stock_per_product.c.id
    ).filter(
        stock_per_product.c.total_stock <= 20  # Threshold of 20 units
    )
    if not current_user.is_admin:
        low_stock_products = low_stock_products.filter(Product.owner_id == current_user.id)
    low_stock_products = low_stock_products.all()

    # Get recent stock movements (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_movements_query = db.query(
        func.to_char(StockMovement.created_at, 'YYYY-MM').label('month'),
        func.sum(StockMovement.quantity).label('total_quantity')
    ).join(Product).filter(
        StockMovement.created_at >= six_months_ago
    )
    if not current_user.is_admin:
        recent_movements_query = recent_movements_query.filter(Product.owner_id == current_user.id)
    recent_movements = recent_movements_query.group_by(
        func.to_char(StockMovement.created_at, 'YYYY-MM')
    ).order_by(
        'month'
    ).all()

    # Get stock distribution by warehouse
    stock_by_warehouse_query = db.query(
        Warehouse.name.label('warehouse_name'),
        func.sum(StockMovement.quantity).label('total_stock')
    ).join(
        StockMovement,
        Warehouse.id == StockMovement.warehouse_id
    ).join(
        Product,
        StockMovement.product_id == Product.id
    )
    if not current_user.is_admin:
        stock_by_warehouse_query = stock_by_warehouse_query.filter(Warehouse.owner_id == current_user.id, Product.owner_id == current_user.id)
    stock_by_warehouse = stock_by_warehouse_query.group_by(
        Warehouse.name
    ).all()

    # Get top 5 products by stock value
    top_products_query = db.query(
        Product.id,
        Product.name,
        Product.price,
        func.sum(StockMovement.quantity).label('total_stock'),
        (Product.price * func.sum(StockMovement.quantity)).label('total_value')
    ).join(StockMovement).group_by(Product.id, Product.name, Product.price)
    if not current_user.is_admin:
        top_products_query = top_products_query.filter(Product.owner_id == current_user.id)
    top_products = top_products_query.order_by(
        desc((Product.price * func.sum(StockMovement.quantity)))
    ).limit(5).all()

    # Get stock value trend (last 6 months)
    value_trend_query = db.query(
        func.to_char(StockMovement.created_at, 'YYYY-MM').label('month'),
        func.sum(StockMovement.quantity * Product.price).label('total_value')
    ).join(Product).filter(
        StockMovement.created_at >= six_months_ago
    )
    if not current_user.is_admin:
        value_trend_query = value_trend_query.filter(Product.owner_id == current_user.id)
    value_trend = value_trend_query.group_by(
        func.to_char(StockMovement.created_at, 'YYYY-MM')
    ).order_by(
        'month'
    ).all()

    return {
        "total_products": total_products,
        "total_warehouses": total_warehouses,
        "total_stock": total_stock,
        "low_stock_items": len(low_stock_products),
        "low_stock_products": [
            {
                "id": str(product[0].id),
                "name": product[0].name,
                "current_stock": product[1],
                "threshold": 20  # We can make this configurable per product later
            }
            for product in low_stock_products
        ],
        "stock_movements_trend": [
            {
                "month": movement[0],
                "total_quantity": movement[1]
            }
            for movement in recent_movements
        ],
        "stock_by_warehouse": [
            {
                "warehouse_name": item[0],
                "total_stock": item[1]
            }
            for item in stock_by_warehouse
        ],
        "top_products_by_value": [
            {
                "id": str(p[0]),
                "name": p[1],
                "price": float(p[2]),
                "total_stock": p[3],
                "total_value": float(p[4])
            }
            for p in top_products
        ],
        "stock_value_trend": [
            {
                "month": v[0],
                "total_value": float(v[1])
            }
            for v in value_trend
        ]
    }
