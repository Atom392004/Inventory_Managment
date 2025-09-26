from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import timedelta
import logging

from app import models, schemas
from app.database import get_db
from app.core import security

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_user_by_username_or_email(db: Session, identifier: str):
    """Fetches a user by their username or email."""
    # Try matching username OR email
    return db.query(models.User).filter(
        (models.User.username == identifier) | (models.User.email == identifier)
    ).first()

def authenticate_user(db: Session, identifier: str, password: str):
    """Authenticates a user based on username/email and password."""
    user = get_user_by_username_or_email(db, identifier)
    if not user or not security.verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """Gets the current user from the provided JWT token."""
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = int(payload.get("sub"))
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    """Ensures the current user is an admin."""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    return current_user

@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registers a new user."""
    try:
        # Check if user with username or email already exists
        existing = db.query(models.User).filter(
            (models.User.username == payload.username) | (models.User.email == payload.email)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username or Email already exists")

        # Hash password and create new user
        hashed = security.get_password_hash(payload.password)
        user = models.User(
            username=payload.username,
            email=payload.email,
            hashed_password=hashed,
            is_admin=False
        )
        
        # Add to database and commit
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException as e:
        # Re-raise explicit HTTPException errors
        raise e
    except SQLAlchemyError as e:
        # Catch and log database errors
        db.rollback()
        logger.error(f"Database error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user due to a database error."
        )
    except Exception as e:
        # Catch and log any other unexpected errors
        logger.error(f"Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Logs in an existing user and returns a JWT token."""
    try:
        # OAuth2PasswordRequestForm always sends "username" field → can be email OR username
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect username/email or password")

        token = security.create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException as e:
        # Re-raise explicit HTTPException errors
        raise e
    except SQLAlchemyError as e:
        # Catch and log database errors
        db.rollback()
        logger.error(f"Database error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log in due to a database error."
        )
    except Exception as e:
        # Catch and log any other unexpected errors
        logger.error(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login."
        )

@router.get("/me", response_model=schemas.UserRead)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Returns the current user's details."""
    return current_user
