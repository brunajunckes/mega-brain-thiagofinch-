# AIOX Architecture Patterns & Design Philosophy

**Versão:** 4.0 | **Data:** 2026-03-21 | **Autor:** Alan Nicolas (@oalanicolas)

---

## Padrões Arquiteturais Fundamentais

### 1. AGENT-FIRST ARCHITECTURE

**Princípio:** Cada operação é orquestrada por um agente especializado com autoridade exclusiva.

#### Pattern Structure:
```
User Request
    ↓
Agent Activation (YAML definition loaded)
    ↓
Persona Adoption (vocabulary, tone, behavior)
    ↓
Command Routing (*-prefixed commands)
    ↓
Task Execution (from dependencies)
    ↓
Output & Handoff (to next agent or user)
```

#### Agent Composition:
```yaml
Agent = {
  persona: {
    name: "Dex (Builder)",
    archetype: "Builder",
    zodiac: "♒ Aquarius",
    role: "Full Stack Developer",
    vocabulary: [construir, implementar, refatorar],
    tone: "pragmatic"
  },
  commands: [
    { name: "develop", args: "{story-id}", mode: [yolo|interactive|preflight] },
    { name: "run-tests", mode: [auto|verify] },
    { name: "apply-qa-fixes" }
  ],
  dependencies: {
    tasks: [205+ task files],
    templates: [20+ document templates],
    checklists: [quality validation lists],
    scripts: [automation runners]
  },
  authorization: {
    allowed: [local git operations],
    blocked: [git push - exclusively @devops],
    delegated_to: [@qa, @architect]
  }
}
```

#### Authority Enforcement:

| Mechanism | Layer | Implementation |
|-----------|-------|-----------------|
| **Git Hooks** | OS Level | `.git/hooks/pre-push` checks `$AIOX_ACTIVE_AGENT` |
| **IDE Config** | IDE Level | `.claude/CLAUDE.md` + `.claudeignore` rules |
| **Environment** | Runtime | `$AIOX_ACTIVE_AGENT` variable injection |
| **Agent Boundaries** | Logic | Agent.blocked_operations explicit list |
| **Deny Rules** | Context | `.claude/settings.json` path-based denials |

**Example: @dev cannot git push**
```bash
# @dev tries: git push
# Hook intercepts:
if [ $AIOX_ACTIVE_AGENT != "devops" ]; then
  echo "ERROR: Only @devops can push. Use: @devops *push"
  exit 1
fi
```

---

### 2. STORY-DRIVEN DEVELOPMENT CYCLE (SDC)

**Princípio:** Todo trabalho flui através de uma história canônica com checkpoints de qualidade.

#### Phase 1: DRAFT (Story Master/PM)
```
Input:  PRD shard, epic context
Task:   create-next-story.md
Output: {epicNum}.{storyNum}.story.md with:
        - Acceptance Criteria (written by @sm)
        - Tasks & Subtasks (defined by @sm)
        - Design Notes (architectural context)
        - Dev Notes (implementation guidance)
Status: Draft
```

**File Structure:**
```markdown
# Story X.Y.Z: Feature Name

## Acceptance Criteria
[ ] AC1: Given X, when Y, then Z
[ ] AC2: ...

## Tasks
[ ] Task 1: Subtitle
  [ ] Subtask 1.1: ...
  [ ] Subtask 1.2: ...
[ ] Task 2: ...

## Dev Agent Record
### Checkboxes
[ ] Code implemented
[ ] Tests passing
[ ] CodeRabbit approved
[ ] Ready for QA

### File List
- src/new-file.js (NEW)
- src/modified-file.js (MODIFIED)
- tests/feature.test.js (NEW)

### Debug Log
[timestamp] Step X started
[timestamp] Error Y at line Z - Fixed by...

### Completion Notes
- Approach: Used pattern X from @architect recommendation
- Technical debt: Identified Y in Z (backlog-debt)
```

#### Phase 2: VALIDATE (@po - Product Owner)

```
Input:  Story in Draft status
Task:   validate-next-story.md (10-point checklist)
Checks:
  1. Acceptance Criteria clarity (testable, measurable)
  2. Design Notes completeness
  3. Dev Notes actionability
  4. Task breakdown appropriateness
  5. No conflicting requirements
  6. Scope appropriate for sprint
  7. Dependencies identified
  8. Non-functional requirements covered
  9. Security/compliance considerations noted
  10. Test strategy clear

Decision: GO (>=7 points) or NO-GO (list fixes needed)
Output:  Story status: Ready for Dev
```

#### Phase 3: IMPLEMENT (@dev - Developer)

```
Input:  Story in Ready for Dev status
Task:   dev-develop-story.md (13-step Coder Agent loop per subtask)
Loop:
  1. Read subtask description
  2. Identify files to create/modify
  3. Design approach (complexity check)
  4. Implement code (with error handling)
  5. Create comprehensive tests
  6. Run test suite
  7. Run linting
  8. Verify type safety
  9. CodeRabbit self-healing review (max 2 iterations)
  10. Update story checkboxes
  11. Update File List
  12. Add completion notes
  13. Mark subtask [x]

Quality Gates:
  - All tests PASS
  - Linting PASS
  - TypeCheck PASS
  - Build PASS
  - CodeRabbit no CRITICAL issues

Output: Story status: Ready for Review
```

**Dev Agent Record Update:**
```
[x] Code implemented (3 files created, 2 modified)
[x] Tests passing (12/12 tests ✓)
[x] CodeRabbit approved (1 HIGH issue documented in notes)
[x] Ready for QA

File List:
- src/feature.ts (NEW - 156 lines)
- src/utils/helper.ts (MODIFIED - +32 lines)
- tests/feature.test.ts (NEW - 89 lines)

Debug Log:
[14:23] Started implementation of AC1
[14:35] Encountered async/await issue in service
[14:42] Fixed by using Promise.all() pattern
[15:10] All tests passing
[15:15] CodeRabbit review: 1 HIGH (memory leak risk - will optimize in Phase 2)
[15:20] Story ready for QA

Completion Notes:
- Selected async/await pattern from tech-preferences.md
- Technical debt: Memory optimization opportunity identified (Story 8.X)
- Collaborations: Used component design from @architect recommendation
```

#### Phase 4: QA GATE (@qa - Quality Assurance)

```
Input:  Story in Ready for Review status
Task:   qa-gate.md (7-point quality checklist)
Checks:
  1. Requirements traceability (AC → Tests)
  2. Test coverage (edge cases, error scenarios)
  3. Code quality (architecture patterns, anti-patterns)
  4. Security (OWASP, auth, data handling)
  5. Performance (load, memory, query optimization)
  6. Maintainability (documentation, clarity)
  7. Non-functional requirements (reliability, scalability)

Decision Verdicts:
  - PASS → Story marked Done
  - CONCERNS → Return to @dev with specific feedback
  - FAIL → Escalate to @architect
  - WAIVED → Exception approval recorded

Output: Story status: Done (if PASS) or InProgress (if CONCERNS/FAIL)
```

---

### 3. LAYERED ARCHITECTURE WITH BOUNDARIES

**Princípio:** Framework e projeto são separados por camadas com regras de mutabilidade.

#### 4-Layer Model:

```
┌─────────────────────────────────────────────┐
│ L4: Project Runtime (ALWAYS modifiable)     │
│ - docs/stories/, packages/, squads/         │
│ - Custom agents, tasks, workflows           │
└─────────────────────────────────────────────┘
                    ↓ Imports
┌─────────────────────────────────────────────┐
│ L3: Project Config (Mutable with gates)     │
│ - .aiox-core/data/, agents/*/MEMORY.md      │
│ - core-config.yaml (selective updates)      │
│ - Allow rules via .claude/settings.json     │
└─────────────────────────────────────────────┘
                    ↓ Imports
┌─────────────────────────────────────────────┐
│ L2: Framework Templates (Extend-only)       │
│ - .aiox-core/development/tasks/ (205+)      │
│ - .aiox-core/development/templates/ (20+)   │
│ - .aiox-core/development/workflows/         │
│ - .aiox-core/development/checklists/        │
└─────────────────────────────────────────────┘
                    ↓ Imports
┌─────────────────────────────────────────────┐
│ L1: Framework Core (NEVER modify)           │
│ - .aiox-core/core/ (runtime engine)         │
│ - constitution.md (6 principles)            │
│ - bin/aiox.js (CLI)                         │
└─────────────────────────────────────────────┘
```

#### Enforcement Mechanism:

**`.claude/settings.json` Deny Rules:**
```json
{
  "deny_rules": [
    {
      "path": ".aiox-core/core/**",
      "reason": "Framework Core - NEVER modify"
    },
    {
      "path": ".aiox-core/constitution.md",
      "reason": "Non-negotiable principles"
    },
    {
      "path": ".aiox-core/development/tasks/**",
      "reason": "Framework Templates - extend-only",
      "allow_create": true,
      "allow_delete": false
    }
  ]
}
```

**Toggle Control:**
```yaml
# core-config.yaml
boundary:
  frameworkProtection: true  # Enforce L1 protection
  # Set false for framework contributors only
```

---

### 4. GATE-BASED QUALITY ASSURANCE

**Princípio:** Múltiplas barreiras de qualidade previnem releases ruins.

#### Multi-Stage Validation Pipeline:

```
┌──────────────────────────────────────────────────────────┐
│ STAGE 1: @dev Code Quality (Self-Healing)              │
│ Location: During story implementation                    │
│ Tool: CodeRabbit (light, max 2 iterations)             │
│ Severity Filter: CRITICAL only (auto-fix)               │
│ Decision: Can proceed to QA or BLOCK?                  │
│ Rationale: Catch major issues early, iterate fast      │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 2: @qa Test Architecture Review                   │
│ Location: After @dev marks Ready for Review             │
│ Tool: Manual review against qa-gate.md checklist        │
│ Severity Levels: PASS / CONCERNS / FAIL / WAIVED        │
│ Decision: Accept story or send back to @dev?           │
│ Rationale: Risk-based testing, requirements traceability│
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 3: @devops Pre-Push Quality Gate (Hard gates)    │
│ Location: Before git push to remote                     │
│ Checks: npm lint, npm test, npm typecheck, npm build   │
│ Tool: CodeRabbit (full review, blocks on CRITICAL)     │
│ Decision: All checks PASS or BLOCK?                    │
│ Rationale: Ensure repository health at all times       │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 4: CI/CD Automation (.github/workflows/)          │
│ Location: After push to feature branch                  │
│ Checks: Lint, Test, TypeCheck, Build, Coverage         │
│ Decision: Auto-merge if PASS? (branch protection)      │
│ Rationale: Catch edge cases in multi-branch scenarios   │
└──────────────────────────────────────────────────────────┘
```

#### CodeRabbit Severity Mapping:

```javascript
// STAGE 1: @dev Self-Healing
CRITICAL:  auto_fix         // Auto-fix immediately
HIGH:      document_only    // Log in story notes
MEDIUM:    ignore           // Skip (not critical for dev)
LOW:       ignore           // Skip

// STAGE 3: @devops Pre-PR
CRITICAL:  block_push       // Do not push, must fix
HIGH:      warn_user        // Warn, let user decide
MEDIUM:    document         // Log in PR description
LOW:       optional         // Note in comments
```

---

### 5. INCREMENTAL DEVELOPMENT SYSTEM (IDS)

**Princípio:** Prevenir duplicação e reutilizar componentes inteligentemente.

#### Registry Structure:

```javascript
{
  entities: [
    {
      id: "create-doc.md",
      type: "task",
      category: "document-creation",
      keywords: ["create", "document", "template"],
      usedBy: ["@aiox-master", "@pm", "@architect"],
      dependencies: ["prd-tmpl.yaml", "create-deep-research-prompt.md"],
      codeIntelMetadata: {
        imports: 3,
        exportedSymbols: 12,
        complexity: "high"
      }
    },
    // ... 200+ more entities
  ],
  index: {
    by_type: { task: 120, template: 20, agent: 12, workflow: 4 },
    by_keyword: { "create": 45, "document": 32, ... },
    health_score: 98.7
  }
}
```

#### IDS Commands:

```bash
# Advisory (pre-creation check)
*ids check "create PDF export feature"
# → Recommendation: REUSE (create-doc.md), ADAPT (export-template.md), or CREATE (new task)

# Impact analysis (pre-modification check)
*ids impact create-doc.md
# → Shows: 89 direct consumers, 156 indirect consumers, risk level

# Registration (post-creation)
*ids register "paths/to/new-task.md" --type task --agent @dev

# Health monitoring
*ids health
# → Checks: orphaned entities, broken dependencies, circular imports

*ids stats
# → Shows: 205 tasks, 20 templates, 12 agents, health 98.7%
```

#### Pre-Action Hooks:

```javascript
// Hook 1: Before *create
pre_create: {
  trigger: "*create task|agent|workflow",
  action: FrameworkGovernor.preCheck(intent, type),
  mode: "advisory", // Non-blocking
  shows: ["REUSE recommendations", "Similar entities", "Estimated impact"]
}

// Hook 2: Before *modify
pre_modify: {
  trigger: "*modify {component}",
  action: FrameworkGovernor.impactAnalysis(componentId),
  mode: "advisory",
  shows: ["Direct consumers", "Indirect consumers", "Risk level"]
}

// Hook 3: After *create (automatic)
post_create: {
  trigger: "Creation completed successfully",
  action: FrameworkGovernor.postRegister(filePath, metadata),
  mode: "automatic",
  registers: ["Entity in registry", "Dependencies tracked", "Health updated"]
}
```

---

### 6. AUTONOMOUS BUILD & RECOVERY SYSTEMS

**Princípio:** Desenvolvimento autônomo com capacidade de recuperação de falhas.

#### Autonomous Build Architecture:

```
User: @dev *build-autonomous story-3.14

┌─────────────────────────────────────────────────────┐
│ Step 1: Create Worktree Isolation                   │
│ - Branch: story-3.14 from main                      │
│ - Location: .claude/worktrees/story-3.14/           │
│ - Purpose: Prevent conflicts with other development │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 2: Load Story & Plan                           │
│ - Read docs/stories/3.14.story.md                   │
│ - Extract tasks and subtasks                        │
│ - Create implementation plan (phases)               │
│ - Estimate effort per subtask                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 3: Execute Loop (per subtask)                  │
│ Coder Agent 13-Step Loop:                          │
│ 1. Parse subtask requirements                       │
│ 2. Identify affected files                          │
│ 3. Read current file content                        │
│ 4. Design approach (architectural review)           │
│ 5. Implement code changes                           │
│ 6. Create comprehensive tests                       │
│ 7. Run test suite                                   │
│ 8. Run linting                                      │
│ 9. Run type checking                                │
│ 10. Run CodeRabbit review                           │
│ 11. Self-heal if CRITICAL issues                    │
│ 12. Update story checkboxes                         │
│ 13. Create checkpoint (for resume)                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 4: Recovery on Failure                         │
│ Track attempt: { subtask, attempt#, error, action } │
│ Decide:                                             │
│ - RETRY: With different approach (max 3 attempts)  │
│ - ROLLBACK: To last checkpoint                      │
│ - ESCALATE: To human (@dev) with context            │
│ - STUCK: Detected after N retries                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 5: Completion & Merge                          │
│ - All subtasks completed and tested                 │
│ - CodeRabbit pre-PR review (full, blocks CRITICAL)  │
│ - Merge worktree branch back to main                │
│ - Story status: Done                                │
│ - Report: Success with metrics (time, attempts)     │
└─────────────────────────────────────────────────────┘
```

#### Recovery Mechanisms:

```javascript
// Mechanism 1: Checkpoint-based resume
recovery/
  checkpoints/
    story-3.14/
      subtask-1.1.checkpoint (file hashes, state)
      subtask-1.2.checkpoint
      subtask-2.1.checkpoint

*build-resume story-3.14  // Resume from last checkpoint

// Mechanism 2: Attempt tracking
recovery/
  attempts.json
  [
    {
      subtask: "1.1",
      attempt: 1,
      error: "Module not found",
      action: "Fixed import path",
      timestamp: "2026-03-21T14:23:00Z"
    },
    ...
  ]

// Mechanism 3: Rollback to last good state
*rollback story-3.14 subtask-1.2
// → Reverts to last checkpoint, preserves decision log

// Mechanism 4: Stuck detection
stuck_detector detects:
- Same error 3 consecutive attempts
- Timeout exceeded for subtask
- Circular dependency detected
→ Auto-escalate to human with full context

// Mechanism 5: Decision logging
decision-log-{story-id}.md captures:
- What was decided (architecture choice)
- Why (rationale, alternatives considered)
- When (timestamp)
- Who (which agent, model)
- Rollback info (git commit for reverting)
```

---

### 7. ORCHESTRATION & AGENT HANDOFF

**Princípio:** Transições suaves entre agentes sem acúmulo de contexto.

#### Agent Handoff Protocol:

```
Agent @sm completes task
    ↓
Generate handoff artifact (~379 tokens):
{
  from_agent: "sm",
  to_agent: "po",
  story_context: {
    story_id: "3.14",
    story_path: "docs/stories/3.14.story.md",
    status: "Draft → Ready for Validation",
    current_task: "Story drafted with 5 AC, 3 tasks"
  },
  decisions: [
    "Chose spiral wireframe pattern for onboarding",
    "Deferred accessibility refactor to Story 3.15",
    "Selected PostgreSQL for task storage"
  ],
  files_modified: [
    "docs/stories/3.14.story.md"
  ],
  blockers: [],
  next_action: "Validate story against 10-point checklist"
}
    ↓
Discard @sm full persona (~3K tokens)
Load handoff artifact (~379 tokens)
    ↓
Load @po full persona (~3K tokens)
    ↓
Display @po greeting with suggested next step
HALT for @po input
```

#### Context Efficiency:

```
Without Handoff:
Session 1: @sm (3K) + story context (2K) = 5K
Session 2: @po (3K) + @sm (3K) + story context (2K) = 8K
Session 3: @qa (3K) + @po (3K) + @sm (3K) + story (2K) = 11K
Total: 24K tokens for 3 agent switches

With Handoff:
Session 1: @sm (3K) + story context (2K) = 5K
Session 2: @po (3K) + handoff (0.4K) + story (2K) = 5.4K (-33%)
Session 3: @qa (3K) + handoff (0.4K) + handoff (0.4K) + story (2K) = 5.8K (-57%)
Total: 16.2K tokens (33% reduction per switch)
```

#### Workflow Chains:

```yaml
# .aiox-core/data/workflow-chains.yaml
story_development_cycle:
  @sm *draft → @po *validate → @dev *develop → @qa *qa-gate → @devops *push

epic_execution:
  @pm *create-epic → @pm *execute-epic (wave-1) → @pm *execute-epic (wave-2) → ...

spec_pipeline:
  @pm *gather-requirements → @architect *assess-complexity →
  @analyst *research → @pm *write-spec → @qa *critique → @architect *plan

qa_loop:
  @qa *qa-review → @dev *fix-qa-issues → @qa *qa-review (max 5 cycles)
```

---

### 8. CONSTITUTION & GOVERNANCE

**Princípio:** 6 princípios não-negociáveis que guiam todo o framework.

#### Constitution (6 Artigos):

```markdown
# AIOX Constitution

## Article I: CLI First
**Princípio:** Todas as interfaces devem ser acessíveis via CLI.
**Rationale:** Integração com IDEs, automação, CI/CD, reproduzibilidade.
**Enforcement:** `aiox` CLI como single source of truth, IDE integration via hooks.

## Article II: Agent Authority
**Princípio:** Cada agente tem autoridade exclusiva sobre operações críticas.
**Rationale:** Previne caos, garante accountability, executa garantias de qualidade.
**Enforcement:** Auth matrix, git hooks, IDE configuration, environment checks.

## Article III: Story-Driven Development
**Princípio:** Todo trabalho flui através de histórias canônicas.
**Rationale:** Rastreabilidade, validação incremental, qualidade assegurada.
**Enforcement:** Workflow gates (Draft → Validate → Implement → QA), status enforcement.

## Article IV: No Invention
**Princípio:** Toda afirmação deve rastrear para requisitos, pesquisa ou documentação.
**Rationale:** Evita feature creep, mantém foco em MVP, reduz débito técnico.
**Enforcement:** Spec pipeline validation (Every statement → FR/NFR/CON/research).

## Article V: Quality First
**Princípio:** Qualidade é não-negociável; gates bloqueiam releases ruins.
**Rationale:** Confiança no código, rápida iteração, reduz bugs em produção.
**Enforcement:** Multi-stage validation (CodeRabbit → @qa → @devops), hard blocks on CRITICAL.

## Article VI: Absolute Imports
**Princípio:** Usar absolute imports, nunca relative paths.
**Rationale:** Clareza, refactoring seguro, IDE navigation, encontrar referências.
**Enforcement:** ESLint rules, TypeScript paths, import statement conventions.
```

#### Gates Automáticos:

```javascript
// Gate 1: Story Draft → Validate
if (story.status !== "Draft") {
  throw "Story must be in Draft status to validate";
}
if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
  throw "Missing Acceptance Criteria (Article IV: No Invention)";
}

// Gate 2: Story Ready → Implement
if (!validation.passed || validation.score < 7) {
  throw "Story validation score below 7 (must have @po approval)";
}

// Gate 3: Story Ready → Review
if (!allTests.pass || !lint.pass || !typecheck.pass || !build.pass) {
  throw "Code quality gates failed (Article V: Quality First)";
}
if (coderabbit.criticalIssues > 0) {
  throw "CodeRabbit found CRITICAL issues - cannot proceed";
}

// Gate 4: Story Review → Push
if (!qa.passed) {
  throw "QA gate must pass before push (Article V)";
}
if (!devops.healthCheck.pass) {
  throw "Repository health check failed (Article V)";
}
```

---

### 9. TEMPLATE-DRIVEN DEVELOPMENT

**Princípio:** Documentos e código são gerados a partir de templates Handlebars com elicitation.

#### Template Hierarchy:

```
Generic Templates (Tier 1)
  ├── story-tmpl.yaml      → Story structure (AC, tasks, design notes)
  ├── agent-template.yaml  → Agent definitions (persona, commands)
  ├── task-template.md     → Task structure (phases, elicitation)
  └── workflow-template.yaml → Workflow structure (steps, gates)

Domain Templates (Tier 2)
  ├── prd-tmpl.yaml        → PRD structure (functional, non-functional)
  ├── architecture-tmpl.yaml → System architecture template
  ├── brownfield-prd-tmpl.yaml → Brownfield PRD variant
  └── front-end-architecture-tmpl.yaml → Frontend-specific

Specialized Templates (Tier 3)
  ├── competitor-analysis-tmpl.yaml
  ├── market-research-tmpl.yaml
  ├── project-brief-tmpl.yaml
  └── subagent-step-prompt.md
```

#### Template Rendering Flow:

```
User: *create-doc prd
  ↓
Load: prd-tmpl.yaml
  ↓
Elicit values:
  {
    product_name: "BookMe",
    target_users: "Content creators",
    core_features: [...],
    success_metrics: [...],
    technical_constraints: [...]
  }
  ↓
Render Handlebars:
  {{#each core_features}}
    ## Feature: {{this.name}}
    **Objective:** {{this.objective}}
    ...
  {{/each}}
  ↓
Output: prd.md (complete document)
```

#### Document Sharding:

```bash
*shard-doc prd.md docs/prds/
# Breaks 50KB PRD into:
#   - prds/prd-functional-overview.md (10KB)
#   - prds/prd-user-stories.md (15KB)
#   - prds/prd-technical-requirements.md (12KB)
#   - prds/prd-success-metrics.md (8KB)
# Easier to manage, review, and edit
```

---

### 10. CONFIGURATION MANAGEMENT & CUSTOMIZATION

**Princípio:** Configuração multi-camada permite customização sem modificar framework.

#### Configuration Stack:

```
Global Layer (.claude/settings.json)
  ├── MCP configuration
  ├── IDE selection
  ├── Permission mode defaults
  └── Global deny rules
         ↑↑↑
Project Layer (core-config.yaml)
  ├── Framework protection toggle
  ├── MCP catalog selection
  ├── QA workflow selection
  ├── Story template variant
  └── Devload files
         ↑↑↑
Local Layer (.env / .env.local)
  ├── API keys (DeepSeek, OpenRouter, GitHub)
  ├── Database credentials
  └── Integration tokens
         ↑↑↑
Runtime Layer (Environment variables)
  ├── $AIOX_ACTIVE_AGENT
  ├── $AIOX_STORY_ID
  └── $AIOX_FEATURE_FLAGS
```

#### Config Resolution Order:

```javascript
const config = {
  ...defaultConfig,                              // 1. Defaults
  ...readFile('core-config.yaml'),              // 2. Project config
  ...readFile('.env'),                          // 3. Environment file
  ...readFile('.env.local'),                    // 4. Local overrides
  ...process.env                                // 5. Runtime envs
};

// Later values override earlier values
// Example: core-config.yaml can override defaults
//          .env.local can override core-config.yaml
//          $AIOX_ACTIVE_AGENT always wins
```

---

## Padrões de Orchestração

### Pattern 1: Sequential Orchestration
```
@sm *draft → @po *validate → @dev *implement → @qa *review → @devops *push
```

### Pattern 2: Parallel Orchestration (Waves)
```
@pm *execute-epic (wave-1)
  → @dev *build-autonomous story-X (parallel)
  → @dev *build-autonomous story-Y (parallel)
  → @dev *build-autonomous story-Z (parallel)
→ @qa *qa-gate-all-stories
→ @devops *push-wave-1
```

### Pattern 3: Conditional Orchestration
```
If complexity == SIMPLE:
  → Gather → Spec → Critique (3 phases)
Else if complexity == STANDARD:
  → Gather → Assess → Research → Spec → Critique → Plan (6 phases)
Else if complexity == COMPLEX:
  → 6 phases + revision cycle
```

### Pattern 4: Fault-Recovery Orchestration
```
@qa *qa-review
  → If PASS: @devops *push
  → If CONCERNS: @dev *fix-qa-issues → @qa *qa-review (loop max 5)
  → If FAIL: @architect *assess-impact → @dev *redesign
  → If BLOCKED: Escalate to @aiox-master
```

---

## Sumário de Padrões

| Padrão | Princípio | Benefício |
|--------|-----------|-----------|
| Agent-First | Autoridade exclusiva | Previne conflitos, garante qualidade |
| Story-Driven | Histórias canônicas | Rastreabilidade, validação incremental |
| Layered Arch | 4 camadas de mutabilidade | Proteção do framework, extensibilidade |
| Gate-Based QA | Múltiplas barreiras | Releases confiáveis, feedback rápido |
| IDS Registry | Reutilização inteligente | Reduz duplicação, melhora manutenção |
| Autonomous Build | Worktree + Recovery | Desenvolvimento eficiente, resiliência |
| Agent Handoff | Compactação de contexto | Reduz token usage, mantém coesão |
| Constitution | 6 princípios | Governança clara, decisões consistentes |
| Template-Driven | Geração de artefatos | Consistência, reproduzibilidade |
| Config Management | Multi-camada | Flexibilidade, segurança |

---

**Nota Final:** Esses padrões arquiteturais são implementados de forma prática e testada no framework AIOX. Não são apenas conceitos teóricos, mas sistemas operacionais que guiam o desenvolvimento de projetos complexos com múltiplos agentes, garantindo qualidade, rastreabilidade e eficiência.
