"""Per-clone Qdrant vector storage with collection-per-slug pattern"""

import os
import re
import httpx
from datetime import datetime
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import hashlib


QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY', 'aiox-secret-key')
VECTOR_SIZE = 768  # nomic-embed-text
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://172.17.0.1:11434')
EMBED_MODEL = 'nomic-embed-text'


class BrainStore:
  """Per-clone vector store using Qdrant with collection: brain_clone_{slug}"""

  def __init__(self, slug: str):
    if not re.match(r'^[a-z0-9_]{1,40}$', slug):
      raise ValueError(f'Invalid slug format: {slug}. Must match ^[a-z0-9_]{{1,40}}$')
    self.slug = slug
    self.collection_name = f'brain_clone_{slug}'
    self.client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    self.ensure_collection()

  def ensure_collection(self) -> None:
    """Create collection if it doesn't exist"""
    try:
      self.client.get_collection(self.collection_name)
    except:
      self.client.create_collection(
        collection_name=self.collection_name,
        vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
      )
      print(f'✅ Created Qdrant collection: {self.collection_name}')

  async def generate_embedding(self, text: str) -> List[float]:
    """Generate embedding via Ollama nomic-embed-text"""
    try:
      async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
          f'{OLLAMA_URL}/api/embed',
          json={'model': EMBED_MODEL, 'input': text}
        )
        response.raise_for_status()
        data = response.json()
        embeddings = data.get('embeddings', [])
        return embeddings[0] if embeddings else [0.0] * VECTOR_SIZE
    except Exception as e:
      print(f'[ERROR] Embedding generation failed: {e}')
      return [0.0] * VECTOR_SIZE

  async def upsert_chunk(self, text: str, metadata: dict, vector: Optional[List[float]] = None) -> str:
    """
    Store a chunk with metadata in Qdrant collection.

    Args:
      text: Chunk text
      metadata: Dict with source_type, source_url, source_title, chunk_index, chunk_total, clone_slug, ingested_at
      vector: Pre-computed embedding (optional)

    Returns:
      Point ID as string
    """
    try:
      # Generate vector if not provided
      if vector is None:
        vector = await self.generate_embedding(text)

      # Create deterministic point ID from text hash
      point_id = int(hashlib.md5(text.encode()).hexdigest()[:8], 16) % (2**31 - 1)

      payload = {
        'text': text,
        **metadata,
        'timestamp': datetime.now().isoformat(),
      }

      point = PointStruct(
        id=point_id,
        vector=vector,
        payload=payload,
      )

      self.client.upsert(collection_name=self.collection_name, points=[point])
      return str(point_id)

    except Exception as e:
      print(f'❌ Error upserting chunk: {e}')
      raise

  def search(self, query_vector: List[float], limit: int = 5) -> List[Dict[str, Any]]:
    """Search collection by vector"""
    try:
      results = self.client.search(
        collection_name=self.collection_name,
        query_vector=query_vector,
        limit=limit,
      )

      return [
        {
          'score': result.score,
          'text': result.payload.get('text'),
          'source_type': result.payload.get('source_type'),
          'source_url': result.payload.get('source_url'),
          'source_title': result.payload.get('source_title'),
          'timestamp': result.payload.get('timestamp'),
        }
        for result in results
      ]

    except Exception as e:
      print(f'❌ Error searching: {e}')
      return []

  def get_stats(self) -> dict:
    """Get collection statistics"""
    try:
      collection_info = self.client.get_collection(self.collection_name)
      return {
        'slug': self.slug,
        'collection': self.collection_name,
        'points_count': collection_info.points_count,
        'vectors_count': collection_info.vectors_count,
        'status': 'healthy',
      }
    except Exception as e:
      print(f'❌ Error getting stats: {e}')
      return {'slug': self.slug, 'status': 'error', 'error': str(e)}

  def delete_collection(self) -> bool:
    """Delete entire collection"""
    try:
      self.client.delete_collection(self.collection_name)
      return True
    except Exception as e:
      print(f'❌ Error deleting collection: {e}')
      return False
