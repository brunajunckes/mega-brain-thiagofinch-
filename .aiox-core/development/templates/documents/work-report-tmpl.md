# Work Report Template

**Template ID:** work-report-tmpl
**Version:** 1.0
**Purpose:** Structured comment posted to ClickUp after completing work
**Used by:** All agents via Universal ClickUp Task Tracking Rule

---

## Full Report (Sprint Tasks, Feature Work)

```markdown
## Relatorio de Trabalho — {{AGENT_NAME}}
**Data:** {{DATE}}
**Sessao:** {{SESSION_DESCRIPTION}}

---

### O que foi feito
- {{ITEM_1}}
- {{ITEM_2}}
- {{ITEM_3}}

### Arquivos Alterados
| Arquivo | Acao | Descricao |
|---------|------|-----------|
| {{FILE_PATH_1}} | {{CREATED/MODIFIED/DELETED}} | {{BRIEF_DESCRIPTION}} |
| {{FILE_PATH_2}} | {{CREATED/MODIFIED/DELETED}} | {{BRIEF_DESCRIPTION}} |

### Decisoes Tomadas
| Decisao | Razao |
|---------|-------|
| {{DECISION_1}} | {{RATIONALE_1}} |

### Tempo Estimado
~{{HOURS}}h{{MINUTES}}min

### Proximos Passos
- [ ] {{NEXT_STEP_1}}
- [ ] {{NEXT_STEP_2}}

### Bloqueios
{{NONE_OR_DESCRIPTION}}

---
_Gerado por {{AGENT_NAME}} via AIOS em {{TIMESTAMP}}_
```

---

## Minimal Report (Quick Tasks, Bug Fixes)

```markdown
## Relatorio — {{AGENT_NAME}} ({{DATE}})

**Feito:** {{ONE_LINE_SUMMARY}}
**Arquivos:** {{FILE_LIST_COMMA_SEPARATED}}
**Tempo:** ~{{MINUTES}}min
**Proximo:** {{NEXT_STEP_OR_NONE}}
```

---

## Usage Guide

### When to Use Full vs Minimal

| Scenario | Template |
|----------|----------|
| Sprint task (estimated >3 pts) | Full |
| Feature implementation | Full |
| Multi-file changes | Full |
| Bug fix (<1h) | Minimal |
| Config change | Minimal |
| Single-file edit | Minimal |

### Placeholder Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{AGENT_NAME}}` | Active agent persona | `@dev (Dex)` |
| `{{DATE}}` | Current date | `2026-02-24` |
| `{{SESSION_DESCRIPTION}}` | Brief session context | `Implementacao LP Decifrando` |
| `{{ITEM_N}}` | Work item completed | `Criou componente Hero section` |
| `{{FILE_PATH_N}}` | Relative file path | `src/components/Hero.tsx` |
| `{{HOURS}}` | Estimated hours | `2` |
| `{{MINUTES}}` | Estimated minutes | `30` |
| `{{NEXT_STEP_N}}` | Actionable next step | `Integrar com API de checkout` |
| `{{TIMESTAMP}}` | ISO timestamp | `2026-02-24T15:30:00Z` |

### Rules for Good Reports

1. **Be specific** — "Criou Hero.tsx com CTA e animacao" > "Trabalhou no frontend"
2. **List ALL files** — Even if trivial, list every file touched
3. **Honest time estimates** — Round to nearest 15min
4. **Actionable next steps** — Each item should be doable as a standalone task
5. **Flag blockers immediately** — Don't wait for the report to mention blockers

---

_Template Version: 1.0_
_Created: 2026-02-24_
