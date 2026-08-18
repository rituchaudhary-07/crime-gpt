import os
from pathlib import Path
from dotenv import load_dotenv

# Paths
BASE_DIR = Path(__file__).resolve().parent
IS_VERCEL = os.getenv("VERCEL") is not None or os.getenv("VERCEL_ENV") is not None

if IS_VERCEL:
    DB_DIR = Path("/tmp/db")
    UPLOAD_DIR = Path("/tmp/uploads")
else:
    DB_DIR = BASE_DIR / "db"
    UPLOAD_DIR = BASE_DIR / "db" / "uploads"

try:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

# Load env file
load_dotenv(BASE_DIR / ".env")

# Database
if IS_VERCEL and not os.getenv("DATABASE_URL"):
    DATABASE_URL = "sqlite:////tmp/crimegpt.db"
else:
    default_db_path = (DB_DIR / "crimegpt.db").as_posix()
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path}")

if DATABASE_URL.startswith("sqlite:///"):
    db_file_str = DATABASE_URL.replace("sqlite:///", "")
    db_file_path = Path(db_file_str)
    if not db_file_path.is_absolute():
        db_file_path = (BASE_DIR / db_file_str).resolve()
    try:
        db_file_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    # Normalize path with forward slashes for SQLite compatibility on Windows
    DATABASE_URL = f"sqlite:///{db_file_path.as_posix()}"


# Security
SECRET_KEY = os.getenv("SECRET_KEY", "b3d5c6f1a8e9c2b4d7f5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Browser clients allowed to call the API. Use a comma-separated list in production,
# for example: https://crime-gpt-tau.vercel.app,https://crimegpt.vercel.app
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,https://crime-gpt-tau.vercel.app,https://crimegpt.vercel.app"
_parsed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip() and origin.strip() != "*"
]
_dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
CORS_ORIGINS = list(dict.fromkeys(_parsed_origins + _dev_origins))

# Email & Admin Approval Config
ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL", "rituchaudhary15077@gmail.com")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

