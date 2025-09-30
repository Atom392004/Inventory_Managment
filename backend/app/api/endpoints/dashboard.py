from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, select
from datetime import datetime, timedelta
from app.database import get_db
from app import models
from typing import List
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/user-analytics")
def get_user_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "warehouse_owner":
        raise HTTPException(status_code=403, detail="Only warehouse owners can access user analytics")

    # Get users who have made stock movements in these warehouses
    user_movements = db.query(
        models.User.username,
        models.User.id,
        func.count(models.StockMovement.id).label('movement_count'),
        func.sum(func.abs(models.StockMovement.quantity)).label('total_quantity'),
        func.max(models.StockMovement.created_at).label('last_activity')
    ).join(
        models.StockMovement, models.StockMovement.user_id == models.User.id
    ).join(
        models.Warehouse, models.StockMovement.warehouse_id == models.Warehouse.id
    ).filter(
        models.Warehouse.owner_id == current_user.id
    ).group_by(
        models.User.id, models.User.username
    ).order_by(
        desc(func.count(models.StockMovement.id))
    ).all()

    return {
        "user_activity": [
            {
                "user_id": u.id,
                "username": u.username,
                "movement_count": u.movement_count,
                "total_quantity": int(u.total_quantity or 0),
                "last_activity": u.last_activity.isoformat() if u.last_activity else None
            }
            for u in user_movements
        ]
    }

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Base queries filtered by role
    product_query = db.query(models.Product)
    warehouse_query = db.query(models.Warehouse)
    movement_query = db.query(models.StockMovement).join(models.Product, models.StockMovement.product_id == models.Product.id)

    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner":
        product_query = product_query.filter(models.Product.owner_id == current_user.id)
        warehouse_query = warehouse_query.filter(models.Warehouse.owner_id == current_user.id)
        movement_query = movement_query.filter(models.Product.owner_id == current_user.id)
    else:  # USER
        product_query = product_query.filter(models.Product.owner_id == current_user.id)
        # Warehouses that are available (ignore location and assignment for visibility)
        assigned_warehouse_ids = select(models.UserWarehouseAssignment.warehouse_id).where(models.UserWarehouseAssignment.user_id == current_user.id)
        warehouse_query = warehouse_query.filter(
            models.Warehouse.is_available == True
        )
        movement_query = movement_query.filter(models.Product.owner_id == current_user.id).join(models.Warehouse, models.StockMovement.warehouse_id == models.Warehouse.id).filter(
            models.Warehouse.is_available == True
        )

    # Get basic counts
    total_products = product_query.count()
    total_warehouses = warehouse_query.count()

    # Calculate total stock across all warehouses
    total_stock = movement_query.with_entities(func.sum(models.StockMovement.quantity)).scalar() or 0

    # Get products with low stock (less than 20% of max stock)
    stock_per_product = db.query(
        models.Product.id,
        models.Product.name,
        func.sum(models.StockMovement.quantity).label('total_stock')
    ).join(models.StockMovement, models.Product.id == models.StockMovement.product_id).group_by(models.Product.id)
    if current_user.role != "admin":
        stock_per_product = stock_per_product.filter(models.Product.owner_id == current_user.id)
    stock_per_product = stock_per_product.subquery()

    low_stock_products = db.query(
        models.Product,
        stock_per_product.c.total_stock
    ).join(
        stock_per_product,
        models.Product.id == stock_per_product.c.id
    ).filter(
        stock_per_product.c.total_stock <= 20  # Threshold of 20 units
    )
    if current_user.role != "admin":
        low_stock_products = low_stock_products.filter(models.Product.owner_id == current_user.id)
    low_stock_products = low_stock_products.all()

    # Get recent stock movements (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    if db.bind.dialect.name == 'sqlite':
        # SQLite does not support to_char, use strftime instead
        recent_movements_query = db.query(
            func.strftime('%Y-%m', models.StockMovement.created_at).label('month'),
            func.sum(models.StockMovement.quantity).label('total_quantity')
        ).join(models.Product, models.StockMovement.product_id == models.Product.id).filter(
            models.StockMovement.created_at >= six_months_ago
        )
        if current_user.role != "admin":
            recent_movements_query = recent_movements_query.filter(models.Product.owner_id == current_user.id)
        recent_movements = recent_movements_query.group_by(
            func.strftime('%Y-%m', models.StockMovement.created_at)
        ).order_by(
            'month'
        ).all()
    else:
        recent_movements_query = db.query(
            func.to_char(models.StockMovement.created_at, 'YYYY-MM').label('month'),
            func.sum(models.StockMovement.quantity).label('total_quantity')
        ).join(models.Product, models.StockMovement.product_id == models.Product.id).filter(
            models.StockMovement.created_at >= six_months_ago
        )
        if current_user.role != "admin":
            recent_movements_query = recent_movements_query.filter(models.Product.owner_id == current_user.id)
        recent_movements = recent_movements_query.group_by(
            func.to_char(models.StockMovement.created_at, 'YYYY-MM')
        ).order_by(
            'month'
        ).all()

    # Get stock distribution by warehouse
    stock_by_warehouse_query = db.query(
        models.Warehouse.name.label('warehouse_name'),
        func.sum(models.StockMovement.quantity).label('total_stock')
    ).join(
        models.StockMovement,
        models.Warehouse.id == models.StockMovement.warehouse_id
    ).join(
        models.Product,
        models.StockMovement.product_id == models.Product.id
    )
    if current_user.role == "admin":
        pass
    elif current_user.role == "warehouse_owner":
        stock_by_warehouse_query = stock_by_warehouse_query.filter(models.Warehouse.owner_id == current_user.id, models.Product.owner_id == current_user.id)
    else:  # USER
        assigned_warehouse_ids = select(models.UserWarehouseAssignment.warehouse_id).where(models.UserWarehouseAssignment.user_id == current_user.id)
        stock_by_warehouse_query = stock_by_warehouse_query.filter(
            models.Warehouse.is_available == True,
            models.Product.owner_id == current_user.id
        )
    stock_by_warehouse = stock_by_warehouse_query.group_by(
        models.Warehouse.name
    ).all()

    # Get top 5 products by stock value
    top_products_query = db.query(
        models.Product.id,
        models.Product.name,
        models.Product.price,
        func.sum(models.StockMovement.quantity).label('total_stock'),
        (models.Product.price * func.sum(models.StockMovement.quantity)).label('total_value')
    ).join(models.StockMovement, models.Product.id == models.StockMovement.product_id).group_by(models.Product.id, models.Product.name, models.Product.price)
    if current_user.role != "admin":
        top_products_query = top_products_query.filter(models.Product.owner_id == current_user.id)
    top_products = top_products_query.order_by(
        desc((models.Product.price * func.sum(models.StockMovement.quantity)))
    ).limit(5).all()

    # Get stock value trend (last 6 months)
    if db.bind.dialect.name == 'sqlite':
        value_trend_query = db.query(
            func.strftime('%Y-%m', models.StockMovement.created_at).label('month'),
            func.sum(models.StockMovement.quantity * models.Product.price).label('total_value')
        ).join(models.Product, models.StockMovement.product_id == models.Product.id).filter(
            models.StockMovement.created_at >= six_months_ago
        )
        if current_user.role != "admin":
            value_trend_query = value_trend_query.filter(models.Product.owner_id == current_user.id)
        value_trend = value_trend_query.group_by(
            func.strftime('%Y-%m', models.StockMovement.created_at)
        ).order_by(
            'month'
        ).all()
    else:
        value_trend_query = db.query(
            func.to_char(models.StockMovement.created_at, 'YYYY-MM').label('month'),
            func.sum(models.StockMovement.quantity * models.Product.price).label('total_value')
        ).join(models.Product, models.StockMovement.product_id == models.Product.id).filter(
            models.StockMovement.created_at >= six_months_ago
        )
        if current_user.role != "admin":
            value_trend_query = value_trend_query.filter(models.Product.owner_id == current_user.id)
        value_trend = value_trend_query.group_by(
            func.to_char(models.StockMovement.created_at, 'YYYY-MM')
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
