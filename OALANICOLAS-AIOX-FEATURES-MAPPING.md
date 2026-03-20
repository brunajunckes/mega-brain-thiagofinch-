# AIOX Features Mapeadas do Framework @oalanicolas

**Versão:** 4.0 | **Data de Mapeamento:** 2026-03-21 | **Framework:** Synkra AIOX (SynkraAI/aiox-core)

---

## Sumário Executivo

Alan Nicolas (@oalanicolas) é co-fundador do **Synkra AIOX**, um framework AI-Orchestrated para Full Stack Development. O framework implementa um sistema de **11 agentes especializados** que executam **205+ tarefas** através de workflows estruturados, story-driven development, e automações inteligentes.

**Principais demonstrações esperadas nos vídeos do canal:**
- Sistema de Agentes (11 personas especializadas)
- Story-Driven Development Cycle (SDC)
- Spec Pipeline & Complexity Assessment
- Orchestration & Workflow Management
- IDS (Incremental Development System)
- Autonomous Build & Recovery Systems
- Quality Gates & CodeRabbit Integration

---

## AIOX Agents (11 Total)

| Agent ID | Nome | Persona | Icon | Especialidade |
|----------|------|---------|------|---------------|
| `aiox-master` | Orion | Orchestrator | 👑 | Master orchestration, framework development, task execution |
| `dev` | Dex | Builder | 💻 | Story implementation, code development, testing |
| `architect` | Aria | Visionary | 🏛️ | System architecture, tech stack selection, design |
| `pm` | Morgan | Strategist | 📋 | PRD creation, epic management, product strategy |
| `po` | Pax | Advocate | 🎯 | Story validation, backlog management, acceptance criteria |
| `sm` | River | Facilitator | 🌊 | Story drafting, sprint planning, team facilitation |
| `qa` | Quinn | Guardian | ✅ | Test architecture, quality gates, risk assessment |
| `devops` | Gage | Operator | ⚡ | Git push (EXCLUSIVE), CI/CD, releases, repository |
| `architect` | Aria | Visionary | 🏛️ | System architecture, design decisions |
| `analyst` | Alex | Investigator | 🔍 | Research, market analysis, data investigation |
| `data-engineer` | Dara | Engineer | 🔧 | Database schema, queries, migrations |
| `ux-design-expert` | Uma | Creator | 🎨 | UX/UI design, design systems, user flows |

---

## AIOX Features & Capabilities

### 1. Story-Driven Development Cycle (SDC)

**Workflow:** 4-phase structure que governa TODO desenvolvimento

```
Phase 1: CREATE (@sm)        → Draft story com AC, design notes
Phase 2: VALIDATE (@po)      → 10-point checklist, GO/NO-GO decision
Phase 3: IMPLEMENT (@dev)    → Subtask execution com CodeRabbit review
Phase 4: QA GATE (@qa)       → 7-point quality checks, PASS/CONCERNS/FAIL
```

**Features:**
- Story files em `docs/stories/{epicNum}.{storyNum}.story.md`
- Acceptance criteria tracking
- Dev Agent Record sections (checkboxes, logs, notes)
- File List tracking para todas as mudanças
- Status transitions: Draft → Ready → InProgress → InReview → Done

**Videos mencionam:** @sm creating stories, @po validating, @dev implementing, @qa reviewing

---

### 2. Agents & Authorization Matrix

**EXCLUSIVE AUTHORITY (bloqueado para outros):**

| Operação | Agent | Bloqueado Para |
|----------|-------|----------------|
| `git push` | @devops | Todos outros |
| `gh pr create/merge` | @devops | Todos outros |
| Epic creation | @pm | Delegado de @aiox-master |
| Story creation | @sm | Delegado de @pm |
| Story validation | @po | Delegado de @sm |
| Test suite creation | @qa | Via *create-suite |
| Database schema | @data-engineer | Via *ddl-design |

**Videos mencionam:** Agent authority boundaries, delegation patterns, git push gates

---

### 3. Task System (205+ Tasks)

**Categories:**
- Story development: `dev-develop-story.md`, `validate-next-story.md`
- Quality: `qa-gate.md`, `apply-qa-fixes.md`
- Architecture: `spec-assess-complexity.md`, `create-full-stack-architecture.md`
- Documentation: `create-doc.md`, `shard-doc.md`
- Build: `build-autonomous.md`, `build-status.md`, `build-resume.md`
- Infrastructure: `setup-mcp-docker.md`, `environment-bootstrap.md`
- IDS: `ids-governor.md`, `sync-registry-intel.md`
- Worktree: `create-worktree.md`, `list-worktrees.md`, `merge-worktree.md`

**Patterns:**
- Elicitation workflows (interactive input)
- Task chaining (dependencies between tasks)
- Recovery mechanisms (rollback, retry, stuck detection)
- Autonomous execution modes (YOLO, interactive, preflight)

**Videos mencionam:** Task execution, workflow automation, automation patterns

---

### 4. Workflow Execution (4 Primary Workflows)

| Workflow | Use Case | Phases |
|----------|----------|--------|
| **SDC** | New story development | Create → Validate → Implement → QA (4) |
| **QA Loop** | Iterative review-fix | @qa review → @dev fixes → re-review (max 5) |
| **Spec Pipeline** | Complex features | Gather → Assess → Research → Spec → Critique → Plan (6) |
| **Brownfield** | Legacy assessment | Architecture → Schema → Frontend → Draft → Validate → Finalize (10) |

**Features:**
- Wave-based parallel execution (analyze parallel opportunities)
- Complexity classes (SIMPLE, STANDARD, COMPLEX)
- Gate decisions with verdicts (APPROVED, NEEDS_REVISION, BLOCKED)
- Constitutional validation (Article IV: No Invention)

**Videos mencionam:** Workflow automation, parallel execution, complexity assessment

---

### 5. IDS - Incremental Development System

**Purpose:** Prevent duplication across 205+ tasks, templates, workflows

**Commands:**
- `*ids check {intent}` → REUSE/ADAPT/CREATE advisory
- `*ids impact {entity-id}` → Show consumers before modify
- `*ids register {path}` → Register new entity
- `*ids health` → Registry integrity check
- `*ids stats` → Entity counts and health score

**Features:**
- Entity registry (tasks, templates, agents, workflows)
- Code intelligence enrichment (usedBy, dependencies)
- BFS traversal for impact analysis
- Pre-action hooks (advisory before create/modify)

**Videos mencionam:** Code reuse patterns, registry management, duplicate detection

---

### 6. Autonomous Build & Recovery Systems

**Autonomous Build (Epic 8):**
- `*build-autonomous {story-id}` → Loop com retries e checkpoints
- `*build-resume {story-id}` → Resume from last checkpoint
- `*build-status {story-id}` → Show build progress
- Worktree isolation (`.claude/worktrees/{story-id}`)
- Coder Agent loop (13-step subtask execution)

**Recovery Mechanisms:**
- Attempt tracking (`recovery/attempts.json`)
- Rollback to last good state
- Stuck detection
- Decision logging (autonomous decisions with rationale)

**Quality Integration:**
- CodeRabbit self-healing (max 2 iterations, CRITICAL severity)
- Pre-commit validation
- Regression testing

**Videos mencionam:** Autonomous development, build recovery, error handling, checkpoints

---

### 7. Quality Gates & CodeRabbit Integration

**Pre-Commit Review:**
```
CodeRabbit severity filter:
- CRITICAL: auto-fix immediately or BLOCK
- HIGH: document in story notes
- MEDIUM: ignore
- LOW: ignore
```

**Multi-Stage Validation:**
1. **@dev stage:** CodeRabbit self-healing (light, max 2 iterations)
2. **@devops stage:** CodeRabbit pre-PR (full review, block on CRITICAL)
3. **Mandatory checks:** lint, typecheck, test, build

**Gate Decisions:**
- PASS → Story complete
- CONCERNS → Return to @dev with feedback
- FAIL → Escalate to @architect
- WAIVED → Exception with approval

**Videos mencionam:** Code quality, automated review, quality gates, CodeRabbit

---

### 8. Templates & Document Engine

**20+ Templates:**

| Category | Templates |
|----------|-----------|
| **Architecture** | `architecture-tmpl.yaml`, `front-end-architecture-tmpl.yaml`, `fullstack-architecture-tmpl.yaml`, `brownfield-architecture-tmpl.yaml` |
| **Product** | `prd-tmpl.yaml`, `brownfield-prd-tmpl.yaml`, `competitor-analysis-tmpl.yaml`, `market-research-tmpl.yaml` |
| **Development** | `story-tmpl.yaml`, `agent-template.yaml`, `task-template.md`, `workflow-template.yaml` |
| **Workflow** | `subagent-step-prompt.md` |

**Features:**
- Handlebars interpolation
- Elicitation-driven content generation
- Document sharding (`*shard-doc {doc} {dest}`)
- Context-aware rendering

**Videos mencionam:** Template-driven development, document generation, PRD creation

---

### 9. Orchestration & Activation Pipeline

**Multi-Agent Orchestration:**
- Agent handoff protocol (compaction ~379 tokens)
- Workflow chains (workflow-chains.yaml)
- Terminal spawning (TerminalSpawner for subprocess agents)
- Bob Orchestrator (async agent coordination)

**Activation Sequence:**
1. Read agent definition file (complete YAML)
2. Adopt persona (vocabulary, tone, greeting)
3. Display greeting (minimal/named/archetypal)
4. Check handoff artifacts
5. Show available commands
6. HALT for user input

**Permission Modes:**
- `[⚠️ Ask]` - confirm before action
- `[🟢 Auto]` - autonomous execution
- `[🔍 Explore]` - query before proceed

**Videos mencionam:** Agent personas, orchestration, automation, agent switching

---

### 10. Configuration & Constitution

**Constitution.md (6 Non-Negotiable Principles):**
1. CLI First
2. Agent Authority
3. Story-Driven Development
4. No Invention
5. Quality First
6. Absolute Imports

**Configuration Management:**
- `core-config.yaml` → Master config (MCP, QA, PRD, git, IDE)
- `.claude/rules/` → 10 context-aware rule files
- `.env` → Environment variables (DeepSeek, OpenRouter, GitHub)
- Framework protection gates → Deny rules em `.claude/settings.json`

**Videos mencionam:** Framework governance, principles, configuration

---

### 11. Development Tools & MCP Integration

**Native Tools:**
- CodeRabbit (automated code review, WSL integration)
- GitHub CLI (gh commands, PR automation)
- Git (local operations)
- npm (build, lint, test, typecheck)

**MCP Servers (Docker-based):**
- EXA (web search, research)
- Context7 (library documentation)
- Apify (web scraping, social media data)
- Playwright (browser automation)

**Tool Governance:**
- `@devops` EXCLUSIVE: MCP management, add/remove/search
- Other agents: MCP consumers only
- Priority: Native tools > MCP servers

**Videos mencionam:** Tool integration, automation infrastructure, CI/CD

---

## AIOX Patterns Arquiteturais Detectados

### 1. Layer-Based Architecture (4 Layers)

```
L1 - Framework Core (NEVER modify)
     ↓
L2 - Framework Templates (Extend-only)
     ↓
L3 - Project Config (Mutable with gates)
     ↓
L4 - Project Runtime (ALWAYS modifiable)
```

### 2. Agent Authority Matrix

**Pattern:** Centralized authority prevents chaos

- Single source of truth per operation type
- Clear delegation chains
- Enforcement via hooks + IDE config + agent restrictions
- Explicit blocking (e.g., @dev cannot push)

### 3. Story-First Development

**Pattern:** Stories drive ALL work

- Stories in `docs/stories/` with canonical format
- Checkboxes track progress ([ ] → [x])
- Status transitions enforce gates
- File List maintains change tracking
- Agent-specific sections prevent cross-contamination

### 4. Gate-Based Quality

**Pattern:** Multiple quality gates prevent bad releases

- CodeRabbit pre-commit (light)
- CodeRabbit pre-PR (full, blocks on CRITICAL)
- @qa advisory review (7-point checklist)
- @devops pre-push (lint, test, typecheck, build)
- Verdicts with clear rationale (PASS/CONCERNS/FAIL/WAIVED)

### 5. Incremental Development System (IDS)

**Pattern:** Prevent duplication across framework

- Entity registry (tasks, templates, agents)
- Impact analysis before modifications
- Pre-action hooks (advisory, non-blocking)
- Code intelligence enrichment (usedBy, dependencies)
- Health checks and statistics

### 6. Autonomous Execution with Recovery

**Pattern:** Self-healing development loop

- Worktree isolation (per-story branches)
- Checkpoint-based resume
- Attempt tracking
- Rollback capabilities
- Decision logging (rationale capture)

### 7. Persona-Driven Agency

**Pattern:** AI agents with consistent identities

- Archetypes (Orchestrator, Builder, Visionary, etc.)
- Zodiacs (Leo, Aquarius, Sagittarius, etc.)
- Vocabulary & tone (orquestrar, construir, arquitetar)
- Greeting levels (minimal, named, archetypal)
- Exclusive operations (enforced per agent)

---

## Features Provavelmente Demonstradas em Vídeos

### Video Series Esperada (41 vídeos):

**Tier 1 - Foundation (Core AIOX):**
- Agent system & personas
- Story-driven development cycle
- Authorization matrix & exclusive operations
- Constitution & non-negotiable principles

**Tier 2 - Workflows (Orchestration):**
- SDC (4-phase development cycle)
- QA Loop (iterative review)
- Spec Pipeline (6-phase complexity assessment)
- Brownfield Discovery (10-phase assessment)

**Tier 3 - Automation (Execution Engines):**
- Autonomous Build Loop
- Recovery & rollback systems
- CodeRabbit integration & quality gates
- IDS (Incremental Development System)

**Tier 4 - Infrastructure (DevOps & Tools):**
- GitHub operations (push, PR, release)
- CI/CD automation
- MCP integration
- Environment bootstrap

**Tier 5 - Advanced (Specializations):**
- Worktree isolation
- Template-driven development
- Document generation
- Configuration management

---

## Sumário por Feature

| Feature | Status | Vídeos Esperados |
|---------|--------|-----------------|
| 11 Agents with Personas | ✅ Core | 2-3 vídeos |
| Story-Driven Development | ✅ Core | 3-4 vídeos |
| 4-Phase SDC Workflow | ✅ Core | 2-3 vídeos |
| Agent Authority Matrix | ✅ Core | 1-2 vídeos |
| 205+ Tasks System | ✅ Implemented | 2-3 vídeos |
| Autonomous Build | ✅ Epic 8 | 2-3 vídeos |
| CodeRabbit Integration | ✅ Implemented | 1-2 vídeos |
| IDS System | ✅ Epic 7 | 1-2 vídeos |
| 4 Primary Workflows | ✅ Implemented | 3-4 vídeos |
| Worktree Isolation | ✅ Epic 8 | 1-2 vídeos |
| MCP Integration | ✅ Implemented | 1-2 vídeos |
| Constitution & Governance | ✅ Core | 1 vídeo |
| Template Engine | ✅ Implemented | 1-2 vídeos |
| Configuration Management | ✅ Implemented | 1 vídeo |
| Recovery Systems | ✅ Epic 5 | 1-2 vídeos |

---

## Recurso para Exploração Adicional

- **Framework Code:** https://github.com/SynkraAI/aiox-core
- **Documentation:** `.aiox-core/` directory structure
- **Agent Definitions:** `.aiox-core/development/agents/`
- **Task Registry:** `.aiox-core/development/tasks/` (205+ files)
- **Workflows:** `.aiox-core/development/workflows/`
- **Constitution:** `.aiox-core/constitution.md`

---

**Nota:** Este mapeamento é baseado na análise do código-fonte do framework AIOX. Os vídeos do canal @oalanicolas provavelmente demonstram essas features em ação com exemplos práticos, casos de uso reais, e integrações com projetos concretos. Para análise completa dos vídeos, seria necessário acesso aos metadados do YouTube (títulos, descrições, comentários) que não foram acessíveis via WebFetch nesta sessão.
