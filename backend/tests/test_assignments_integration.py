import pytest

def test_assign_user_to_warehouse(auth_client, db):
    # Create a warehouse
    warehouse_response = auth_client.post("/warehouses", json={
        "name": "Test Warehouse",
        "location": "Test Location"
    })
    assert warehouse_response.status_code == 201
    warehouse_id = warehouse_response.json()["id"]

    # Create another user
    user_response = auth_client.post("/auth/register", json={
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "Password1!",
        "role": "user"
    })
    assert user_response.status_code == 201
    user_id = user_response.json()["id"]

    # Assign user to warehouse
    assign_response = auth_client.post("/assignments", json={
        "user_id": user_id,
        "warehouse_id": warehouse_id
    })
    assert assign_response.status_code == 201
    data = assign_response.json()
    assert data["user_id"] == user_id
    assert data["warehouse_id"] == warehouse_id

def test_list_assignments_for_warehouse(auth_client, db):
    # Create warehouse and user, assign
    warehouse_response = auth_client.post("/warehouses", json={
        "name": "Test Warehouse 2",
        "location": "Test Location"
    })
    warehouse_id = warehouse_response.json()["id"]

    user_response = auth_client.post("/auth/register", json={
        "username": "testuser3",
        "email": "test3@example.com",
        "password": "Password1!",
        "role": "user"
    })
    user_id = user_response.json()["id"]

    auth_client.post("/assignments", json={
        "user_id": user_id,
        "warehouse_id": warehouse_id
    })

    # List assignments
    list_response = auth_client.get(f"/assignments/warehouse/{warehouse_id}")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == user_id

def test_remove_assignment(auth_client, db):
    # Create and assign
    warehouse_response = auth_client.post("/warehouses", json={
        "name": "Test Warehouse 3",
        "location": "Test Location"
    })
    warehouse_id = warehouse_response.json()["id"]

    user_response = auth_client.post("/auth/register", json={
        "username": "testuser4",
        "email": "test4@example.com",
        "password": "Password1!",
        "role": "user"
    })
    user_id = user_response.json()["id"]

    assign_response = auth_client.post("/assignments", json={
        "user_id": user_id,
        "warehouse_id": warehouse_id
    })
    assignment_id = assign_response.json()["id"]

    # Remove assignment
    remove_response = auth_client.delete(f"/assignments/{assignment_id}")
    assert remove_response.status_code == 204

    # Check removed
    list_response = auth_client.get(f"/assignments/warehouse/{warehouse_id}")
    assert len(list_response.json()) == 0
