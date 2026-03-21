# Task: Sprint Review via ClickUp

**Task ID:** clickup-sprint-review
**Version:** 1.0
**Purpose:** Generate Sprint Review report from ClickUp data
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Autonomous with elicit for feedback

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `client_tag` | string | No | Filter by client | `"SIDERAL"` |
| `sprint_tag` | string | Yes | Sprint identifier | `"sprint-1"` |

---

## Steps

### Step 1: Fetch All Sprint Tasks

```yaml
action:
  tool: clickup_mcp
  operation: get_tasks
  params:
    list_id: '{resolve from context}'
    tags: ['{sprint_tag}']
```

### Step 2: Categorize Results

```yaml
analysis:
  completed: 'tasks with status concluido/complete'
  not_completed: 'tasks with any other status'
  carried_over: 'tasks that will move to next sprint'

  metrics:
    committed_points: 'sum of all sprint task points'
    delivered_points: 'sum of completed task points'
    completion_rate: 'delivered / committed × 100'
    velocity: 'delivered_points (this is THE velocity data point)'
```

### Step 3: Compare with Previous Sprint

```yaml
comparison:
  if_previous_velocity_available:
    - trend: 'up / down / stable'
    - delta: 'points difference'
    - insight: 'what contributed to change'
```

### Step 4: Generate Review Report

```yaml
output:
  template: 'templates/sprint-review-tmpl.md'
  format: |
    ## Sprint Review — {client_name} ({sprint_tag})
    **Sprint Goal:** {sprint_goal}
    **Período:** {start_date} → {end_date}

    ### Resultado
    - **Comprometido:** {committed_points} pts ({committed_tasks} tasks)
    - **Entregue:** {delivered_points} pts ({delivered_tasks} tasks)
    - **Completude:** {completion_rate}%
    - **Velocity:** {velocity} pts

    ### Items Concluídos
    | Task | Assignee | Points | Status |
    |------|----------|--------|--------|
    {completed_rows}

    ### Items Não Concluídos
    | Task | Assignee | Points | Razão |
    |------|----------|--------|-------|
    {not_completed_rows}

    ### Velocity Trend
    {sprint_n-2}: {v1} pts → {sprint_n-1}: {v2} pts → {sprint_n}: {v3} pts
    Tendência: {trend_emoji} {trend_description}

    ### Adaptações para Próxima Sprint
    {recommendations}
```

### Step 5: Collect Stakeholder Feedback (Elicit)

```yaml
elicit: true
prompt: |
  Sprint Review gerado acima.

  Algum feedback dos stakeholders para registrar?
  (Digite feedback ou 'skip' para pular)
```

---

## Veto Conditions

- condition: 'Sprint tag nao encontrada no ClickUp'
  action: 'VETO - Sprint nao existe'
  reason: 'Nao é possivel fazer review de sprint inexistente'

---

## Completion Criteria

- [ ] Todas as tasks da sprint categorizadas
- [ ] Velocity calculado
- [ ] Completion rate calculado
- [ ] Items nao-concluidos documentados com razao
- [ ] Report apresentado

---

_Task Version: 1.0_
_Created: 2026-02-24_
