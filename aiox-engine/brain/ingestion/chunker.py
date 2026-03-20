"""Intelligent text chunking with token-aware overlap"""

import re
from typing import List, Tuple


def estimate_tokens(text: str) -> int:
  """Estimate token count via word-based heuristic (no tiktoken dependency)"""
  words = len(text.split())
  return max(1, int(words * 1.3))


def find_sentence_boundary(text: str, target_pos: int, direction: str = 'backward') -> int:
  """Find nearest sentence boundary (. ! ? \\n\\n) near target position"""
  if direction == 'backward':
    search_range = max(0, target_pos - 200), target_pos
    candidates = []
    for match in re.finditer(r'[.!?\n]', text[search_range[0]:search_range[1]]):
      pos = search_range[0] + match.start()
      if pos <= target_pos:
        candidates.append(pos)
    return candidates[-1] + 1 if candidates else target_pos
  else:
    search_range = target_pos, min(len(text), target_pos + 200)
    match = re.search(r'[.!?\n]', text[search_range[0]:search_range[1]])
    return search_range[0] + match.start() + 1 if match else target_pos


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[dict]:
  """
  Intelligently chunk text with sentence-aware boundaries and overlap.

  Args:
    text: Input text to chunk
    chunk_size: Target tokens per chunk
    overlap: Overlap tokens between chunks

  Returns:
    List of dicts: {'text': str, 'token_count': int, 'start': int, 'end': int}
  """
  if not text or estimate_tokens(text) <= chunk_size // 2:
    # Text is small enough for single chunk
    tokens = estimate_tokens(text)
    if tokens > 0:
      return [{
        'text': text,
        'token_count': tokens,
        'start': 0,
        'end': len(text),
      }]
    return []

  chunks = []
  pos = 0
  chunk_idx = 0

  while pos < len(text):
    # Calculate chunk end based on token budget
    target_end = pos + int((chunk_size / 1.3) * 1.1)  # Rough char-to-token conversion
    target_end = min(target_end, len(text))

    if target_end >= len(text):
      # Last chunk
      chunk_text = text[pos:]
      if estimate_tokens(chunk_text) >= 50:  # Minimum chunk size
        chunks.append({
          'text': chunk_text,
          'token_count': estimate_tokens(chunk_text),
          'start': pos,
          'end': len(text),
        })
      break

    # Find sentence boundary near target_end
    end = find_sentence_boundary(text, target_end, direction='backward')
    end = max(pos + int((chunk_size / 2) / 1.3), end)  # Never create tiny chunks

    chunk_text = text[pos:end].strip()
    if estimate_tokens(chunk_text) < 50:
      # Expand to next sentence if chunk is too small
      next_boundary = find_sentence_boundary(text, end + 100, direction='forward')
      end = next_boundary
      chunk_text = text[pos:end].strip()

    chunks.append({
      'text': chunk_text,
      'token_count': estimate_tokens(chunk_text),
      'start': pos,
      'end': end,
    })

    # Move position, accounting for overlap
    overlap_chars = int((overlap / 1.3) * 1.1)
    pos = end - overlap_chars
    chunk_idx += 1

  # Add metadata about total chunks
  total_chunks = len(chunks)
  for idx, chunk in enumerate(chunks):
    chunk['index'] = idx
    chunk['total'] = total_chunks

  return chunks


def validate_slug(slug: str) -> bool:
  """Validate clone slug format (^[a-z0-9_]{1,40}$)"""
  return bool(re.match(r'^[a-z0-9_]{1,40}$', slug))
