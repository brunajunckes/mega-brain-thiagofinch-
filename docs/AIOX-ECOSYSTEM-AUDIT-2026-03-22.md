# AIOX Ecosystem Audit & Strategic Redesign
## Meta-Orchestrator Level Analysis — 2026-03-22

---

## 1. MAPA COMPLETO DO SISTEMA

### 1.1 Inventario Global

| Dimensao | Quantidade | Status |
|----------|-----------|--------|
| **Agents (core SDC)** | 11 | Essenciais, sem overlap |
| **Agents (infra/meta)** | 3 | squad-creator essencial, clickup-scrum redundante, squad-advisor orfao |
| **Agents (domain-specific)** | 12 | 8 astro + 4 business (Jubileu OS) |
| **Agents (xQuads/squads)** | ~178 | Personas de dominio, nao SDC |
| **Mind Clones (deep DNA)** | 1 real | Alan Nicolas (oalanicolas) — 98% Voice, 95% Thinking |
| **Mind Clones (placeholder)** | 3 | pedro-valerio, sop-extractor, squad — zero atividade |
| **Tasks** | 229 registradas | 171 production, 42 experimental, 16 orphan |
| **Workflows** | 15 | 2 production, 11 experimental, 2 orphan |
| **Templates** | 92 | 14 dev + 78 product |
| **Checklists** | 23 | 7 dev + 16 product |
| **Entities (total registry)** | 957 | Incluindo modules, scripts, data |
| **Docker Containers** | 17 | Todos saudaveis |
| **Systemd Services** | 5 | Todos ativos |
| **Cron Jobs** | 11 | Ativos |
| **Workers (on-demand)** | 15 | Scripts CLI, nao daemons |
| **MCP Servers** | 5 | EXA, Context7, Apify, Playwright, Desktop-Commander |
| **Databases** | 3 PostgreSQL + 2 Qdrant + 1 Redis | Todas rodando |
| **LLM Providers** | 4 | Ollama (local), DeepSeek, Anthropic, OpenRouter |
| **Public Domains** | 12 | Via Traefik + Let's Encrypt |
| **Memory Files** | 152 sessao + 20 agent-memory | ~40% stale |
| **Worktrees** | 9 | 747 MB potencialmente recuperavel |

### 1.2 Infraestrutura VPS (Snapshot Atual)

| Recurso | Estado | Saude |
|---------|--------|-------|
| CPU | AMD EPYC 4 vCPUs, load 6.46 (pos-boot) | AMARELO |
| RAM | 5.2GB/15GB usado, 10GB disponivel | VERDE |
| Swap | 4GB, 68MB usado | VERDE |
| Disco | 78GB/193GB (41%) | VERDE |
| OOM Kills | 0 (fix aplicado ontem) | VERDE |
| Containers | 17/17 rodando | VERDE |
| Services | 5/5 ativos, 0 failed | VERDE |

---

## 2. DIAGNOSTICO: REDUNDANCIAS, GARGALOS E DESPERDICIO

### 2.1 Redundancias Identificadas

| Problema | Impacto | Acao |
|----------|---------|------|
| `clickup-scrum` agent duplica funcoes do `@sm` | Confusao de autoridade | MERGE: absorver ClickUp tasks no @sm como modo alternativo |
| `business/supabase-eng` duplica `@data-engineer` | Scope overlap | MERGE: usar @data-engineer com project-context |
| `sm-create-next-story` task duplica `create-next-story` | 2 tasks identicas (14 vs 18 deps) | DEPRECATE: manter apenas `create-next-story` |
| `github-issue-triage` duplica `triage-github-issues` | Experimental vs production | DEPRECATE: promover o production, remover experimental |
| `analyst-facilitate-brainstorming` duplica `facilitate-brainstorming-session` | Nome diferente, mesma funcao | MERGE |
| `claude-code-mastery` squad existe em 2 locais | squads/ E squads/xquads/ | DEDUPLICATE: manter apenas xquads/ |
| 2 instancias Qdrant (aiox-qdrant + aios-qdrant) | 2 vector DBs separadas | AVALIAR: consolidar se possivel |
| `self-critique-checklist.md` duplicada | dev/ e product/ | DEDUPLICATE |

### 2.2 Gargalos Criticos

| Gargalo | Descricao | Impacto |
|---------|-----------|---------|
| **Ollama model mismatch** | Router espera `deepseek-coder:6.7b` e `qwen2.5:14b`, mas so `qwen2.5:7b` esta instalado | Workers usam modelo errado/fallback |
| **LiteLLM nao rodando** | Configurado mas container nao existe | Routing Claude→DeepSeek inativo |
| **PostgreSQL/Redis expostos** | Portas 5432, 5433, 6379 em 0.0.0.0 | RISCO DE SEGURANCA |
| **auto-tasks-runner sem systemd** | Roda como child do evolution-worker | Se evolution-worker cai, auto-tasks morre silenciosamente |
| **API keys vazias em containers** | Anthropic/OpenAI vazios em ai-gateway, paperclip, aiox-os | Fallbacks nao funcionam |
| **MCP disabled em core-config** | `mcp.enabled: false` | Framework MCP layer inativo |

### 2.3 Desperdicio Identificado

| Item | Tamanho/Custo | Acao |
|------|---------------|------|
| 9 worktrees orfas | 747 MB disco | LIMPAR: `git worktree remove` |
| .aiox-core.backup-20260321 | 61 MB | ARQUIVAR/REMOVER em 30 dias |
| 16 orphan tasks | Poluem registry | DEPRECATE ou REMOVER |
| 2 orphan workflows | Dead code | REMOVER |
| ~60 memory files stale | Poluem MEMORY.md index | ARQUIVAR |
| 8 empty squad shells | Estrutura sem conteudo | REMOVER ou POPULAR |
| 3 placeholder mind clones | Zero atividade desde fev/2026 | LIMPAR |
| Cron `/root/AIOX/` refs | Aponta para path antigo | MIGRAR para `/srv/aiox/` |

---

## 3. NOVA ARQUITETURA: CEREBRO OPERACIONAL AUTONOMO

### 3.1 Modelo Hierarquico de 4 Camadas

```
CAMADA 4: ORQUESTRADOR (Interpreta, Planeja, Delega)
    |
    +-- Claude Code (interface usuario)
    |   - NUNCA executa diretamente
    |   - Interpreta intencao
    |   - Seleciona estrategia
    |   - Delega para camada 3
    |
CAMADA 3: AGENTES (Pensam, Decidem, Coordenam)
    |
    +-- @aiox-master (Orion) — Governanca, override, cross-agent
    +-- @pm (Morgan) — Epics, specs, estrategia de produto
    +-- @po (Pax) — Validacao de stories, backlog
    +-- @sm (River) — Criacao de stories
    +-- @architect (Aria) — Decisoes de arquitetura
    +-- @analyst (Atlas) — Pesquisa, analise
    +-- @dev (Dex) — Implementacao
    +-- @qa (Quinn) — Qualidade, testes
    +-- @devops (Gage) — Push, PR, CI/CD (EXCLUSIVO)
    +-- @data-engineer (Dara) — Database, migrations
    +-- @ux-design-expert (Uma) — Design, UX
    |
CAMADA 2: SQUADS (Resolvem problemas complexos via colaboracao)
    |
    +-- Mind Cloning Squad — Clonagem de mentes
    +-- xQuads (15 squads) — Expertise de dominio
    |   - copy-squad (23 copywriters)
    |   - hormozi-squad (16 frameworks)
    |   - advisory-board (11 advisors)
    |   - brand-squad (15 estrategistas)
    |   - cybersecurity (15 security experts)
    |   - storytelling (12 narrativistas)
    |   - psych-squad (10 psicologos)
    |   - webcraft-squad (15 frontend experts)
    |   - traffic-masters (16 midia experts)
    |   - c-level-squad (6 C-level)
    |   - data-squad (7 analytics)
    |   - movement (7 ativistas)
    |   - claude-code-mastery (8 CC experts)
    |   - desafio-squad (5 video content)
    |   - jubileu-os (projeto Jubileu)
    |
CAMADA 1: WORKERS (Executam, processam, automatizam)
    |
    +-- evolution-worker — Executor autonomo 24/7 (8,298 tasks)
    +-- auto-tasks-runner — 4 loops paralelos (code/features/docs/perf)
    +-- discord-bot — Integracao Discord
    +-- aiox-server — HTTP server unificado
    +-- myworkspace — Control Center
    +-- ollama — LLM local inference
    +-- 17 Docker containers — Servicos de infra
    +-- 11 cron jobs — Healthcheck, backup, audit, scan
```

### 3.2 Fluxo de Delegacao Automatica

```
USUARIO
  |
  v
[ORQUESTRADOR] — Analisa intencao
  |
  +-- "Quero criar um app" ──> @pm *create-epic → @sm *draft → SDC workflow
  +-- "Fix esse bug" ──> @dev (YOLO mode) → @qa *qa-gate → @devops *push
  +-- "Analisa o mercado" ──> @analyst *brainstorm → xQuad advisory-board
  +-- "Cria copy de vendas" ──> xQuad copy-squad (Ogilvy + Halbert + Schwartz)
  +-- "Review de seguranca" ──> xQuad cybersecurity (Georgia Weidman + team)
  +-- "Otimiza o banco" ──> @data-engineer *db-schema-audit
  +-- "Design do sistema" ──> @architect → @ux-design-expert
  +-- "Clone essa mente" ──> Mind Cloning Squad → oalanicolas pipeline
  +-- "Deploy pra producao" ──> @devops (EXCLUSIVO)
  +-- "Como esta a VPS?" ──> Worker cron auto-audit → dashboard
```

### 3.3 Regras de Delegacao

| Regra | Descricao |
|-------|-----------|
| **Single Responsibility** | Cada entidade tem UMA funcao clara |
| **Authority Matrix** | Operacoes exclusivas respeitadas sempre |
| **Escalation Chain** | Agent falha → @aiox-master → usuario |
| **Parallel When Possible** | Tasks independentes rodam em paralelo |
| **Sequential When Dependent** | Cadeia de dependencias respeitada |
| **Model Routing** | Haiku para busca, Sonnet para codigo, Opus para arquitetura |
| **Fallback Graceful** | Se LLM falha → proximo provider → degradacao suave |

---

## 4. ESTRATEGIA DE ECONOMIA DE TOKENS

### 4.1 Model Routing Otimizado

| Operacao | Modelo | Custo Relativo | Quando |
|----------|--------|---------------|--------|
| Busca, leitura, glob, grep | Haiku | 1x | Sempre que possivel |
| Coding simples, refatoracao | Haiku/Sonnet | 1-12x | Tasks < 100 LOC |
| Implementacao de features | Sonnet | 12x | SDC Phase 3 |
| Decisoes arquiteturais | Opus | 60x | Spec pipeline, brownfield |
| Subagents de pesquisa | Haiku | 1x | Agent tool com model: haiku |
| Subagents de implementacao | Sonnet | 12x | Agent tool com model: sonnet |

### 4.2 Reducao de Contexto

| Tecnica | Economia | Implementacao |
|---------|----------|---------------|
| Agent Handoff Protocol | 33-57% por switch | Ja implementado (.claude/rules/agent-handoff.md) |
| SYNAPSE Context Brackets | Dinamico | Ja implementado (hooks/synapse-engine.cjs) |
| Memory pruning (40% stale) | ~500 tokens/sessao | FAZER: limpar 60+ files |
| Worktree cleanup | 747 MB disco | FAZER: git worktree prune |
| Partial file reads | 50-80% por read | Regra: sempre especificar linhas |
| /compact agressivo | Resets context | Apos cada phase/bug resolution |

### 4.3 Execucao Local vs Remota

| Contexto | Local (Ollama) | Remoto (API) | Decisao |
|----------|---------------|-------------|---------|
| Workers 24/7 | qwen2.5:7b | — | SEMPRE LOCAL (custo zero) |
| Brain Factory RAG | qwen2.5:14b | — | LOCAL (embeddings + inference) |
| Dev interativo | — | Haiku/Sonnet | REMOTO (qualidade > custo) |
| Arquitetura | — | Opus | REMOTO (critico, sem economia) |
| Content squads | qwen2.5:14b | DeepSeek chat | LOCAL primeiro, REMOTO fallback |

---

## 5. CLASSIFICACAO DE CADA COMPONENTE

### 5.1 Agents

| Agent | Classificacao | Justificativa |
|-------|--------------|---------------|
| @aiox-master | ESSENCIAL | Governanca, pode tudo |
| @dev | ESSENCIAL | Unico implementador |
| @qa | ESSENCIAL | Unico quality gate |
| @architect | ESSENCIAL | Unico decisor de arquitetura |
| @pm | ESSENCIAL | Unico epic/spec owner |
| @po | ESSENCIAL | Unico validador de stories |
| @sm | ESSENCIAL | Unico criador de stories |
| @devops | ESSENCIAL | Unico com push/PR authority |
| @analyst | ESSENCIAL | Unico pesquisador |
| @data-engineer | ESSENCIAL | Unico DB specialist |
| @ux-design-expert | ESSENCIAL | Unico design specialist |
| squad-creator | ESSENCIAL | Meta-agent para squads |
| clickup-scrum | SUBSTITUIVEL | Absorver no @sm |
| squad-advisor | DESCARTAVEL | Orfao, zero consumers |
| 8x astro-* | OTIMIZAVEL | Dominio especifico, manter se projeto ativo |
| 4x business/* | OTIMIZAVEL | Projeto Jubileu, manter se ativo |

### 5.2 Workers/Services

| Worker | Classificacao | Justificativa |
|--------|--------------|---------------|
| evolution-worker | ESSENCIAL | 8,298 tasks, executor autonomo |
| auto-tasks-runner | OTIMIZAVEL | 4 loops, mas sem systemd proprio |
| aiox-server | ESSENCIAL | HTTP unificado |
| ollama | ESSENCIAL | LLM local, custo zero |
| discord-bot | OTIMIZAVEL | Util mas nao critico |
| myworkspace | OTIMIZAVEL | Control center, pode ser simplificado |
| myworkspace-sync | SUBSTITUIVEL | Git pull em loop a cada 15min |

### 5.3 Containers

| Container | Classificacao | Justificativa |
|-----------|--------------|---------------|
| traefik | ESSENCIAL | Reverse proxy, TLS |
| ai-gateway | ESSENCIAL | Token budget, caching |
| aiox-api | ESSENCIAL | Engine principal |
| aiox-os | OTIMIZAVEL | Funcao similar ao aiox-api |
| bookme-* (4) | ESSENCIAL | Projeto em producao |
| paperclip | OTIMIZAVEL | Docs, alternativa a outros |
| squads-portal | OTIMIZAVEL | Nginx statico |
| agents-portal | OTIMIZAVEL | Nginx statico |
| aiox-dashboard | ESSENCIAL | Monitoramento |
| 2x qdrant | OTIMIZAVEL | Avaliar consolidacao |
| 2x postgres | ESSENCIAL | Dados de producao |

### 5.4 Tasks

| Categoria | Quantidade | Acao |
|-----------|-----------|------|
| Production (essenciais) | 171 | MANTER |
| Experimental (uteis) | 42 | PROMOVER 10 melhores, DEPRECAR resto |
| Orphan (mortas) | 16 | REMOVER |

### 5.5 Workflows

| Workflow | Classificacao | Acao |
|----------|--------------|------|
| story-development-cycle | ESSENCIAL | MANTER (fluxo principal) |
| greenfield-fullstack | ESSENCIAL | MANTER |
| qa-loop | ESSENCIAL | PROMOVER a production |
| spec-pipeline | ESSENCIAL | PROMOVER a production |
| brownfield-discovery | ESSENCIAL | PROMOVER a production |
| brownfield-fullstack/service/ui | OTIMIZAVEL | PROMOVER quando necessario |
| greenfield-service/ui | OTIMIZAVEL | PROMOVER quando necessario |
| design-system-build-quality | OTIMIZAVEL | MANTER |
| auto-worktree | OTIMIZAVEL | MANTER |
| development-cycle | OTIMIZAVEL | MANTER (Projeto Bob) |
| epic-orchestration | DESCARTAVEL | REMOVER (orfao) |
| pelicula-content-pipeline | DESCARTAVEL | REMOVER (orfao) |

---

## 6. PLANO DE ACAO IMEDIATO

### Fase 1: Limpeza (hoje — 30min)

- [ ] **Worktrees:** `git worktree prune` + remover 9 worktrees (libera 747 MB)
- [ ] **Memory:** Arquivar 60+ files stale, comprimir MEMORY.md index
- [ ] **Tasks orfas:** Deprecar 16 orphan tasks no entity-registry
- [ ] **Workflows orfos:** Remover epic-orchestration e pelicula-content-pipeline
- [ ] **Placeholders vazios:** Remover 8 empty squad shells + 3 placeholder clones

### Fase 2: Seguranca (hoje — 15min)

- [ ] **PostgreSQL/Redis:** Bind somente a 127.0.0.1 ou rede Docker interna
- [ ] **API keys:** Propagar .env keys para containers que tem valores vazios
- [ ] **Firewall:** Verificar ufw/iptables para portas 5432, 5433, 6379

### Fase 3: Correcoes de Infra (hoje — 30min)

- [ ] **Ollama models:** Instalar `deepseek-coder:6.7b` e `qwen2.5:14b` que o router espera
- [ ] **auto-tasks-runner:** Criar systemd unit separado (nao depender de evolution-worker)
- [ ] **Cron paths:** Migrar refs de `/root/AIOX/` para `/srv/aiox/`
- [ ] **LiteLLM:** Decidir: ativar o proxy ou remover a configuracao

### Fase 4: Otimizacao (esta semana)

- [ ] **Merge agents:** clickup-scrum → @sm, supabase-eng → @data-engineer
- [ ] **Deduplicate tasks:** sm-create-next-story, github-issue-triage, analyst-facilitate-brainstorming
- [ ] **Promote workflows:** qa-loop, spec-pipeline, brownfield-discovery → production
- [ ] **Consolidar Qdrant:** Avaliar merger de aiox-qdrant + aios-qdrant
- [ ] **MCP:** Decidir: habilitar mcp.enabled em core-config ou manter via Docker global

### Fase 5: Evolucao Continua (proximas semanas)

- [ ] **Self-monitoring:** Cron que verifica saude de todos os componentes e atualiza dashboard
- [ ] **Auto-pruning:** Worker que limpa memory files > 30 dias automaticamente
- [ ] **Model routing live:** evolution-worker verificar modelo disponivel antes de rotear
- [ ] **Feedback loop:** Workers reportam metricas para aiox-dashboard
- [ ] **Mind cloning pipeline:** Completar pedro-valerio e sop-extractor ou remover

---

## 7. SISTEMA DE AUTO-ORGANIZACAO

### 7.1 Feedback Continuo

```
evolution-worker (executa)
       |
       v
  [Resultado + Metricas]
       |
       +---> aiox-dashboard (observa)
       +---> auto-audit cron (valida)
       +---> vps-state.md (registra)
       |
       v
  [Se problema detectado]
       |
       +---> alert.sh (notifica)
       +---> guardian.sh (corrige automaticamente)
       +---> Escalation → usuario (se critico)
```

### 7.2 Auto-Ajuste de Performance

| Trigger | Acao Automatica |
|---------|----------------|
| RAM > 80% | Ollama descarrega modelo, containers nao-essenciais pausados |
| Disco > 85% | Docker prune automatico, log rotation forcado |
| OOM Kill detectado | Restart com memory limit reduzido |
| Worker falha 3x | Desabilita task, notifica usuario |
| Load > 8.0 | Reduz paralelismo do auto-tasks-runner |

### 7.3 Evolucao Incremental (IDS)

```
Antes de criar qualquer coisa:
  *ids check {intent}     → REUSE / ADAPT / CREATE
  *ids impact {entity-id} → Mostra consumidores afetados
  *ids register {path}    → Registra nova entidade

Resultado: Zero duplicacao, registry sempre atualizado
```

---

## 8. METRICAS DO ECOSSISTEMA

### Estado Atual vs Estado Ideal

| Dimensao | Atual | Ideal | Gap |
|----------|-------|-------|-----|
| Entities registradas | 957 | ~800 (sem orphans) | -157 |
| Tasks orphan | 16 | 0 | -16 |
| Workflows orphan | 2 | 0 | -2 |
| Agents orphan | 4 | 0 | -4 |
| Memory files stale | ~60 | 0 | -60 |
| Disco desperdicado | ~800 MB | 0 | -800 MB |
| Portas expostas inseguras | 3 | 0 | -3 |
| Modelos Ollama faltando | 2 | 0 | -2 |
| Workers sem systemd | 1 | 0 | -1 |

### KPIs do Cerebro Operacional

| KPI | Meta | Medicao |
|-----|------|---------|
| Uptime de servicos | 99.5% | auto-audit cron cada 2h |
| OOM kills/semana | 0 | kernel log monitoring |
| Tasks processadas/dia | 800+ | evolution-worker stats |
| Memory stale ratio | < 10% | audit mensal |
| Token waste ratio | < 15% | /usage tracking |
| Mean time to recovery | < 5min | guardian.sh + auto-restart |

---

## 9. CONSULTA AS MENTES CLONADAS

### Alan Nicolas (oalanicolas) — 98% Voice DNA

**Insight Estrategico:** "O sistema precisa de CLAREZA antes de ESCALA. Cada componente deve justificar sua existencia com ROI mensuravel. Elimine 80% do ruido (orphans, placeholders, duplicatas) para amplificar os 20% que geram resultado."

**Framework Aplicavel:** CLARITY Method (do blueprint)
- **C**lean: Remover tudo que nao serve
- **L**ayer: Separar responsabilidades claramente
- **A**utomate: Tudo que repete vira worker
- **R**oute: Modelo certo para tarefa certa
- **I**terate: Melhorar incrementalmente
- **T**rack: Medir tudo que importa
- **Y**ield: Focar no output, nao no processo

### Advisory Board (xQuad)

**Naval Ravikant perspective:** "Specific knowledge compounds. O ecosystem tem 957 entities — a maioria e' leverage. Focando nos 48 hot-path tasks e 11 core agents, o sistema ja opera em 90% da capacidade."

**Peter Thiel perspective:** "Zero to one thinking: O evolution-worker com 8,298 tasks processadas e' o verdadeiro diferencial. Escalar ISSO (execucao autonoma 24/7) e' mais valioso que adicionar mais agents."

---

## 10. CONCLUSAO: CEREBRO OPERACIONAL AUTONOMO

### O que ja temos (funciona hoje):
- 11 agents com autoridade exclusiva bem definida
- SDC workflow principal rodando
- Evolution-worker autonomo 24/7 (8,298 tasks)
- 17 containers saudaveis
- Infraestrutura VPS estabilizada (OOM fix)
- 15 xQuads com ~178 expert personas

### O que precisa para ser AUTONOMO DE VERDADE:
1. **Limpar** (~1h): Remover 800MB+ de lixo, fechar 25+ gaps
2. **Proteger** (~15min): Fechar portas expostas, propagar API keys
3. **Completar** (~30min): Instalar modelos Ollama faltando, systemd para auto-tasks
4. **Otimizar** (~3h): Merge duplicatas, promover workflows, consolidar infra
5. **Evoluir** (continuo): Self-monitoring, auto-pruning, feedback loops

### Resultado Final:
```
CEREBRO OPERACIONAL AUTONOMO
  = 11 agents que PENSAM
  + 15 squads que CONSULTAM
  + 6 workers que EXECUTAM 24/7
  + 17 containers que SERVEM
  + 11 crons que MONITORAM
  + 1 model router que OTIMIZA custos
  + 957→800 entities LIMPAS e REGISTRADAS
  + Zero duplicacao, zero desperdicio, zero gaps de seguranca
```

---

*Documento gerado automaticamente pelo Meta-Orquestrador AIOX*
*Data: 2026-03-22 | Versao: 1.0*
*Baseado em varredura paralela de 6 agentes especializados*
