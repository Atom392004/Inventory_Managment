ta#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.database import SessionLocal
from backend.app import models
from backend.app.core.security import get_password_hash

def add_admin():
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_location = os.getenv("ADMIN_LOCATION", "Headquarters")

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(models.User).filter(models.User.username == admin_username).first()
        if existing_admin:
            print("Admin user already exists.")
            return

        # Create admin user
        hashed_password = get_password_hash(admin_password)
        admin_user = models.User(
            username=admin_username,
            email=admin_email,
            hashed_password=hashed_password,
            role="admin",
            location=admin_location
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Admin user created: {admin_user.username}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_admin()
