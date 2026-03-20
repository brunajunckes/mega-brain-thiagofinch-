"""Plain text and markdown document ingestion"""

from pathlib import Path
from .chunker import chunk_text
from typing import List, Dict, Any


def ingest_document(file_path: str, slug: str, source_url: str = None) -> List[Dict[str, Any]]:
  """
  Ingest plain text or markdown file.

  Args:
    file_path: Path to text/markdown file
    slug: Clone slug
    source_url: Optional source URL

  Returns:
    List of chunks with metadata
  """
  try:
    path = Path(file_path)
    if not path.exists():
      raise FileNotFoundError(f'File not found: {file_path}')

    # Read file
    text = path.read_text(encoding='utf-8')

    # Chunk
    chunks = chunk_text(text, chunk_size=500, overlap=50)

    # Add metadata
    for chunk in chunks:
      chunk.update({
        'source_type': 'document',
        'source_url': source_url or f'file://{path.absolute()}',
        'source_title': path.stem,
        'clone_slug': slug,
      })

    return chunks

  except Exception as e:
    print(f'❌ Error ingesting document: {e}')
    raise
