import os
from pathlib import Path
from dotenv import load_dotenv

# Paths
BASE_DIR = Path(__file__).resolve().parent
DB_DIR = BASE_DIR / "db"
DB_DIR.mkdir(parents=True, exist_ok=True)

# Load env file
load_dotenv(BASE_DIR / ".env")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_DIR}/crimegpt.db")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "b3d5c6f1a8e9c2b4d7f5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Browser clients allowed to call the API. Use a comma-separated list in production,
# for example: https://crime-gpt-tau.vercel.app,https://crimegpt.vercel.app
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,https://crime-gpt-tau.vercel.app,https://crimegpt.vercel.app"
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip() and origin.strip() != "*"
]
