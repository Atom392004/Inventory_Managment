import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User
from app.crud.user_crud import (
    get_user_by_username,
    get_user_by_email,
    get_user_by_id,
    create_user,
    authenticate_user
)
from app.schemas.auth_schemas import UserCreate
from app.core.security import get_password_hash

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_crud.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_get_user_by_username_found(db):
    # Create a test user
    hashed_password = get_password_hash("Password1!")
    user = User(username="testuser", email="test@example.com", hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Test retrieval
    retrieved = get_user_by_username(db, "testuser")
    assert retrieved is not None
    assert retrieved.username == "testuser"

def test_get_user_by_username_not_found(db):
    retrieved = get_user_by_username(db, "nonexistent")
    assert retrieved is None

def test_get_user_by_email_found(db):
    # Create a test user
    hashed_password = get_password_hash("Password1!")
    user = User(username="testuser", email="test@example.com", hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Test retrieval
    retrieved = get_user_by_email(db, "test@example.com")
    assert retrieved is not None
    assert retrieved.email == "test@example.com"

def test_get_user_by_email_not_found(db):
    retrieved = get_user_by_email(db, "nonexistent@example.com")
    assert retrieved is None

def test_get_user_by_id_found(db):
    # Create a test user
    hashed_password = get_password_hash("Password1!")
    user = User(username="testuser", email="test@example.com", hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Test retrieval
    retrieved = get_user_by_id(db, user.id)
    assert retrieved is not None
    assert retrieved.id == user.id

def test_get_user_by_id_not_found(db):
    retrieved = get_user_by_id(db, "nonexistent_id")
    assert retrieved is None

def test_create_user(db):
    from app.schemas.auth_schemas import UserCreate
    user_create = UserCreate(username="newuser", email="new@example.com", password="Password1!", role="user")
    created = create_user(db, user_create)
    assert created.username == "newuser"
    assert created.email == "new@example.com"
    assert created.hashed_password != "Password1!"  # Should be hashed

def test_authenticate_user_success(db):
    # Create a test user
    hashed_password = get_password_hash("Password1!")
    user = User(username="testuser", email="test@example.com", hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Test authentication
    authenticated = authenticate_user(db, "testuser", "Password1!")
    assert authenticated is not None
    assert authenticated.username == "testuser"

def test_authenticate_user_wrong_password(db):
    # Create a test user
    hashed_password = get_password_hash("Password1!")
    user = User(username="testuser", email="test@example.com", hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Test authentication with wrong password
    authenticated = authenticate_user(db, "testuser", "wrongpassword")
    assert authenticated is None

def test_authenticate_user_nonexistent(db):
    authenticated = authenticate_user(db, "nonexistent", "Password1!")
    assert authenticated is None
