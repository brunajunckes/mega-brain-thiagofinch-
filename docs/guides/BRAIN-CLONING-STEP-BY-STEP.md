# 🧠 Brain Cloning — Step by Step (Super Simples)

**Guia passo-a-passo para clonar qualquer especialista do YouTube.**

---

## Pre-requisitos

✅ Tem um YouTube URL?
✅ Tem ~10-20 minutos?
✅ Serviços rodando (Ollama, Qdrant, Redis, FastAPI)?

Se não tem serviços:
```bash
# Terminal 1
ollama serve

# Terminal 2
docker run -p 6333:6333 -v /srv/qdrant:/qdrant/storage qdrant/qdrant

# Terminal 3
redis-server

# Terminal 4
cd /srv/aiox/aiox-engine && python -m api.main
```

---

## O Processo (3 Etapas)

### ⏱️ Etapa 1: INGERIR (5-15 min)

**Tempo:** Depende de quantos vídeos
**O que faz:** Baixa, transcreve, chunka, embedda, armazena

```bash
# VOCÊ FORNECE:
# 1. YouTube URL (channel ou video)
# 2. Nome do clone (slug)
# 3. Quantidade de vídeos

# EXEMPLO:
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 20
```

**Flags:**
```
--youtube <URL>    (obrigatório) YouTube URL
--clone <slug>     (obrigatório) Nome do clone
--last <n>         (opcional) Últimos N vídeos [default: 10]
--dry-run          (opcional) Testar sem salvar
```

**Output esperado:**
```
✅ Fetched 20 videos from @AlexHormozi
📥 Downloaded 20 transcripts
🔄 Chunking 45k tokens into 90 chunks
🧮 Generated embeddings
💾 Stored in brain_clone_hormozi (Qdrant)
✅ Ingestion complete!
```

---

### ⏱️ Etapa 2: TESTAR (1 min)

**Tempo:** < 1 minuto
**O que faz:** Consulta o clone com uma pergunta

```bash
# Teste básico
aiox brain ask --clone hormozi "What is your #1 business advice?"

# Com session (multi-turn)
aiox brain ask --clone hormozi "Question 1?" --session s1
aiox brain ask --clone hormozi "Question 2?" --session s1
aiox brain ask --clone hormozi --session s1 --history
```

**Output esperado:**
```
🧠 hormozi

Based on my experience building 8 and 9-figure companies,
the #1 thing is focusing on ONE thing. Most entrepreneurs
get distracted by shiny objects...

📊 Context: 3 chunks | Tokens: 245→89 | Cache: miss
```

---

### ⏱️ Etapa 3: USAR (Contínuo)

**Opção A: Perguntas individuais**
```bash
aiox brain ask --clone hormozi "Your question?"
```

**Opção B: Squad (múltiplos clones)**
```bash
# Setup outros clones primeiro
aiox brain ingest --youtube <URL2> --clone naval --last 20

# Depois consultar juntos
aiox brain squad --ask "How to build wealth?" --synthesize
```

**Opção C: Monitor automático**
```bash
aiox brain watch --channel https://www.youtube.com/@AlexHormozi --clone hormozi
```

---

## Exemplo Prático Completo

### 🎯 Objetivo: Clonar Alex Hormozi e consultá-lo

**Passo 1: Ingerir**
```bash
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 20
# ⏳ Aguarda 5-15 min
# ✅ Pronto!
```

**Passo 2: Testar**
```bash
aiox brain ask --clone hormozi "What is the biggest mistake entrepreneurs make?"
# ✅ Resposta recebida
```

**Passo 3: Conversa multi-turn**
```bash
aiox brain ask --clone hormozi "How do I scale?" --session myconv
aiox brain ask --clone hormozi "What about pricing?" --session myconv
aiox brain ask --clone hormozi "Any final advice?" --session myconv
aiox brain ask --clone hormozi --session myconv --history
# ✅ Histórico completo
```

**Passo 4: Ver histórico (opcional)**
```bash
aiox brain status
# 🧠 hormozi — 2000 chunks, 8 videos ingested
```

**Passo 5: Monitor (opcional)**
```bash
aiox brain watch --channel https://www.youtube.com/@AlexHormozi --clone hormozi
# 🔍 Verificará a cada 6 horas por novo conteúdo
```

---

## Erros Comuns & Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| "Connection refused: Qdrant" | Qdrant não rodando | `docker run -p 6333:6333 qdrant/qdrant` |
| "Connection refused: Ollama" | Ollama não rodando | `ollama serve` em outro terminal |
| "No chunks found" | Ingestão em andamento | Aguarde mais 5 min |
| "Invalid YouTube URL" | URL malformada | Use: `https://www.youtube.com/@ChannelName` |
| "Slug already exists" | Clone já criado | Use outro nome ou `aiox brain status` |

---

## Checklist

- [ ] Serviços rodando (Ollama, Qdrant, Redis, FastAPI)
- [ ] YouTube URL válida
- [ ] Clone slug escolhido (min 3 caracteres, sem espaços)
- [ ] `aiox` CLI instalado e no PATH
- [ ] Executou: `aiox brain ingest --youtube <URL> --clone <slug>`
- [ ] Esperou ingestão completar
- [ ] Testou: `aiox brain ask --clone <slug> "test question?"`
- [ ] ✅ Funcionando!

---

## Tempo Total

| Etapa | Tempo |
|-------|-------|
| Setup (primeira vez) | 5 min |
| Ingestão | 5-15 min (depende do # vídeos) |
| Teste | 1 min |
| **Total** | **11-21 min** |

---

## Próximos Passos Avançados

Depois de ter seu primeiro clone:

1. **Crie um squad**
   ```bash
   aiox brain ingest --youtube <URL2> --clone expert2 --last 20
   aiox brain squad --ask "Compare your approaches" --debate 3
   ```

2. **Configure monitor automático**
   ```bash
   aiox brain watch --channel <URL> --clone expert
   ```

3. **Use em produção**
   ```bash
   # API HTTP disponível
   curl -X POST http://localhost:8000/brain/ask \
     -H "Content-Type: application/json" \
     -d '{"slug":"expert", "question":"Your q?"}'
   ```

4. **Customize a persona** (avançado)
   - Edite: `outputs/minds/expert/implementation/system-prompt.md`
   - Re-execute: `aiox brain ask --clone expert "test"`

---

## Suporte

**Alguma dúvida?**

1. Veja: `/srv/aiox/docs/guides/BRAIN-FACTORY-QUICKSTART.md`
2. Veja: `/srv/aiox/docs/BRAIN-FACTORY-PERSONAS.md`
3. Veja: `/srv/aiox/docs/BRAIN-FACTORY-COMPLETE.md`

---

**Pronto?**

⬇️ **Forneça um YouTube URL + nome do clone e execute:**

```bash
aiox brain ingest --youtube YOUR_URL --clone your_slug --last 20
```

🧠 **Seu clone estará pronto em ~10 minutos!**

---

**Brain Factory v1.0 — Produção Ready** ✅
