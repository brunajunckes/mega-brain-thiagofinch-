"""Tests for intelligent text chunking"""

import pytest
from brain.ingestion.chunker import chunk_text, estimate_tokens, validate_slug


def test_estimate_tokens():
  """Token estimation should work"""
  text = 'Hello world this is a test'
  tokens = estimate_tokens(text)
  assert tokens > 0
  assert tokens == int(len(text.split()) * 1.3)


def test_validate_slug():
  """Slug validation should enforce format"""
  assert validate_slug('alex_hormozi') == True
  assert validate_slug('naval123') == True
  assert validate_slug('test_clone_2') == True
  assert validate_slug('UPPERCASE') == False
  assert validate_slug('special-chars') == False
  assert validate_slug('') == False
  assert validate_slug('a' * 50) == False  # Too long


def test_chunk_small_text():
  """Small text should result in single chunk"""
  text = 'Short text'
  chunks = chunk_text(text, chunk_size=500, overlap=50)
  assert len(chunks) == 1
  assert chunks[0]['text'] == text
  assert chunks[0]['index'] == 0
  assert chunks[0]['total'] == 1


def test_chunk_large_text():
  """Large text should be chunked"""
  text = ' '.join(['word'] * 1000)  # ~1300 tokens
  chunks = chunk_text(text, chunk_size=500, overlap=50)
  assert len(chunks) > 1
  # Verify chunk metadata
  for idx, chunk in enumerate(chunks):
    assert chunk['index'] == idx
    assert chunk['total'] == len(chunks)
    assert chunk['token_count'] > 0


def test_chunk_minimum_size():
  """Chunks below minimum size should not be created"""
  text = ' '.join(['word'] * 100)  # ~130 tokens
  chunks = chunk_text(text, chunk_size=500, overlap=50)
  for chunk in chunks:
    assert chunk['token_count'] >= 50


def test_chunk_overlap():
  """Chunks should have overlap between them"""
  text = ' '.join(['word'] * 2000)  # ~2600 tokens
  chunks = chunk_text(text, chunk_size=500, overlap=50)
  if len(chunks) > 1:
    # Last char of chunk N should appear in chunk N+1
    for i in range(len(chunks) - 1):
      chunk_end = chunks[i]['end']
      next_start = chunks[i + 1]['start']
      assert next_start < chunk_end  # Overlap exists
