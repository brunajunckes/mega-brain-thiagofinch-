# Task: Create Task in ClickUp

**Task ID:** clickup-create-task
**Version:** 1.0
**Purpose:** Create a task in ClickUp with full Scrum metadata
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Interactive (elicit: true)

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `task_name` | string | Yes | Task title | `"Configurar ManyChat"` |
| `list_id` | string | No | Target list (resolved from context) | `"901325668059"` |
| `client_tag` | string | No | Client tag | `"SIDERAL"` |

---

## Steps

### Step 1: Elicit Task Details

```yaml
elicit: true
prompt: |
  Criando task no ClickUp. Preencha:

  1. **Nome:** {pre-filled if provided}
  2. **Descrição:** (o que precisa ser feito)
  3. **Lista:** {suggest based on client/context}
  4. **Responsável:** Fernando / Gabriel / Karol / Diego
  5. **Prioridade:** Urgente (1) / Alta (2) / Normal (3) / Baixa (4)
  6. **Sprint Points:** 1 / 2 / 3 / 5 / 8 / 13
  7. **Cliente:** SIDERAL / CARACOL / LEVEE / JUBILEU INTERNAL
  8. **Due Date:** (opcional, formato YYYY-MM-DD)
  9. **Acceptance Criteria:** (opcional, 1 por linha)
```

### Step 2: Validate Inputs

```yaml
validation:
  - check: 'list_id exists and is valid'
  - check: 'status is valid for target list'
  - check: 'assignee is valid member'
  - check: 'priority is 1-4'
  - check: 'sprint points in Fibonacci (1,2,3,5,8,13,21)'
```

### Step 3: Create Task

```yaml
action:
  tool: clickup_mcp
  operation: create_task
  params:
    list_id: '{list_id}'
    name: '{task_name}'
    description: '{description}'
    assignees: ['{assignee_id}']
    priority: '{priority}'
    due_date: '{due_date_timestamp}'
    tags: ['{sprint_tag_if_in_sprint}']
    custom_fields:
      - id: 'cc045f42-056d-4e1b-9bc4-8cbc2699370e'
        value: '{client_option_id}'
```

### Step 4: Add Acceptance Criteria (if provided)

```yaml
if_criteria_provided:
  tool: clickup_mcp
  operation: create_checklist
  params:
    task_id: '{new_task_id}'
    name: 'Acceptance Criteria'
  then:
    for_each_criterion:
      operation: create_checklist_item
      params:
        checklist_id: '{checklist_id}'
        name: '{criterion}'
```

### Step 5: Confirm Creation

```yaml
output: |
  Task criada com sucesso!

  **{task_name}**
  - ID: {task_id}
  - Lista: {list_name}
  - Responsável: {assignee_name}
  - Prioridade: {priority_label}
  - Points: {sprint_points}
  - Cliente: {client_tag}
  - Due Date: {due_date or 'não definido'}
  - Criteria: {criteria_count} items (checklist criada)
```

---

## Veto Conditions

- condition: 'Task sem nome'
  action: 'VETO - Task precisa de nome'
  reason: 'Tasks sem nome nao sao rastreáveis'

- condition: 'Lista invalida ou nao encontrada'
  action: 'VETO - Lista nao existe no ClickUp'
  reason: 'Verificar workspace map para IDs corretos'

---

## Completion Criteria

- [ ] Task criada no ClickUp com ID confirmado
- [ ] Assignee definido
- [ ] Prioridade definida
- [ ] Cliente tagueado
- [ ] Acceptance criteria como checklist (se fornecido)

---

_Task Version: 1.0_
_Created: 2026-02-24_
