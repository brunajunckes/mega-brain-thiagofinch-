---
task: psychoanalyticAssessment()
responsavel: "@sigmund-freud"
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
  - campo: psychoanalytic_assessment
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Material manifesto e latente diferenciados"
  - "[ ] Mecanismos de defesa mapeados"
  - "[ ] Dinamica transferencial analisada"
  - "[ ] Formulacao psicodinamica elaborada"
---

# Task: Psychoanalytic Assessment — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-003` |
| Command | `*psychoanalytic-assessment` |
| Orchestrator | `sigmund-freud` |
| Purpose | Avaliacao psicanalitica — estrutura psiquica, mecanismos de defesa, transferencia e dinamica inconsciente |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `caso` | User prompt / Routing | Sim | Descricao do caso, queixa, historico |
| `contexto_clinico` | Session | Nao | Sessoes previas, historico do tratamento |
| `transcript` | User | Nao | Transcricao de sessao para analise |

## Preconditions

- Descricao do caso contem material suficiente para analise (queixa, historico, dinamica relacional)
- Caso nao se limita a pedido de medicacao ou intervencao exclusivamente comportamental

## Phases

### Phase 1: Escuta Analitica — Material Manifesto vs Latente

1. Ler o caso com atencao flutuante:
   - **Material manifesto**: O que o paciente diz literalmente, queixa explicita, narrativa consciente
   - **Material latente**: O que esta por tras — contradicoes, lapsos, repeticoes, temas recorrentes
   - **Lacunas narrativas**: O que nao e dito, o que e evitado, silenciamentos significativos

2. Identificar formacoes do inconsciente:
   - Atos falhos e lapsos de linguagem
   - Sonhos relatados e associacoes
   - Repeticoes de padroes (compulsao a repeticao)
   - Sintomas como formacoes de compromisso

3. Mapear a historia libidinal:
   - Fases do desenvolvimento psicossexual relevantes
   - Fixacoes identificaveis
   - Relacoes objetais primarias (figuras parentais, cuidadores)

### Phase 2: Mapeamento de Defesas

1. Identificar mecanismos de defesa operantes:
   - **Primitivas**: Cisao, identificacao projetiva, negacao, idealizacao/desvalorizacao
   - **Neuroticas**: Repressao, formacao reativa, isolamento, anulacao, racionalizacao
   - **Maduras**: Sublimacao, humor, antecipacao, supressao

2. Para cada defesa identificada:
   - Evidencia clinica no material
   - Contra que ansiedade protege
   - Nivel de rigidez (flexivel vs rigido)
   - Custo adaptativo (quanto limita o funcionamento)

3. Avaliar o nivel de organizacao defensiva:
   - Predominantemente primitivo → estrutura borderline
   - Predominantemente neurotico → estrutura neurotica
   - Misto com flexibilidade → funcionamento saudavel com areas de conflito

### Phase 3: Analise Transferencial

1. Avaliar a dinamica transferencial presente:
   - **Transferencia positiva**: Idealizacao, erotizacao, dependencia
   - **Transferencia negativa**: Hostilidade, desvalorizacao, resistencia
   - **Transferencia de repeticao**: Padroes relacionais antigos reeditados

2. Identificar padroes contratransferenciais:
   - Que sentimentos o caso evoca no terapeuta
   - Risco de colusao inconsciente
   - Sinais de identificacao projetiva recebida

3. Mapear relacoes de objeto internalizadas:
   - Quais figuras internas estao sendo reeditadas
   - Qualidade dos objetos internos (persecutorios, idealizados, integrados)
   - Capacidade de vinculacao e confianca

### Phase 4: Formulacao Psicodinamica

1. Integrar os achados em formulacao coerente:
   - **Conflito central**: Qual o conflito inconsciente predominante
   - **Ansiedade nuclear**: Qual ansiedade impulsiona as defesas
   - **Ganho primario do sintoma**: Qual funcao o sintoma cumpre na economia psiquica
   - **Ganho secundario**: Beneficios externos que mantem o sintoma

2. Propor hipoteses sobre:
   - Origem desenvolvimental do conflito
   - Como o conflito se manifesta no presente
   - Prognostico psicanalitico

3. Sugerir direcionamentos:
   - Foco analitico recomendado
   - Tipo de interpretacao indicada (conteudo vs defesa vs transferencia)
   - Manejo da resistencia
   - Timing e dosagem das intervencoes

## Output Format

```yaml
psychoanalytic_assessment:
  manifest_content:
    queixa_explicita: "{o que o paciente apresenta conscientemente}"
    narrativa: "{resumo da narrativa manifesta}"
  latent_content:
    temas_inconscientes: ["{tema 1}", "{tema 2}"]
    formacoes_inconsciente: ["{ato falho, sonho, repeticao}"]
    lacunas: ["{o que nao e dito}"]
  defenses:
    - defense: "{nome da defesa}"
      evidence: "{evidencia clinica}"
      protects_against: "{tipo de ansiedade}"
      rigidity: "{flexivel|moderada|rigida}"
      adaptive_cost: "{alto|medio|baixo}"
  defense_organization: "{primitiva|neurotica|mista|madura}"
  transference:
    type: "{positiva|negativa|repeticao|mista}"
    pattern: "{descricao do padrao transferencial}"
    countertransference_risks: ["{risco 1}"]
    internal_objects: ["{objeto interno identificado}"]
  formulation:
    central_conflict: "{conflito inconsciente principal}"
    nuclear_anxiety: "{ansiedade que impulsiona defesas}"
    primary_gain: "{funcao do sintoma}"
    secondary_gain: "{beneficios externos}"
    developmental_origin: "{origem hipotetica}"
  therapeutic_direction:
    focus: "{foco analitico recomendado}"
    interpretation_type: "{conteudo|defesa|transferencia}"
    resistance_management: "{como manejar resistencia}"
    timing_notes: "{notas sobre timing}"
```

## Veto Rules

1. **NUNCA interpretar prematuramente** — a interpretacao so e eficaz quando o paciente esta proximo da consciencia do material
2. **NUNCA ignorar resistencia** — resistencia e informacao clinica, nao obstáculo
3. **NUNCA patologizar sem base clinica** — estrutura psiquica nao e diagnostico psiquiatrico
4. **NUNCA reduzir o caso a uma unica interpretacao** — sobredeterminacao e principio fundamental
5. **NUNCA ignorar a qualidade da alianca terapeutica** — interpretacao sem alianca e violencia

## Completion Criteria

- [ ] Material manifesto e latente diferenciados com evidencias
- [ ] Mecanismos de defesa mapeados com nivel de organizacao
- [ ] Dinamica transferencial e contratransferencial analisada
- [ ] Formulacao psicodinamica integrada elaborada
- [ ] Direcionamento terapeutico proposto com timing
- [ ] Output segue o schema definido
