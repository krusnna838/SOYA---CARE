import os
import secrets
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    BASE_DIR = BASE_DIR
    DB_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "soybeancare.db")))
    if not DB_PATH.is_absolute():
        DB_PATH = BASE_DIR / DB_PATH

    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY") or secrets.token_hex(32)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "7")))
    
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB limit
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "https://soybeancare-frontend.onrender.com")
    DEFAULT_CORS_ORIGINS = (
        "https://soybeancare-frontend.onrender.com,"
        "http://localhost:5173,http://127.0.0.1:5173"
    )
    CORS_ORIGINS = [
        o.strip().rstrip("/")
        for o in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
        if o.strip()
    ]
    
    # External AI APIs
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")
    
    ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
    ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "soybean-crop-disease/6")
    
    MIN_PREDICTION_CONFIDENCE = float(os.getenv("MIN_PREDICTION_CONFIDENCE", "0.50"))
    SOYBEAN_DETECTOR_MIN_CONFIDENCE = float(os.getenv("SOYBEAN_DETECTOR_MIN_CONFIDENCE", "0.75"))
    
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID", "")
