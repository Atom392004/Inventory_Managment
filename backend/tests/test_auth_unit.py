import pytest
from pydantic import ValidationError
from app.schemas.auth_schemas import UserCreate

def test_password_validation_valid():
    # Valid password
    user = UserCreate(username="test", email="test@example.com", password="Password1!")
    assert user.password == "Password1!"

def test_password_validation_too_short():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(username="test", email="test@example.com", password="Pass1!")
    assert "Password must be at least 8 characters long" in str(exc_info.value)

def test_password_validation_no_uppercase():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(username="test", email="test@example.com", password="password1!")
    assert "Password must contain at least one uppercase letter" in str(exc_info.value)

def test_password_validation_no_lowercase():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(username="test", email="test@example.com", password="PASSWORD1!")
    assert "Password must contain at least one lowercase letter" in str(exc_info.value)

def test_password_validation_no_digit():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(username="test", email="test@example.com", password="Password!")
    assert "Password must contain at least one digit" in str(exc_info.value)

def test_password_validation_no_special():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(username="test", email="test@example.com", password="Password1")
    assert "Password must contain at least one special character" in str(exc_info.value)
