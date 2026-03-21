# Checklist: Universal Task Tracking Quality Gate

**Checklist ID:** universal-task-tracking-gate
**Version:** 1.0
**Purpose:** Validate that the ClickUp Task Tracking protocol was followed during any work session
**Applies to:** All agents, all work types
**Reference:** `.claude/rules/clickup-task-tracking.md`

---

## Pre-Execution Checks

- [ ] **Work type evaluated against tracking threshold**
  - veto_if_fail: "Cannot determine if tracking is needed"
  - action: "Check MUST Track vs MAY Skip criteria in the rule"

- [ ] **ClickUp search performed for existing task**
  - veto_if_fail: "May create duplicate tasks"
  - action: "Run get_tasks on relevant list or get_task_details if ID provided"

- [ ] **Task linked or created**
  - veto_if_fail: "Work is untracked in ClickUp"
  - action: "Link existing task or create new via MTQS-Lite"

- [ ] **Status updated to in-progress**
  - veto_if_fail: "Board doesn't reflect actual work state"
  - action: "update_task with appropriate in-progress status for the list"

---

## During Execution Checks

- [ ] **File changes tracked**
  - warning: "Report will be incomplete without file list"
  - action: "Maintain running list of created/modified/deleted files"

- [ ] **Key decisions documented**
  - warning: "Decisions without rationale create future confusion"
  - action: "Note any architectural, technical, or strategic decisions"

- [ ] **Blockers reported immediately**
  - veto_if_fail: "Delayed blocker reporting wastes team time"
  - action: "Post blocker comment to ClickUp task as soon as discovered"

---

## Post-Execution Checks

- [ ] **Work report posted as comment**
  - veto_if_fail: "No record of work done on this task"
  - action: "Use create_task_comment with structured report (see work-report-tmpl.md)"

- [ ] **Final status updated correctly**
  - veto_if_fail: "Board shows wrong state"
  - action: "Set to concluido/em revisao/bloqueado as appropriate"

- [ ] **Tags and custom fields updated**
  - warning: "Task may not appear in correct filters"
  - action: "Update client tag, sprint tag via curl API if needed"

- [ ] **Notion sync performed (when applicable)**
  - warning: "Knowledge base may be outdated"
  - action: "If work produced docs or client deliverables, sync to Notion"

- [ ] **Checklist items marked complete**
  - warning: "Task progress not reflected in ClickUp"
  - action: "Update checklist items that were completed during this session"

---

## Approval Criteria

### PASS
- All Pre-Execution checks passed
- All Post-Execution checks passed
- At least 2/3 During Execution checks passed
- **Result:** Tracking protocol fully followed

### CONDITIONAL
- All Pre-Execution checks passed
- Work report posted (Post-Execution)
- Some optional checks skipped (tags, Notion, decisions)
- **Result:** Acceptable — improve on non-critical items next time

### SKIP (Valid)
- Work is under tracking threshold (typos, exploration, Q&A)
- User explicitly opted out ("sem clickup", "skip clickup")
- ClickUp MCP was unavailable (text report provided instead)
- **Result:** No tracking required — protocol correctly skipped

### FAIL
- Trackable work done without any ClickUp interaction
- Task created but no report posted
- Status never updated (still shows original status)
- **Result:** Protocol violated — address before closing session

---

## Recovery Actions (When FAIL)

1. **No task linked:** Create task retroactively via MTQS-Lite
2. **No report posted:** Generate report from session history and post
3. **Status stale:** Update to correct current status
4. **Missing files in report:** Review git diff and update comment

---

_Checklist Version: 1.0_
_Created: 2026-02-24_
