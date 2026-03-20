# Squad Advisor — Quickstart Guide

**Seu novo sistema de especialistas para projetos profissionais e auto-evolutivos**

---

## Em 60 Segundos

O **Squad Advisor** automatiza isso:

```
📌 Novo projeto começa
   ↓
🔍 Squad Advisor identifica expertise necessária
   ↓
🧠 Clona os top 3 especialistas relevantes
   ↓
💬 Orquestra "roundtable discussion" entre eles:
   - Expert A: propõe MVP + arquitetura
   - Expert B: questiona e sugere alternativas
   - Expert C: avalia viabilidade + roadmap
   ↓
📝 Gera spec AUTO-EVOLUTIVA com:
   - AC claros para MVP
   - Roadmap de fases futuras
   - Triggers automáticos (quando scale, refactor, pivot)
   ↓
📚 Cria backlog de stories prontas pro @dev implementar
```

---

## Como Ativar

### Opção 1: Comando Direto

```bash
@squad-advisor *new-project "Descrição do seu projeto"
```

**Exemplo:**
```bash
@squad-advisor *new-project "SaaS de análise de investimentos com AI para wealth managers"
```

### Opção 2: Via Story (PO/SM)

PO cria story como:
> "Executar roundtable Squad Advisor para projeto de Analytics Dashboard"
> Especialidades necessárias: Data Science, Product Design, Technical Architecture

---

## Inputs & Outputs

### INPUT
```
Descrição do projeto (1-2 parágrafos):
- Problema sendo resolvido
- Target user
- Scale esperada
- Constraints (orçamento, timeline, etc)
```

### OUTPUT (3 arquivos automáticos)

#### 1. `spec-auto-evolved.md`
```markdown
# Auto-Evolved Specification

## Executive Summary (Expert Consensus)
3-5 bullet points com consensus dos especialistas

## MVP Phase
- AC1: ...
- AC2: ...
- Stories: Story 1.1, 1.2, 1.3, ...

## Phase 2 (Scale 1M → 10M users)
- Triggered when: [metric] reaches [threshold]
- New AC: ...

## Phase 3 (Scale 10M → 100M)
- Triggered when: [metric] reaches [threshold]
- New AC: ...

## Evolution Triggers
- When to migrate from X to Y
- When to refactor core subsystem
- When to change pricing model
```

#### 2. `roundtable-discussion.md`
```markdown
# Expert Roundtable Discussion

## Participants
- Expert A (expertise tags)
- Expert B (expertise tags)
- Expert C (expertise tags)

## Question: [Tema do debate]

### Round 1 — Initial Perspectives
Expert A: "..."
Expert B: "..."
Expert C: "..."

### Round 2 — Rebuttal & Refinement
...

### Round 3 — Consensus Synthesis
Key agreements: ...
Key disagreements: ...
Final recommendation: ...
```

#### 3. `project-evolution.yaml`
```yaml
project_name: "..."
created_at: "2026-03-20"

mvp_phase:
  target_users: 100
  timeline: "8 weeks"
  quality_gates:
    - "Unit test coverage >= 80%"
    - "Manual QA sign-off"

phase_2:
  name: "Scale to 10k users"
  trigger:
    metric: "daily_active_users"
    threshold: 500
  new_requirements:
    - "Implement caching layer"
    - "Database migration to PostgreSQL"

phase_3:
  name: "Scale to 100k users"
  trigger:
    metric: "daily_active_users"
    threshold: 5000
  new_requirements:
    - "Implement load balancing"
    - "CDN for static assets"

evolution_triggers:
  - name: "Refactor monolith"
    when: "API latency > 500ms"
    action: "Migrate to microservices"
```

---

## Os 8 Squads Disponíveis

### 💰 Business & Growth
Hormozi, Vaynerchuk, Naval Ravikant, Paul Graham, Lex Fridman

**Use quando:** Decisões sobre GTM, scaling, Product-Market Fit, funding strategy

### 🏗️ Technical Architecture
Carmack, Torvalds, Martin Fowler

**Use quando:** MVP architecture, system design decisions, performance choices

### 🧠 AI & Machine Learning
Andrew Ng, Jeremy Howard, Yann LeCun

**Use quando:** ML framework choice, model selection, ML Ops strategy

### 🎨 Product & Design
Don Norman, Marty Neumeier

**Use quando:** Core user problem, interface design, product strategy

### 👔 Leadership & Culture
Satya Nadella, Tim Cook

**Use quando:** Organizational structure, culture decisions, exec leadership

### ✍️ Marketing & Copywriting
Frank Kern, Russell Brunson

**Use quando:** Messaging, positioning, funnel strategy, conversion

### 📊 Research & Analytics
Georgia Weidman, team

**Use quando:** KPI selection, metrics, data strategy, risk assessment

### 💹 Finance & Operations
Donald Miller, team

**Use quando:** Unit economics, pricing strategy, operational scaling

---

## Exemplos de Uso

### Exemplo 1: SaaS para Wealth Managers

```bash
@squad-advisor *new-project \
  "AI-powered investment analysis SaaS for independent wealth managers.
   Problem: Manual research takes 40+ hours/week.
   Target: 500 wealth managers in year 1, 5k in year 2.
   Constraint: Regulatory compliance (SEC Reg BI)"
```

**Squad Advisor executará:**
1. Identifica expertise: AI/ML, Finance/Ops, Product Design
2. Clona: Jeremy Howard (ML), Donald Miller (Ops), Don Norman (Product)
3. Roundtable debate:
   - Jeremy: "Start with simple ML model, iterate"
   - Donald: "Unit economics: $50/month → $10k/month at scale"
   - Don: "Regulatory dashboard is MVP, analytics come later"
4. Gera spec com MVP (simple ML + dashboard) + Phase 2 (advanced ML) + Phase 3 (mobile)

### Exemplo 2: Real-time Multiplayer Game

```bash
@squad-advisor *new-project \
  "Real-time multiplayer game backend.
   Genre: Battle royale, 100 players per match.
   Scale target: 1M concurrent players.
   Timeline: MVP in 3 months"
```

**Squad Advisor executará:**
1. Identifica expertise: Technical Architecture, Business & Growth
2. Clona: John Carmack (perf), Paul Graham (PMF), Naval (scaling mindset)
3. Roundtable debate:
   - Carmack: "Use message queue architecture from day 1"
   - PG: "Launch with 1 region, expand after PMF"
   - Naval: "Growth = word-of-mouth, nail core game first"
4. Gera spec com MVP (100 CCU, CRDT) + Phase 2 (10k CCU) + Phase 3 (1M CCU)

---

## Ativação do Sistema

### 1. Agent está Registered ✅
```
Arquivo: .aiox-core/development/agents/squad-advisor.yaml
Status: Production Ready
```

### 2. Squads estão Configurados ✅
```
Diretório: /squads/
- business-growth/
- technical-architecture/
- ai-ml/
- product-design/
- leadership-culture/
- marketing-copywriting/
- research-analytics/
- finance-operations/
```

### 3. Specialists Classificados ✅
```
Arquivo: docs/specialists-classification.json
Total: 180+ specialists
Categorized in 8 domains
```

### 4. Pronto para Usar! 🚀
```bash
# Inicie um novo projeto
@squad-advisor *new-project "Sua descrição aqui"

# Ou busque experts para domínio específico
@squad-advisor *expert-search "machine learning"

# Ou execute roundtable sobre decisão específica
@squad-advisor *roundtable \
  --expert andrew_ng \
  --expert jeremy_howard \
  --question "PyTorch ou TensorFlow?"
```

---

## Benefícios

| Benefício | Como Funciona |
|-----------|--------------|
| **Projetos profissionais desde o início** | Experts debatem MVP vs future antes de qualquer código |
| **Sem improviso** | Roadmap e evolution triggers são pré-planejados |
| **Auto-evolutivo** | Sistema sabe quando scale, quando refactor, quando mudar |
| **Reduz decisões erradas** | Experts com 50+ anos de experiência combinada |
| **Escalável** | Mesmo padrão funciona para projeto de 3 pessoas ou 300 |
| **Documentado** | Spec gerada fica como referência per-project |

---

## Próximos Passos

1. **Primeira vez?** Rode este exemplo:
   ```bash
   @squad-advisor *new-project "Sistema de controle de gastos pessoal com analytics"
   ```

2. **Depois integre no seu workflow:**
   - New project request → Squad Advisor roundtable
   - Roundtable output → PO creates story backlog
   - Story backlog → @dev implements
   - Done! (com evolution triggers pré-planejadas)

3. **Para projetos maior:**
   - Customize os squads conforme necessário
   - Adicione especialistas específicos por projeto
   - Use `*expert-search` para encontrar talent adicional

---

**Created:** 2026-03-20
**Status:** Production Ready ✅
**Owner:** Squad System
