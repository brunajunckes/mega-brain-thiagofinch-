---
paths: **/*
---

# Universal ClickUp Task Tracking Rule

**Rule ID:** clickup-task-tracking
**Version:** 1.0
**Applies to:** ALL agents (@dev, @qa, @architect, @pm, @po, @sm, @analyst, @devops, @data-engineer, @ux-design-expert, @aios-master)
**Priority:** HIGH — This rule overrides agent-specific behavior for tracking purposes.

---

## Tracking Threshold

### MUST Track (always)
- Work estimated >15 minutes
- Code changes (new files, edits, refactors)
- Deploys or infrastructure changes
- Content creation (copy, designs, docs for clients)
- Campaign actions (publish, schedule, configure)
- Any work referencing an existing ClickUp task ID
- Sprint-related work

### MAY Skip (no tracking required)
- Typo fixes (<5 min)
- Exploratory research / codebase browsing
- AIOS internal config changes (rules, templates, checklists)
- User explicitly says: "sem clickup", "skip clickup", "no tracking", "quick fix"
- Answering questions without producing deliverables

---

## Phase 1 — Pre-Execution (Before Starting Work)

### Step 1: Evaluate Trackability
Assess if the work meets the "MUST Track" threshold above. If not, proceed without tracking.

### Step 2: Link to Existing Task
- **If user provides a task ID** (e.g., `86afp0pyc`):
  ```
  get_task_details(task_id)
  ```
  Confirm the task exists and is relevant. Store the ID for the session.

- **If no task ID provided**:
  Identify the most likely list based on work type (see List Mapping below).
  ```
  get_tasks(list_id) — search by keywords in task names
  ```

- **If matching task found**: Confirm with user: "Encontrei task [NAME] ([ID]). Linkar a este trabalho?"

- **If no task found**: Ask user: "Nao encontrei task no ClickUp para este trabalho. Criar uma nova?"

### Step 3: Create Task (if needed) — MTQS-Lite
When creating a new task, use this simplified quality standard:

**Required fields:**
- `name`: Clear, actionable title
- `list_id`: Correct list for work type (see mapping)
- `description`: 2-3 sentences of context + objective
- `assignees`: User IDs of people doing the work
- `priority`: 1=Urgent, 2=High, 3=Normal, 4=Low
- `status`: Set to initial status of the target list

**Recommended fields (add when available):**
- `due_date`: Deadline in Unix ms
- `tags`: Client tag, sprint tag, epic tag (via curl API)
- Custom field "Cliente" (via curl API)
- Checklist "Acceptance Criteria"

### Step 4: Update Status to In Progress
```
update_task(task_id, { status: "em progresso" })
```
> Note: Status names vary by list. Always check the list's valid statuses first.

---

## Phase 2 — During Execution

### Track Changes
Maintain an internal list throughout the session:
- Files created/modified/deleted
- Key decisions made and rationale
- Dependencies discovered
- Blockers encountered

### Report Blockers Immediately
If a blocker is found during execution:
```
create_task_comment(task_id, comment_text: "BLOQUEIO: [description]. Acao necessaria: [what's needed].")
```

### Update Checklist Items
If the task has a checklist, mark items as completed when done:
```
update_checklist_item(checklist_id, checklist_item_id, { resolved: true })
```

---

## Phase 3 — Post-Execution (Work Report)

### Post Structured Comment
After completing work, post a report using `create_task_comment`:

```markdown
## Relatorio de Trabalho — {{AGENT_NAME}}
**Data:** {{DATE}}

### O que foi feito
- [bullet point 1]
- [bullet point 2]
- [bullet point 3]

### Arquivos Alterados
| Arquivo | Acao |
|---------|------|
| path/to/file.ts | Criado |
| path/to/other.js | Modificado |

### Tempo Estimado
~{{HOURS}}h{{MINUTES}}min

### Proximos Passos
- [ ] [next step 1]
- [ ] [next step 2]

### Bloqueios
{{NONE or description}}
```

> Use the full template at `.aiox-core/development/templates/work-report-tmpl.md` for complex tasks.

### Update Final Status
Based on outcome:
- Work complete → set status to "concluido" / "complete" / "done" (check list's valid statuses)
- Needs review → set status to "em revisao" / "review" (if available)
- Blocked → keep "em progresso" + add blocker comment

### Update Tags/Custom Fields (via curl API when needed)
```bash
# Add tag
curl -s -X POST "https://api.clickup.com/api/v2/task/{task_id}/tag/{tag_name}" \
  -H "Authorization: {token}" -H "Content-Type: application/json"

# Set custom field
curl -s -X POST "https://api.clickup.com/api/v2/task/{task_id}/field/{field_id}" \
  -H "Authorization: {token}" -H "Content-Type: application/json" \
  -d '{"value": "..."}'
```

---

## Phase 4 — Notion Sync (Optional)

### When to Sync
- Work produces client-facing documentation
- Work changes client deliverables
- User explicitly requests Notion update
- Architecture decisions that affect knowledge base

### How to Sync
1. Search for existing page: `notion-search(query: "relevant title")`
2. If page exists → `notion-update-page` with new content
3. If no page → `notion-create-pages` in the correct hub:
   - Client docs → Clientes hub
   - SOPs/templates → Base de Conhecimento
   - Tech/infra → AIOS & Tecnologia
   - Team/ops → Central de Comando

---

## Reference Data

### List Mapping (Work Type → List ID)

| Work Type | List | ID |
|-----------|------|----|
| Campaigns, launches, marketing ops | Gestao de Campanhas | `901325668059` |
| Publishing, social media posts | Publicacao | `901325668055` |
| Strategy, planning, briefs | Planejamento & Estrategia | `901325668052` |
| Design, video, visual assets | Design/Audiovisual | `901325668054` |
| Copywriting, scripts, text content | Redacao/Copy | `901325668053` |
| AI experiments, tools, automation | Lab IA | `901325668065` |

### Team Member IDs (for assignees)

| Name | User ID | Role |
|------|---------|------|
| Fernando de Souza | `466187` | Dev/Tech Lead |
| Gabriel Campos | `3212457` | Content/Video |
| Karolina Martins | `3161900` | Design/Social |
| Victor Dhornelas | `200600104` | Client (Pelicula) |
| Sylvia Fernandes | `99926943` | Client (Pelicula) |

> NEVER use workspace owner ID `284457202` as assignee. Always use personal IDs above.

### Custom Field IDs

| Field | ID |
|-------|----|
| Cliente | `01f1addc-7d25-49b6-b312-439a5fb8fb0e` |
| Responsavel | `932eee93-521c-4be7-b07f-7202529ed160` |

**Cliente dropdown values:**
| Client | Value ID |
|--------|----------|
| Pelicula Sideral | `8904ef40-de6b-4ad5-ae94-b266e0d8f0fe` |
| Caracol Records | `4efb97a6-3272-467e-b3f6-af63ec079af2` |
| Levee | `baa8c501-89b6-4ed1-91db-65db4f9a38af` |
| Jubileu Internal | `4cf69d24-b2ed-4f20-8556-9531392dbaf2` |

**Responsavel dropdown values:**
| Person | Value ID |
|--------|----------|
| Fernando | `23224353-d227-4b8e-a19e-af031133a7df` |
| Gabriel | `239508a9-78b1-4f7e-8afc-87f4a27db2eb` |
| Karol | `cfd41920-6557-49ec-b0dc-60bc43754aff` |

---

## Edge Cases

### ClickUp MCP Unavailable
If ClickUp tools fail (timeout, auth error):
1. Continue working — do NOT block execution
2. Inform user: "ClickUp indisponivel. Trabalho continuara sem tracking."
3. At the end, provide the work report as text for manual posting
4. Suggest: "Quando ClickUp voltar, posso postar o relatorio. Deseja?"

### Task Already Completed
If the linked task has status "concluido"/"complete":
1. Ask user: "Task [NAME] ja esta concluida. Reabrir ou criar nova task?"
2. If reopen → update status back to "em progresso"
3. If new → create via MTQS-Lite

### Quick Fix That Scales
If work started as "quick fix" (no tracking) but exceeds 15 minutes:
1. Notify user: "Este trabalho esta levando mais que 15min. Criar task no ClickUp?"
2. If yes → create task and post retroactive report
3. If no → continue without tracking

### Multiple Tasks in One Session
If work spans multiple ClickUp tasks:
1. Track each task separately
2. Post individual reports to each task
3. Note cross-references between tasks in comments

---

_Rule Version: 1.0_
_Created: 2026-02-24_
_Applies to: All AIOS agents_
