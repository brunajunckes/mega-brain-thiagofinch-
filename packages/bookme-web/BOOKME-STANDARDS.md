# BookMe Development Standards

Definitive team workflow and standards for all BookMe development.
Every new feature, endpoint, and bugfix must follow these patterns.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Frontend — Next.js 14 App Router (TypeScript)      │
│  src/app/api/**  (proxy routes to Python backend)   │
│  Port: 3000                                         │
├─────────────────────────────────────────────────────┤
│  Backend — Python FastAPI                           │
│  backend-god-mode.py   (core engine + LLM layer)   │
│  novel_process.py      (writing craft system)       │
│  novel_process_api.py  (FastAPI endpoints)          │
│  plot_engine.py        (plot generation)            │
│  beta_readers.py       (beta review simulation)     │
│  epub_export.py        (EPUB export)                │
│  Port: 8002                                         │
├─────────────────────────────────────────────────────┤
│  Engine — Node.js library (packages/bookme-engine)  │
│  book-processor.js, book-exporter.js,               │
│  book-integrator.js                                 │
└─────────────────────────────────────────────────────┘
```

**Data flow:** Browser -> Next.js route -> Python FastAPI -> LLM provider -> response

**BACKEND_URL resolution** (used in every Next.js proxy route):
```js
const BACKEND = process.env.BACKEND_URL
  || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');
```

---

## 2. Adding a New API Endpoint (Step-by-Step)

### Step A: Add Pydantic request model in `novel_process_api.py`

```python
class MyFeatureRequest(BaseModel):
    content: Optional[str] = None
    project_id: Optional[str] = None
    language: str = "pt-br"
```

### Step B: Add FastAPI route in `novel_process_api.py`

```python
@router.post("/projects/{project_id}/my-feature")
async def my_feature(
    project_id: str,
    req: MyFeatureRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        from god_mode import get_god_mode_engine
        engine = get_god_mode_engine()
        # ... feature logic ...
        return {"result": result}
    except Exception as e:
        import traceback
        return {"error": str(e), "details": traceback.format_exc()}
```

### Step C: Add Next.js proxy route

Create `src/app/api/projects/[id]/my-feature/route.js`:

```js
const BACKEND = process.env.BACKEND_URL
  || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const r = await fetch(`${BACKEND}/api/projects/${id}/my-feature`, {
      method: 'POST',
      headers: { 'Authorization': token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    try {
      JSON.parse(text);
      return new Response(text, {
        status: r.status,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid response from backend' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Failed', message: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Step D: Add test in `tests/`

See Section 5 for testing patterns.

---

## 3. Adding a New Python Feature

### Where to add

| Type | File |
|------|------|
| Writing craft system (voice, audit, story bible) | `novel_process.py` |
| Core engine logic (generation, RAG, memory) | `backend-god-mode.py` |
| Plot-specific logic | `plot_engine.py` |
| Beta reader simulation | `beta_readers.py` |
| Export formats | `epub_export.py` |
| API routes only | `novel_process_api.py` |

### Required patterns

```python
class MyFeature:
    """One-line summary of what this does.

    Longer description if needed.
    """

    def __init__(self, provider: str = None):
        self.provider = provider or get_available_provider()

    def analyze(self, content: str, options: Dict = None) -> Dict:
        """Analyze content and return structured result.

        Args:
            content: The text to analyze.
            options: Optional configuration dict.

        Returns:
            Dict with keys: result, score, details.
        """
        # Rule-based analysis first (always works)
        result = self._rule_based_analysis(content)

        # LLM enhancement second (graceful degradation)
        llm_result = call_llm(
            prompt=f"Analyze this: {content[:5000]}",
            system="You are a writing analyst.",
            max_tokens=1000
        )
        if llm_result:
            result = self._merge_llm_result(result, llm_result)

        return result
```

### Rules

1. **Rule-based first, LLM-enhanced second** -- every feature must produce a useful result without any LLM
2. **Always handle `call_llm()` returning `None`** -- the fallback provider returns `None`
3. **Type hints on all public methods**
4. **Docstrings on all classes and public methods**
5. **Import from `god_mode` inside try/except** (see `novel_process.py` pattern)

---

## 4. LLM Provider Pattern

### Provider priority

```
DeepSeek > OpenAI > Anthropic > OpenRouter > Ollama > template (None)
```

### Functions (in `backend-god-mode.py`)

| Function | Purpose |
|----------|---------|
| `get_available_provider()` | Returns first available provider string |
| `call_llm(prompt, system, max_tokens, provider)` | Calls LLM, returns string or `None` |
| `_check_ollama()` | Probes local Ollama availability |

### Rules

- **Never hardcode a provider.** Use `get_available_provider()` or accept it as a parameter.
- **Never assume `call_llm()` succeeds.** Always check for `None` return.
- **Never import provider SDKs at module level.** Import inside the function (allows graceful fallback).
- **Template fallback** means `call_llm()` returns `None` -- your code must handle this.

### Example

```python
result = call_llm(prompt, system="You are a writing expert.", max_tokens=2000)
if result is None:
    # Fallback to rule-based / template output
    result = self._template_fallback(context)
```

---

## 5. Testing Requirements

### Python tests

```bash
cd packages/bookme-web && python -m pytest tests/ -v
```

Test file pattern: `tests/test_<module>.py`

```python
import unittest
from unittest.mock import patch, MagicMock

class TestMyFeature(unittest.TestCase):
    """Tests for MyFeature."""

    def test_rule_based_without_llm(self):
        """Feature works without any LLM provider."""
        feature = MyFeature(provider="template")
        result = feature.analyze("Sample text")
        self.assertIn("result", result)

    @patch("backend_god_mode.call_llm")
    def test_with_llm_enhancement(self, mock_llm):
        """Feature enhances result when LLM is available."""
        mock_llm.return_value = '{"enhanced": true}'
        feature = MyFeature(provider="openai")
        result = feature.analyze("Sample text")
        self.assertIn("result", result)

    @patch("backend_god_mode.call_llm")
    def test_llm_failure_graceful(self, mock_llm):
        """Feature degrades gracefully when LLM fails."""
        mock_llm.return_value = None
        feature = MyFeature(provider="openai")
        result = feature.analyze("Sample text")
        self.assertIn("result", result)

if __name__ == "__main__":
    unittest.main()
```

### Node.js / bookme-engine tests

```bash
npx jest packages/bookme-engine
```

Test file pattern: `src/__tests__/<module>.test.js`

### Coverage rules

- All new Python features must have tests
- All new API endpoints must have at least one happy-path test
- Mock all external calls (`call_llm`, HTTP requests, database)
- Test the `None`/failure path for every LLM call

---

## 6. Pre-Commit Validation Checklist

Run these before every commit:

```
1. [ ] Python syntax check
       python -m py_compile backend-god-mode.py novel_process.py novel_process_api.py

2. [ ] Python tests pass
       python -m pytest tests/ -v

3. [ ] Node.js lint
       npm run lint

4. [ ] TypeScript type check
       npx tsc --noEmit

5. [ ] Backend health (if running)
       curl -s http://localhost:8002/api/health | jq .

6. [ ] No hardcoded secrets
       grep -r "sk-\|api_key.*=.*['\"]" --include="*.py" --include="*.js" --include="*.ts" .
       (should return nothing)

7. [ ] BACKEND_URL pattern used in all new routes
       New proxy routes must use the standard BACKEND resolution line

8. [ ] LLM calls handle None return
       Every call_llm() usage has a None/fallback check
```

---

## 7. Error Handling Standard

### Python (FastAPI endpoints)

```python
try:
    # ... feature logic ...
    return {"result": data}
except Exception as e:
    import traceback
    return {"error": str(e), "details": traceback.format_exc()}
```

For HTTP errors, use HTTPException:
```python
raise HTTPException(status_code=404, detail="Project not found")
```

### Next.js (proxy routes)

```js
try {
  // ... proxy logic ...
} catch (e) {
  return new Response(
    JSON.stringify({ error: 'Failed', message: e.message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

Always validate backend responses before forwarding:
```js
const text = await r.text();
try {
  JSON.parse(text);
  return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
} catch {
  return new Response(
    JSON.stringify({ error: 'Invalid response from backend' }),
    { status: 502, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Response structure

All error responses must follow:
```json
{
  "error": "Human-readable error message",
  "message": "Optional additional context",
  "details": "Stack trace (development only, strip in production)"
}
```

---

## 8. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_URL` | No | `http://localhost:8002` | Python backend URL |
| `DOCKER_ENV` | No | `false` | Set to `true` inside Docker containers |
| `DEEPSEEK_API_KEY` | No | -- | DeepSeek API key (priority 1) |
| `DEEPSEEK_MODEL` | No | `deepseek-chat` | DeepSeek model name |
| `OPENAI_API_KEY` | No | -- | OpenAI API key (priority 2) |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model name |
| `ANTHROPIC_API_KEY` | No | -- | Anthropic API key (priority 3) |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-20250514` | Anthropic model name |
| `OPENROUTER_API_KEY` | No | -- | OpenRouter API key (priority 4) |
| `OPENROUTER_MODEL` | No | `deepseek/deepseek-chat` | OpenRouter model name |
| `OLLAMA_URL` | No | `http://localhost:11434` | Ollama server URL (priority 5) |
| `OLLAMA_MODEL` | No | `llama3.2` | Ollama model name |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3000/api` | Frontend API base URL |

At least one LLM provider key is recommended. Without any, the system falls back to template-based generation (no AI enhancement).

---

## 9. Docker Development Setup

### Frontend only

```bash
cd packages/bookme-web
docker build -t bookme-web .
docker run -p 3000:3000 -e BACKEND_URL=http://host.docker.internal:8002 bookme-web
```

### Backend only

```bash
cd packages/bookme-web
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn novel_process_api:router --host 0.0.0.0 --port 8002
```

### Full stack (local, no Docker)

```bash
# Terminal 1 — Backend
cd packages/bookme-web
python -m uvicorn novel_process_api:router --host 0.0.0.0 --port 8002

# Terminal 2 — Frontend
cd packages/bookme-web
npm run dev
# Open http://localhost:3000
```

### Environment setup

```bash
cp .env.example .env  # if available
# Or create .env with at least one LLM key:
echo "DEEPSEEK_API_KEY=your-key-here" >> .env
```

---

## 10. Deployment Checklist

Before deploying to any environment:

```
1. [ ] All Python files compile without errors
       python -m py_compile backend-god-mode.py novel_process.py novel_process_api.py

2. [ ] All tests pass
       python -m pytest tests/ -v
       npx jest packages/bookme-engine

3. [ ] Next.js builds successfully
       npm run build

4. [ ] No TypeScript errors
       npx tsc --noEmit

5. [ ] No lint errors
       npm run lint

6. [ ] Environment variables configured on target
       (at minimum: one LLM provider key)

7. [ ] BACKEND_URL set correctly for target environment
       - Local: http://localhost:8002
       - Docker: http://bookme-backend:8000
       - Production: https://api.your-domain.com

8. [ ] Backend health check passes
       curl -s $BACKEND_URL/api/health

9. [ ] No secrets in committed code
       grep -r "sk-\|Bearer.*[a-zA-Z0-9]" --include="*.py" --include="*.js" .

10. [ ] Docker image builds cleanly (if using Docker)
        docker build -t bookme-web .
```

---

## Quick Reference: File Map

| File | Role |
|------|------|
| `backend-god-mode.py` | Core engine: LLM provider layer, VoiceBible, RAG, generation pipeline |
| `novel_process.py` | Writing craft: VoiceProfile (10 dims), StoryBible, CraftStandards, Auditors |
| `novel_process_api.py` | FastAPI routes for novel process features |
| `plot_engine.py` | Plot structure and arc generation |
| `beta_readers.py` | Simulated beta reader feedback |
| `epub_export.py` | EPUB file export |
| `backend-long-content.py` | Long-form content generation (3000-4000 words/chapter) |
| `src/app/api/` | Next.js proxy routes (all forward to Python backend) |
| `Dockerfile` | Frontend container (Node 18 Alpine, dev mode) |

---

*BookMe Development Standards v1.0 -- Follow these patterns for all new development.*
