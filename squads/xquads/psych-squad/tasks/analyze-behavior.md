---
task: analyzeBehavior()
responsavel: "@daniel-kahneman"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: caso
    tipo: string
    origem: User Input / Routing
    obrigatorio: true
  - campo: contexto_clinico
    tipo: string
    origem: Session
    obrigatorio: false

Saida:
  - campo: behavioral_analysis
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Padroes comportamentais identificados"
  - "[ ] Vieses e heuristicas mapeados"
  - "[ ] Dominancia Sistema 1/2 avaliada"
  - "[ ] Plano de desenviesamento proposto"
---

# Task: Analyze Behavior — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-002` |
| Command | `*analyze-behavior` |
| Orchestrator | `daniel-kahneman` |
| Purpose | Analise de padroes comportamentais, vieses cognitivos e heuristicas em acao no caso clinico |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `caso` | User prompt / Routing | Sim | Descricao do caso ou comportamento a analisar |
| `contexto_clinico` | Session | Nao | Historico do caso, diagnosticos previos |
| `domain_focus` | Routing | Nao | Area especifica (decisao, julgamento, comportamento) |

## Preconditions

- Descricao do caso contem informacoes comportamentais observaveis
- Contexto suficiente para distinguir padroes de eventos isolados

## Phases

### Phase 1: Coleta de Informacoes Comportamentais

1. Ler o caso completo e extrair:
   - **Comportamentos observados**: Acoes concretas relatadas
   - **Contexto decisional**: Situacoes onde decisoes foram tomadas
   - **Padroes repetitivos**: Comportamentos que se repetem em diferentes contextos
   - **Gatilhos**: O que antecede cada comportamento
   - **Consequencias**: Resultados das decisoes e comportamentos

2. Mapear a sequencia temporal:
   - Quando os padroes comecaram
   - Frequencia e intensidade
   - Fatores de manutencao

### Phase 2: Identificacao de Vieses e Heuristicas

1. Analisar cada comportamento/decisao contra o catalogo de vieses:
   - **Vieses de julgamento**: Ancoragem, disponibilidade, representatividade
   - **Vieses de decisao**: Aversao a perda, efeito dotacao, custo afundado
   - **Vieses sociais**: Conformidade, efeito halo, viés de confirmacao
   - **Vieses de memoria**: Viés retrospectivo, pico-fim, negligencia da taxa base
   - **Vieses emocionais**: Afeto heuristico, viés de otimismo, projecao empática

2. Para cada viés identificado, documentar:
   - Evidencia no caso
   - Impacto estimado no funcionamento
   - Relacao com outros vieses (efeitos em cascata)

### Phase 3: Analise Sistema 1 vs Sistema 2

1. Classificar cada comportamento:
   - **Sistema 1 (rapido, automatico)**: Reacoes automaticas, respostas emocionais imediatas, julgamentos intuitivos
   - **Sistema 2 (lento, deliberado)**: Decisoes ponderadas, analise consciente, planejamento

2. Avaliar a dominancia:
   - Qual sistema predomina no caso
   - Em quais situacoes cada sistema e ativado
   - Onde o Sistema 1 esta "sequestrando" decisoes que precisariam do Sistema 2
   - Onde o Sistema 2 esta sobrecarregado (fadiga decisional)

3. Identificar pontos de intervencao:
   - Momentos onde uma "pausa" entre S1 e S2 seria terapeutica
   - Situacoes onde confiar no S1 e adaptativo
   - Contextos de esgotamento do S2

### Phase 4: Plano de Desenviesamento

1. Para cada viés critico identificado, propor:
   - **Estrategia de consciencia**: Como ajudar o paciente a reconhecer o viés em acao
   - **Tecnica de desenviesamento**: Metodo especifico (pre-mortem, devil's advocate, etc.)
   - **Ambiente decisional**: Mudancas no contexto para reduzir ativacao do viés
   - **Metricas de progresso**: Como medir se o desenviesamento esta funcionando

2. Priorizar intervencoes por:
   - Impacto no funcionamento do paciente
   - Facilidade de implementacao
   - Risco de efeitos colaterais

## Output Format

```yaml
behavioral_analysis:
  caso_summary: "{resumo do caso}"
  patterns:
    - pattern: "{descricao do padrao}"
      frequency: "{alta|media|baixa}"
      trigger: "{gatilho identificado}"
      consequence: "{consequencia observada}"
  biases:
    - bias: "{nome do viés}"
      evidence: "{evidencia no caso}"
      impact: "{alto|medio|baixo}"
      cascade_effects: ["{viés relacionado}"]
  system_dominance:
    primary: "{sistema_1|sistema_2|alternante}"
    hijack_points: ["{situacao onde S1 domina indevidamente}"]
    fatigue_indicators: ["{sinais de fadiga do S2}"]
    intervention_windows: ["{momentos para intervir}"]
  debiasing_plan:
    - target_bias: "{viés alvo}"
      awareness_strategy: "{estrategia de consciencia}"
      technique: "{tecnica especifica}"
      environment_change: "{mudanca no contexto}"
      progress_metric: "{como medir}"
      priority: "{alta|media|baixa}"
  clinical_notes: |
    {observacoes adicionais relevantes para o terapeuta}
```

## Veto Rules

1. **NUNCA diagnosticar transtorno** — a analise e sobre padroes comportamentais e vieses, nao sobre patologia
2. **NUNCA ignorar contexto emocional** — vieses cognitivos existem em contexto afetivo, nao no vacuo
3. **NUNCA reduzir tudo a vieses** — nem todo comportamento e viesado; alguns sao adaptativos
4. **NUNCA prescrever mudanca sem considerar custo emocional** — desenviesamento tem custo psicologico
5. **NUNCA ignorar fatores culturais e sociais** — vieses operam em contexto cultural

## Completion Criteria

- [ ] Padroes comportamentais identificados com gatilhos e consequencias
- [ ] Vieses cognitivos mapeados com evidencia e impacto
- [ ] Dominancia Sistema 1 vs Sistema 2 avaliada
- [ ] Pontos de intervencao identificados
- [ ] Plano de desenviesamento priorizado proposto
- [ ] Output segue o schema definido
