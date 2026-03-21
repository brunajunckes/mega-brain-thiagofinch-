# Task: Sprint Retrospective via ClickUp

**Task ID:** clickup-retrospective
**Version:** 1.0
**Purpose:** Facilitate Sprint Retrospective and create action items in ClickUp
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Interactive (elicit: true)

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `sprint_tag` | string | Yes | Sprint to retrospect | `"sprint-1"` |
| `list_id` | string | No | Where to create action items | `"901325668052"` |

---

## Steps

### Step 1: Gather Sprint Data

```yaml
action:
  - fetch_sprint_metrics: 'from sprint-review data'
  - fetch_blocked_history: 'tasks that were blocked during sprint'
  - fetch_overdue_history: 'tasks that missed due dates'
  - fetch_scope_changes: 'tasks added/removed mid-sprint'
```

### Step 2: Present Data & Elicit "What Went Well" (Keep)

```yaml
elicit: true
prompt: |
  ## Retrospectiva — {sprint_tag}

  **Dados da Sprint:**
  - Velocity: {velocity} pts | Completude: {completion}%
  - Bloqueios: {blocked_count} | Atrasados: {overdue_count}
  - Mudancas de escopo: {scope_changes}

  **O que deu certo nesta sprint?** (Keep)
  Liste itens positivos (1 por linha):
```

### Step 3: Elicit "What Can Improve" (Improve)

```yaml
elicit: true
prompt: |
  **O que pode melhorar?** (Improve)
  Liste problemas ou oportunidades de melhoria (1 por linha):
```

### Step 4: Elicit Action Items

```yaml
elicit: true
prompt: |
  Com base no que pode melhorar, quais acoes concretas vamos tomar?

  Para cada acao, informe:
  - Descricao da acao
  - Responsavel (Fernando / Gabriel / Karol)
  - Prazo (proximo sprint ou data especifica)

  Formato: "Acao | Responsavel | Prazo"
```

### Step 5: Create Action Items in ClickUp

```yaml
for_each_action_item:
  tool: clickup_mcp
  operation: create_task
  params:
    list_id: '{list_id or planejamento list}'
    name: '[RETRO] {action_description}'
    description: |
      **Origem:** Retrospectiva {sprint_tag}
      **Ação:** {action_description}
      **Contexto:** {improve_item_related}
    assignees: ['{assignee_id}']
    priority: 3  # Normal
    tags: ['retro', '{sprint_tag}']
```

### Step 6: Generate Retrospective Document

```yaml
output:
  template: 'templates/retrospective-tmpl.md'
  format: |
    ## Retrospectiva — {sprint_tag} ({date})

    ### O que deu certo (Keep)
    {keep_items_as_bullets}

    ### O que pode melhorar (Improve)
    {improve_items_as_bullets}

    ### Ações (Action Items)
    | Ação | Responsável | Prazo | ClickUp ID |
    |------|-------------|-------|------------|
    {action_items_rows}

    ### Métricas da Sprint
    - Velocity: {velocity} pts
    - Completude: {completion}%
    - Satisfação do time: {satisfaction_if_collected}
```

---

## Veto Conditions

- condition: 'Nenhum item "keep" E nenhum item "improve" fornecido'
  action: 'VETO - Retrospectiva vazia nao gera valor'
  reason: 'Scrum Guide: retro deve identificar mudancas para melhorar eficacia'

- condition: 'Items "improve" sem action items'
  action: 'WARNING - Melhorias sem acoes nao viram realidade'
  reason: 'Action items convertem insights em mudanca concreta'

---

## Completion Criteria

- [ ] Ao menos 1 "keep" identificado
- [ ] Ao menos 1 "improve" identificado
- [ ] Action items criados como tasks no ClickUp
- [ ] Documento de retrospectiva gerado
- [ ] Tags 'retro' aplicadas nos action items

---

_Task Version: 1.0_
_Created: 2026-02-24_
