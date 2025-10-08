import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    API_SECRET_KEY: str = os.getenv("API_SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    
    def validate(self):
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set")
        if not self.API_SECRET_KEY:
            raise ValueError("API_SECRET_KEY must be set")

settings = Settings()