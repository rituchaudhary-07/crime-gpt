"""Development launcher for the NyayaIQ FastAPI service."""
import os
import sys
from pathlib import Path
import uvicorn

# Ensure project root is in sys.path
backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent

if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Support running from both root directory and backend directory
app_target = "main:app" if Path.cwd() == backend_dir else "backend.main:app"

if __name__ == "__main__":
    uvicorn.run(
        app_target,
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "true").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )

