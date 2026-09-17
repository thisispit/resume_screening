import os
import sys
from pathlib import Path

# Add backend directory to python path for Vercel serverless environment
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Ensure Vercel knows we are running in Vercel environment
os.environ["VERCEL"] = "1"

from app.main import app

# Export ASGI app for Vercel Serverless Function handler
__all__ = ["app"]
