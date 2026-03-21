# Task: Sprint Planning via ClickUp

**Task ID:** clickup-sprint-planning
**Version:** 1.0
**Purpose:** Facilitate Sprint Planning ceremony and create Sprint Backlog in ClickUp
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Interactive (elicit: true)

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `client_tag` | string | Yes | Client filter (SIDERAL, CARACOL, LEVEE, JUBILEU INTERNAL) | `"SIDERAL"` |
| `sprint_duration` | string | No | Sprint length (default: 1 week) | `"1 week"` |
| `sprint_start` | string | No | Start date (default: next Monday) | `"2026-03-03"` |

---

## Steps

### Step 1: Load Workspace Context

**Action:** Read current backlog from ClickUp

```yaml
actions:
  - tool: clickup_mcp
    operation: get_tasks
    params:
      list_id: '{resolve from client_tag → key_lists mapping}'
      statuses: ['a fazer', 'to do']
      order_by: 'priority'
  - tool: memory
    read: 'docs/clickup-workspace-map.md'
    extract: 'list IDs, statuses, custom fields for client'
```

**Output:** Backlog items with priorities, points, assignees

### Step 2: Define Sprint Goal (Elicit)

**Action:** Ask user for Sprint Goal

```yaml
elicit: true
prompt: |
  Backlog carregado ({N} items).

  Top 5 items por prioridade:
  {list top 5 with name, priority, points}

  Qual o Sprint Goal para esta sprint?
  (Ex: "Lançar campanha Spoiler Semanal #2" ou "Finalizar 20 posts Caracol")
```

**Veto Condition:**
- condition: 'Sprint Goal vazio ou generico (ex: "fazer coisas")'
  action: 'VETO - Sprint sem goal claro nao tem direcao'
  reason: 'Scrum Guide: Sprint Goal comunica porque a Sprint é valiosa'

### Step 3: Select Sprint Backlog Items (Elicit)

**Action:** Present backlog items for selection

```yaml
elicit: true
prompt: |
  Sprint Goal: "{sprint_goal}"
  Capacidade estimada: {team_size × 5 dias} pontos
  Velocity anterior: {last_velocity} pontos (se disponivel)

  Selecione items para esta sprint (numeros separados por virgula):
  {numbered list of backlog items with points and priority}

  Ou digite 'auto' para selecao automatica por prioridade.
```

**Auto-selection logic:**
```yaml
auto_select:
  - Sort by priority (1=urgente first)
  - Fill until capacity reached (velocity-based or estimate)
  - Never exceed 120% of last velocity
  - Warn if > 80% capacity used
```

### Step 4: Create Tasks in ClickUp

**Action:** Create/move tasks into sprint

```yaml
for_each_selected_item:
  - if_new_task:
      tool: clickup_mcp
      operation: create_task
      params:
        list_id: '{target_list_id}'
        name: '{task_name}'
        description: '{task_description}'
        assignees: ['{assignee_id}']
        priority: '{priority_1_to_4}'
        start_date: '{sprint_start_timestamp}'
        due_date: '{sprint_end_timestamp}'
        tags: ['sprint-{sprint_number}']
        custom_fields:
          - id: 'cc045f42-056d-4e1b-9bc4-8cbc2699370e'
            value: '{client_option_id}'

  - if_existing_task:
      tool: clickup_mcp
      operation: update_task
      params:
        task_id: '{task_id}'
        start_date: '{sprint_start_timestamp}'
        due_date: '{sprint_end_timestamp}'
        tags: ['sprint-{sprint_number}']
```

### Step 5: Add Acceptance Criteria as Checklists

**Action:** For each task, add acceptance criteria

```yaml
for_each_task_with_criteria:
  tool: clickup_mcp
  operation: create_checklist
  params:
    task_id: '{task_id}'
    name: 'Acceptance Criteria'
  then:
    for_each_criterion:
      tool: clickup_mcp
      operation: create_checklist_item
      params:
        checklist_id: '{checklist_id}'
        name: '{criterion_text}'
```

### Step 6: Present Sprint Summary

**Action:** Output formatted sprint plan

```yaml
output:
  format: |
    ## Sprint Planning — {client_name}
    **Sprint Goal:** {sprint_goal}
    **Duração:** {start_date} → {end_date} ({duration})
    **Capacidade:** {capacity} pontos | **Comprometido:** {committed} pontos

    ### Sprint Backlog
    | # | Task | Assignee | Points | Priority | ClickUp ID |
    |---|------|----------|--------|----------|------------|
    {rows}

    **Risco:** {risk_assessment}
    → {N} tasks criadas/atualizadas no ClickUp
```

---

## Veto Conditions

- condition: 'Sprint Goal nao definido'
  action: 'VETO - Nao criar sprint sem goal'
  reason: 'Scrum Guide: Sprint Goal é o unico objetivo da Sprint'

- condition: 'Nenhum item selecionado para sprint'
  action: 'VETO - Sprint vazio nao tem sentido'
  reason: 'Sprint Backlog precisa de items para gerar incremento'

- condition: 'Pontos comprometidos > 150% velocity anterior'
  action: 'WARNING - Over-commitment detectado'
  reason: 'Velocity historica deve guiar planejamento, nao otimismo'

---

## Completion Criteria

- [ ] Sprint Goal definido e claro
- [ ] Items selecionados com sprint points
- [ ] Tasks criadas/atualizadas no ClickUp com assignees
- [ ] Start/due dates da sprint definidos
- [ ] Cliente tagueado em todas as tasks
- [ ] Summary apresentado ao usuario

---

_Task Version: 1.0_
_Created: 2026-02-24_
