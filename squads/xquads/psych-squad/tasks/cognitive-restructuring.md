---
task: cognitiveRestructuring()
responsavel: "@aaron-beck"
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
  - campo: cognitive_plan
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Pensamentos automaticos identificados"
  - "[ ] Distorcoes cognitivas classificadas"
  - "[ ] Pensamentos alternativos elaborados"
  - "[ ] Plano de intervencao proposto"
---

# Task: Cognitive Restructuring — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-004` |
| Command | `*cognitive-restructuring` |
| Orchestrator | `aaron-beck` |
| Purpose | Plano de reestruturacao cognitiva com identificacao de distorcoes e pensamentos alternativos |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `caso` | User prompt / Routing | Sim | Descricao do caso, situacao problema, cognições relatadas |
| `contexto_clinico` | Session | Nao | Historico, diagnosticos, tratamentos previos |
| `situacao_gatilho` | User | Nao | Situacao especifica que desencadeia pensamentos |

## Preconditions

- Caso contem informacoes sobre pensamentos, interpretacoes ou crencas do paciente
- Material suficiente para identificar pelo menos uma cadeia pensamento-emocao-comportamento

## Phases

### Phase 1: Identificacao de Pensamentos Automaticos

1. Extrair do caso a triade cognitiva:
   - **Visao de si**: Como o paciente se ve ("Eu sou...")
   - **Visao do mundo**: Como ve os outros e o ambiente ("As pessoas sao...", "O mundo e...")
   - **Visao do futuro**: Como antecipa o que vira ("Vai ser...", "Nunca vou...")

2. Mapear pensamentos automaticos:
   - Identificar pensamentos "quentes" (carregados de emocao)
   - Registrar a situacao-gatilho para cada pensamento
   - Anotar a emocao associada e intensidade (0-100%)
   - Identificar o comportamento resultante

3. Construir o modelo cognitivo do caso:
   - Crencas centrais (nivel mais profundo)
   - Crencas intermediarias (regras, pressupostos, atitudes)
   - Pensamentos automaticos (nivel superficial)

### Phase 2: Exame de Evidencias

1. Para cada pensamento automatico principal:
   - **Evidencias a favor**: O que sustenta este pensamento
   - **Evidencias contra**: O que contradiz este pensamento
   - **Fonte das evidencias**: Fatos observaveis vs interpretacoes
   - **Qualidade da evidencia**: Solida vs enviesada

2. Classificar distorcoes cognitivas presentes:
   - **Pensamento tudo-ou-nada**: Categorias absolutas sem meio-termo
   - **Catastrofizacao**: Antecipar o pior cenario possivel
   - **Leitura mental**: Assumir que sabe o que os outros pensam
   - **Filtro mental**: Focar apenas no negativo
   - **Desqualificacao do positivo**: Descartar experiencias positivas
   - **Personalizacao**: Assumir responsabilidade indevida
   - **Rotulacao**: Rotulo global baseado em evento especifico
   - **Raciocinio emocional**: "Sinto, logo e verdade"
   - **Imperativos (deveria/tenho que)**: Regras rigidas autoimpostas
   - **Magnificacao/Minimizacao**: Distorcer a proporcao dos eventos

3. Avaliar o impacto de cada distorcao no funcionamento

### Phase 3: Reestruturacao Cognitiva

1. Para cada pensamento automatico disfuncional:
   - Formular pensamento alternativo baseado nas evidencias
   - Testar a credibilidade do pensamento alternativo (0-100%)
   - Reavaliar a emocao apos o pensamento alternativo
   - Verificar se o pensamento alternativo e realista (nao positivismo ingenuo)

2. Trabalhar no nivel das crencas intermediarias:
   - Identificar regras rigidas ("Se... entao...")
   - Reformular em versoes mais flexiveis
   - Criar "cartao de enfrentamento" com pensamentos alternativos

3. Para crencas centrais (se acessiveis):
   - Nomear a crenca central ("Eu sou inadequado", "Sou indigno de amor")
   - Propor trabalho de continuum (0-100% em vez de tudo-ou-nada)
   - Sugerir registro de dados positivos

### Phase 4: Plano de Intervencao

1. Estruturar experimentos comportamentais:
   - **Hipotese a testar**: Qual pensamento sera testado
   - **Experimento**: O que o paciente fara
   - **Predicao do paciente**: O que ele espera que aconteca
   - **Resultado real**: O que de fato aconteceu
   - **Conclusao**: O que isso diz sobre o pensamento original

2. Propor tarefas de casa:
   - Registro de pensamentos (RPD — Registro de Pensamentos Disfuncionais)
   - Experimentos comportamentais graduais
   - Tecnicas de distanciamento cognitivo
   - Exercicios de descoberta guiada

3. Definir metricas de progresso:
   - Reducao na credibilidade dos pensamentos automaticos
   - Reducao na intensidade emocional
   - Aumento em comportamentos adaptativos
   - Flexibilizacao de crencas intermediarias

## Output Format

```yaml
cognitive_plan:
  caso_summary: "{resumo do caso}"
  cognitive_triad:
    self_view: "{visao de si}"
    world_view: "{visao do mundo}"
    future_view: "{visao do futuro}"
  automatic_thoughts:
    - thought: "{pensamento automatico}"
      situation: "{situacao gatilho}"
      emotion: "{emocao (intensidade%)}"
      behavior: "{comportamento resultante}"
      distortion: "{tipo de distorcao}"
  core_beliefs: ["{crenca central identificada}"]
  intermediate_beliefs: ["{regra/pressuposto identificado}"]
  distortions:
    - type: "{tipo de distorcao}"
      evidence: "{exemplo no caso}"
      impact: "{alto|medio|baixo}"
  alternative_thoughts:
    - original: "{pensamento original}"
      alternative: "{pensamento alternativo}"
      credibility: "{0-100%}"
      emotion_change: "{emocao e nova intensidade}"
  behavioral_experiments:
    - hypothesis: "{o que sera testado}"
      experiment: "{o que o paciente fara}"
      patient_prediction: "{predicao do paciente}"
      expected_learning: "{aprendizado esperado}"
  homework:
    - task: "{tarefa de casa}"
      frequency: "{frequencia}"
      purpose: "{objetivo}"
  progress_metrics: ["{metrica de progresso}"]
```

## Veto Rules

1. **NUNCA invalidar emocoes do paciente** — a emocao e real, mesmo que o pensamento seja distorcido
2. **NUNCA impor pensamentos "corretos"** — reestruturacao e descoberta guiada, nao doutrinacao
3. **NUNCA ignorar crencas centrais** — trabalhar apenas no nivel superficial gera melhora temporaria
4. **NUNCA usar positivismo ingenuo** — pensamentos alternativos devem ser realistas, nao "positivos"
5. **NUNCA desconsiderar o contexto emocional** — timing e fundamental na reestruturacao

## Completion Criteria

- [ ] Triade cognitiva mapeada
- [ ] Pensamentos automaticos identificados com situacoes e emocoes
- [ ] Distorcoes cognitivas classificadas com impacto
- [ ] Pensamentos alternativos elaborados com credibilidade
- [ ] Experimentos comportamentais estruturados
- [ ] Plano de intervencao com tarefas e metricas
- [ ] Output segue o schema definido
