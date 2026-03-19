from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import redis
import os
from typing import Optional
from datetime import datetime

# Environment
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

app = FastAPI(title="AIOX Engine", version="1.0.0")

# Redis connection
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Models
class AgentRequest(BaseModel):
    prompt: str
    model: Optional[str] = None

class AgentResponse(BaseModel):
    model: str
    response: str
    cached: bool
    timestamp: str

@app.on_event("startup")
async def startup_event():
    """Initialize connections"""
    try:
        redis_client.ping()
        print("✅ Redis connected")
    except Exception as e:
        print(f"❌ Redis error: {e}")

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "redis": check_redis(),
            "ollama": await check_ollama(),
        }
    }

def check_redis():
    """Check Redis health"""
    try:
        redis_client.ping()
        return "✅ OK"
    except:
        return "❌ FAIL"

async def check_ollama():
    """Check Ollama health"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags", timeout=5)
            return "✅ OK" if response.status_code == 200 else "❌ FAIL"
    except:
        return "❌ FAIL"

@app.post("/agent")
async def agent(request: AgentRequest) -> AgentResponse:
    """Main Agent endpoint - routes to optimal model"""

    # 1. Check cache
    cache_key = f"agent:{hash(request.prompt)}"
    cached_response = redis_client.get(cache_key)

    if cached_response:
        return AgentResponse(
            model=cached_response.split("|")[0],
            response=cached_response.split("|", 1)[1],
            cached=True,
            timestamp=datetime.now().isoformat()
        )

    # 2. Select model
    from router.selector import select_model as route_model
    model = request.model or route_model(request.prompt)

    # 3. Call Ollama
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": model, "prompt": request.prompt, "stream": False},
                timeout=60
            )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Ollama error")

        result = response.json()["response"]

        # 4. Save cache (24h)
        redis_client.setex(cache_key, 86400, f"{model}|{result}")

        # 5. Save memory (Qdrant)
        from memory.store import save_to_memory
        await save_to_memory(request.prompt, result, model)

        return AgentResponse(
            model=model,
            response=result,
            cached=False,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def stats():
    """Get usage statistics"""
    return {
        "cache_keys": redis_client.dbsize(),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
