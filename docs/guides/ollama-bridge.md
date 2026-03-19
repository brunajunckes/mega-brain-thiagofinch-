# AIOX Ollama Bridge — Hybrid LLM Routing Guide

## Overview

AIOX Ollama Bridge is a hybrid LLM routing system that automatically delegates tasks to either:
- **Ollama** (local, free, for simple tasks)
- **Claude API** (paid, for complex tasks)

This saves tokens and costs by using the right model for the right task.

## Installation

Ollama Bridge is included with AIOX. To use it:

### 1. Install Ollama
```bash
# macOS/Linux
curl https://ollama.ai/install.sh | sh

# Or download from: https://ollama.ai/download
```

### 2. Start Ollama server
```bash
ollama serve
# Server runs at http://localhost:11434
```

### 3. Pull a model
```bash
ollama pull llama3.2   # Recommended (4.1GB)
# Or other models:
ollama pull mistral
ollama pull neural-chat
```

### 4. Start AIOX Ollama Bridge
```bash
aiox ollama
# Or use the global alias:
claude-ollama
```

## Usage

### Interactive Chat Mode

Start the interactive chat:

```bash
aiox ollama
```

You'll see:
```
🤖 AIOX Ollama Bridge — Interactive Chat
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commands: /help, /models, /threshold, /force-ollama, /force-claude, /exit

You: 
```

Type messages and the bridge automatically routes them:

```
You: ler o arquivo README.md
📊 [SIMPLE (2)] → Using Ollama

Ollama (llama3.2):
O arquivo README.md contém a documentação principal do projeto...

You: implementar webhook com retry logic e circuit breaker
📊 [COMPLEX (4.5)] → Using Claude

💡 This task is complex. Switch to Claude Code for @dev, @architect, etc.
```

### Commands

| Command | Purpose |
|---------|---------|
| `/help` | Show available commands |
| `/models` | List installed Ollama models |
| `/threshold <1-5>` | Set complexity threshold (1=always Ollama, 5=always Claude) |
| `/force-ollama` | Force Ollama for all requests (this session) |
| `/force-claude` | Force Claude for all requests (this session) |
| `/clear` | Clear chat history |
| `/exit` | Exit chat |

### Examples

Simple tasks (score 1-3) → Ollama:
```
"ler arquivo"
"list files"
"summarize this"
"explain concept"
```

Complex tasks (score 4-5) → Claude:
```
"implementar webhook com retry logic"
"design scalable database schema"
"debug circular dependency issue"
"refactor authentication module"
```

## Configuration

Configuration is stored at `~/.aiox/ollama-bridge.json`:

```json
{
  "ollama": {
    "host": "http://localhost:11434",
    "model": "llama3.2",
    "complexityThreshold": 3
  },
  "routing": {
    "forceOllama": false,
    "forceClaude": false
  },
  "chat": {
    "maxHistory": 10,
    "streaming": true
  }
}
```

### Configuration Options

| Key | Default | Description |
|-----|---------|-------------|
| `ollama.host` | `http://localhost:11434` | Ollama server URL |
| `ollama.model` | `llama3.2` | Default model to use |
| `ollama.complexityThreshold` | `3` | Score threshold (≤ threshold = Ollama) |
| `routing.forceOllama` | `false` | Always use Ollama |
| `routing.forceClaude` | `false` | Always use Claude |
| `chat.maxHistory` | `10` | Max messages in history |
| `chat.streaming` | `true` | Stream responses |

### Change Configuration

Via CLI:

```bash
# Set threshold
aiox ollama --threshold 2

# Force Ollama
aiox ollama --force-ollama

# Check configuration
aiox ollama --config

# Reset to defaults
aiox ollama --reset-config
```

Via interactive mode:

```
You: /threshold 4
✅ Threshold set to 4

You: /force-ollama
✅ Forcing Ollama for all requests
```

## Complexity Scoring

Tasks are scored 1-5 based on:

| Score | Category | Model | Description |
|-------|----------|-------|-------------|
| 1-1.5 | TRIVIAL | Ollama | Extremely simple, one-word queries |
| 1.5-2.5 | SIMPLE | Ollama | Basic reading, listing, explaining |
| 2.5-3.5 | MEDIUM | Ollama or Claude | Moderate complexity, depends on threshold |
| 3.5-4.5 | COMPLEX | Claude | Architecture, design, debugging |
| 4.5-5 | CRITICAL | Claude | High-risk, security, performance |

### Scoring Factors

1. **Keywords**
   - Simple: "read", "list", "summarize", "explain"
   - Complex: "implement", "design", "refactor", "debug", "build"

2. **Length**
   - Short (< 15 words): -0.5 score
   - Long (> 200 words): +1 score

3. **Context**
   - Mentions "file": +0.5
   - Mentions "test": +0.5
   - Mentions "story": +0.3

## Health Check

Verify Ollama is running:

```bash
aiox ollama --health
```

Output:
```
✅ Ollama Status
   Ollama is running

📦 Available Models:
   • llama3.2
   • mistral
```

## Troubleshooting

### Ollama not found

```
❌ Ollama is not available: connect ECONNREFUSED 127.0.0.1:11434
```

**Solution:**
1. Start Ollama: `ollama serve`
2. Verify it's running: `curl http://localhost:11434/api/tags`

### No models installed

```
❌ No models. Run: ollama pull llama3.2
```

**Solution:**
```bash
ollama pull llama3.2   # 4.1GB
# Or other models
ollama pull mistral    # 3.8GB
ollama pull neural-chat # 3.8GB
```

### Slow responses

If Ollama is slow:
1. Check system RAM (models need 8GB+)
2. Check if GPU is available
3. Try a smaller model: `ollama pull neural-chat`

### Configuration not saving

```
Failed to save config: EACCES: permission denied
```

**Solution:**
```bash
mkdir -p ~/.aiox
chmod 755 ~/.aiox
```

## Use Cases

### 1. Reading Documentation
```
You: ler a documentação de async/await
→ Uses Ollama (score 1.5)
✅ Fast, free, local
```

### 2. Code Review
```
You: revisar este código para segurança
→ Uses Claude (score 3.5-4)
✅ Better analysis, contextual awareness
```

### 3. Debugging
```
You: debug this memory leak issue
→ Uses Claude (score 4-4.5)
✅ Needs complex reasoning
```

### 4. Writing Tests
```
You: write unit tests for this function
→ Uses Claude (score 4)
✅ Requires understanding full context
```

## Performance

Typical performance:

| Model | Tokens/sec | Latency | Hardware |
|-------|-----------|---------|----------|
| llama3.2 | 5-10 | 1-2s | CPU (8GB RAM) |
| mistral | 8-15 | 0.5-1s | CPU (8GB RAM) |
| with GPU | 20-50 | 0.1-0.5s | NVIDIA/Apple GPU |

## Architecture

```
User Input
    ↓
Classifier (score 1-5)
    ↓
Router (Ollama vs Claude)
    ↓
    ├─→ Ollama (if ≤ threshold)
    │    ↓
    │    Ollama API (local)
    │    ↓
    │    Stream response
    │
    └─→ Claude (if > threshold)
         ↓
         Suggest switching to Claude Code
         ↓
         Manual handling
```

## Limitations

1. **Ollama only for text** — No image/code generation yet
2. **No persistence** — History cleared on exit
3. **Single model** — Configure one Ollama model
4. **Local only** — Ollama must run on localhost

## Advanced

### Use with Claude Code

When Ollama suggests Claude:

```
You: design a microservices architecture
📊 [COMPLEX (4.5)] → Using Claude

💡 This task is complex. Switch to Claude Code for @dev, @architect, etc.
```

Switch to Claude Code:
```bash
# In another terminal
cd /srv/aiox
claude code
```

Then interact with `@architect` agent:
```
@architect design a microservices architecture for e-commerce
```

### Custom Model

```bash
# Use custom model
aiox ollama --model mistral

# Or in interactive:
You: /force-ollama
You: /threshold 2
```

### Disable for Session

```bash
# Always use Claude
aiox ollama --force-claude

# Always use Ollama
aiox ollama --force-ollama
```

## See Also

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Available Models](https://ollama.ai/library)
- [AIOX Documentation](../README.md)
