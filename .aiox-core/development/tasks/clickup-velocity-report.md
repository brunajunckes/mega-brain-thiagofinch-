# Task: Velocity Report via ClickUp

**Task ID:** clickup-velocity-report
**Version:** 1.0
**Purpose:** Calculate team velocity from historical sprint data
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Autonomous

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `client_tag` | string | No | Filter by client | `"SIDERAL"` |
| `sprints_count` | number | No | Number of sprints to analyze (default: 5) | `5` |

---

## Steps

### Step 1: Fetch Historical Sprint Data

```yaml
action:
  for_each_sprint_tag:
    tool: clickup_mcp
    operation: get_tasks
    params:
      list_id: '{resolve from context}'
      tags: ['{sprint_tag}']
    extract:
      - total_points_committed
      - total_points_delivered
      - tasks_count
      - start_date
      - end_date
```

### Step 2: Calculate Velocity Metrics

```yaml
analysis:
  per_sprint:
    velocity: 'delivered points'
    commitment_ratio: 'delivered / committed × 100'

  aggregate:
    avg_velocity: 'mean of last N sprints'
    velocity_trend: 'increasing / decreasing / stable'
    best_sprint: 'highest velocity'
    worst_sprint: 'lowest velocity'
    variance: 'standard deviation'
    predictive_capacity: 'avg_velocity ± variance'
```

### Step 3: Generate Report

```yaml
output:
  template: 'templates/velocity-report-tmpl.md'
  format: |
    ## Velocity Report — {client_name}
    **Período:** Últimas {sprints_count} sprints

    ### Velocidade por Sprint
    | Sprint | Comprometido | Entregue | Velocity | Ratio |
    |--------|-------------|----------|----------|-------|
    {sprint_rows}

    ### Resumo
    - **Velocidade Média:** {avg_velocity} pts/sprint
    - **Tendência:** {trend_emoji} {trend}
    - **Melhor Sprint:** {best} ({best_velocity} pts)
    - **Pior Sprint:** {worst} ({worst_velocity} pts)
    - **Capacidade Preditiva:** {avg - variance} a {avg + variance} pts

    ### Recomendação para Próximo Sprint
    - **Comprometer:** {recommended_commitment} pts (baseado em {avg_velocity})
    - **Máximo seguro:** {max_safe} pts (90% confidence)

    {if_trend_down: '⚠️ Velocity em queda — investigar na retrospectiva'}
    {if_high_variance: '⚠️ Alta variabilidade — melhorar estimativas'}
```

---

## Veto Conditions

- condition: 'Menos de 2 sprints com dados'
  action: 'WARNING - Dados insuficientes para tendencia confiavel'
  reason: 'Velocity precisa de historico para ser preditiva'

---

## Completion Criteria

- [ ] Dados de sprints historicos coletados
- [ ] Velocity por sprint calculada
- [ ] Media e tendencia calculadas
- [ ] Capacidade preditiva estimada
- [ ] Recomendacao para proximo sprint

---

_Task Version: 1.0_
_Created: 2026-02-24_
