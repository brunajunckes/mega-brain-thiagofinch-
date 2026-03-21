---
task: emotionalRegulationPlan()
responsavel: "@marsha-linehan"
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
  - campo: regulation_plan
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Desregulacao emocional avaliada"
  - "[ ] Modulos TCD selecionados"
  - "[ ] Plano de habilidades elaborado"
  - "[ ] Estrategia de implementacao proposta"
---

# Task: Emotional Regulation Plan — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-008` |
| Command | `*emotional-regulation-plan` |
| Orchestrator | `marsha-linehan` |
| Purpose | Plano de regulacao emocional usando modulos da TCD/DBT |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `caso` | User prompt / Routing | Sim | Descricao do caso e padroes de desregulacao |
| `contexto_clinico` | Session | Nao | Historico, diagnosticos, tentativas previas |
| `risk_level` | Routing | Nao | Nivel de risco avaliado (autolesao, suicidio) |

## Preconditions

- Caso apresenta padroes de desregulacao emocional identificaveis
- Informacoes sobre gatilhos e consequencias emocionais disponiveis

## Phases

### Phase 1: Avaliacao da Desregulacao

1. Mapear o padrao de desregulacao emocional:
   - **Vulnerabilidade emocional**: Sensibilidade alta, reatividade intensa, retorno lento a baseline
   - **Ambiente invalidante**: Historico de invalidacao emocional (familia, escola, relacoes)
   - **Deficit de habilidades**: Quais habilidades regulatorias estao ausentes

2. Avaliar areas de desregulacao:
   - **Emocional**: Instabilidade afetiva, raiva intensa, vazio cronico
   - **Interpessoal**: Relacoes caóticas, medo de abandono, idealizacao/desvalorizacao
   - **Comportamental**: Impulsividade, autolesao, abuso de substancias
   - **Cognitiva**: Pensamento preto-e-branco, dissociacao, paranoia transitoria
   - **Identidade**: Senso de self instavel, vazio cronico, mudancas de valores

3. Identificar cadeia comportamental:
   - Evento precipitador → vulnerabilidades → pensamentos → emocao → impulso → comportamento → consequencias
   - Diferenciar comportamentos-alvo primarios (risco de vida) vs secundarios (qualidade de vida)

4. Avaliar risco:
   - Autolesao ativa ou historico
   - Ideacao suicida (frequencia, intensidade, plano)
   - Comportamentos de risco
   - Rede de suporte disponivel

### Phase 2: Selecao de Modulos

1. Avaliar necessidade por modulo TCD/DBT:
   - **Mindfulness (Atencao Plena)**: Capacidade de observar sem reagir, mente sabia
   - **Tolerancia ao Mal-Estar**: Capacidade de suportar crises sem comportamentos destrutivos
   - **Regulacao Emocional**: Entender e modular emocoes, reduzir vulnerabilidade
   - **Efetividade Interpessoal**: Pedir, dizer nao, manter autorrespeito

2. Priorizar modulos por urgencia:
   | Prioridade | Situacao | Modulo |
   |-----------|----------|--------|
   | 1 (urgente) | Risco de vida, autolesao ativa | Tolerancia ao Mal-Estar |
   | 2 (alta) | Desregulacao emocional intensa | Regulacao Emocional |
   | 3 (media) | Conflitos relacionais graves | Efetividade Interpessoal |
   | 4 (fundacao) | Base para todos os modulos | Mindfulness |

3. Selecionar habilidades especificas por modulo:
   - Mindfulness: observar, descrever, participar, nao-julgar, uma-coisa-de-cada-vez, efetividade
   - Tolerancia: TIPP, distracao (ACCEPTS), auto-acalmar, melhoria do momento, pros e contras
   - Regulacao: nomear emocoes, checar os fatos, acao oposta, acumular positivos, construir maestria
   - Interpessoal: DEAR MAN, GIVE, FAST

### Phase 3: Plano de Habilidades

1. Para cada habilidade selecionada:
   - **Descricao**: O que e a habilidade
   - **Quando usar**: Situacao-gatilho especifica
   - **Como praticar**: Passos concretos
   - **Exemplo aplicado**: Usando a situacao do paciente
   - **Barreiras previsiveis**: O que pode impedir a pratica

2. Equilibrar validacao e mudanca:
   - **Validacao**: Reconhecer que as emocoes fazem sentido no contexto
   - **Mudanca**: Propor formas mais efetivas de lidar
   - **Sintese dialetica**: Manter ambos simultaneamente

3. Criar plano de crise:
   - Sinais de alerta precoces
   - Habilidades de emergencia (TIPP, gelo, mergulho facial)
   - Contatos de suporte
   - Quando buscar ajuda profissional de emergencia

### Phase 4: Estrategia de Implementacao

1. Plano de treino gradual:
   - Semana 1-2: Mindfulness basico + uma habilidade de tolerancia
   - Semana 3-4: Adicionar regulacao emocional
   - Semana 5+: Integrar efetividade interpessoal

2. Estrutura de pratica:
   - Diario de emocoes (registro diario)
   - Cartoes de habilidades (para consulta rapida)
   - Pratica formal (exercicios estruturados)
   - Pratica informal (usar no dia a dia)

3. Monitoramento:
   - Diary card adaptada ao caso
   - Analise de cadeia quando ocorrer comportamento-alvo
   - Revisao semanal de habilidades praticadas
   - Ajustes baseados em progresso

## Output Format

```yaml
regulation_plan:
  caso_summary: "{resumo do caso}"
  dysregulation_assessment:
    emotional_vulnerability: "{descricao da vulnerabilidade}"
    invalidating_environment: "{historico de invalidacao}"
    skill_deficits: ["{deficit identificado}"]
    dysregulation_areas: ["{area de desregulacao}"]
    behavioral_chain: "{evento → emocao → comportamento → consequencia}"
    risk_level: "{baixo|moderado|alto|critico}"
  selected_modules:
    - module: "{nome do modulo}"
      priority: "{1-4}"
      rationale: "{por que este modulo}"
      skills: ["{habilidade especifica}"]
  skills_plan:
    - skill: "{nome da habilidade}"
      module: "{modulo de origem}"
      when_to_use: "{situacao-gatilho}"
      how_to_practice: "{passos concretos}"
      applied_example: "{exemplo com caso do paciente}"
      barriers: ["{barreira previsivel}"]
  crisis_plan:
    warning_signs: ["{sinal de alerta}"]
    emergency_skills: ["{habilidade de emergencia}"]
    support_contacts: ["{contato de suporte}"]
    when_to_seek_help: "{criterios para buscar ajuda}}"
  implementation:
    week_1_2: ["{atividade}"]
    week_3_4: ["{atividade}"]
    week_5_plus: ["{atividade}"]
    monitoring: ["{forma de monitoramento}"]
  validation_notes: |
    {notas de validacao — reconhecimento do sofrimento e das razoes por tras dos comportamentos}
```

## Veto Rules

1. **NUNCA minimizar sofrimento** — emocoes intensas sao reais e dolorosas, mesmo quando desproporcionais
2. **NUNCA pular validacao** — mudanca sem validacao e invalidacao; validar ANTES de propor mudanca
3. **NUNCA ignorar risco de autolesao** — comportamentos de risco devem ser priorizados no plano
4. **NUNCA prescrever habilidades sem contexto** — cada habilidade deve ser adaptada ao caso
5. **NUNCA abandonar a dialetica** — manter validacao E mudanca simultaneamente, sempre

## Completion Criteria

- [ ] Desregulacao emocional avaliada com cadeia comportamental
- [ ] Risco avaliado e documentado
- [ ] Modulos TCD priorizados com justificativa
- [ ] Habilidades especificas selecionadas com exemplos aplicados
- [ ] Plano de crise elaborado
- [ ] Estrategia de implementacao gradual proposta
- [ ] Output segue o schema definido
