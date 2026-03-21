# Task: Board Status via ClickUp

**Task ID:** clickup-board-status
**Version:** 1.0
**Purpose:** Show current Sprint Board status from ClickUp data
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Autonomous

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `client_tag` | string | No | Filter by client | `"SIDERAL"` |
| `list_id` | string | No | Specific list | `"901325668059"` |

---

## Steps

### Step 1: Fetch All Active Tasks

```yaml
action:
  tool: clickup_mcp
  operation: get_tasks
  params:
    list_id: '{resolve from context}'
    # No status filter — get ALL to show full board
```

### Step 2: Group by Status

```yaml
analysis:
  group_tasks_by_status:
    - 'a fazer / to do'
    - 'em progresso / in progress'
    - 'em revisao / in review'
    - 'bloqueado / blocked'
    - 'concluido / complete'

  per_column:
    - count tasks
    - sum sprint points
    - list task names with assignees
```

### Step 3: Calculate Metrics

```yaml
metrics:
  total_tasks: '{count all}'
  total_points: '{sum all points}'
  done_tasks: '{count concluido}'
  done_points: '{sum concluido points}'
  progress_pct: '{done_tasks / total_tasks × 100}'
  points_pct: '{done_points / total_points × 100}'
  blocked_count: '{count bloqueado}'
  burndown_status: 'on track / behind / ahead'
```

### Step 4: Present Board

```yaml
output: |
  ## Board — {client_name} (Sprint Atual)

  | A Fazer ({n1}) | Em Progresso ({n2}) | Em Revisão ({n3}) | Bloqueado ({n4}) | Concluído ({n5}) |
  |----------------|---------------------|--------------------|--------------------|-------------------|
  {column_items}

  **Progresso:** {done_tasks}/{total_tasks} tasks ({progress_pct}%) | {done_points}/{total_points} pts ({points_pct}%)
  **Bloqueados:** {blocked_count} tasks
  **Burndown:** {burndown_emoji} {burndown_status}

  {if_blocked: '⚠️ Tasks bloqueadas: {blocked_list}'}
  {if_overdue: '🔴 Tasks atrasadas: {overdue_list}'}
```

---

## Veto Conditions

- condition: 'Lista nao encontrada no ClickUp'
  action: 'VETO - Lista invalida'
  reason: 'Verificar workspace map'

---

## Completion Criteria

- [ ] Todas as tasks da lista carregadas
- [ ] Agrupamento por status correto
- [ ] Metricas calculadas (progress %, points %)
- [ ] Board visual apresentado
- [ ] Bloqueios e atrasos destacados

---

_Task Version: 1.0_
_Created: 2026-02-24_
