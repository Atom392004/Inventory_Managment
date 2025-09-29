import pytest

def test_get_dashboard(auth_client):
    # Create some data
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
        "quantity": 10
    })
    response = auth_client.get("/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "total_warehouses" in data
    assert "total_stock" in data
    assert "low_stock_products" in data
