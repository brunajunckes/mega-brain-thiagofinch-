"""
AIOX Engine - FastAPI Backend
Multi-turn conversations with RAG, session management, and smart model routing
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import redis
import os
import uuid
from typing import Optional, List
from datetime import datetime
import sys
import asyncio

# Add project root to path for imports (works in both Docker and host)
import os
sys.path.insert(0, os.path.dirname(__file__))

try:
  from session.manager import session_manager, Message, SessionInfo
  from rag.pipeline import execute_rag_pipeline
  from router.selector import select_model
  from memory.store import save_to_memory
  # from brain.api.brain_routes import router as brain_router
except ImportError as e:
  print(f"[ERROR] Import failed: {e}")
  pass  # Ignore import error

# Environment
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://172.17.0.1:11434")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

app = FastAPI(title="AIOX Engine", version="2.0.0")

# Include Brain Factory router
# app.include_router(brain_router) # Brain module disabled

# Redis connection
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Models
class AgentRequest(BaseModel):
  prompt: str
  model: Optional[str] = None
  session_id: Optional[str] = None
  use_rag: bool = True

class AgentResponse(BaseModel):
  model: str
  response: str
  cached: bool
  session_id: str
  context_used: int
  timestamp: str

@app.on_event("startup")
async def startup_event():
  """Initialize on startup"""
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
  """Main Agent endpoint with session, RAG, and multi-turn support"""

  # Generate session ID if not provided
  session_id = request.session_id or str(uuid.uuid4())

  # Initialize session if new
  if not session_manager.session_exists(session_id):
    session_manager.create_session(session_id)

  # Check cache (session-scoped)
  cache_key = f"agent:{session_id}:{hash(request.prompt)}"
  cached_response = redis_client.get(cache_key)

  if cached_response:
    parts = cached_response.split("|", 2)
    return AgentResponse(
      model=parts[0],
      response=parts[1] if len(parts) > 1 else "",
      cached=True,
      session_id=session_id,
      context_used=0,
      timestamp=datetime.now().isoformat()
    )

  # Select model (routing)
  model = request.model or select_model(request.prompt)

  # Execute RAG pipeline
  rag_result = await execute_rag_pipeline(request.prompt, session_id, request.use_rag)
  context_used = rag_result.get("context_used", 0)
  messages = rag_result.get("messages", [])

  # Call Ollama /api/chat with messages array
  try:
    async with httpx.AsyncClient(timeout=60.0) as client:
      response = await client.post(
        f"{OLLAMA_URL}/api/chat",
        json={
          "model": model,
          "messages": messages,
          "stream": False
        }
      )
      response.raise_for_status()
      data = response.json()
      result_text = data.get("message", {}).get("content", "")
  except Exception as e:
    result_text = f"Error calling Ollama: {str(e)}"

  # Save to memory (async, fire-and-forget)
  embedding = rag_result.get("embedding", [])
  asyncio.create_task(save_to_memory(request.prompt, result_text, model, embedding))

  # Save to session history
  session_manager.save_message(session_id, "user", request.prompt)
  session_manager.save_message(session_id, "assistant", result_text, model)

  # Cache response (24h TTL)
  cache_value = f"{model}|{result_text}"
  redis_client.setex(cache_key, 86400, cache_value)

  return AgentResponse(
    model=model,
    response=result_text,
    cached=False,
    session_id=session_id,
    context_used=context_used,
    timestamp=datetime.now().isoformat()
  )

@app.get("/session/{session_id}")
async def get_session(session_id: str):
  """Get session information"""
  info = session_manager.get_session_info(session_id)
  if not info:
    raise HTTPException(status_code=404, detail="Session not found")

  messages = session_manager.get_messages(session_id, last_n=50)
  return {
    "session_id": session_id,
    "created_at": info.created_at,
    "message_count": info.message_count,
    "messages": [m.to_dict() for m in messages]
  }

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
  """Clear session"""
  success = session_manager.clear_session(session_id)
  return {"success": success, "session_id": session_id}

@app.get("/stats")
async def stats():
  """Get system statistics"""
  try:
    dbsize = redis_client.dbsize()
    return {
      "timestamp": datetime.now().isoformat(),
      "redis_keys": dbsize,
      "cache_status": "healthy"
    }
  except Exception as e:
    return {
      "timestamp": datetime.now().isoformat(),
      "error": str(e)
    }

if __name__ == "__main__":
  import uvicorn
  uvicorn.run(app, host="0.0.0.0", port=8000)
