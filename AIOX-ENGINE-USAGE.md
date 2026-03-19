# 🚀 AIOX Ollama Engine - Como Usar

## ⚡ Quick Start

### 1. Certifique que tudo está rodando
```bash
# Terminal 1: Start AIOX Engine
cd /srv/aiox/aiox-engine
docker compose up -d

# Verifique se está saudável
curl http://localhost:8000/health | jq .
```

### 2. Abra o Terminal AIOX Ollama
```bash
aiox-ollama
```

**Você verá:**
```
🚀 AIOX Ollama Engine Terminal
════════════════════════════════════════════

✨ 100% Offline - Zero Claude Tokens
📦 Models: deepseek-coder, qwen2.5:7b, qwen2.5:14b

✅ AIOX Engine conectado

Commands:
  /help     - Show commands
  /clear    - Clear history
  /history  - Show chat history
  /exit     - Exit

════════════════════════════════════════════

>
```

---

## 💬 Usando o Terminal

### Fazer uma Pergunta
```
> write a function to reverse a string in python
⏳ Processing...

[deepseek-coder:6.7b]
──────────────────────────────────────────────
def reverse_string(s):
    return s[::-1]

# Example usage
result = reverse_string("hello")
print(result)  # Output: olleh

>
```

### Fazer Outra Pergunta (Cache Ativo!)
```
> hello world
⏳ Processing...

[qwen2.5:7b (📦 cached)]
──────────────────────────────────────────────
Hello! How can I help you today?

>
```

**Note:** `(📦 cached)` = resposta do cache (instantânea, zero latência)

---

## 🎯 Comandos

| Comando | O que faz |
|---------|-----------|
| `/help` | Mostra help |
| `/clear` | Limpa histórico |
| `/history` | Mostra conversas anteriores |
| `/exit` | Sai do terminal |

---

## 📊 Como Funciona

```
você digita
    ↓
aiox-ollama CLI
    ↓
HTTP POST http://localhost:8000/agent
    ↓
FastAPI (Python)
    ↓
Router: Select Model
    ↓
Cache Check (Redis)
    ↓
Ollama (se não cached)
    ↓
Save to Redis + Qdrant
    ↓
Resposta para você
```

---

## 🔧 Roteamento de Modelos

O sistema escolhe automaticamente:

| Tipo de Pergunta | Modelo | Tempo |
|------------------|--------|-------|
| "write code" | deepseek-coder:6.7b | 2-5s |
| "design system" | qwen2.5:14b | 3-8s |
| "hello world" | qwen2.5:7b | 1-2s |
| **Pergunta anterior** | (cache) | <100ms ⚡ |

---

## 🎬 Exemplo Completo

```bash
$ aiox-ollama

🚀 AIOX Ollama Engine Terminal
════════════════════════════════════════════
✅ AIOX Engine conectado
════════════════════════════════════════════

> explain quantum computing in simple terms
⏳ Processing...

[qwen2.5:14b]
──────────────────────────────────────────────
Quantum computing uses quantum bits (qubits) instead of
regular bits. Here's why it's special:

1. **Superposition**: A qubit can be 0, 1, or both at once
2. **Entanglement**: Qubits can be linked mysteriously
3. **Interference**: Amplify right answers, cancel wrong ones

This lets quantum computers solve some problems
exponentially faster than classical computers.

> write the above as javascript
⏳ Processing...

[deepseek-coder:6.7b]
──────────────────────────────────────────────
// Quantum Computing Concepts
const quantumConcepts = {
  superposition: "qubit can be 0, 1, or both",
  entanglement: "qubits linked mysteriously",
  interference: "amplify right, cancel wrong"
};

> /history

[1] User: explain quantum computing in simple terms
    qwen2.5:14b: Quantum computing uses quantum bits...

[2] User: write the above as javascript
    deepseek-coder:6.7b: // Quantum Computing Concepts...

> /exit

👋 Goodbye!
```

---

## 📋 Requisitos

- ✅ Docker running
- ✅ AIOX Engine running (`docker compose up -d`)
- ✅ Ollama com modelos instalados
- ✅ Node.js 18+

---

## 🛠️ Troubleshooting

### "AIOX Engine não está rodando"
```bash
# Start the engine
cd /srv/aiox/aiox-engine
docker compose up -d

# Check health
curl http://localhost:8000/health
```

### "Timeout - Ollama taking too long"
- Ollama está processando (normal, wait)
- Se persistir: `kill ollama && OLLAMA_HOST=0.0.0.0:11434 ollama serve`

### "Connection refused"
```bash
# Make sure everything is running
docker compose ps
netstat -tlnp | grep 11434  # Ollama
netstat -tlnp | grep 6379   # Redis
netstat -tlnp | grep 6335   # Qdrant
```

---

## 💡 Dicas

1. **Primeira pergunta é lenta** (modelo carrega) - subsequentes são instantâneas (cache)
2. **Modelos especializados** - deepseek é muito melhor para código
3. **Zero tokens** - tudo offline, nunca usa Claude API
4. **Histórico salvo** - `/history` mostra conversas anteriores

---

## 🚀 Próximas Melhorias

- [ ] Persistência de histórico em Qdrant
- [ ] Busca semântica no histórico
- [ ] Multi-turn conversations com contexto
- [ ] Exportar conversa como PDF/Markdown
- [ ] Integração com slash commands

---

**Status:** ✅ Production Ready
**Tokens gastos:** 0 (100% offline)
**Uptime:** 24/7 com docker compose
