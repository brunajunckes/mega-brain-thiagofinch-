# Comparative Git Analysis — Complete Guide

**Created:** 2026-03-21
**Status:** 🟢 PRODUCTION READY
**Domain:** `comparative-git-analysis`
**Star-Command:** `*analyze-external-repo`

---

## 🎯 Purpose

When you find an interesting external git repository and want to understand what's different and better that could be implemented in AIOX, use the **`*analyze-external-repo`** command to trigger a deep, exhaustive comparative analysis.

This rule ensures NOTHING is skipped and every aspect is evaluated.

---

## 📋 How to Use

### Quick Start

```bash
*analyze-external-repo {repo-url}
```

or in a conversation:

> "Analyze this external repo for improvements we can bring into AIOX: https://github.com/..."

The SYNAPSE engine will automatically inject the `comparative-git-analysis` domain rules, ensuring comprehensive analysis.

---

## 🔍 What Gets Analyzed

The domain rules enforce analysis of **25 different dimensions**:

### 1. **Squads Structure** (`RULE_0`)
- All squads in external repo
- Comparison against `/srv/aiox/squads/`
- Novel squad patterns

### 2. **Agents** (`RULE_1`)
- Agent definitions (YAML/Markdown)
- Personas, capabilities, commands
- Comparison against `/srv/aiox/.claude/agents/`

### 3. **Skills** (`RULE_2`)
- Skill registration and domains
- Tool integrations
- Comparison against `/srv/aiox/.claude/skills/`

### 4. **Workflows** (`RULE_3`)
- Multi-step orchestration patterns
- State machines, task dependencies
- Comparison against `/srv/aiox/.aiox-core/development/workflows/`

### 5. **Tasks** (`RULE_4`)
- 205+ task patterns in AIOX (exhaustive search)
- Execution patterns, pre/post conditions, elicitation points
- Novel tasks NOT in AIOX

### 6. **Workers** (`RULE_5`)
- Background jobs, evolution engine, automation
- Execution models, scheduling patterns
- Comparison with evolution-engine patterns

### 7. **Infrastructure** (`RULE_6`)
- Docker, CI/CD, Kubernetes, monitoring, logging
- IaC patterns (Infrastructure-as-Code)
- Comparison against `/srv/aiox/infrastructure/`

### 8. **Packages** (`RULE_7`)
- NPM modules, utilities, types
- Architectural patterns, exports, dependency trees
- Comparison against `/srv/aiox/packages/`

### 9. **Agent Memory / Clones** (`RULE_8`)
- Cloned minds, personality data
- Voice DNA and Thinking DNA patterns
- Comparison against `/srv/aiox/.claude/agent-memory/`

### 10. **Constitution / Governance** (`RULE_9`)
- Non-negotiable principles
- Enforcement gates, mechanisms
- Comparison against `/srv/aiox/.aiox-core/constitution.md`

### 11. **Data Registry** (`RULE_10`)
- Entity registry, tool registry, config templates
- Reference structures
- Comparison against `/srv/aiox/.aiox-core/data/`

### 12. **Templates** (`RULE_11`)
- Document, code, checklist templates
- Generation patterns
- Comparison against `/srv/aiox/.aiox-core/development/templates/`

### 13. **Tests** (`RULE_12`)
- Unit, integration, e2e tests
- Testing patterns, coverage strategies
- Comparison against `/srv/aiox/tests/`

### 14. **Documentation** (`RULE_13`)
- Stories, PRD, architecture guides
- Documentation patterns
- Acceptance criteria templates

### 15. **Claude Code Integration** (`RULE_14`)
- `.claude/` directory structure
- Settings, rules, hooks
- Context management patterns, tool definitions

### 16. **Build System** (`RULE_15`)
- webpack/vite/next.js config
- Optimization patterns
- CLI tool definitions

### 17-21. **Comparison & Classification** (`RULE_16-20`)
- Side-by-side comparison tables
- NEW CAPABILITY markers
- ENHANCEMENT markers with effort estimates
- AIOX ADVANTAGE identification
- Technology stack differences

### 22-25. **Documentation & Completeness** (`RULE_21-25`)
- Exact file paths and line numbers
- Implementation roadmap with dependencies
- Handoff document for developers
- **EXHAUSTIVE completeness** (never skip any directory)

---

## 📊 Output Format

The analysis produces:

### 1. **Comparison Table**
```
| Feature | External Repo | AIOX | Recommendation |
|---------|---------------|------|-----------------|
| Squad System | 8 squads with X pattern | 13 squads with Y pattern | ENHANCEMENT: Adopt pattern Y |
| Agent Personas | Custom 5-level system | 11 standard personas | AIOX ADVANTAGE |
| Memory System | Basic agent memory | 22-clone Mind Cloning System | NEW CAPABILITY (Phase 2 complete) |
```

### 2. **NEW CAPABILITIES** (not in AIOX)
```
✨ NEW CAPABILITY: [Name]
- Description: What it does
- Technology: Framework/language
- Effort: XX hours
- Priority: HIGH/MEDIUM/LOW
- Implementation Plan: Step-by-step
- File References: Exact paths + line numbers
- Benefits: Why add to AIOX
```

### 3. **ENHANCEMENTS** (improvements to AIOX)
```
⬆️ ENHANCEMENT: [Name]
- Current AIOX: How it works now
- Proposed: How external repo does it better
- Benefit: Why it's better
- Effort: XX hours
- Priority: HIGH/MEDIUM/LOW
- Diff: What changes in AIOX files
- File References: `/srv/aiox/path/file.js:line-range`
```

### 4. **AIOX ADVANTAGES** (AIOX is better)
```
✅ AIOX ADVANTAGE: [Name]
- External Repo: Limitation or missing feature
- AIOX: How AIOX handles it better
- Why Keep: Why not adopt external approach
```

### 5. **Technology Compatibility**
```
| Tech | External | AIOX | Compatibility |
|------|----------|------|---------------|
| Node.js | 16+ | 18+ | ✅ Compatible |
| React | 18 | 18.x | ✅ Compatible |
```

### 6. **Implementation Roadmap**
```
ROADMAP (Recommended Order):
1. [Feature 1] (Depends on: none) — XX hours
2. [Feature 2] (Depends on: Feature 1) — XX hours
3. [Feature 3] (Depends on: Feature 1, 2) — XX hours
```

### 7. **Developer Handoff Document**
- Exact spec for each change
- Code examples from external repo
- Integration points in AIOX
- Testing strategy
- Risk assessment

---

## 🚀 Example Usage

### Scenario 1: Analyzing a New AI Framework

```
User: *analyze-external-repo https://github.com/org/ai-framework-v2
```

Response will analyze:
- How their agents work differently
- If they have better workflow orchestration
- New memory/clone patterns
- Better infrastructure setup
- Novel worker patterns

Produces actionable recommendations with implementation roadmap.

### Scenario 2: Competitive Analysis

```
User: *analyze-external-repo https://github.com/competitor/platform
```

Response will identify:
- Features they have that AIOX lacks
- Features AIOX has that they're missing
- Technology choices and why
- Architecture differences
- Performance/scalability advantages

---

## 🎓 Key Principles

1. **EXHAUSTIVE:** Never skip any directory or file
2. **COMPARATIVE:** Always compare to equivalent AIOX structure
3. **ACTIONABLE:** Every recommendation includes effort, priority, implementation plan
4. **TRACEABLE:** Every suggestion links to exact file paths and line numbers
5. **CLASSIFIED:** Every finding marked as NEW, ENHANCEMENT, or AIOX ADVANTAGE
6. **COMPLETE:** Delivers developer-ready handoff, not just observations

---

## 📍 Domain Reference

**Domain File:** `.synapse/comparative-git-analysis`
**Manifest Entry:** `COMPARATIVE_GIT_ANALYSIS_STATE=active`
**Recall Keywords:** git, repo, analysis, external, comparative, squads, agents, skills, workflows, tasks, workers, infrastructure

**25 Analysis Rules:** All mandatory for complete coverage

---

## 🔧 Technical Details

### How SYNAPSE Activates This

When you use `*analyze-external-repo`:

1. SYNAPSE Layer 7 (Commands) detects `*analyze-external-repo`
2. Loads domain `comparative-git-analysis` with 25 rules
3. Injects all rules into context
4. Ensures analysis covers ALL dimensions
5. Prevents skipping any analysis area

### Manual Activation

You can also activate manually:

```
*synapse toggle comparative-git-analysis
```

Then your prompts will automatically include the comparative analysis rules.

---

## 📝 History

- **Created:** 2026-03-21
- **Status:** 🟢 PRODUCTION READY
- **Rules:** 25 comprehensive analysis dimensions
- **Star-Command:** `*analyze-external-repo`
- **Target:** Complete, exhaustive comparative analysis

---

**Use case:** "Analyze this external repo for improvements"
**Result:** Complete implementation roadmap, actionable recommendations, developer handoff
**Completeness:** ✅ EXHAUSTIVE (never skip anything)
