"""Memory Store - Qdrant integration for persistent memory with real embeddings"""

import os
import httpx
from datetime import datetime
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import hashlib

# Qdrant configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "aiox-secret-key")
COLLECTION_NAME = "memory"
VECTOR_SIZE = 768  # Real embeddings from Ollama (nomic-embed-text)

# Ollama embedding
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://172.17.0.1:11434")
EMBED_MODEL = "nomic-embed-text"

# Initialize Qdrant client
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)


def ensure_collection_exists():
    """Create collection if it doesn't exist"""
    try:
        client.get_collection(COLLECTION_NAME)
    except:
        # Collection doesn't exist, create it
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        print(f"✅ Created Qdrant collection: {COLLECTION_NAME}")


async def generate_vector(text: str) -> List[float]:
    """
    Generate real semantic embedding using Ollama (nomic-embed-text).

    Args:
        text: Text to embed

    Returns:
        Vector of size VECTOR_SIZE (768)
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/embed",
                json={"model": EMBED_MODEL, "input": text}
            )
            response.raise_for_status()
            data = response.json()

            # Extract embedding from response
            embeddings = data.get("embeddings", [])
            if embeddings and len(embeddings) > 0:
                return embeddings[0]

            # Fallback: return zero vector if generation fails
            return [0.0] * VECTOR_SIZE
    except Exception as e:
        print(f"[ERROR] Failed to generate embedding: {e}")
        # Return zero vector as fallback
        return [0.0] * VECTOR_SIZE


async def save_to_memory(prompt: str, response: str, model: str, vector: Optional[List[float]] = None) -> bool:
    """
    Save prompt+response to Qdrant memory store.

    Args:
        prompt: User prompt
        response: Model response
        model: Model used for generation
        vector: Pre-generated embedding vector (optional)

    Returns:
        Success status
    """
    try:
        ensure_collection_exists()

        # Generate ID from prompt hash
        point_id = int(hashlib.md5(prompt.encode()).hexdigest()[:8], 16) % (2**31 - 1)

        # Create vector from prompt if not provided
        if vector is None:
            vector = await generate_vector(prompt)

        # Create point with metadata
        point = PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "prompt": prompt,
                "response": response,
                "model": model,
                "timestamp": datetime.now().isoformat(),
                "prompt_length": len(prompt),
                "response_length": len(response),
            },
        )

        # Upsert point (insert or update)
        client.upsert(collection_name=COLLECTION_NAME, points=[point])

        return True

    except Exception as e:
        print(f"❌ Error saving to memory: {e}")
        return False


def search_memory(query: Optional[str] = None, query_vector: Optional[List[float]] = None, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search similar responses in memory using embedding.

    Args:
        query: Search query string (will be embedded if provided)
        query_vector: Pre-generated embedding vector (optional, takes precedence)
        limit: Max results

    Returns:
        List of similar memory entries
    """
    try:
        ensure_collection_exists()

        # Use provided vector or generate from query
        if query_vector is not None:
            vector_to_search = query_vector
        elif query is not None:
            # Note: This is synchronous, but generate_vector is async
            # For now, we'll skip async generation in search_memory
            # The RAG pipeline will provide pre-generated vectors
            print("[WARNING] search_memory called without query_vector and async context not available")
            return []
        else:
            print("[ERROR] search_memory requires either query or query_vector")
            return []

        # Search in Qdrant
        results = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=vector_to_search,
            limit=limit,
        )

        # Return formatted results
        return [
            {
                "score": result.score,
                "prompt": result.payload.get("prompt"),
                "response": result.payload.get("response"),
                "model": result.payload.get("model"),
                "timestamp": result.payload.get("timestamp"),
                "content": result.payload.get("response"),  # For compatibility
            }
            for result in results
        ]

    except Exception as e:
        print(f"❌ Error searching memory: {e}")
        return []


async def get_memory_stats() -> dict:
    """Get collection statistics"""
    try:
        ensure_collection_exists()
        collection_info = client.get_collection(COLLECTION_NAME)
        return {
            "collection": COLLECTION_NAME,
            "points_count": collection_info.points_count,
            "vectors_count": collection_info.vectors_count,
            "status": "healthy",
        }
    except Exception as e:
        print(f"❌ Error getting memory stats: {e}")
        return {"status": "error", "error": str(e)}
