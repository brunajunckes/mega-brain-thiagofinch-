# 🧠 Brain Factory v1.0

**Clonador cognitivo de especialistas. Aprenda de qualquer YouTube.**

---

## O que é isso?

O Brain Factory é um sistema que:

1. 📺 Baixa vídeos do YouTube
2. 🎙️ Transcreve automaticamente
3. 🧠 Extrai padrões mentais (thinking style, frameworks, beliefs)
4. 💾 Armazena em um banco de dados vetorial
5. 🤖 Cria um agente IA que pensa como a pessoa
6. 🎯 Permite que você consulte o clone com perguntas

---

## Quick Start (60 segundos)

```bash
# 1. Forneça um YouTube
aiox brain ingest --youtube https://www.youtube.com/@ExpertName --clone expert --last 20

# 2. Aguarde 5-15 min
# ⏳ Transcrevendo + salvando...

# 3. Consulte
aiox brain ask --clone expert "Your question here?"

# ✅ Resposta (em-persona)!
```

---

## Documentação

| Documento | Para quem? | O quê? |
|-----------|-----------|--------|
| **BRAIN-CLONING-STEP-BY-STEP.md** | Iniciantes | Guia super simples (passo 1, 2, 3) |
| **BRAIN-FACTORY-QUICKSTART.md** | Usuários | Referência rápida de comandos |
| **BRAIN-FACTORY-PERSONAS.md** | Inspiração | Clones prontos + recomendações |
| **BRAIN-FACTORY-COMPLETE.md** | Técnico | Arquitetura completa + implementação |

---

## Arquitetura

```
YouTube
   ↓
[yt-dlp] Download
   ↓
[Whisper] Transcrição
   ↓
[Chunking] Semântico (500 tokens)
   ↓
[Embeddings] nomic-embed-text
   ↓
Qdrant Vector DB (brain_clone_{slug})
   ↓
CloneAgent + RAG
   ↓
[Ollama qwen2.5:7b]
   ↓
Resposta em-persona
```

---

## Componentes

| Componente | Status | Arquivo |
|-----------|--------|---------|
| **Story 4.1: Ingestão** | ✅ Done | `aiox-engine/brain/ingestion/` |
| **Story 4.2: Clone Agent** | ✅ Done | `aiox-engine/brain/clone/` |
| **Story 4.3: Squad System** | ✅ Done | `aiox-engine/brain/squad/` |
| **Story 4.4: Auto-Evolution** | ✅ Done | `aiox-engine/brain/watch/` |
| **CLI** | ✅ Done | `bin/modules/brain/` |
| **API** | ✅ Done | `aiox-engine/brain/api/` |
| **Tests** | ✅ Done | `aiox-engine/tests/brain/` |

---

## Comandos

### Ingestão
```bash
aiox brain ingest --youtube <URL> --clone <slug> [--last N]
aiox brain ingest --pdf /path/to/file.pdf --clone <slug>
aiox brain ingest --doc /path/to/file.md --clone <slug>
aiox brain ingest --image /path/to/image.jpg --clone <slug>
```

### Consultas
```bash
aiox brain ask --clone <slug> "Your question?"
aiox brain ask --clone <slug> "Q1?" --session s1
aiox brain ask --clone <slug> "Q2?" --session s1
aiox brain ask --clone <slug> --session s1 --history
```

### Squad (múltiplos clones)
```bash
aiox brain squad --ask "Question?" --synthesize
aiox brain squad --ask "Question?" --debate 3
aiox brain squad --list
```

### Monitor automático
```bash
aiox brain watch --channel <URL> --clone <slug>
aiox brain watch --list
aiox brain watch --clone <slug> --pause
```

### Status
```bash
aiox brain status
aiox brain status --json
```

---

## Pré-requisitos

### Serviços (rodar em paralelo)

**Terminal 1 — Ollama**
```bash
ollama serve
```
Modelos necessários:
```bash
ollama pull qwen2.5:7b       # Clone reasoning
ollama pull nomic-embed-text # Embeddings
```

**Terminal 2 — Qdrant**
```bash
docker run -d -p 6333:6333 \
  -v /srv/qdrant:/qdrant/storage \
  qdrant/qdrant
```

**Terminal 3 — Redis**
```bash
redis-server
```

**Terminal 4 — FastAPI Engine**
```bash
cd /srv/aiox/aiox-engine
python -m api.main
```

### Dependências Python
```bash
cd /srv/aiox/aiox-engine
pip install -r requirements.txt
```

### CLI
```bash
npm install -g /srv/aiox
```

---

## Exemplos de Clones

### Categoria: Business & Scaling
- **Alex Hormozi** — https://www.youtube.com/@AlexHormozi
- **Naval Ravikant** — https://www.youtube.com/@NavalMaven
- **Gary Vee** — https://www.youtube.com/@garyvaynerchuk

### Categoria: Technology & Innovation
- **Elon Musk** — Search "Elon Musk interviews"
- **Paul Graham** — YCombinator talks

### Categoria: Wellness & Leadership
- **Arianna Huffington** — TED talks
- **Brené Brown** — TEDx

---

## Workflow Recomendado

### Para Aprender
```bash
# 1. Clonar especialista
aiox brain ingest --youtube <URL> --clone expert --last 30

# 2. Fazer perguntas específicas
aiox brain ask --clone expert "Qual é sua framework para X?"
aiox brain ask --clone expert "Exemplos concretos?"

# 3. Multi-turn (aprofundar)
aiox brain ask --clone expert "P1?" --session study
aiox brain ask --clone expert "P2?" --session study
aiox brain ask --clone expert "P3?" --session study
aiox brain ask --clone expert --session study --history
```

### Para Análise Comparada
```bash
# 1. Clonar múltiplos especialistas
aiox brain ingest --youtube <URL1> --clone expert1 --last 20
aiox brain ingest --youtube <URL2> --clone expert2 --last 20

# 2. Debater tópicos
aiox brain squad --ask "Approaches to X?" --debate 3

# 3. Síntese
aiox brain squad --ask "Best practices?" --synthesize
```

### Para Monitoramento
```bash
# 1. Setup automático
aiox brain watch --channel <URL> --clone expert

# 2. Acompanhar atualizações
# Sistema verifica a cada 6h por novo conteúdo
```

---

## Performance

| Métrica | Valor |
|---------|-------|
| Tempo de ingestão | 5-15 min (depende do # vídeos) |
| Tempo de resposta | <1s (com cache) |
| Storage por 1000 chunks | ~500MB em Qdrant |
| TTL Persona | 1h (Redis) |
| TTL Respostas | 30min (Redis) |
| TTL Sessões | 24h (Redis) |

---

## Troubleshooting

**"Ollama connection refused"**
```bash
ollama serve  # em outro terminal
```

**"Qdrant connection refused"**
```bash
docker run -p 6333:6333 -v /srv/qdrant:/qdrant/storage qdrant/qdrant
```

**"No chunks found"**
```bash
# Aguarde 5-15 min, a ingestão pode estar em andamento
aiox brain status --json  # Verificar status
```

**"Invalid YouTube URL"**
```bash
# Use formato: https://www.youtube.com/@ChannelName
# OU: https://www.youtube.com/watch?v=VideoID
```

---

## Próximos Passos

### Imediato (hoje)
1. [ ] Escolher um YouTube
2. [ ] Executar: `aiox brain ingest --youtube <URL> --clone <slug> --last 20`
3. [ ] Testar: `aiox brain ask --clone <slug> "test?"`

### Curto prazo (esta semana)
1. [ ] Clonar 3-5 especialistas
2. [ ] Criar squads (comparar perspectivas)
3. [ ] Setup automático (`aiox brain watch`)

### Médio prazo (este mês)
1. [ ] Integrar em produção
2. [ ] API endpoints customizados
3. [ ] Dashboard de monitoramento

---

## Suporte & Docs

- **Guia passo-a-passo:** `BRAIN-CLONING-STEP-BY-STEP.md`
- **Quick reference:** `BRAIN-FACTORY-QUICKSTART.md`
- **Personas prontas:** `BRAIN-FACTORY-PERSONAS.md`
- **Arquitetura técnica:** `BRAIN-FACTORY-COMPLETE.md`

---

## Status

| Story | Status | Link |
|-------|--------|------|
| 4.1 — Ingestion | ✅ Done | `/docs/BRAIN-FACTORY-IMPLEMENTATION.md` |
| 4.2 — Clone Engine | ✅ Done | Story file updated |
| 4.3 — Squad System | ✅ Done | Story file updated |
| 4.4 — Auto-Evolution | ✅ Done | Story file updated |

**Total:** 56 Acceptance Criteria completed ✅

---

## Começando

**👉 Forneça um YouTube URL + slug e execute:**

```bash
aiox brain ingest --youtube YOUR_URL --clone your_slug --last 20
```

**Em ~10 minutos, você terá seu primeiro clone!**

---

**Brain Factory v1.0 — Production Ready** 🚀

*Última atualização: 2026-03-20*
