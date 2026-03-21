---
task: reviewPsychOutput()
responsavel: "@psych-chief"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: specialist_output
    tipo: string
    origem: Specialist Agent
    obrigatorio: true
  - campo: original_request
    tipo: string
    origem: User Input
    obrigatorio: true

Saida:
  - campo: review_report
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Checklist de qualidade aplicada"
  - "[ ] Revisao multi-perspectiva realizada"
  - "[ ] Veredicto emitido (APPROVED/NEEDS_REVISION/FAIL)"
  - "[ ] Questoes eticas revisadas"
---

# Task: Review — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-010` |
| Command | `*review` |
| Orchestrator | `psych-chief` |
| Purpose | Revisao multi-abordagem e checklist de qualidade para qualquer output do squad |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `specialist_output` | Specialist Agent | Sim | Output produzido pelo especialista |
| `original_request` | User prompt | Sim | Pedido original que gerou o trabalho |
| `specialist_id` | Routing | Sim | ID do agente que produziu o output |
| `task_id` | System | Nao | ID da task executada |

## Preconditions

- Especialista completou sua task e produziu output
- Checklist de qualidade disponivel em `checklists/output-quality.md`

## Phases

### Phase 1: Coleta do Deliverable

1. Re-ler o pedido original do profissional
2. Identificar o que foi solicitado vs o que foi entregue
3. Anotar o especialista que produziu o output
4. Identificar o dominio clinico: psicanalise, TCC, humanista, existencial, trauma, regulacao emocional, comportamental
5. Determinar a gravidade clinica: caso de risco vs caso de desenvolvimento

### Phase 2: Checklist de Qualidade

1. Avaliar cada item obrigatorio:

   **Itens Criticos (bloqueantes):**
   - [ ] **Seguranca do paciente**: Nenhuma recomendacao que coloque o paciente em risco
   - [ ] **Etica profissional**: Respeito ao sigilo, consentimento, limites do papel
   - [ ] **Nao-diagnostico**: O output nao fornece diagnostico clinico definitivo
   - [ ] **Indicadores de risco**: Se presentes, foram identificados e alertados

   **Itens de Qualidade (importantes):**
   - [ ] **Relevancia**: O output responde ao que foi perguntado
   - [ ] **Fundamentacao**: As analises estao baseadas em teoria reconhecida
   - [ ] **Nuance**: Complexidade do caso preservada, sem simplificacoes excessivas
   - [ ] **Aplicabilidade**: Recomendacoes sao praticas e implementaveis
   - [ ] **Multi-perspectiva**: Considerou mais de uma lente teorica
   - [ ] **Linguagem**: Clara, respeitosa, sem jargao desnecessario

   **Itens Complementares (desejaveis):**
   - [ ] **Contexto cultural**: Fatores culturais considerados
   - [ ] **Longitudinalidade**: Considerou historico quando disponivel
   - [ ] **Proximos passos**: Direcionamento claro para o profissional

2. Pontuar: cada item CRITICO vale 3 pontos, QUALIDADE vale 2, COMPLEMENTAR vale 1
3. Calcular score total e percentual

### Phase 3: Revisao Multi-Perspectiva

1. Avaliar o output sob uma lente diferente da do especialista:
   - Se output foi psicanalitico → avaliar se aspectos cognitivos foram ignorados
   - Se output foi cognitivo → avaliar se aspectos emocionais e relacionais foram ignorados
   - Se output foi humanista → avaliar se aspectos inconscientes foram ignorados
   - Se output foi de trauma → avaliar se aspectos existenciais foram ignorados

2. Identificar:
   - Pontos cegos da abordagem escolhida
   - Perspectivas que enriqueceriam a analise
   - Riscos de viés de abordagem (ver tudo pela mesma lente)

3. Verificar coerencia interna:
   - Os achados sustentam as conclusoes?
   - As recomendacoes seguem dos achados?
   - Ha contradicoes internas?

### Phase 4: Veredicto

1. Decidir com base no score e na avaliacao qualitativa:

   | Score | Criterio | Veredicto |
   |-------|----------|-----------|
   | Todos CRITICOS passam, < 2 falhas QUALIDADE | Qualidade alta | **APPROVED** |
   | Todos CRITICOS passam, 2+ falhas QUALIDADE | Precisa ajustes | **NEEDS_REVISION** |
   | Qualquer CRITICO falha | Bloqueante | **FAIL** |

2. Para NEEDS_REVISION: listar exatamente o que precisa ser corrigido
3. Para FAIL: explicar por que e bloqueante e como corrigir

## Output Format

```yaml
review:
  deliverable_summary: "{resumo do que foi entregue}"
  specialist: "{agent-id}"
  domain: "{dominio clinico}"
  quality_score:
    critical_items: "{X/Y passaram}"
    quality_items: "{X/Y passaram}"
    complementary_items: "{X/Y passaram}"
    total_score: "{pontuacao total}"
    percentage: "{percentual}"
  critical_failures: ["{item critico que falhou, se houver}"]
  quality_failures: ["{item de qualidade que falhou, se houver}"]
  multi_perspective_notes:
    blind_spots: ["{ponto cego identificado}"]
    enriching_perspectives: ["{perspectiva que enriqueceria}"]
    approach_bias_risk: "{risco de viés de abordagem}"
    internal_coherence: "{coerente|parcialmente coerente|incoerente}"
  ethical_review:
    patient_safety: "{aprovado|alerta}"
    professional_ethics: "{aprovado|alerta}"
    risk_indicators: "{verificados|ausentes|nao aplicavel}"
  verdict: "{APPROVED|NEEDS_REVISION|FAIL}"
  revision_items: ["{item a revisar, se aplicavel}"]
  recommendation: |
    {proximo passo: entregar / revisar itens especificos / refazer}
```

## Veto Rules

1. **NUNCA aprovar sem checklist completa** — todos os itens devem ser avaliados
2. **NUNCA ignorar questoes eticas** — itens de seguranca e etica sao sempre bloqueantes
3. **NUNCA modificar o output do especialista** — apenas revisar e fornecer feedback
4. **NUNCA aprovar output que fornece diagnostico clinico definitivo** — o squad orienta, nao diagnostica
5. **NUNCA aprovar sem verificar indicadores de risco** — risco e sempre prioridade

## Completion Criteria

- [ ] Pedido original re-lido e comparado com entrega
- [ ] Todos os itens da checklist avaliados e pontuados
- [ ] Revisao multi-perspectiva realizada com pontos cegos identificados
- [ ] Coerencia interna verificada
- [ ] Questoes eticas e de seguranca revisadas
- [ ] Score calculado e veredicto emitido
- [ ] Feedback especifico fornecido para falhas identificadas
- [ ] Output segue o schema definido
