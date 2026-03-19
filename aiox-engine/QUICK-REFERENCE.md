# AIOX Engine — Quick Reference

## 🚀 Start Engine (30 seconds)

```bash
cd /aiox-engine
./start-engine.sh
```

**Expected Output:**
```
✅ AIOX Engine Started!
Services Running:
  • FastAPI:  http://localhost:8000
  • Ollama:   http://localhost:11434
  • Redis:    localhost:6379
  • Qdrant:   http://localhost:6333
```

## 📊 Check Health

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "redis": "✅ OK",
    "ollama": "✅ OK"
  }
}
```

## 🤖 Send Prompt

```bash
# Code task
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "write a python function"}'

# Reasoning task
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "design a system"}'

# Simple task
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello"}'
```

## 📈 Cache Statistics

```bash
curl http://localhost:8000/stats
```

**Response:**
```json
{
  "cache_keys": 42,
  "timestamp": "2026-03-20T12:00:00"
}
```

## 🔍 View Logs

```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f aiox-api

# Last 100 lines
docker-compose logs -n 100 aiox-api

# Ollama
docker-compose logs -f ollama
```

## 📋 Service Status

```bash
docker-compose ps
```

**Output:**
```
NAME               STATUS          PORTS
aiox-ollama        Up 2 hours      0.0.0.0:11434->11434/tcp
aiox-redis         Up 2 hours      0.0.0.0:6379->6379/tcp
aiox-qdrant        Up 2 hours      0.0.0.0:6333->6333/tcp
aiox-api           Up 2 hours      0.0.0.0:8000->8000/tcp
```

## 🛑 Stop Engine

```bash
docker-compose down
```

## 🔄 Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart aiox-api
```

## 🧪 Run Tests

```bash
python3 tests/test_model_selector.py
```

**Output:**
```
✅ Code detection tests passed
✅ Reasoning detection tests passed
✅ Default fallback tests passed
✅ Empty prompt test passed
✅ All model selector tests passed!
```

## ✅ Validate Structure

```bash
./validate-structure.sh
```

**Output:**
```
✅ All validation checks passed!
✅ All files present and valid
```

## 🔧 Common Issues

### API not responding
```bash
# Wait longer (first start takes time)
sleep 10
curl http://localhost:8000/health

# Check logs
docker-compose logs aiox-api

# Restart API
docker-compose restart aiox-api
```

### Models not found
```bash
# List models
docker exec aiox-ollama ollama list

# Pull missing models
docker exec aiox-ollama ollama pull qwen2.5:7b
docker exec aiox-ollama ollama pull deepseek-coder:6.7b
docker exec aiox-ollama ollama pull qwen2.5:14b
```

### Redis connection error
```bash
# Check Redis is running
docker exec aiox-redis redis-cli ping

# Should respond: PONG
```

### Port already in use
```bash
# Find process using port 8000
lsof -i :8000

# Change port in docker-compose.yml
# "8000:8000" → "8001:8000" (use 8001 instead)
```

## 📚 Full Documentation

- **Complete Guide:** `README.md`
- **Implementation Details:** `IMPLEMENTATION-SUMMARY.md`
- **Model Routing Logic:** `router/selector.py`
- **API Code:** `api/main.py`
- **Memory System:** `memory/store.py`

## 🎯 Key Commands Cheat Sheet

| Command | Purpose |
|---------|---------|
| `./start-engine.sh` | Start all services |
| `docker-compose ps` | Show service status |
| `docker-compose logs -f` | Stream all logs |
| `curl http://localhost:8000/health` | Health check |
| `curl -X POST http://localhost:8000/agent ...` | Send prompt |
| `docker-compose restart` | Restart all services |
| `docker-compose down` | Stop all services |
| `./validate-structure.sh` | Validate project |
| `python3 tests/test_model_selector.py` | Run tests |

## 🔌 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/agent` | POST | Send prompt for processing |
| `/stats` | GET | Cache statistics |

## 📦 Services Overview

| Service | Port | Technology | Purpose |
|---------|------|-----------|---------|
| aiox-api | 8000 | FastAPI | HTTP API |
| aiox-ollama | 11434 | Ollama | Model execution |
| aiox-redis | 6379 | Redis | Cache layer |
| aiox-qdrant | 6333 | Qdrant | Memory storage |

## 🧠 Model Selection Logic

```
IF prompt contains [code, function, def, error, debug, api, endpoint, database]
  → Use deepseek-coder:6.7b (code specialist)
ELSE IF prompt contains [analyze, design, architecture, strategy, compare, evaluate]
  → Use qwen2.5:14b (reasoning engine)
ELSE
  → Use qwen2.5:7b (fast default)
```

## 💾 Response Caching

- **Cache Key:** SHA-256 hash of prompt
- **TTL:** 24 hours (86400 seconds)
- **Hit Rate (typical):** 80%+ (major speedup)
- **Storage:** Redis
- **Persistence:** Automatic

## 🚨 Troubleshooting Priority

1. Check status: `docker-compose ps`
2. View logs: `docker-compose logs aiox-api`
3. Test health: `curl http://localhost:8000/health`
4. Restart service: `docker-compose restart aiox-api`
5. Check models: `docker exec aiox-ollama ollama list`
6. Read full guide: `README.md`

---

**Quick Start:** `./start-engine.sh` then `curl http://localhost:8000/health` ✅
