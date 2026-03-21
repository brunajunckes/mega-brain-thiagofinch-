# Pattern Library - Squad-Creator

**Version:** 4.0.0
**Last Updated:** 2026-03-06
**Source:** Squad-Creator Base + Pro consolidated patterns

---

## Overview

This document consolidates all patterns, heuristics, veto conditions, quality gates, and axiomas used by the Squad-Creator system. Updated for v4.0.0 with unified veto map, structural completeness gate, and validate-squad 6-phase system.

**Config Files (Base):**
- `config/heuristics.yaml` - 3 decision heuristics (SC_HE_*)
- `config/quality-gates.yaml` - 10 quality gates (QG-SC-*)
- `config/task-anatomy.yaml` - 8 mandatory task fields

**Config Files [PRO] (squad-creator-pro):**
- `config/veto-conditions.yaml` - 18 veto conditions (SC_VC_* + AN_VC_*)
- `config/axioma-validator.yaml` - 10 axioma dimensions (D1-D10)
- `config/heuristics.yaml` - 6 heuristics (SC_HE_* + AN_HE_*)
- `config/scoring-rubric.yaml` - Quality scoring rubric
- `config/model-routing.yaml` - Model tier routing

**Validation:**
- `scripts/validate-squad.sh` - All-in-one validation (Worker)
- `scripts/coherence-validator.py` - Cross-reference coherence
- `scripts/inventory.py` - Component inventory
- `scripts/naming_validator.py` - Naming conventions
- `scripts/dependency_check.py` - Reference validation
- `scripts/checklist_validator.py` - Checklist structure
- `scripts/scoring.py` - Weighted quality score
- `scripts/security_scanner.py` - Security issues (API keys, secrets)

---

## Heuristics (SC_HE_*)

Decision heuristics derived from Pedro Valerio's mind artifacts.

| ID | Name | Source | Phase | Mode |
|----|------|--------|-------|------|
| SC_HE_001 | Vision Alignment | PV_BS_001 | architecture | `*eng-*` |
| SC_HE_002 | Agent Coherence | PV_PA_001 | agent_creation | `*arq-*` |
| SC_HE_003 | Workflow Automation | PV_PM_001 | workflow_design | `*auto-*` |

### SC_HE_001: Vision Alignment

**When to use:** Before starting any major squad creation
**Decision Tree:**
```
Is vision defined and clear?
+-- YES (score >= 7) -> PROCEED
+-- PARTIAL (score 5-6) -> Document gaps, proceed with warning
+-- NO (score < 5) -> VETO (SC_VC_002)
```

### SC_HE_002: Agent Coherence

**When to use:** During agent creation or validation
**Decision Tree:**
```
Does agent structure align with DNA?
+-- Voice + Thinking DNA match -> PASS
+-- Minor inconsistencies -> WARN, suggest fixes
+-- Major misalignment -> VETO (SC_VC_005)
```

### SC_HE_003: Workflow Automation

**When to use:** During workflow design or audit
**Decision Tree:**
```
Can this step be automated without loss?
+-- YES -> Implement as Worker/Agent
+-- NEEDS JUDGMENT -> Implement as Hybrid
+-- REQUIRES HUMAN -> Keep as Human, document why
```

---

## Unified Veto Condition Map

All veto conditions across the Squad-Creator system, organized by source.

### VETO-SQD-* (create-squad.md task -- Base)

Hard blockers from the `create-squad` pipeline.

| Code | Name | Trigger | Behavior | Phase |
|------|------|---------|----------|-------|
| VETO-SQD-001 | Overwrite without confirmation | Squad directory exists AND user has not confirmed overwrite | HALT at PHASE 0. Prompt user for confirmation or abort. | Phase 0 |
| VETO-SQD-002 | Validation score below threshold | Quality score < 7.0 after fix_cycle exhausts max_retries (2) | Transition to `failed`. Manual intervention required. | Phase 5 |
| VETO-SQD-003 | Missing entry agent | config.yaml has no `entry_agent` OR referenced agent file does not exist | HALT at PHASE 3. Cannot proceed without valid entry point. | Phase 3 |
| VETO-SQD-004 | Missing workspace integration | config.yaml has no `workspace_integration.level` field | HALT at PHASE 3. Must declare level (none/read_only/read_write/workspace_first). | Phase 3 |
| VETO-SQD-005 | Smoke test failure | All 3 smoke test scenarios fail (activation, help, basic_task) | Transition to `failed` via `smoke_failed` trigger. | Phase 5 |

### SC_VC_* (config/veto-conditions.yaml [PRO])

Process-level veto conditions from Pedro Valerio's methodology.

| Code | Name | Trigger | Resolution | Phase |
|------|------|---------|------------|-------|
| SC_VC_001 | Domain Viability | elite_minds_count < 3 OR source_quality < 0.6 | Research more, change scope | Discovery |
| SC_VC_002 | Vision Clarity | squad_vision_clarity < 0.7 | Define clearer objectives | Architecture |
| SC_VC_003 | Source Quality | verified_quotes < 15 OR signature_phrases < 5 | Add more sources, return to @oalanicolas | DNA Extraction [PRO] |
| SC_VC_004 | DNA Completeness | voice_dna_missing OR thinking_dna_missing | Extract missing DNA | DNA Extraction [PRO] |
| SC_VC_005 | Agent Coherence | agent_behavior_coherence < 0.7 | Realign voice+thinking | Agent Creation |
| SC_VC_006 | Smoke Test | smoke_tests_passed < 3 | Fix and re-test | Agent Creation |
| SC_VC_007 | Guardrail Missing | guardrails_count < 5 | Add veto conditions | Workflow Design |
| SC_VC_008 | Unidirectional Flow | status_can_go_backwards = true | Redesign flow | Workflow Design |
| SC_VC_009 | Axioma Score | axioma_overall_score < 7.0 OR truthfulness < 7.0 | Improve truthfulness | Validation |
| SC_VC_010 | Task Anatomy | required_fields_missing = true | Add missing 8 fields | Any |

**Veto Hierarchy:**

```
HARD VETO (immediate stop):
  SC_VC_003 (Source Quality) - No sources = no clone [PRO]
  SC_VC_006 (Smoke Test) - Failed behavior = broken agent
  SC_VC_009 (Axioma D1) - Truthfulness below threshold

SOFT VETO (warn, allow override):
  SC_VC_001 (Domain Viability) - May proceed with reduced scope
  SC_VC_010 (Task Anatomy) - May proceed with documentation
```

### AN_VC_* (config/veto-conditions.yaml [PRO])

Mind-cloning veto conditions from @oalanicolas DNA extraction pipeline.

| Code | Name | Trigger | Resolution | Phase |
|------|------|---------|------------|-------|
| AN_VC_001 | Volume Without Curation | volume_prioritized_over_curation | Aplicar classificacao ouro/bronze | Source Classification [PRO] |
| AN_VC_002 | Trinity Incomplete | playbook_missing OR framework_missing OR swipe_missing | Identificar componente faltante e extrair | DNA Extraction [PRO] |
| AN_VC_003 | Bronze Majority | ouro_ratio < 0.6 | Buscar mais fontes ouro ou eliminar bronze | Source Classification [PRO] |
| AN_VC_004 | Citation Missing | concept_without_source OR citations < 15 | Adicionar [SOURCE:] ou marcar como [INFERRED] | DNA Extraction [PRO] |
| AN_VC_005 | Handoff Without Validation | self_validation_not_passed | Passar checklist antes de handoff | Handoff [PRO] |

**Additional AN_VC_* (CLAUDE.md methodology -- [PRO]):**

| Code | Name | Trigger | Resolution |
|------|------|---------|------------|
| AN_VC_006 | Create Without Discovery | create_without_search OR create_when_similar_exists | Search existing first [PRO] |
| AN_VC_007 | Trust Without Verification | trust_without_verification OR llm_when_code_suffices | Verify physically first [PRO] |
| AN_VC_008 | Ignore Pattern | ignore_repeated_correction OR batch_without_single_validation | Document as rule [PRO] |

### V1-V9 Universal Vetos (validate-squad.md -- Base)

Inline veto conditions checked during squad validation Phase 5.

| Code | Condition | Check | Applies To |
|------|-----------|-------|------------|
| SC_VC_000 | Preflight results not generated | /tmp/preflight-results.yaml does not exist | All squads |
| V1 | No entry agent defined | tier_1_result.entry_agent_exists == false | All squads |
| V2 | Entry agent cannot activate | tier_1_result.entry_agent_activatable == false | All squads |
| V3 | >20% of referenced files missing | tier_1_result.missing_references > 20% | All squads |
| V4 | config.yaml invalid | tier_1_result.config_valid == false | All squads |
| V5 | Security issue detected | tier_1_result.security_issues > 0 | All squads |
| V6 | Critical cross-reference broken | tier_1_result.broken_handoffs > 0 | All squads |
| V7 | Task anatomy incomplete | required_fields_missing = true | All squads |
| V8 | Domain not viable | elite_minds_count < 3 OR source_quality < 0.6 | Squad creation only |
| V9 | Vision unclear | squad_vision_clarity < 0.7 | Squad creation only |

### VE/VP/VH Type-Specific Vetos (validate-squad.md -- Base)

| Code | Type | Condition | Check |
|------|------|-----------|-------|
| VE1 | Expert | Zero agents with voice_dna | tier_4_result.voice_dna_coverage == 0 |
| VE2 | Expert | No Tier 0 capability | tier_4_result.has_tier_0 == false |
| VP1 | Pipeline | Workflow has sequence collisions | tier_3_result.sequence_collisions > 0 |
| VP2 | Pipeline | Phase outputs don't connect | tier_3_result.broken_output_chain == true |
| VP3 | Pipeline | No quality gate before final | tier_4_result.has_quality_gate == false |
| VH1 | Hybrid | No heuristic validation defined | tier_4_result.heuristic_count == 0 |
| VH2 | Hybrid | Missing fallback behavior | tier_4_result.has_fallback == false |

---

## Structural Completeness Gate

From `checklists/squad-structural-completeness.md` (SC_STRUCT_001). Documents the 14 blocking requirements before a squad can be declared "created".

### Philosophy

```
Um squad nao esta "criado" ate que os arquivos estruturais existam.
Listar no README nao e criar.
Mencionar que vai criar nao e criar.
O arquivo precisa EXISTIR no filesystem.
Templates DEVEM ser usados - NUNCA escrever ad-hoc.
```

### 14 Blocking Requirements

| # | Category | Check | Validation |
|---|----------|-------|-----------|
| 1 | Config | `config.yaml` existe | `ls squads/{name}/config.yaml` |
| 2 | Config | NAO e `squad.yaml` | Arquivo deve ser `config.yaml` |
| 3 | Config | Campo `entry_agent` presente | `grep "entry_agent:" config.yaml` |
| 4 | Config | Campo `version` presente | semver (X.Y.Z) |
| 5 | Entry Agent | Arquivo do entry_agent existe | `ls squads/{name}/agents/{entry_agent}.md` |
| 6 | Entry Agent | Tem `activation-instructions:` | Bloco YAML com steps de ativacao |
| 7 | Entry Agent | Tem comando `*help` | Minimo obrigatorio |
| 8 | Docs | `README.md` existe | Documentacao principal |
| 9 | Template | config.yaml baseado em template | Estrutura match com config-tmpl.yaml |
| 10 | Template | Entry agent baseado em template | Estrutura match com agent-tmpl.md |
| 11 | Config | Campo `tested` presente | true/false no config |
| 12 | Docs | `CHANGELOG.md` existe | Historico de versoes |
| 13 | Docs | `ARCHITECTURE.md` existe | Pipeline flow |
| 14 | Lifecycle | update/delete tasks existem | Para squads Expert/Pipeline (WARNING para Operational/Utility) |

**Scoring:**
```yaml
blocking_checks: 14 items
pass_threshold: 14/14 (100%)
any_failure: Squad marcado como INCOMPLETO
```

### Squad Type Detection (affects which checks are blocking)

| Type | Characteristics | Lifecycle Tasks |
|------|----------------|-----------------|
| **Expert** | Mind clones, voice_dna, multiplos agents | update + delete RECOMENDADOS |
| **Pipeline** | Fases sequenciais, orchestrator | update + delete RECOMENDADOS |
| **Operational** | Funcional, sem mind clones, focado em automacao | update + delete OPCIONAIS |
| **Utility** | Single-purpose, poucos agents | update + delete OPCIONAIS |

### Template Compliance

```
NUNCA escrever arquivos de squad ad-hoc (de memoria).
SEMPRE carregar e usar os templates do squad-creator.
```

| Arquivo a Criar | Template a Carregar | Campos Obrigatorios |
|-----------------|---------------------|---------------------|
| `config.yaml` | `templates/config-tmpl.yaml` | name, version, entry_agent, agents[] |
| `agents/*.md` | `templates/agent-tmpl.md` | activation-instructions, persona, commands |
| `README.md` | `templates/readme-tmpl.md` | Overview, Commands, Files |
| `tasks/*.md` | `templates/task-tmpl.md` | Task ID, Inputs, Outputs |

---

## validate-squad 6-Phase System

From `tasks/validate-squad.md` v5.0.0. Context-aware, tiered validation system.

### Overview

```
INPUT (squad_name)
    |
[PHASE 0: TYPE DETECTION]
    -> Detect squad type (Expert/Pipeline/Hybrid)
    -> Load type-specific requirements
    |
[PHASE 1: STRUCTURE - TIER 1] (BLOCKING)
    -> T1-CFG: config.yaml exists, valid, required fields
    -> T1-ENT: Entry agent exists, activatable, has *help
    -> T1-REF: All config/agent dependencies exist
    -> T1-XREF: Handoff targets, task refs, template refs valid
    -> T1-SEC: Security scan (API keys, secrets, credentials)
    -> Any failure = ABORT
    |
[PHASE 2: COVERAGE - TIER 2] (BLOCKING)
    -> T2-COV: Checklist coverage >= 30% for complex tasks
    -> T2-ORP: Orphan task detection (max 2 allowed)
    -> T2-PHS: Pipeline phase coverage 100% (Pipeline squads)
    -> T2-DAT: Data file usage >= 50%
    -> T2-TOOL: Tool registry validation (if exists)
    -> Coverage failures = ABORT
    |
[PHASE 3: QUALITY - TIER 3] (SCORING 0-10)
    -> T3-PQ: Prompt Quality (25%)
    -> T3-PC: Pipeline Coherence (25%)
    -> T3-CA: Checklist Actionability (25%)
    -> T3-DOC: Documentation (25%)
    -> T3-OPT: Optimization Opportunities (20%)
    -> Score threshold 7.0
    |
[PHASE 4: CONTEXTUAL - TIER 4] (SCORING 0-10)
    -> Expert: T4E-VD (voice_dna), T4E-OA (objections), T4E-OE (examples), T4E-TO (tiers)
    -> Pipeline: T4P-WD (workflow), T4P-PC (checkpoints), T4P-OC (orchestrator), T4P-IO (outputs), T4P-AS (automation)
    -> Hybrid: T4H-PP (persona), T4H-BS (behavioral), T4H-HV (heuristics), T4H-PS (process), T4H-EX (executor tree)
    -> Weighted 20% of final score
    |
[PHASE 5: VETO CHECK]
    -> Universal vetos (V1-V9, SC_VC_000)
    -> Type-specific vetos (VE1-VE2, VP1-VP3, VH1-VH2)
    -> Any veto = FAIL regardless of score
    |
[PHASE 6: SCORING & REPORT]
    -> Formula: (Tier3 x 0.80) + (Tier4 x 0.20)
    -> 9.0-10.0: EXCELLENT
    -> 7.0-8.9: PASS
    -> 5.0-6.9: CONDITIONAL
    -> 0.0-4.9: FAIL
    |
OUTPUT: Validation Report + Final Score
```

### Worker Scripts (Mandatory Preflight)

Before ANY manual analysis, run deterministic scripts first:

**Option A: All-in-one (recommended)**
```bash
bash squads/squad-creator/scripts/validate-squad.sh {squad_name} --json > /tmp/preflight-results.yaml
```

**Option B: Modular (for debugging)**
| Script | Purpose |
|--------|---------|
| `inventory.py` | "What components exist?" |
| `naming_validator.py` | "Why is naming failing?" |
| `dependency_check.py` | "What references are broken?" |
| `checklist_validator.py` | "Which checklists have issues?" |
| `coherence-validator.py` | "Why coherence check failed?" |
| `scoring.py` | "How is score calculated?" |
| `security_scanner.py` | "What security issues exist?" |

### Requirements by Squad Type

| Component | Expert | Pipeline | Hybrid |
|-----------|--------|----------|--------|
| voice_dna | REQUIRED | optional | optional |
| objection_algorithms | REQUIRED | optional | optional |
| output_examples | REQUIRED | optional | optional |
| tier_organization | REQUIRED | optional | optional |
| workflow_definition | optional | REQUIRED | optional |
| phase_checkpoints | optional | REQUIRED | optional |
| orchestrator | optional | REQUIRED | optional |
| automation_script | optional | **IF 8+ phases** | optional |
| persona_profile | optional | optional | REQUIRED |
| behavioral_states | optional | optional | REQUIRED |
| heuristic_validation | optional | optional | REQUIRED |
| executor_decision_tree | optional | optional | REQUIRED |
| tool_registry | optional | optional | optional |

---

## Axioma Dimensions (D1-D10)

Based on Pedro Valerio's META_AXIOMAS artifact. Each dimension measures a quality aspect. Used in validation and scoring.

| ID | Name | Weight | Threshold | VETO Power |
|----|------|--------|-----------|------------|
| D1 | Truthfulness | 1.0 | 7.0 | **YES** |
| D2 | Coherence | 0.9 | 6.0 | No |
| D3 | Strategic Alignment | 0.9 | 6.0 | No |
| D4 | Operational Excellence | 0.8 | 6.0 | No |
| D5 | Innovation Capacity | 0.7 | 5.0 | No |
| D6 | Risk Management | 0.8 | 6.0 | No |
| D7 | Resource Optimization | 0.8 | 6.0 | No |
| D8 | Stakeholder Value | 0.7 | 6.0 | No |
| D9 | Sustainability | 0.7 | 6.0 | No |
| D10 | Adaptability | 0.6 | 5.0 | No |

### D1: Truthfulness (VETO POWER)

The only dimension with automatic veto. If truthfulness < 7.0, entire validation fails.

**Validation Questions:**
- Todas as citacoes tem [SOURCE:] verificavel?
- Os frameworks sao documentados ou inventados?
- As inferencias estao marcadas como tal?
- Existe evidencia para cada claim?

**Red Flags:**
- Citacoes sem fonte
- Frameworks 'inspirados em' sem documentacao
- Afirmacoes categoricas sem evidencia
- Inferencias apresentadas como fatos

---

## Quality Gates (QG-SC-*)

Validation checkpoints throughout the workflow.

### Auto Gates (Runtime, <60s)

| ID | Name | Trigger | Validation |
|----|------|---------|------------|
| QG-SC-1.1 | Structure Validation | On artifact creation | YAML syntax, required fields |
| QG-SC-1.2 | Schema Compliance | On artifact creation | task-anatomy fields |
| QG-SC-2.1 | Reference Integrity | On artifact save | All refs exist |
| QG-SC-3.1 | Veto Scan | On checkpoint | No active vetos |
| QG-SC-4.1 | Coherence Check | On validation request | coherence-validator.py |
| QG-SC-4.2 | Axioma Scoring | On validation request | D1-D10 scoring |

### Hybrid Gates (AI + Human, <5min)

| ID | Name | Trigger | Validation |
|----|------|---------|------------|
| QG-SC-5.1 | DNA Review [PRO] | On DNA extraction complete | AI prepares, human validates |
| QG-SC-5.2 | Smoke Test Review | On smoke test execution | AI runs, human verifies |
| QG-SC-6.1 | Squad Review | On squad completion | Final human approval |
| QG-SC-6.2 | Handoff Review | Before handoff | Validate deliverables |

---

## Task Anatomy (8 Fields)

Every task MUST have these 8 fields:

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | task_name | string | Verb + Object (e.g., "Create Agent") |
| 2 | status | enum | draft/ready/in_progress/done/blocked |
| 3 | responsible_executor | string | Who executes (@agent or role) |
| 4 | execution_type | enum | Human/Agent/Hybrid/Worker |
| 5 | estimated_time | string | Duration with unit (e.g., "30 min") |
| 6 | input | array | Required inputs to start |
| 7 | output | array | Expected deliverables |
| 8 | action_items | array | Concrete steps to execute |

**Validation:** SC_VC_010 triggers if any field missing. V7 veto in validate-squad Phase 5.

---

## Executor Types

Decision tree for choosing executor (from `data/executor-decision-tree.md`):

```
Is output 100% predictable?
+-- YES -> Can be written as pure function?
|         +-- YES -> Library/API exists?
|         |         +-- YES -> WORKER
|         |         +-- NO -> Worth coding (used 3+ times)?
|         |                  +-- YES -> WORKER
|         |                  +-- NO -> AGENT
|         +-- NO -> (continue to NLP check)
+-- NO -> Requires NLP interpretation?
|         +-- YES -> Error impact significant?
|         |         +-- HIGH -> HYBRID
|         |         +-- LOW -> AGENT
|         +-- NO -> Requires strategic judgment?
|                  +-- YES -> AI can assist?
|                  |         +-- YES -> HYBRID
|                  |         +-- NO -> HUMAN
|                  +-- NO -> (re-evaluate)
```

| Type | Cost | Speed | Consistency | When |
|------|------|-------|-------------|------|
| Worker | $ | ms-s | 100% | Deterministic transforms |
| Agent | $$$$ | s-min | 85-95% | NLP, analysis, generation |
| Hybrid | $$ | min-h | 95%+ | Critical output, human review |
| Human | $$$ | h-days | Variable | Strategic, interpersonal |

---

## Cross-Reference Map

How configs reference each other:

```
heuristics.yaml
+-- SC_HE_001 -> veto_on_fail: SC_VC_002
+-- SC_HE_002 -> veto_on_fail: SC_VC_005
+-- SC_HE_003 -> veto_on_fail: SC_VC_007

axioma-validator.yaml
+-- D1_truthfulness -> maps_to_veto: SC_VC_003
+-- D1_truthfulness -> maps_to_veto: SC_VC_009

quality-gates.yaml
+-- QG-SC-3.1 -> checks: veto-conditions.yaml
+-- QG-SC-4.1 -> runs: coherence-validator.py
+-- QG-SC-4.2 -> uses: axioma-validator.yaml

validate-squad.md
+-- Phase 0 -> uses: squad-type-definitions.yaml
+-- Phase 1 -> runs: T1-CFG, T1-ENT, T1-REF, T1-XREF, T1-SEC
+-- Phase 2 -> runs: T2-COV, T2-ORP, T2-PHS, T2-DAT, T2-TOOL
+-- Phase 3 -> runs: T3-PQ, T3-PC, T3-CA, T3-DOC, T3-OPT
+-- Phase 4 -> runs: T4E-*, T4P-*, T4H-* (type-specific)
+-- Phase 5 -> checks: V1-V9, VE1-VE2, VP1-VP3, VH1-VH2
+-- Phase 6 -> formula: (Tier3 x 0.80) + (Tier4 x 0.20)
```

**Validation Command:**
```bash
python scripts/coherence-validator.py
```

---

## Usage in Workflows

### In wf-create-squad.yaml (v3.0)

```yaml
# Phase 0: Discovery
heuristic:
  id: SC_SCP_001  # Scope Complexity Gate (PRD Gate)
  blocking: true
  thresholds:
    workflows: ">= 10 -> PRD required"
    agents: ">= 8 -> PRD required"

# Phase 0 -> Phase 0.5 transition
heuristic: SC_HE_001
veto_check: SC_VC_001

# Phase 0.5: Deep Tool Discovery
heuristic: SC_TLD_001  # 5 parallel sub-agents
blocking: true

# Phase 2 -> Phase 3 transition
heuristic: SC_HE_002
veto_check: SC_VC_005

# Phase 3 sub-phases (DNA Extraction) [PRO]
sub_transitions:
  sources -> extraction:
    heuristic: AN_HE_003
    veto_check: [AN_VC_001, AN_VC_003]  # [PRO]
  extraction -> validation:
    heuristic: AN_HE_001
    veto_check: [AN_VC_002, AN_VC_004]  # [PRO]
  validation -> handoff:
    heuristic: AN_HE_002
    veto_check: AN_VC_005  # [PRO]

# Phase 5: Validation
heuristic: SC_HE_003
veto_check: [SC_VC_007, SC_VC_008, SC_VC_009, SC_VC_010]
quality_gates:
  - QG-SC-4.1  # Coherence Check
  - QG-SC-4.2  # Axioma Scoring
  - QG-SC-6.1  # Final Human Approval
```

### In create-squad.yaml (State Machine)

```yaml
# States: idle -> creating -> validating -> fix_cycle -> complete | failed
# Veto-controlled transitions:
creating -> validating:  SC_CRT_001
validating -> fix_cycle: score < 7.0 (VETO-SQD-002)
fix_cycle -> validating:  max_retries check
validating -> complete:   score >= 7.0 AND smoke_pass
any -> failed:            VETO-SQD-001 through VETO-SQD-005
```

### In Agent Definitions

```yaml
# In squad-chief.md or any agent
quality_standards:
  agents:
    required:
      - "voice_dna com signature phrases rastreaveis a [SOURCE:]"  # D1
      - "thinking_dna com heuristics que tem QUANDO usar"  # SC_HE_*
      - "3 smoke tests que PASSAM"  # SC_VC_006
      - "handoffs definidos"  # SC_HE_002
```

---

## Validation Report Example

```
======================================================================
COHERENCE VALIDATOR - Squad-Creator Configs
======================================================================
Config dir: /squads/squad-creator/config
Strict mode: False

CONFIGS LOADED:
  OK heuristics.yaml
  OK veto-conditions.yaml
  OK axioma-validator.yaml
  OK quality-gates.yaml
  OK task-anatomy.yaml

VALIDATIONS:
  OK heuristic_veto_coverage
      Heuristics with veto: 3/3
  OK axioma_threshold_coverage
      Dimensions defined: 10/10
  OK gate_reference_validity
      Invalid references found: 0
  OK veto_code_uniqueness
      Unique veto codes: 10, Duplicates: 0
  OK executor_consistency
      Valid executor types: ['Worker', 'Agent', 'Hybrid', 'Human']
  OK cross_reference_integrity
      Total unique IDs across configs: 53

======================================================================
STATUS: PASS
  Rules: 6 | Passed: 6 | Failed: 0 | Warnings: 0 | Skipped: 0
======================================================================
```

---

## Veto Condition Summary

| Source | Count | IDs | Availability |
|--------|-------|-----|-------------|
| create-squad.md task | 5 | VETO-SQD-001 to 005 | Base |
| validate-squad.md (universal) | 10 | SC_VC_000, V1-V9 | Base |
| validate-squad.md (Expert) | 2 | VE1-VE2 | Base |
| validate-squad.md (Pipeline) | 3 | VP1-VP3 | Base |
| validate-squad.md (Hybrid) | 2 | VH1-VH2 | Base |
| config/veto-conditions.yaml (process) | 10 | SC_VC_001 to 010 | [PRO] |
| config/veto-conditions.yaml (extraction) | 5 | AN_VC_001 to 005 | [PRO] |
| config/veto-conditions.yaml (methodology) | 3 | AN_VC_006 to 008 | [PRO] |
| **Total** | **40** | | Base: 22 / PRO: 18 |

---

*Pattern Library v4.0.0*
*Last Updated: 2026-03-06*
*Source: Squad-Creator Base + Pro consolidated*
