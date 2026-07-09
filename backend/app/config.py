import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./stadiumos.db"
    GEMINI_API_KEY: str = ""
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
