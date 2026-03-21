# Task: Backlog Grooming via ClickUp

**Task ID:** clickup-backlog-grooming
**Version:** 1.0
**Purpose:** Refine Product Backlog: prioritize, estimate, and break down items
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Interactive (elicit: true)

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `client_tag` | string | No | Filter by client | `"SIDERAL"` |
| `list_id` | string | No | Specific list to groom | `"901325668059"` |

---

## Steps

### Step 1: Load Current Backlog

```yaml
action:
  tool: clickup_mcp
  operation: get_tasks
  params:
    list_id: '{list_id or resolve from client}'
    statuses: ['a fazer', 'to do']
    order_by: 'priority'
```

### Step 2: Present Backlog Status

```yaml
present:
  format: |
    ## Backlog — {client_name}
    **Total items:** {count} | **Estimados:** {estimated_count} | **Sem estimativa:** {unestimated_count}

    | # | Task | Priority | Points | Assignee | Status |
    |---|------|----------|--------|----------|--------|
    {rows}

    **Issues detectados:**
    {list: tasks sem descricao, sem assignee, sem estimativa, > 13 pontos}
```

### Step 3: Refine Items (Elicit per item)

```yaml
elicit: true
prompt: |
  Selecione items para refinar (numeros separados por virgula):

  Para cada item selecionado, vou perguntar:
  1. Estimativa em sprint points (Fibonacci: 1,2,3,5,8,13)
  2. Prioridade (1=urgente, 2=alta, 3=normal, 4=baixa)
  3. Precisa quebrar em subtasks? (se > 8 pontos)
  4. Acceptance criteria (para criar checklist)
```

### Step 4: Break Down Large Items

```yaml
for_large_items:  # points > 8
  elicit: true
  prompt: |
    Item "{task_name}" tem {points} pontos — muito grande para 1 sprint.

    Sugiro quebrar em:
    {auto_suggestions based on description}

    Aceitar sugestoes ou definir manualmente?

  actions:
    - Create subtasks or new tasks in ClickUp
    - Update original task as epic/parent
    - Set dependencies between sub-items
```

### Step 5: Update Tasks in ClickUp

```yaml
for_each_refined_item:
  tool: clickup_mcp
  operation: update_task
  params:
    task_id: '{task_id}'
    priority: '{new_priority}'
    # Sprint points via API if MCP supports

  if_has_acceptance_criteria:
    tool: clickup_mcp
    operation: create_checklist
    params:
      task_id: '{task_id}'
      name: 'Acceptance Criteria'
    then_add_items: true
```

### Step 6: Present Refined Backlog

```yaml
output: |
  ## Backlog Refinado — {client_name}
  **Refinados:** {refined_count} items
  **Quebrados:** {broken_down_count} items
  **Estimados:** {newly_estimated_count} items

  ### Top 10 (prontos para sprint)
  | # | Task | Points | Priority | Ready? |
  |---|------|--------|----------|--------|
  {top_10_rows}

  ### Ainda precisam de refinamento
  {items_needing_more_work}
```

---

## Veto Conditions

- condition: 'Backlog vazio (0 items)'
  action: 'VETO - Nao ha items para refinar'
  reason: 'Criar items no backlog antes de refinar'

---

## Completion Criteria

- [ ] Backlog apresentado com status de cada item
- [ ] Items selecionados refinados (estimativa + prioridade)
- [ ] Items grandes (> 8pts) quebrados em menores
- [ ] Acceptance criteria adicionados como checklists
- [ ] Tasks atualizadas no ClickUp

---

_Task Version: 1.0_
_Created: 2026-02-24_
