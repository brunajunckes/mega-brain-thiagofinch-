"""Tests for BrainStore (Qdrant per-clone storage)"""

import pytest
from brain.clone.store import BrainStore
from unittest.mock import MagicMock, patch, AsyncMock


def test_invalid_slug():
  """Invalid slugs should raise ValueError"""
  with pytest.raises(ValueError):
    BrainStore('INVALID_SLUG')  # Uppercase not allowed

  with pytest.raises(ValueError):
    BrainStore('special-chars')  # Only alphanumeric + underscore

  with pytest.raises(ValueError):
    BrainStore('')  # Empty

  with pytest.raises(ValueError):
    BrainStore('a' * 50)  # Too long


def test_valid_slug():
  """Valid slugs should not raise"""
  with patch('brain.clone.store.QdrantClient'):
    store = BrainStore('alex_hormozi')
    assert store.slug == 'alex_hormozi'
    assert store.collection_name == 'brain_clone_alex_hormozi'


@pytest.mark.asyncio
async def test_embedding_generation():
  """Embedding should fallback to zero vector on error"""
  with patch('brain.clone.store.QdrantClient'):
    store = BrainStore('test_clone')

    # Mock httpx to fail
    with patch('brain.clone.store.httpx.AsyncClient') as mock_client:
      mock_client.return_value.__aenter__.return_value.post.side_effect = Exception('Network error')
      result = await store.generate_embedding('test text')
      assert result == [0.0] * 768


@pytest.mark.asyncio
async def test_upsert_chunk():
  """Chunk upsertion should work"""
  with patch('brain.clone.store.QdrantClient') as mock_qdrant:
    store = BrainStore('test_clone')
    store.client.upsert = MagicMock()

    # Mock embedding
    with patch.object(store, 'generate_embedding', new_callable=AsyncMock) as mock_embed:
      mock_embed.return_value = [0.1] * 768

      point_id = await store.upsert_chunk(
        text='Test chunk',
        metadata={'source_type': 'test', 'source_url': 'http://test'},
      )

      assert point_id is not None
      store.client.upsert.assert_called_once()


def test_search():
  """Search should return results"""
  with patch('brain.clone.store.QdrantClient') as mock_qdrant:
    store = BrainStore('test_clone')

    # Mock search result
    class MockResult:
      def __init__(self):
        self.score = 0.95
        self.payload = {
          'text': 'Result text',
          'source_type': 'test',
          'source_url': 'http://test',
          'timestamp': '2025-01-01',
        }

    store.client.search = MagicMock(return_value=[MockResult()])
    results = store.search([0.1] * 768, limit=5)

    assert len(results) == 1
    assert results[0]['score'] == 0.95
    assert results[0]['text'] == 'Result text'
