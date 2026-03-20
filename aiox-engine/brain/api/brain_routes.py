"""FastAPI routes for Brain Factory"""

import asyncio
import json
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from brain.clone.store import BrainStore
from brain.clone.agent import CloneAgent
from brain.ingestion.doc import ingest_document
from brain.ingestion.pdf import ingest_pdf
from brain.ingestion.youtube import ingest_youtube
from brain.ingestion.image import ingest_image

router = APIRouter(prefix='/brain', tags=['brain'])

# In-memory job tracking (would be Redis in production)
JOBS = {}


class IngestRequest(BaseModel):
  slug: str
  source_type: str  # youtube, pdf, doc, image
  source_path: Optional[str] = None
  source_url: Optional[str] = None
  last_n: Optional[int] = None


class IngestResponse(BaseModel):
  job_id: str
  status: str


class AskRequest(BaseModel):
  slug: str
  question: str
  session_id: Optional[str] = None
  use_rag: bool = True
  model: Optional[str] = None


class AskResponse(BaseModel):
  slug: str
  question: str
  response: str
  session_id: str
  chunks_used: int
  cache_hit: bool
  model: str
  input_tokens: int
  output_tokens: int
  timestamp: str


@router.post('/ingest')
async def ingest_content(req: IngestRequest):
  """Kick off async ingestion job"""
  job_id = str(uuid.uuid4())[:8]

  # Validate slug
  try:
    store = BrainStore(req.slug)
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))

  # Start async job
  asyncio.create_task(_ingest_job(job_id, req, store))

  return IngestResponse(job_id=job_id, status='queued')


async def _ingest_job(job_id: str, req: IngestRequest, store: BrainStore):
  """Background ingestion job"""
  try:
    JOBS[job_id] = {'status': 'processing', 'chunks': 0, 'error': None}

    # Route based on source type
    if req.source_type == 'youtube':
      chunks = await ingest_youtube(req.source_url, req.slug, req.last_n)
    elif req.source_type == 'pdf':
      chunks = ingest_pdf(req.source_path, req.slug, req.source_url)
    elif req.source_type == 'doc':
      chunks = ingest_document(req.source_path, req.slug, req.source_url)
    elif req.source_type == 'image':
      chunks = await ingest_image(req.source_path, req.slug, req.source_url)
    else:
      raise ValueError(f'Unknown source type: {req.source_type}')

    # Store chunks
    for chunk in chunks:
      await store.upsert_chunk(
        text=chunk['text'],
        metadata={
          'source_type': chunk['source_type'],
          'source_url': chunk['source_url'],
          'source_title': chunk['source_title'],
          'chunk_index': chunk['index'],
          'chunk_total': chunk['total'],
          'clone_slug': chunk['clone_slug'],
        }
      )

    JOBS[job_id] = {'status': 'done', 'chunks': len(chunks), 'error': None}

  except Exception as e:
    print(f'❌ Job {job_id} failed: {e}')
    JOBS[job_id] = {'status': 'error', 'chunks': 0, 'error': str(e)}


@router.get('/job/{job_id}/status')
async def job_status(job_id: str):
  """Poll job progress"""
  if job_id not in JOBS:
    raise HTTPException(status_code=404, detail='Job not found')
  return JOBS[job_id]


@router.get('/clones')
async def list_clones():
  """List all brain clones"""
  # Find all brain_clone_* collections in Qdrant
  try:
    from qdrant_client import QdrantClient
    import os

    url = os.getenv('QDRANT_URL', 'http://localhost:6333')
    api_key = os.getenv('QDRANT_API_KEY', 'aiox-secret-key')
    client = QdrantClient(url=url, api_key=api_key)

    collections = client.get_collections().collections
    clones = []

    for col in collections:
      if col.name.startswith('brain_clone_'):
        slug = col.name.replace('brain_clone_', '')
        store = BrainStore(slug)
        stats = store.get_stats()
        clones.append(stats)

    return {'clones': clones, 'total': len(clones)}

  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@router.get('/clones/{slug}/stats')
async def clone_stats(slug: str):
  """Get stats for a specific clone"""
  try:
    store = BrainStore(slug)
    return store.get_stats()
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@router.post('/ask')
async def ask_clone(req: AskRequest) -> AskResponse:
  """Query clone with RAG context"""
  try:
    agent = CloneAgent(req.slug, req.session_id)
    result = await agent.ask(
      question=req.question,
      use_rag=req.use_rag,
      model=req.model
    )
    return AskResponse(**result)
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@router.get('/ask/{slug}/history')
async def clone_history(slug: str, session_id: Optional[str] = None, last_n: int = 10):
  """Get conversation history for clone"""
  try:
    agent = CloneAgent(slug, session_id)
    history = agent.get_session_history(last_n)
    return {
      'slug': slug,
      'session_id': agent.session_id,
      'messages': history,
      'count': len(history)
    }
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
