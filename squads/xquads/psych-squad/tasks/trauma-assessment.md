---
task: traumaAssessment()
responsavel: "@gabor-mate"
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
  - campo: trauma_assessment
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Historia desenvolvimental explorada"
  - "[ ] ACEs e trauma mapeados"
  - "[ ] Conexoes mente-corpo identificadas"
  - "[ ] Plano de abordagem ao trauma proposto"
---

# Task: Trauma Assessment — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-006` |
| Command | `*trauma-assessment` |
| Orchestrator | `gabor-mate` |
| Purpose | Avaliacao de trauma desenvolvimental, impacto no corpo e padroes de adaptacao |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `caso` | User prompt / Routing | Sim | Descricao do caso, historico do paciente |
| `contexto_clinico` | Session | Nao | Diagnosticos previos, tratamentos anteriores |
| `somatic_complaints` | User | Nao | Queixas somaticas relatadas |

## Preconditions

- Caso contem informacoes sobre historico de vida e/ou relacoes primarias
- Indicadores de possivel trauma presente (comportamentais, somaticos ou relacionais)

## Phases

### Phase 1: Historia Desenvolvimental — Compassionate Inquiry

1. Explorar a historia atraves da lente do trauma desenvolvimental:
   - **Ambiente emocional precoce**: Como era o clima emocional do lar
   - **Figuras de apego**: Disponibilidade, responsividade, previsibilidade
   - **Necessidades atendidas vs nao atendidas**: Seguranca, aceitacao, expressao emocional
   - **Eventos adversos**: Abandono, negligencia, abuso, perda, instabilidade

2. Fazer as perguntas de Compassionate Inquiry:
   - "O que aconteceu com voce?" (nao "O que ha de errado com voce?")
   - "O que voce precisou desligar para sobreviver?"
   - "Como a crianca que voce foi aprendeu a se proteger?"
   - "Quais partes de si voce teve que esconder para ser amado?"

3. Mapear o estilo de apego resultante:
   - Seguro: confianca basica preservada
   - Ansioso: hipervigilancia relacional
   - Evitante: distanciamento emocional como protecao
   - Desorganizado: oscilacao medo/necessidade

### Phase 2: Mapeamento de Trauma e ACEs

1. Avaliar Experiencias Adversas na Infancia (ACEs):
   - Abuso emocional, fisico, sexual
   - Negligencia emocional, fisica
   - Violencia domestica
   - Abuso de substancias no lar
   - Doenca mental no lar
   - Separacao/divorcio parental
   - Encarceramento de familiar

2. Identificar tipos de trauma presentes:
   - **Trauma de choque**: Evento unico, circunscrito (acidente, violencia)
   - **Trauma desenvolvimental**: Cronico, relacional, cumulativo
   - **Trauma de apego**: Falha nas relacoes primarias de cuidado
   - **Trauma intergeracional**: Padroes transmitidos entre geracoes
   - **Trauma coletivo/social**: Exclusao, discriminacao, migracao forcada

3. Avaliar o impacto cumulativo:
   - ACE score estimado (0-10)
   - Fatores de protecao presentes (resiliencia, relacoes de suporte)
   - Fatores de risco adicionais

### Phase 3: Conexao Mente-Corpo

1. Mapear manifestacoes somaticas do trauma:
   - **Tensao muscular cronica**: Onde o corpo "segura" a historia
   - **Doencas autoimunes**: Conexao com trauma e estresse toxico
   - **Dor cronica**: Quando o corpo fala o que a mente cala
   - **Adicoes**: Substancias, comportamentos, relacoes — como tentativas de regulacao
   - **Fadiga cronica**: Quando o sistema nervoso esta em burnout

2. Avaliar o estado do sistema nervoso:
   - **Hiperativacao simpatica**: Ansiedade, hipervigilancia, insonia
   - **Hipoativacao dorsal vagal**: Dissociacao, entorpecimento, colapso
   - **Janela de tolerancia**: Quao estreita esta (capacidade de regulacao)

3. Identificar mecanismos de coping adaptativos:
   - O que o paciente faz para se regular (saudavel e nao saudavel)
   - Reconhecer que adicoes e comportamentos destrutivos foram solucoes criativas
   - Nao patologizar mecanismos de sobrevivencia

### Phase 4: Plano de Abordagem ao Trauma

1. Principios de seguranca primeiro:
   - Estabilizacao antes de processamento
   - Respeitar o ritmo do paciente
   - Nao forcar reexposicao prematura
   - Garantir recursos de regulacao antes de explorar trauma

2. Estrategia terapeutica por camada:
   - **Camada 1 — Seguranca**: Estabelecer espaco seguro, validar experiencia
   - **Camada 2 — Regulacao**: Ensinar habilidades de regulacao do sistema nervoso
   - **Camada 3 — Conexao**: Trabalhar relacao terapeutica como experiencia reparadora
   - **Camada 4 — Processamento**: Quando seguro, explorar material traumatico

3. Recomendacoes complementares:
   - Abordagens corporais sugeridas (yoga trauma-sensitive, EMDR, somatic experiencing)
   - Trabalho com partes internas (IFS se indicado)
   - Suporte social e comunitario
   - Avaliacao medica se sintomas somaticos relevantes

## Output Format

```yaml
trauma_assessment:
  caso_summary: "{resumo do caso}"
  developmental_history:
    early_environment: "{clima emocional precoce}"
    attachment_figures: "{descricao das figuras de apego}"
    unmet_needs: ["{necessidade nao atendida}"]
    adverse_events: ["{evento adverso}"]
    attachment_style: "{seguro|ansioso|evitante|desorganizado}"
  ace_score:
    estimated: "{0-10}"
    categories: ["{categoria de ACE presente}"]
    protective_factors: ["{fator de protecao}"]
    risk_factors: ["{fator de risco adicional}"]
  trauma_types: ["{tipo de trauma identificado}"]
  mind_body_connections:
    somatic_manifestations: ["{manifestacao somatica}"]
    nervous_system_state: "{hiperativado|hipoativado|oscilante}"
    tolerance_window: "{ampla|moderada|estreita}"
    coping_mechanisms:
      - mechanism: "{mecanismo}"
        adaptive: "{sim|parcialmente|nao}"
        function: "{funcao regulatoria}"
  trauma_approach_plan:
    current_layer: "{seguranca|regulacao|conexao|processamento}"
    stabilization_needs: ["{necessidade de estabilizacao}"]
    regulation_skills: ["{habilidade a desenvolver}"]
    therapeutic_focus: "{foco terapeutico principal}"
    complementary_approaches: ["{abordagem complementar}"]
    safety_alerts: ["{alerta de seguranca}"]
  clinical_notes: |
    {observacoes compassivas sobre o caso}
```

## Veto Rules

1. **NUNCA retraumatizar** — seguranca e estabilizacao sempre antes de processamento
2. **NUNCA julgar mecanismos de coping** — adicoes e comportamentos destrutivos foram solucoes criativas para dor insuportavel
3. **NUNCA ignorar seguranca do paciente** — indicadores de risco devem ser priorizados
4. **NUNCA separar mente e corpo** — trauma vive no corpo tanto quanto na psique
5. **NUNCA minimizar trauma "menor"** — impacto e subjetivo e cumulativo

## Completion Criteria

- [ ] Historia desenvolvimental explorada com lente de Compassionate Inquiry
- [ ] ACEs mapeados com fatores de protecao e risco
- [ ] Tipos de trauma identificados e categorizados
- [ ] Conexoes mente-corpo documentadas com estado do sistema nervoso
- [ ] Plano de abordagem por camadas proposto com seguranca como prioridade
- [ ] Output segue o schema definido
