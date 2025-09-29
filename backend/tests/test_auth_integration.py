import pytest
from app import models

def test_register_success(client, db):
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password1!"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"

def test_register_duplicate_username(client, db):
    # Create first user
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password1!"
    })
    # Try duplicate username
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test2@example.com",
        "password": "Password2!"
    })
    assert response.status_code == 400
    assert "Username already exists" in response.json()["detail"]

def test_register_duplicate_email(client, db):
    # Create first user
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password1!"
    })
    # Try duplicate email
    response = client.post("/auth/register", json={
        "username": "testuser2",
        "email": "test@example.com",
        "password": "Password2!"
    })
    assert response.status_code == 400
    assert "Email already exists" in response.json()["detail"]

def test_register_weak_password(client, db):
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "weak"
    })
    assert response.status_code == 422  # Validation error

def test_login_success(client, db):
    # Register user
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password1!"
    })
    # Login
    response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "Password1!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, db):
    # Register user
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password1!"
    })
    # Login with wrong password
    response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "wrong"
    })
    assert response.status_code == 401
    assert "Incorrect username/email or password" in response.json()["detail"]

def test_get_me_authenticated(client, db):
    # Register and login
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password1!"
    })
    login_response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "Password1!"
    })
    token = login_response.json()["access_token"]

    # Get me
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
