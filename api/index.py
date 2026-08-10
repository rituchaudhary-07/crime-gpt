import sys
from pathlib import Path

file_dir = Path(__file__).resolve().parent
repo_dir = file_dir.parent
if str(repo_dir) not in sys.path:
    sys.path.insert(0, str(repo_dir))

from backend.main import app
