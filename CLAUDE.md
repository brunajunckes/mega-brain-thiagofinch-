# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

**Synkra AIOX** — an AI-Orchestrated Full-Stack Development meta-framework, published as `@aiox-fullstack/core`. It orchestrates AI agents (11 personas) through structured story-driven workflows. The working directory is `/root/.aiox-core/`, which is the main framework package.

## Commands

All commands run from `/root/.aiox-core/`:

```bash
npm run build          # Build via ../tools/build-core.js
npm run test           # Run unit + integration tests
npm run test:unit      # jest tests/unit
npm run test:integration  # jest tests/integration
npx jest tests/unit/path/to/file.test.js  # Run a single test file
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
```

The `aiox` CLI is the primary interface:
```bash
aiox doctor            # Health check — verifies tool setup
aiox graph --deps      # Dependency tree (--format=json|html|mermaid|dot)
aiox graph --stats     # Entity stats and cache metrics
aiox manifest          # Validate manifests
aiox config            # Layered config management
```

## Architecture

The framework uses a **4-layer modular architecture**:

| Layer | Path | Mutability |
|-------|------|------------|
| Infrastructure | `.aiox-core/infrastructure/` | Base layer — tools, integrations, scripts |
| Core | `.aiox-core/core/` | Runtime: config, session, elicitation, orchestration, graph |
| Development | `.aiox-core/development/` | Agents, tasks (205), workflows (15), templates |
| Product | `.aiox-core/product/` | 80+ document templates, checklists, PRD/architecture specs |

**Framework boundaries** (enforced via `.claude/settings.json` deny rules):
- **L1 — Never modify:** `.aiox-core/core/`, `.aiox-core/constitution.md`, `bin/aiox.js`
- **L2 — Extend only:** `.aiox-core/development/tasks/`, `templates/`, `checklists/`, `workflows/`, `infrastructure/`
- **L3 — Config (mutable):** `.aiox-core/data/`, `agents/*/MEMORY.md`, `core-config.yaml`
- **L4 — Always modifiable:** `docs/stories/`, `packages/`, `squads/`, `tests/`

Toggle: `core-config.yaml → boundary.frameworkProtection: true/false`

## Agent System

Agents live in `.aiox-core/development/agents/` as YAML/Markdown files. Each defines persona, commands, and dependencies. Key authority rules:

- `@devops` — **EXCLUSIVE** authority over `git push`, `gh pr create/merge`, CI/CD
- `@dev` — `git add/commit` allowed; push is blocked, delegate to @devops
- `@pm` — EXCLUSIVE over epic creation (`*create-epic`, `*execute-epic`)
- `@po` — EXCLUSIVE over story validation (10-point checklist)
- `@sm` — EXCLUSIVE over story drafting from epics
- `@aiox-master` — Can execute any task; framework governance

Activation: `@agent-name` or `/AIOX:agents:agent-name`. Agent commands use `*` prefix.

## Development Workflow (SDC)

All work flows through **docs/stories/**: `SM drafts → PO validates → Dev implements → QA gates → DevOps pushes`

Stories are in `docs/stories/{epicNum}.{storyNum}.story.md`. Mark progress with `[ ] → [x]` checkboxes. The active story drives commit messages: `feat: implement X [Story 2.1]`.

Context-loaded files at dev time (from `core-config.yaml → devLoadAlwaysFiles`):
- `docs/framework/coding-standards.md`
- `docs/framework/tech-stack.md`
- `docs/framework/source-tree.md`

## Key Configuration

- **`core-config.yaml`** — Master config (MCP, QA, PRD locations, git, IDE selection, lazy loading)
- **`constitution.md`** — 6 non-negotiable principles (CLI First, Agent Authority, Story-Driven, No Invention, Quality First, Absolute Imports)
- **`.claude/rules/`** — 10 context-aware rule files loaded automatically
- **`.env`** — Copy from `.env.example`; supports DeepSeek, OpenRouter, Anthropic, OpenAI, Supabase, GitHub, ClickUp

## Package Exports

The package (`@aiox-fullstack/core`) exports from `index.js` (CJS) and `index.esm.js` (ESM):
- `MetaAgent`, `TaskManager`, `ElicitationEngine`, `TemplateEngine`, `ComponentSearch`, `DependencyAnalyzer`

Sub-path exports: `./templates`, `./utils`, `./tasks`, `./docs`, `./elicitation`

## IDS — Incremental Development System

Before creating new agents/tasks/workflows, always run:
```
*ids check {intent}     # Advisory: returns REUSE/ADAPT/CREATE recommendation
*ids impact {entity-id} # Show consumers before modifying existing components
*ids register {path}    # Register new entity after creation
```

This prevents duplication across the 205+ existing tasks.
