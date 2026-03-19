"""Memory Store - Qdrant integration for persistent memory"""

import os
from datetime import datetime
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import hashlib

# Qdrant configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "aiox-secret-key")
COLLECTION_NAME = "memory"
VECTOR_SIZE = 384  # Simple hash-based vectors (not embeddings)

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


def generate_vector(text: str) -> list:
    """
    Generate a simple vector from text using hash-based approach.

    For production, replace with proper embeddings (OpenAI, Huggingface, etc).
    This gives us vector storage infrastructure ready for real embeddings.

    Args:
        text: Text to vectorize

    Returns:
        Vector of size VECTOR_SIZE (384)
    """
    # Use hash for deterministic vector generation
    hash_obj = hashlib.sha256(text.encode())
    hash_int = int(hash_obj.hexdigest(), 16)

    # Generate pseudo-random vector from hash
    vector = []
    for i in range(VECTOR_SIZE):
        # Deterministic but distributed values
        val = ((hash_int >> (i % 64)) ^ (hash_int >> ((i + 1) % 64))) % 1000
        vector.append(val / 1000.0)  # Normalize to [0, 1]

    return vector


async def save_to_memory(prompt: str, response: str, model: str) -> bool:
    """
    Save prompt+response to Qdrant memory store.

    Args:
        prompt: User prompt
        response: Model response
        model: Model used for generation

    Returns:
        Success status
    """
    try:
        ensure_collection_exists()

        # Generate ID from prompt hash
        point_id = int(hashlib.md5(prompt.encode()).hexdigest()[:8], 16) % (2**31 - 1)

        # Create vector from prompt
        vector = generate_vector(prompt)

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


async def search_memory(query: str, limit: int = 5) -> list:
    """
    Search similar responses in memory.

    Args:
        query: Search query
        limit: Max results

    Returns:
        List of similar memory entries
    """
    try:
        ensure_collection_exists()

        # Generate query vector
        query_vector = generate_vector(query)

        # Search in Qdrant
        results = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
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
