import pytest

def test_record_stock_movement(auth_client):
    # Create product and warehouse first
    auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    response = auth_client.post("/stock-movements", json={
        "product_id": 1,
        "warehouse_id": 1,
        "movement_type": "in",
        "quantity": 10
    })
    assert response.status_code == 201
    data = response.json()
    assert "movement_id" in data

def test_list_stock_movements(auth_client):
    # Create dependencies
    auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    auth_client.post("/stock-movements", json={
        "product_id": 1,
        "warehouse_id": 1,
        "movement_type": "in",
        "quantity": 5
    })
    response = auth_client.get("/stock-movements")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["quantity"] == 5

def test_record_negative_stock_movement(auth_client):
    # Create dependencies
    auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    # Add initial stock
    auth_client.post("/stock-movements", json={
        "product_id": 1,
        "warehouse_id": 1,
        "movement_type": "in",
        "quantity": 10
    })
    # Remove stock
    response = auth_client.post("/stock-movements", json={
        "product_id": 1,
        "warehouse_id": 1,
        "movement_type": "out",
        "quantity": 5
    })
    assert response.status_code == 201
