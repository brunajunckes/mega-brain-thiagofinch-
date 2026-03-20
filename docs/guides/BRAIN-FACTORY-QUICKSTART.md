# 🧠 Brain Factory — Quick Start Guide

**Crie clones cognitivos de especialistas em 3 passos.**

---

## Passo 1: Clone um YouTube

```bash
# Exemplo: Clonar Alex Hormozi
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 20

# Ou um canal inteiro
aiox brain ingest --youtube https://www.youtube.com/@Channel --clone my_expert

# Ou um vídeo específico
aiox brain ingest --youtube https://www.youtube.com/watch?v=abc123 --clone my_expert
```

**Flags:**
- `--clone <slug>` — Nome do clone (obrigatório)
- `--last <n>` — Últimos N vídeos do canal (opcional)
- `--dry-run` — Testar sem armazenar (opcional)

---

## Passo 2: Consulte o Clone

```bash
# Fazer uma pergunta
aiox brain ask --clone hormozi "What is your #1 business advice?"

# Multi-turn (conversas)
aiox brain ask --clone hormozi "How to scale?" --session session_1
aiox brain ask --clone hormozi "What about pricing?" --session session_1
aiox brain ask --clone hormozi --session session_1 --history

# Ver tudo o que foi aprendido
aiox brain status
```

---

## Passo 3: Crie Squads (Opcional)

```bash
# Consultar múltiplos especialistas
aiox brain squad --ask "How to scale to 8 figures?" --synthesize

# Debate entre clones
aiox brain squad --ask "What is success?" --debate 3

# Listar clones disponíveis
aiox brain squad --list
```

---

## Auto-Ingestion (Opcional)

```bash
# Monitorar novo conteúdo automaticamente
aiox brain watch --channel https://www.youtube.com/@AlexHormozi --clone hormozi

# Listar canais monitorados
aiox brain watch --list

# Parar de monitorar
aiox brain watch --clone hormozi --pause
```

---

## Detalhes Técnicos

### O que acontece internamente

1. **Ingestão** (Story 4.1)
   - Download do vídeo via `yt-dlp`
   - Transcrição via `faster-whisper` (local)
   - Chunking inteligente (500 tokens, 50 overlap)
   - Embedding via `nomic-embed-text` (local)
   - Armazenamento em Qdrant (brain_clone_{slug})

2. **Clone Agent** (Story 4.2)
   - Carrega persona de `outputs/minds/{slug}/implementation/system-prompt.md`
   - RAG: Top-3 chunks relevantes
   - Cache Redis (persona 1h, respostas 30min, sessões 24h)
   - Ollama `qwen2.5:7b` para reasoning

3. **Squad System** (Story 4.3)
   - Queries em paralelo (timeout 30s)
   - Debate multi-round (3 rodadas)
   - Consensus scoring
   - Synthesis via Ollama

4. **Auto-Evolution** (Story 4.4)
   - Poll 6h (configurável)
   - Detecção de novos vídeos
   - Auto-ingestão
   - Histórico + logging

### Requisitos

- **Serviços rodando:**
  - Qdrant (porta 6333)
  - Ollama (porta 11434) com `qwen2.5:7b` e `nomic-embed-text`
  - Redis (porta 6379)
  - FastAPI engine (`python -m api.main`)

- **Modelos Ollama:**
  ```bash
  ollama pull qwen2.5:7b
  ollama pull nomic-embed-text
  ollama pull mistral  # para synthesis
  ```

- **Python 3.10+** com deps:
  ```bash
  cd aiox-engine
  pip install -r requirements.txt
  ```

---

## Exemplos Práticos

### Exemplo 1: Clonar Naval Ravikant

```bash
# Ingerir últimos 50 vídeos
aiox brain ingest --youtube https://www.youtube.com/@NavalMaven --clone naval --last 50

# Testar
aiox brain ask --clone naval "How do you think about wealth?"
aiox brain ask --clone naval "What is specific knowledge?" --session s1
aiox brain ask --clone naval "How does that apply?" --session s1
```

### Exemplo 2: Clonar Marcus Aurelius (palestra)

```bash
# Single video
aiox brain ingest --youtube https://www.youtube.com/watch?v=stoic_talk --clone aurelius

# Consultar
aiox brain ask --clone aurelius "What is virtue?"
aiox brain ask --clone aurelius "How should I live?" --session philosophy
```

### Exemplo 3: Squad com múltiplos especialistas

```bash
# Setup
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 30
aiox brain ingest --youtube https://www.youtube.com/@NavalMaven --clone naval --last 30

# Consultá-los juntos
aiox brain squad --ask "How do I build wealth?" --synthesize
aiox brain squad --ask "What is success?" --debate 3
```

---

## Troubleshooting

| Erro | Solução |
|------|---------|
| "Ollama connection refused" | `ollama serve` em outro terminal |
| "Qdrant connection refused" | Verificar porta 6333 |
| "No chunks found" | Aguardar ingestion completar (pode levar mins) |
| "Token limit exceeded" | Reducir `--last` ou chunking size |
| "YouTube unavailable" | Verificar URL, firewall, autenticação |

---

## Arquitetura em uma imagem

```
YouTube Video
     ↓
  [yt-dlp]
     ↓
  Audio
     ↓
  [Whisper]
     ↓
  Transcript
     ↓
  [Chunking: 500 tokens]
     ↓
  [Embeddings: nomic-embed-text]
     ↓
  Qdrant Vector DB
     ↓
  CloneAgent + RAG
     ↓
  Ollama qwen2.5:7b
     ↓
  Response (in-persona)
```

---

## Próximos Passos

1. **Criar sua primeira clonagem** (5 min)
2. **Testar com ask** (1 min)
3. **Monitorar auto-updates** (setup 1 min)
4. **Squad para análise** (2 min)

**Tempo total: ~9 minutos para primeiro clone!**

---

**Pronto?** Forneça um YouTube e execute:
```bash
aiox brain ingest --youtube YOUR_URL --clone your_slug --last 10
```

— Brain Factory v1.0 ✅
