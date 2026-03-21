# Task: Sync Notion → ClickUp

**Task ID:** clickup-sync-notion
**Version:** 1.0
**Purpose:** Read prompt from Notion page and execute it in ClickUp context
**Orchestrator:** @clickup-scrum (Sprint)
**Mode:** Interactive

---

## Inputs

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `notion_url` | string | Yes | Notion page URL | `"https://notion.so/..."` |

---

## Steps

### Step 1: Fetch Notion Page Content

```yaml
action:
  tool: notion_mcp
  operation: notion-fetch
  params:
    id: '{notion_url}'
  extract:
    title: 'page title'
    content: 'page markdown content'
```

### Step 2: Parse Instructions

```yaml
analysis:
  identify:
    - action_type: 'What to do (create, update, report, plan)'
    - target: 'Which client/list/tasks'
    - parameters: 'Specific values mentioned'
    - constraints: 'Any limitations or conditions'

  validate:
    - 'Instructions are clear and actionable'
    - 'Target client/list can be resolved'
    - 'No destructive operations without explicit confirmation'
```

### Step 3: Present Interpreted Instructions (Confirm)

```yaml
elicit: true
prompt: |
  ## Prompt do Notion: "{page_title}"

  **Interpretação:**
  - Ação: {action_type}
  - Alvo: {target}
  - Parâmetros: {parameters}

  **Ações que vou executar:**
  {numbered_list_of_actions}

  Confirmar execução? (sim / nao / ajustar)
```

### Step 4: Execute Actions

```yaml
execute:
  for_each_action:
    - map_to_clickup_operation
    - execute_via_mcp_or_api
    - log_result
    - handle_errors
```

### Step 5: Report Results

```yaml
output: |
  ## Execução do Prompt Notion
  **Fonte:** {page_title} ({notion_url})

  ### Ações Executadas
  {for_each_action}
  {status_emoji} {action_description} → {result}
  {/for_each}

  ### Resumo
  - Sucesso: {success_count}/{total_count}
  - Falhas: {failure_count} {if_failures: '(detalhes acima)'}
```

---

## Veto Conditions

- condition: 'Pagina do Notion vazia ou sem instrucoes claras'
  action: 'VETO - Nao ha prompt para executar'
  reason: 'Pagina precisa conter instrucoes actionable'

- condition: 'Instrucoes incluem delete/bulk operations sem confirmacao'
  action: 'HALT - Confirmar operacoes destrutivas'
  reason: 'Seguranca: operacoes destrutivas requerem confirmacao explicita'

---

## Completion Criteria

- [ ] Pagina do Notion lida com sucesso
- [ ] Instrucoes interpretadas e confirmadas pelo usuario
- [ ] Acoes executadas no ClickUp
- [ ] Resultados reportados

---

_Task Version: 1.0_
_Created: 2026-02-24_
