# AIOX Engine - Phase 2 Implementation

**Status:** ✅ Complete — Ready for Docker Deployment

## Overview

AIOX Engine é um sistema de orquestração de IA que:
- ✅ Roteia prompts inteligentemente entre 3 modelos Ollama otimizados
- ✅ Cacheia respostas em Redis (TTL 24h)
- ✅ Armazena memória em Qdrant para aprendizado
- ✅ Expõe API FastAPI `/agent` para integração

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Application (8000)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /agent → [Cache] → [Router] → [Ollama] → [Store]  │
│  └──────────────────────────────────────────────────────┘   │
└──────────┬──────────────────┬──────────────────┬──────────────┘
           │                  │                  │
       Redis (6379)      Ollama (11434)     Qdrant (6333)
       Cache Layer      Model Execution    Memory Layer
```

## Directory Structure

```
/aiox-engine/
├── api/
│   ├── main.py              # FastAPI application
│   └── __init__.py
├── router/
│   ├── selector.py          # Model selection logic
│   └── __init__.py
├── memory/
│   ├── store.py             # Qdrant integration
│   └── __init__.py
├── cache/                   # Redis cache (future)
├── tests/
│   ├── test_model_selector.py      # Unit tests
│   └── test_integration.py         # Integration tests
├── monitoring/              # Prometheus metrics (future)
├── docker/
│   └── Dockerfile           # Container image
├── docker-compose.yml       # Multi-container orchestration
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── validate-structure.sh    # Validation script
└── README.md               # This file
```

## Components

### 1. Model Router (`router/selector.py`)

Routes prompts to optimal model:

```python
deepseek-coder:6.7b    → Code generation, debugging, infrastructure
qwen2.5:14b            → Reasoning, design, architecture, decisions
qwen2.5:7b             → Simple tasks, default/fallback
```

**Selection Logic:**
- Analyzes prompt for code keywords/patterns → `deepseek-coder`
- Analyzes prompt for reasoning keywords/patterns → `qwen2.5:14b`
- Everything else → `qwen2.5:7b` (fast)

### 2. FastAPI App (`api/main.py`)

**Endpoints:**

#### `POST /agent`
```bash
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "write a python function",
    "model": "deepseek-coder:6.7b"  # optional
  }'
```

**Response:**
```json
{
  "model": "deepseek-coder:6.7b",
  "response": "...",
  "cached": false,
  "timestamp": "2026-03-20T12:00:00.000000"
}
```

**Flow:**
1. Check Redis cache (24h TTL)
2. If cached → return immediately
3. If not cached:
   - Select optimal model (if not specified)
   - Call Ollama `/api/generate`
   - Save to Redis cache
   - Save to Qdrant memory
   - Return response

#### `GET /health`
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-20T12:00:00.000000",
  "services": {
    "redis": "✅ OK",
    "ollama": "✅ OK"
  }
}
```

#### `GET /stats`
```bash
curl http://localhost:8000/stats
```

Response:
```json
{
  "cache_keys": 42,
  "timestamp": "2026-03-20T12:00:00.000000"
}
```

### 3. Memory Store (`memory/store.py`)

Integrates with Qdrant for persistent memory:

- **Collection:** `memory`
- **Storage:** prompt + response + model + metadata
- **Vector Size:** 384 (hash-based for now, ready for real embeddings)

**API:**
- `save_to_memory(prompt, response, model)` → Stores in Qdrant
- `search_memory(query, limit=5)` → Returns similar memories
- `get_memory_stats()` → Collection metrics

## Getting Started

### Prerequisites

- Docker & Docker Compose
- `/force-ollama` with Ollama running (or Docker will start it)

### 1. Setup Environment

```bash
cd /aiox-engine
cp .env.example .env
```

### 2. Validate Structure

```bash
./validate-structure.sh
```

Expected output: ✅ All validation checks passed!

### 3. Start Services

```bash
# Start all services in background
docker-compose up -d

# Watch logs
docker-compose logs -f aiox-api

# Check service health
docker-compose ps
```

### 4. Test API

```bash
# Health check
curl http://localhost:8000/health

# Test code detection
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "write a python function to parse JSON"}'

# Test reasoning detection
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "design a system architecture for caching"}'

# Test fast default
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello world"}'
```

### 5. View Statistics

```bash
curl http://localhost:8000/stats
```

## Testing

### Unit Tests

```bash
# Test model selection logic
cd /aiox-engine
python3 tests/test_model_selector.py

# Output: ✅ All model selector tests passed!
```

### Manual Integration Test

After `docker-compose up -d`, test the full pipeline:

```bash
# 1. First call (not cached)
time curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "debug this error message"}'

# 2. Second call (cached - should be instant)
time curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "debug this error message"}'
```

## Configuration

### Environment Variables

```bash
# Ollama
OLLAMA_URL=http://ollama:11434

# Redis
REDIS_URL=redis://redis:6379

# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=aiox-secret-key

# Application
ENV=production
LOG_LEVEL=INFO
```

### Docker Compose Services

| Service | Port | Purpose | Healthcheck |
|---------|------|---------|-------------|
| ollama | 11434 | Model execution | `curl /api/tags` |
| redis | 6379 | Cache layer | `redis-cli ping` |
| qdrant | 6333 | Vector memory | `curl /health` |
| aiox-api | 8000 | FastAPI app | `curl /health` |

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f aiox-api
docker-compose logs -f ollama
docker-compose logs -f redis
docker-compose logs -f qdrant
```

### Resource Usage

```bash
docker stats
```

### Service Health

```bash
# Check all services
docker-compose ps

# Manual health check
curl http://localhost:8000/health
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs aiox-api

# Common issues:
# - Port already in use: change port mappings in docker-compose.yml
# - Ollama not running: ensure /force-ollama/executor/evolution-worker-24-7.js is active
# - Redis connection: check REDIS_URL environment variable
```

### Models not found

```bash
# Inside ollama container
docker exec aiox-ollama ollama list

# Pull models manually
docker exec aiox-ollama ollama pull qwen2.5:7b
docker exec aiox-ollama ollama pull deepseek-coder:6.7b
docker exec aiox-ollama ollama pull qwen2.5:14b
```

### Slow responses

```bash
# Check cache stats
curl http://localhost:8000/stats

# If cache_keys is low, first calls will be slow
# Subsequent calls should be instant (cached)
```

## Next Steps

- [ ] Implement Prometheus metrics (`monitoring/metrics.py`)
- [ ] Add GraphQL endpoint for advanced queries
- [ ] Real embeddings integration (OpenAI/Huggingface)
- [ ] Rate limiting and authentication
- [ ] Load testing and optimization
- [ ] Kubernetes deployment configuration

## Related Documentation

- **Evolution Worker:** `/force-ollama/README.md`
- **Model Routing Config:** `/force-ollama/config/model-routing.yaml`
- **AIOX Constitution:** `.aiox-core/constitution.md`
- **Session Notes:** `/root/.claude/projects/-srv-aiox/memory/SESSION-AIOX-OLLAMA-ENGINE-SETUP.md`

## Support

For issues or questions:
1. Check logs: `docker-compose logs aiox-api`
2. Run validation: `./validate-structure.sh`
3. Test components individually (see Testing section)
4. Review error messages in stdout
