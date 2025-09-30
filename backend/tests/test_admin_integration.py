import pytest

def test_list_users(auth_client):
    response = auth_client.get("/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_toggle_role(auth_client):
    # Create user
    auth_client.post("/auth/register", json={
        "username": "admin_test_user",
        "email": "admin_test@example.com",
        "password": "Password1!",
        "role": "user"
    })
    # Get user id
    users = auth_client.get("/admin/users").json()
    user = next((u for u in users if u["username"] == "admin_test_user"), None)
    assert user is not None
    user_id = user["id"]

    response = auth_client.post(f"/admin/users/{user_id}/toggle_role")
    assert response.status_code == 200
    data = response.json()
    assert "role" in data

def test_update_user(auth_client):
    # Create user
    auth_client.post("/auth/register", json={
        "username": "update_test_user",
        "email": "update_test@example.com",
        "password": "Password1!",
        "role": "user"
    })
    users = auth_client.get("/admin/users").json()
    user = next((u for u in users if u["username"] == "update_test_user"), None)
    user_id = user["id"]

    response = auth_client.put(f"/admin/users/{user_id}", json={
        "username": "updated_username",
        "email": "updated_email@example.com",
        "role": "warehouse_owner"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "updated_username"
    assert data["email"] == "updated_email@example.com"
    assert data["role"] == "warehouse_owner"

def test_global_analytics(auth_client):
    response = auth_client.get("/admin/analytics/global")
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_warehouses" in data
    assert "total_products" in data
    assert "total_movements" in data
    assert "total_value" in data

def test_get_warehouse_user_usage(auth_client):
    # Create warehouse
    warehouse_response = auth_client.post("/warehouses", json={
        "name": "Analytics Warehouse",
        "location": "Location"
    })
    warehouse_id = warehouse_response.json()["id"]

    response = auth_client.get(f"/admin/warehouses/{warehouse_id}/users")
    assert response.status_code == 200
    data = response.json()
    assert data["warehouse_id"] == warehouse_id
    assert "users" in data
