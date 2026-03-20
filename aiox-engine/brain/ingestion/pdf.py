"""PDF document ingestion via PyMuPDF"""

from pathlib import Path
from .chunker import chunk_text
from typing import List, Dict, Any

try:
  import fitz  # PyMuPDF
except ImportError:
  fitz = None


def ingest_pdf(file_path: str, slug: str, source_url: str = None) -> List[Dict[str, Any]]:
  """
  Extract text from PDF and ingest as chunks.

  Args:
    file_path: Path to PDF file
    slug: Clone slug
    source_url: Optional source URL

  Returns:
    List of chunks with metadata
  """
  if fitz is None:
    raise ImportError('PyMuPDF (fitz) not installed. Run: pip install pymupdf')

  try:
    path = Path(file_path)
    if not path.exists():
      raise FileNotFoundError(f'File not found: {file_path}')

    # Extract text from PDF
    doc = fitz.open(path)
    text_parts = []

    for page_num in range(len(doc)):
      page = doc[page_num]
      text = page.get_text()
      text_parts.append(f'[PAGE {page_num + 1}]\n{text}')

    full_text = '\n\n'.join(text_parts)
    doc.close()

    # Chunk
    chunks = chunk_text(full_text, chunk_size=500, overlap=50)

    # Add metadata
    for chunk in chunks:
      chunk.update({
        'source_type': 'pdf',
        'source_url': source_url or f'file://{path.absolute()}',
        'source_title': path.stem,
        'clone_slug': slug,
      })

    return chunks

  except Exception as e:
    print(f'❌ Error ingesting PDF: {e}')
    raise
