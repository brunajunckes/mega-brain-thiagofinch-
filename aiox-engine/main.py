#!/usr/bin/env python3
"""
AIOX Engine - Entry point for FastAPI server
Routes to api/main.py FastAPI app
"""

from api.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
