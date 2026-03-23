# Mega Brain — Context Summary for AIOX

> **Source:** `integrations/mega-brain/` (git subtree from thiagofinch/mega-brain v1.4.4)
> **Integrated:** 2026-03-23
> **Purpose:** Reference summary of mega-brain architecture for AIOX agent integration

---

## What is Mega Brain?

AI-powered knowledge management system that transforms expert materials (videos, PDFs,
transcriptions) into structured playbooks, DNA schemas, and mind-clone agents.
Powered by JARVIS orchestrator (J.A.R.V.I.S. — Just A Rather Very Intelligent System).

---

## Architecture (5 Categories)

```
mega-brain/
├── core/           -> Engine (tasks, workflows, intelligence, paths.py)
├── agents/         -> AI agents (5 categories: external, business, personal, cargo, system)
├── knowledge/      -> Knowledge base (3 buckets: external, business, personal)
├── workspace/      -> Company operations (ClickUp mirror, prescriptive layer)
├── .claude/        -> Claude Code integration (hooks, skills, rules, commands)
├── artifacts/      -> Pipeline outputs
└── logs/           -> Session logs
```

---

## Agent System (5 Types)

| Type | Source | Voice | Examples |
|------|--------|-------|---------|
| `external/` | Expert courses/content | Expert's voice | Alex Hormozi, Cole Gordon, Jeremy Miner |
| `business/` | Company calls/docs | Collaborator voice | Team members |
| `personal/` | Founder notes/email | Founder voice | Thiago |
| `cargo/` | Multiple sources (weighted) | Role hybrid | CFO, CRO, CLOSER, CMO |
| `system/` | Config-driven | System voice | JARVIS, Conclave, Boardroom |

---

## DNA Schema (5 Knowledge Layers)

| Layer | Name | Description |
|-------|------|-------------|
| L1 | PHILOSOPHIES | Core beliefs and worldview |
| L2 | MENTAL-MODELS | Thinking and decision frameworks |
| L3 | HEURISTICS | Practical rules and decision shortcuts |
| L4 | FRAMEWORKS | Structured methodologies and processes |
| L5 | METHODOLOGIES | Step-by-step implementations |

---

## Key Commands (from `.claude/commands/`)

| Command | Purpose |
|---------|---------|
| `/jarvis` | Main JARVIS orchestrator |
| `/jarvis-briefing` | System status overview |
| `/conclave` | Multi-agent deliberation (boardroom) |
| `/extract-dna` | Extract DNA schema from expert materials |
| `/extract-knowledge` | Knowledge extraction pipeline |
| `/ingest` | Ingest new content into knowledge base |
| `/ask` | Query agents with context |
| `/save` | Persist session state |
| `/resume` | Restore previous session |
| `/verify` | 6-level verification protocol |
| `/source-sync` | Sync with source spreadsheet |
| `/evolve` | System evolution commands |
| `/loop` | Iterative processing loops |
| `/create-agent` | Agent creation workflow |
| `/chat` | Multi-agent chat interface |
| `/conclave` | Formal multi-agent debate |
| `/mission-autopilot` | Autonomous mission execution |

---

## Key Skills (from `.claude/skills/`)

- `knowledge-extraction` — Pipeline for extracting structured knowledge from content
- `pipeline-jarvis` — Core processing pipeline
- `pipeline-mce` — MCE (Mind Clone Extraction) pipeline
- `jarvis-briefing` — System status reporting
- `source-sync` — Sync with source spreadsheet
- `verify` + `verify-6-levels` — Quality verification protocols
- `dispatching-parallel-agents` — Parallel agent coordination
- `executing-plans` — Plan execution with checkpoints
- `writing-plans` — Pre-execution planning
- `save` / `resume` — Session persistence
- `conclave` — Multi-agent deliberation
- `agent-creation` — Structured agent creation
- `brainstorming` — Pre-implementation exploration
- `feature-dev` — Feature development workflow
- `github-workflow` — Git/PR workflow
- `gha` — GitHub Actions diagnostics
- `frontend-design` — UI/UX design skill
- `code-review` — Automated code review
- `pr-review-toolkit` — Pull request review workflow

---

## Key Rules (from `.claude/rules/`)

| Rule File | Governs |
|-----------|---------|
| `CLAUDE-LITE.md` | JARVIS identity core (30 rules) |
| `RULE-GROUP-1.md` | Phase management (sequential, blocking) |
| `RULE-GROUP-2.md` | Persistence (auto-save, plan mode) |
| `RULE-GROUP-3.md` | Operations (parallelism, templates) |
| `RULE-GROUP-4.md` | Phase 5 specifics (agent creation, cascading) |
| `RULE-GROUP-5.md` | Validation (integrity, source-sync) |
| `RULE-GROUP-6.md` | Auto-routing (skills, sub-agents, GitHub) |
| `ANTHROPIC-STANDARDS.md` | Claude Code best practices enforcement |
| `agent-cognition.md` | Agent reasoning protocol (5 phases) |
| `agent-integrity.md` | Anti-hallucination, source traceability |
| `directory-contract.md` | File system routing (100+ ROUTING keys) |
| `epistemic-standards.md` | Confidence levels, fact vs recommendation |
| `mcp-governance.md` | MCP server usage rules |
| `RULE-GSD-MANDATORY.md` | GSD planning protocol |

---

## Layer System (Community vs Pro)

| Layer | Content | Git Status |
|-------|---------|------------|
| L1 (Community) | core/, agents/conclave, .claude/, bin/, docs/ | Tracked |
| L2 (Pro) | agents/cargo, knowledge/external/ (populated) | Tracked |
| L3 (Personal) | .data/, .env, agents/external/, knowledge/personal/ | Gitignored |

---

## Integration Notes for AIOX

- **Commands:** Available at `.aiox-core/development/commands/mega-brain/`
- **Agents:** Available at `.aiox-core/development/agents/mega-brain/`
- **Full subtree:** Available at `integrations/mega-brain/`
- **JARVIS persona:** Uses "senhor" address, sarcastic but precise, proactive
- **Conclave system:** Multi-agent boardroom for strategic decisions
- **Hormozi clone:** Highest-fidelity agent (96%), expert in offer creation, sales, scaling
- **Pipeline:** 5-phase extraction system (Download → Organize → De-Para → Pipeline → Agents)
