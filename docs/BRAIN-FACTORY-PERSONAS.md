# 🧠 Brain Factory — Pre-Built Personas

**Clones prontos de especialistas reconhecidos.**

---

## Disponíveis

### 1. Alex Hormozi — Entrepreneur & Builder
**YouTube:** https://www.youtube.com/@AlexHormozi

```bash
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 50
```

**Specialties:**
- Business scaling (0 → 8 figures)
- Product-market fit
- Pricing & value stacking
- Sales frameworks
- Gymlaunch & Acquisition.com expertise

**Perguntas ideais:**
- "What is your #1 business advice?"
- "How do I scale from 6 to 7 figures?"
- "How do I price my offer?"
- "What is a Grand Slam Offer?"

**System Prompt:**
- Focus: First-principles thinking
- Style: Brutal honesty, action-oriented
- Vocabulary: "f-ing", "boom", "period", "drives me bananas"

---

### 2. Naval Ravikant — Philosophy & Wealth
**YouTube:** https://www.youtube.com/@NavalMaven

```bash
aiox brain ingest --youtube https://www.youtube.com/@NavalMaven --clone naval --last 50
```

**Specialties:**
- Wealth creation
- Specific knowledge
- Leverage (labor, capital, code, content)
- Philosophy & stoicism
- Long-term thinking

**Perguntas ideais:**
- "How do I build wealth ethically?"
- "What is specific knowledge?"
- "How do I achieve freedom?"
- "What is the difference between wealth and money?"

---

### 3. Elon Musk — Technology & Innovation
**YouTube:** https://www.youtube.com/@elonmusk (ou compilações)

```bash
aiox brain ingest --youtube https://www.youtube.com/results?search_query=elon+musk+interview --clone elon --last 30
```

**Specialties:**
- First-principles engineering
- SpaceX, Tesla, Neuralink
- Manufacturing at scale
- Autonomous systems
- Future thinking

---

### 4. Gary Vee — Marketing & Content
**YouTube:** https://www.youtube.com/@garyvaynerchuk

```bash
aiox brain ingest --youtube https://www.youtube.com/@garyvaynerchuk --clone gary --last 50
```

**Specialties:**
- Content strategy
- Social media marketing
- Personal branding
- Family business lessons
- Hustle & execution

---

### 5. Daniel Kahneman — Decision Making
**YouTube:** Search "Daniel Kahneman" para palestras

```bash
aiox brain ingest --youtube https://www.youtube.com/watch?v=... --clone kahneman --last 20
```

**Specialties:**
- Cognitive biases
- Decision-making psychology
- System 1 vs System 2 thinking
- Behavioral economics

---

## Como Criar Seu Próprio

### Passo 1: Encontrar a fonte
- ✅ YouTube channels
- ✅ Podcasts (baixar como áudio)
- ✅ TED talks
- ✅ Entrevistas compiladas
- ✅ Documentários

### Passo 2: Clonar
```bash
aiox brain ingest --youtube <URL> --clone <seu_slug> --last <N>
```

### Passo 3: Testar
```bash
aiox brain ask --clone <seu_slug> "Test question?"
```

### Passo 4: Refinar (opcional)
Se insatisfeito, adicione mais vídeos:
```bash
aiox brain ingest --youtube <URL> --clone <seu_slug> --last <MORE>
```

---

## Combinações Recomendadas (Squads)

### Squad: Business Wisdom
```bash
# Ingerir
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 30
aiox brain ingest --youtube https://www.youtube.com/@NavalMaven --clone naval --last 30

# Consultar
aiox brain squad --ask "How do I build a 8-figure business?" --synthesize
```

### Squad: Decision Making
```bash
# Ingerir
aiox brain ingest --youtube <kahneman_url> --clone kahneman --last 20
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 20

# Consultar
aiox brain squad --ask "What is the best way to make decisions?" --debate 3
```

### Squad: Innovation & Scale
```bash
# Ingerir (precisa de fontes do Elon)
aiox brain ingest --youtube <elon_url> --clone elon --last 20
aiox brain ingest --youtube https://www.youtube.com/@AlexHormozi --clone hormozi --last 20

# Consultar
aiox brain squad --ask "How do I scale manufacturing?" --synthesize
```

---

## Benchmarks de Qualidade

| Clone | Videos | Chunks | Quality | Use Case |
|-------|--------|--------|---------|----------|
| hormozi (50 vids) | 50 | ~5000 | ⭐⭐⭐⭐⭐ | Business scaling |
| naval (50 vids) | 50 | ~5000 | ⭐⭐⭐⭐⭐ | Philosophy |
| gary (100 vids) | 100 | ~10000 | ⭐⭐⭐⭐ | Marketing advice |
| elon (30 vids) | 30 | ~3000 | ⭐⭐⭐ | Tech insights |

**Recomendação:** 30-50 vídeos por clone para qualidade ótima.

---

## Dicas Avançadas

### 1. Aumentar qualidade (mais vídeos)
```bash
# Primeira ingestão (20)
aiox brain ingest --youtube <URL> --clone expert --last 20

# Depois adicionar mais (20)
aiox brain ingest --youtube <URL> --clone expert --last 20
```

### 2. Monitorar atualizações
```bash
aiox brain watch --channel <URL> --clone expert
```

### 3. Exportar respostas
```bash
aiox brain ask --clone expert "Pergunta" | tee output.txt
```

### 4. Usar em produção
```bash
# API HTTP
curl -X POST http://localhost:8000/brain/ask \
  -H "Content-Type: application/json" \
  -d '{"slug":"expert", "question":"Your question?"}'
```

---

## Limitações & Considerações

| Aspecto | Limitação | Solução |
|---------|-----------|---------|
| Qualidade | Vídeos < 10 min | Usar compilações |
| Confiabilidade | Fake expertise | Validar com múltiplas fontes |
| Atualização | Conhecimento estático | Usar `aiox brain watch` |
| Privacidade | Dados locais (Qdrant) | Qdrant rodando local |
| Performance | Muitos clones (>100) | Distributed Qdrant |

---

## Próximos Clones a Implementar

- [ ] Paul Graham — Startup wisdom
- [ ] Satya Nadella — Cloud & AI
- [ ] Arianna Huffington — Wellness & leadership
- [ ] Reid Hoffman — LinkedIn & networks
- [ ] Bezos — Long-term thinking
- [ ] Jobs (palestrass/biografias) — Design & innovation

---

**Pronto para criar seu primeiro clone?**

Forneça um YouTube e execute:
```bash
./brain-clone-helper.sh <URL> <slug> 20
```

— Brain Factory v1.0 🧠
