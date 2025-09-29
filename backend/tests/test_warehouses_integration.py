import pytest

def test_create_warehouse(auth_client):
    response = auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Warehouse"

def test_list_warehouses(auth_client):
    auth_client.post("/warehouses", json={
        "name": "Warehouse 1",
        "location": "Location 1"
    })
    response = auth_client.get("/warehouses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Warehouse 1"

def test_get_warehouse(auth_client):
    auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    response = auth_client.get("/warehouses/1")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Warehouse"

def test_update_warehouse(auth_client):
    auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    response = auth_client.put("/warehouses/1", json={
        "name": "Updated Warehouse",
        "location": "Updated Location"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Warehouse"

def test_delete_warehouse(auth_client):
    auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    response = auth_client.delete("/warehouses/1")
    assert response.status_code == 204
    response = auth_client.get("/warehouses/1")
    assert response.status_code == 404
