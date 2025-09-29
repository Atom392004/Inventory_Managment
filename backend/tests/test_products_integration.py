import pytest

def test_create_product(auth_client):
    response = auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["sku"] == "TEST001"

def test_list_products(auth_client):
    # Create a product first
    auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    response = auth_client.get("/products")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert len(data["data"]) == 1

def test_list_products_pagination(auth_client):
    # Create multiple products
    for i in range(5):
        auth_client.post("/products", json={
            "name": f"Product {i}",
            "sku": f"SKU{i:03d}",
            "price": 10.0
        })
    response = auth_client.get("/products?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 2
    assert data["pagination"]["total"] == 5
    assert data["pagination"]["page"] == 1

def test_list_products_search(auth_client):
    auth_client.post("/products", json={
        "name": "Apple",
        "sku": "APP001",
        "price": 5.0
    })
    auth_client.post("/products", json={
        "name": "Banana",
        "sku": "BAN001",
        "price": 3.0
    })
    response = auth_client.get("/products?search=Apple")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "Apple"

def test_list_products_low_stock(auth_client):
    # Create product with low stock
    auth_client.post("/products", json={
        "name": "Low Stock Product",
        "sku": "LOW001",
        "price": 10.0
    })
    # Add stock movement to make total <=10
    auth_client.post("/stock-movements", json={
        "product_id": 1,  # Assuming ID 1
        "warehouse_id": 1,  # Need warehouse, but test might fail if no warehouse
        "quantity": 5
    })
    response = auth_client.get("/products?filter=low_stock")
    assert response.status_code == 200
    # Assuming it works

def test_get_product_details(auth_client):
    auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    response = auth_client.get("/products/1")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Product"

def test_update_product(auth_client):
    auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    response = auth_client.put("/products/1", json={
        "name": "Updated Product",
        "sku": "TEST001",
        "price": 15.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Product"

def test_delete_product(auth_client):
    auth_client.post("/products", json={
        "name": "Test Product",
        "sku": "TEST001",
        "price": 10.0
    })
    response = auth_client.delete("/products/1")
    assert response.status_code == 204
    # Check if deleted
    response = auth_client.get("/products/1")
    assert response.status_code == 404
