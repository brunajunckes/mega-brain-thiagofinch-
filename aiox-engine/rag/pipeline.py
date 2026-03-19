"""
RAG Pipeline for AIOX Engine
Retrieval-Augmented Generation: embed prompt, search Qdrant, build context, inject into messages
"""

import httpx
import os
import asyncio
from typing import List, Dict, Optional, Any
from session.manager import session_manager, Message

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://172.17.0.1:11434")
EMBED_MODEL = "nomic-embed-text"  # 768-dim, excellent for semantic search


async def generate_embedding(text: str) -> List[float]:
  """Generate embedding using Ollama embed endpoint (5s timeout)"""
  try:
    async with httpx.AsyncClient(timeout=5.0) as client:
      response = await client.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": EMBED_MODEL, "input": text}
      )
      response.raise_for_status()
      data = response.json()
      return data.get("embeddings", [[]])[0] if data.get("embeddings") else []
  except asyncio.TimeoutError:
    print(f"[WARN] Embedding timeout (5s) - continuing without RAG")
    return []
  except Exception as e:
    print(f"[WARN] Failed to generate embedding: {e} - continuing without RAG")
    return []


async def retrieve_context(embedding: List[float], limit: int = 3) -> List[Dict[str, Any]]:
  """Search Qdrant for relevant context using embedding"""
  from memory.store import search_memory

  try:
    # search_memory expects a vector; pass the embedding directly
    results = search_memory(query_vector=embedding, limit=limit)
    return results or []
  except Exception as e:
    print(f"[ERROR] Failed to retrieve context: {e}")
    return []


async def get_session_context(session_id: Optional[str], last_n: int = 10) -> List[Message]:
  """Retrieve session history for context"""
  if not session_id:
    return []

  try:
    messages = session_manager.get_messages(session_id, last_n=last_n)
    return messages
  except Exception as e:
    print(f"[ERROR] Failed to get session context: {e}")
    return []


def format_rag_context(retrieved_docs: List[Dict[str, Any]]) -> str:
  """Format retrieved documents into a context string"""
  if not retrieved_docs:
    return ""

  lines = ["## Relevant Context from History:\n"]
  for doc in retrieved_docs:
    content = doc.get("response", doc.get("content", ""))
    lines.append(f"- {content[:200]}...")  # Truncate to 200 chars
  return "\n".join(lines)


def build_messages_array(
  system_prompt: str,
  rag_context: str,
  session_messages: List[Message],
  current_prompt: str
) -> List[Dict[str, str]]:
  """Build OpenAI-compatible messages array for /api/chat"""
  messages = []

  # System prompt
  if system_prompt:
    messages.append({"role": "system", "content": system_prompt})

  # RAG context (if available)
  if rag_context:
    messages.append({"role": "system", "content": rag_context})

  # Session history (alternating user/assistant)
  for msg in session_messages:
    messages.append({"role": msg.role, "content": msg.content})

  # Current user prompt
  messages.append({"role": "user", "content": current_prompt})

  return messages


async def execute_rag_pipeline(
  prompt: str,
  session_id: Optional[str] = None,
  use_rag: bool = True
) -> Dict[str, Any]:
  """
  Execute full RAG pipeline (parallelized):
  1. Generate embedding for prompt AND retrieve session history (parallel)
  2. Search Qdrant for relevant context (if embedding succeeded)
  3. Build messages array
  Return: {embedding, rag_docs, session_history, messages, context_used}
  """

  result = {
    "embedding": [],
    "rag_docs": [],
    "session_history": [],
    "messages": [],
    "context_used": 0
  }

  # 1. Generate embedding + get session history in parallel (don't block each other)
  tasks = []
  if use_rag:
    tasks.append(generate_embedding(prompt))
  if session_id:
    tasks.append(get_session_context(session_id, last_n=10))

  if tasks:
    responses = await asyncio.gather(*tasks, return_exceptions=True)

    # Extract results (order: embedding, then session_messages)
    idx = 0
    if use_rag:
      embedding = responses[idx] if not isinstance(responses[idx], Exception) else []
      result["embedding"] = embedding
      idx += 1

      # 2. Search Qdrant for context (only if embedding succeeded)
      if embedding:
        rag_docs = await retrieve_context(embedding, limit=3)
        result["rag_docs"] = rag_docs
        result["context_used"] = len(rag_docs)

    if session_id and idx < len(responses):
      session_messages = responses[idx] if not isinstance(responses[idx], Exception) else []
      result["session_history"] = [m.to_dict() for m in session_messages]
  elif session_id:
    # Only session_id (no RAG)
    session_messages = await get_session_context(session_id, last_n=10)
    result["session_history"] = [m.to_dict() for m in session_messages]

  # 3. Build messages array
  system_prompt = "You are a helpful AI assistant. Respond concisely and accurately."
  rag_context = format_rag_context(result["rag_docs"]) if use_rag else ""
  session_msgs = [Message.from_dict(m) for m in result["session_history"]]

  messages = build_messages_array(system_prompt, rag_context, session_msgs, prompt)
  result["messages"] = messages

  return result
