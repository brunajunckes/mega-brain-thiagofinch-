# Checklist: ClickUp Scrum Quality Gate

**Checklist ID:** clickup-scrum-quality-gate
**Version:** 1.0
**Purpose:** Validate Scrum ceremonies and ClickUp operations quality
**Agent:** @clickup-scrum (Sprint)

---

## Blocking Requirements (VETO if any fails)

- [ ] **Sprint Goal definido**
  - veto_if_fail: "Sprint sem goal nao tem direcao"
  - action: "Definir Sprint Goal antes de selecionar items"

- [ ] **Tasks criadas no ClickUp com ID confirmado**
  - veto_if_fail: "Tasks nao rastreáveis fora do ClickUp"
  - action: "Criar tasks via MCP antes de prosseguir"

- [ ] **Assignees definidos em TODAS as tasks da sprint**
  - veto_if_fail: "Tasks sem responsavel nao tem accountability"
  - action: "Atribuir responsavel para cada task"

- [ ] **Sprint points estimados (Fibonacci)**
  - veto_if_fail: "Sem estimativa nao ha velocity tracking"
  - action: "Estimar cada task em 1,2,3,5,8,13 pontos"

- [ ] **Cliente tagueado (custom field)**
  - veto_if_fail: "Tasks sem cliente nao aparecem em filtros"
  - action: "Usar campo 'Cliente' com valor correto (SIDERAL/CARACOL/LEVEE/JUBILEU)"

- [ ] **Statuses validos para lista alvo**
  - veto_if_fail: "Status invalido causa erro no ClickUp"
  - action: "Verificar statuses da lista antes de setar"

---

## Recommended (WARNING if fails)

- [ ] **Acceptance criteria como checklist**
  - warning: "Tasks sem criteria claros geram ambiguidade"
  - action: "Adicionar checklist 'Acceptance Criteria' na task"

- [ ] **Due dates definidos**
  - warning: "Sem prazo a task pode ser esquecida"
  - action: "Definir due_date alinhado com fim da sprint"

- [ ] **Prioridade definida (1-4)**
  - warning: "Sem prioridade, tudo parece igual"
  - action: "Definir: 1=Urgente, 2=Alta, 3=Normal, 4=Baixa"

- [ ] **Sprint tag aplicada**
  - warning: "Sem tag, task nao aparece em filtros de sprint"
  - action: "Aplicar tag 'sprint-N' para rastreamento"

- [ ] **Descricao preenchida**
  - warning: "Tasks sem descricao requerem contexto verbal"
  - action: "Incluir descricao com contexto e acceptance criteria"

---

## Approval Criteria

**PASS:** 100% blocking + 80% recommended = PASS
**CONDITIONAL:** 100% blocking + <80% recommended = CONDITIONAL (pode prosseguir)
**FAIL:** Qualquer blocking falhou = FAIL (corrigir antes de prosseguir)

---

## Scrum Ceremony Validation

### Sprint Planning
- [ ] Sprint Goal claro e comunicavel
- [ ] Items selecionados nao excedem 120% velocity
- [ ] Cada item tem estimativa e assignee

### Daily Standup
- [ ] Todos os membros reportados
- [ ] Impedimentos identificados ou "nenhum"
- [ ] Burndown atualizado

### Sprint Review
- [ ] Velocity data point calculado
- [ ] Items nao-concluidos documentados
- [ ] Feedback de stakeholders coletado (ou "skip")

### Retrospective
- [ ] Ao menos 1 "keep" e 1 "improve"
- [ ] Action items criados como tasks no ClickUp
- [ ] Compromissos para proxima sprint documentados

---

_Checklist Version: 1.0_
_Created: 2026-02-24_
