from app.config import settings 
from sqlalchemy import text # Add this import to main.py
from app.database import SessionLocal
from fastapi import FastAPI
from app.database import Base, engine, get_db
from app.api.endpoints import products, warehouses, stock_movements, auth
from sqlalchemy.orm import Session
from app.core import security
from app import models
from fastapi.middleware.cors import CORSMiddleware
import os

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Inventory Management API",
    description="Inventory Management System API",
    version="1.0.0"
)

# Configure CORS with specific origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in allowed_origins.split(",")] if allowed_origins != "*" else ["*"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )

from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Not Found"}
    )

@app.on_event("startup")
async def startup_event():
    # Validate settings
    settings.validate()
    # Test database connection
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise
    finally:
        db.close()

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Server is running"}




# create tables
Base.metadata.create_all(bind=engine)

# ensure admin exists from env vars
def ensure_admin():
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")
    
    if not all([admin_username, admin_password, admin_email]):
        logger.info("Admin credentials not provided in env vars; skipping admin creation.")
        return
    
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.username == admin_username).first()
        if not existing:
            hashed = security.get_password_hash(admin_password)
            user = models.User(username=admin_username, email=admin_email, hashed_password=hashed, is_admin=True)
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Admin user '{admin_username}' created successfully.")
        else:
            logger.info(f"Admin user '{admin_username}' already exists.")
    except Exception as e:
        logger.error(f"Error ensuring admin user: {e}")
        db.rollback()
    finally:
        db.close()

ensure_admin()

# routers
app.include_router(auth.router, tags=["Auth"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(warehouses.router, prefix="/warehouses", tags=["Warehouses"])
app.include_router(stock_movements.router, prefix="/stock-movements", tags=["Stock Movements"])
