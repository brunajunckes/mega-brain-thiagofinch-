# Task: Daily Standup via ClickUp

**Task ID:** clickup-daily-standup
**Version:** 1.0
**Purpose:** Run async Daily Scrum by analyzing task status in ClickUp
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Autonomous

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `client_tag` | string | No | Filter by client (default: all) | `"SIDERAL"` |
| `sprint_tag` | string | No | Filter by sprint tag | `"sprint-1"` |

---

## Steps

### Step 1: Fetch In-Progress Tasks

```yaml
action:
  tool: clickup_mcp
  operation: get_tasks
  params:
    list_id: '{resolve from context}'
    statuses: ['em progresso', 'in progress']
    include_subtasks: true
```

### Step 2: Fetch Blocked Tasks

```yaml
action:
  tool: clickup_mcp
  operation: get_tasks
  params:
    list_id: '{resolve from context}'
    statuses: ['bloqueado', 'blocked']
```

### Step 3: Identify Stale Tasks

```yaml
analysis:
  for_each_in_progress_task:
    - check: 'last_updated > 24h ago'
    - if_stale: flag as '⚠️ sem update > 24h'
  for_each_task:
    - check: 'due_date < today AND status != concluido'
    - if_overdue: flag as '🔴 atrasada'
```

### Step 4: Fetch Completed Today

```yaml
action:
  tool: clickup_mcp
  operation: get_tasks
  params:
    list_id: '{resolve from context}'
    statuses: ['concluido', 'complete']
    date_updated_gt: '{today_start_timestamp}'
```

### Step 5: Generate Daily Report

```yaml
output:
  format: |
    ## Daily Scrum — {date} ({day_of_week})
    **Sprint:** {sprint_name} | **Dia {day_number}/{total_days}**

    ### Por Membro
    {for_each_assignee}
    **{name}:** {status_emoji} {task_name} ({status}) | Hoje: {next_action}
    {/for_each}

    ### Metricas
    - Concluido: {done_points}/{total_points} pts ({percent}%) — esperado: {expected}% → {trend_emoji}
    - Bloqueados: {blocked_count} tasks
    - Sem update > 24h: {stale_count} tasks
    - Atrasadas: {overdue_count} tasks

    ### Impedimentos
    {impediments_or_'Nenhum impedimento identificado'}

    → {recommendation}
```

---

## Veto Conditions

- condition: 'Nenhuma task encontrada na sprint'
  action: 'VETO - Nao ha sprint ativa para reportar'
  reason: 'Daily Scrum requer sprint em andamento'

---

## Completion Criteria

- [ ] Status de cada membro reportado
- [ ] Impedimentos listados (ou 'nenhum')
- [ ] Metricas de progresso calculadas
- [ ] Tarefas stale/overdue identificadas

---

_Task Version: 1.0_
_Created: 2026-02-24_
