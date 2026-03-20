"""
Clone Agent — RAG-enabled expert clone with persona-based responses
"""

import os
import redis
import httpx
import json
import hashlib
from typing import Optional, List, Dict
from datetime import datetime
import asyncio

from brain.clone.builder import get_system_prompt, load_persona, validate_slug
from brain.clone.store import BrainStore

# Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://172.17.0.1:11434")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CLONE_MODEL = os.getenv("CLONE_MODEL", "qwen2.5:7b")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class CloneAgent:
    """RAG-enabled clone agent with persona and conversation memory"""

    def __init__(self, slug: str, session_id: Optional[str] = None):
        if not validate_slug(slug):
            raise ValueError(f"Invalid slug format: {slug}")

        self.slug = slug
        self.session_id = session_id or f"session_{slug}_{datetime.now().isoformat()}"
        self.brain_store = BrainStore(slug)
        self.persona = load_persona(slug)
        self.system_prompt = self.persona["system_prompt"]

    async def ask(
        self,
        question: str,
        use_rag: bool = True,
        stream: bool = False,
        model: Optional[str] = None
    ) -> Dict:
        """
        Query clone with RAG context and return in-persona response

        Returns:
        {
            "slug": slug,
            "question": question,
            "response": response_text,
            "session_id": session_id,
            "chunks_used": int,
            "cache_hit": bool,
            "model": model_used,
            "input_tokens": int,
            "output_tokens": int,
            "timestamp": iso_string
        }
        """
        model = model or CLONE_MODEL

        # Check cache
        question_hash = hashlib.sha256(question.encode()).hexdigest()[:8]
        cache_key = f"brain:ask:{self.slug}:{question_hash}"
        cached = redis_client.get(cache_key)

        if cached:
            result = json.loads(cached)
            result["cache_hit"] = True
            return result

        # Build messages array
        context_chunks = []
        chunks_used = 0

        if use_rag:
            # Query BrainStore for top-3 similar chunks
            search_results = self.brain_store.search(question, limit=3)
            context_chunks = [r["text"] for r in search_results]
            chunks_used = len(context_chunks)

        # Format context
        context_text = ""
        if context_chunks:
            context_text = "\n\n".join(context_chunks)
            context_text = f"Context:\n{context_text}\n\n"

        # Build messages
        messages = [
            {
                "role": "system",
                "content": self.system_prompt
            },
            {
                "role": "user",
                "content": f"{context_text}Question: {question}"
            }
        ]

        # Call Ollama
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
                response_text = data.get("message", {}).get("content", "")

                # Extract token counts (if available)
                input_tokens = data.get("prompt_eval_count", 0)
                output_tokens = data.get("eval_count", 0)
        except Exception as e:
            response_text = f"Error calling Ollama: {str(e)}"
            input_tokens = 0
            output_tokens = 0

        # Add attribution if used RAG
        if context_chunks and use_rag:
            # Get metadata from first chunk result
            first_result = self.brain_store.search(question, limit=1)[0]
            source_title = first_result.get("source_title", "unknown")
            source_type = first_result.get("source_type", "unknown")
            response_text += f"\n\n_(Based on {chunks_used} chunks from {source_title} [{source_type}])_"

        # Save to session history
        self._save_to_session(question, response_text)

        # Prepare result
        result = {
            "slug": self.slug,
            "question": question,
            "response": response_text,
            "session_id": self.session_id,
            "chunks_used": chunks_used,
            "cache_hit": False,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "timestamp": datetime.now().isoformat()
        }

        # Cache result (30 min = 1800s)
        redis_client.setex(cache_key, 1800, json.dumps(result))

        return result

    def _save_to_session(self, question: str, response: str):
        """Save Q&A to session history in Redis"""
        session_key = f"brain:session:{self.session_id}:{self.slug}"

        message = {
            "role": "user",
            "content": question,
            "timestamp": datetime.now().isoformat()
        }
        redis_client.lpush(session_key, json.dumps(message))

        message = {
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat()
        }
        redis_client.lpush(session_key, json.dumps(message))

        # Set 24h TTL
        redis_client.expire(session_key, 86400)

    def get_session_history(self, last_n: int = 10) -> List[Dict]:
        """Get last N messages from session history"""
        session_key = f"brain:session:{self.session_id}:{self.slug}"

        messages = []
        stored = redis_client.lrange(session_key, 0, last_n * 2)

        for msg_json in stored:
            try:
                messages.append(json.loads(msg_json))
            except:
                pass

        # Reverse to chronological order (lpush adds newest first)
        return list(reversed(messages))

    def clear_session(self) -> bool:
        """Clear session history"""
        session_key = f"brain:session:{self.session_id}:{self.slug}"
        deleted = redis_client.delete(session_key)
        return deleted > 0


if __name__ == "__main__":
    # Test
    import sys

    async def test():
        if len(sys.argv) > 1:
            slug = sys.argv[1]
            question = sys.argv[2] if len(sys.argv) > 2 else "Who are you?"

            agent = CloneAgent(slug)
            result = await agent.ask(question, use_rag=True)

            print(f"\nClone: {slug}")
            print(f"Question: {result['question']}")
            print(f"Response: {result['response']}")
            print(f"Chunks used: {result['chunks_used']}")
            print(f"Tokens: {result['input_tokens']} in, {result['output_tokens']} out")

    asyncio.run(test())
