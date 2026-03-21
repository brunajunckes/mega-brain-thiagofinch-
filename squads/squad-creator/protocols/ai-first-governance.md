# AI-First Governance Protocol (Squad Creator)

## Objective

Ensure squads are created with reliable, auditable behavior while avoiding unnecessary CI blocking.

## Core Rules

1. Canonical Source Hierarchy
- `squads/{squad}/config.yaml` and `squads/{squad}/squad.yaml` define structure truth.
- `squads/{squad}/agents/*`, `tasks/*`, `workflows/*` define operational truth.
- `squads/{squad}/data/*` is reference truth for frameworks/checklists.
- `docs/research/*` is supporting evidence only, never final source of truth.

2. Evidence Contract
- Every important recommendation must include:
  - evidence source path
  - status (`implemented`, `partial`, `concept`)
  - explicit unresolved items

3. Contradiction Guard
- Never claim completion when dependencies are `partial` or `concept`.
- If artifacts conflict, prefer canonical source hierarchy and log conflict.

4. Research-to-Execution Handshake
- Always map `Existing -> Gap -> Decision` before creation or migration.
- If confidence is low, mark as `assumption`.

5. No Name-Only Inference (Critical)
- Never infer squad/domain scope from name alone (e.g., slug, shorthand, alias).
- Before recommendations, resolve scope from canonical artifacts (`squad.yaml`, `config.yaml`, agent/task/workflow files, registry entries).
- If canonical scope is missing or conflicting, halt recommendation flow and ask clarification first.

## CI Caution Policy (Minimal by Design)

Use CI as blocking only for deterministic checks:
- YAML/JSON syntax
- broken file references
- secrets/security scanning
- required file presence

Do NOT block CI for subjective/semantic quality checks:
- strategy quality
- writing style
- routing judgment
- architecture taste decisions

These semantic checks must be enforced in agent/task/workflow checkpoints.

## Required Output Block

```yaml
governance_check:
  protocol: squads/squad-creator/protocols/ai-first-governance.md
  canonical_sources_checked:
    - path: ""
      status: "implemented|partial|concept"
  evidence:
    - claim: ""
      source: ""
  contradictions_found: []
  unresolved_items: []
```
