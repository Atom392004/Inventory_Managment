from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create engine with connection pool settings
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800  # Recycle connections after 30 minutes
)

# Add engine event listener for debugging
@event.listens_for(engine, "connect")
def connect(dbapi_connection, connection_record):
    logger.info("Database connection established")

# Create SessionLocal for working with database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

# Function to get the DB session and check DB connection
def get_db():
    db = SessionLocal()  # Get session
    try:
        # Test the database connection with a raw SQL query using engine.connect()
        with engine.connect() as conn:
            query = text("SELECT 1")
            conn.execute(query)  # Execute raw SQL query
            logger.info("Database connection is successful.")
        
        yield db  # Yield the database session for the request
    except SQLAlchemyError as e:
        # If there's any error with the database connection
        logger.error(f"Database connection failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error"
        )
    finally:
        db.close()  # Always close the session

