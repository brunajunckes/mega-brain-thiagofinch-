---
task: existentialExploration()
responsavel: "@irvin-yalom"
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
  - campo: existential_exploration
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Preocupacoes existenciais identificadas"
  - "[ ] Aqui-e-agora explorado"
  - "[ ] Trabalho com sentido realizado"
  - "[ ] Direcionamento terapeutico proposto"
---

# Task: Existential Exploration — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-007` |
| Command | `*existential-exploration` |
| Orchestrator | `irvin-yalom` |
| Purpose | Exploracao das preocupacoes existenciais e trabalho com sentido |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `caso` | User prompt / Routing | Sim | Descricao do caso e questoes existenciais presentes |
| `contexto_clinico` | Session | Nao | Historico, fase de vida, eventos recentes |
| `life_stage` | User | Nao | Momento de vida do paciente (transicao, luto, crise) |

## Preconditions

- Caso apresenta questoes de sentido, proposito, mortalidade, liberdade ou isolamento
- Paciente em momento de reflexao existencial (crise, transicao, perda)

## Phases

### Phase 1: Identificacao das Preocupacoes Existenciais

1. Mapear os quatro grandes temas existenciais (Yalom):
   - **Morte**: Consciencia da finitude, medo da morte, negacao da mortalidade
   - **Liberdade**: Responsabilidade por escolhas, angustia da liberdade, fuga para determinismo
   - **Isolamento existencial**: Solidao fundamental, distinacao entre isolamento interpessoal e existencial
   - **Falta de sentido**: Vazio existencial, busca de proposito, ausencia de significado

2. Avaliar qual tema e predominante no caso:
   - Qual preocupacao gera mais angustia
   - Como o paciente lida com ela (enfrentamento vs evitacao)
   - Que defesas existenciais esta usando (crencas de especialidade, companheiro final, etc.)

3. Identificar gatilhos existenciais recentes:
   - Perda significativa (luto, separacao, doenca)
   - Marcos de idade (aniversarios redondos, "crise da meia-idade")
   - Confrontacao com a mortalidade (propria ou de outros)
   - Transicoes de vida (aposentadoria, ninho vazio, mudanca de carreira)

### Phase 2: Exploracao do Aqui-e-Agora

1. Trazer a dinamica existencial para o momento presente:
   - Como o tema existencial se manifesta NA SESSAO
   - O que acontece entre terapeuta e paciente quando o tema surge
   - Que emocoes emergem no aqui-e-agora

2. Usar a relacao terapeutica como microcosmo:
   - Como o paciente se relaciona com o terapeuta reflete como se relaciona com a vida
   - Onde o paciente evita profundidade na relacao
   - Momentos de autenticidade vs momentos de fachada

3. Promover encontro genuino:
   - Terapeuta como "companheiro de viagem", nao como expert distante
   - Uso terapeutico da autorrevelacao do terapeuta
   - Momentos de reconhecimento mutuo da condicao humana

### Phase 3: Trabalho com Sentido

1. Explorar fontes de sentido do paciente:
   - **Criacao**: O que o paciente cria ou contribui para o mundo
   - **Experiencia**: O que traz beleza, conexao, transcendencia
   - **Atitude**: Que sentido encontra no sofrimento inevitavel (Frankl)
   - **Encontro**: Relacoes que trazem significado

2. Diferenciar tipos de vazio:
   - Vazio por perda (algo que existia e foi perdido)
   - Vazio por ausencia (algo que nunca foi construido)
   - Vazio existencial fundamental (confrontacao com a falta de sentido inerente)

3. Trabalhar com "rippling" (ondulacao):
   - Como as acoes do paciente afetam outros
   - Que legado esta sendo construido
   - Conexao com algo maior que si mesmo

### Phase 4: Direcionamento Terapeutico

1. Propor direcoes de trabalho:
   - Qual preocupacao existencial priorizar
   - Que tipo de exploracao e mais indicado (reflexiva, experiencial, relacional)
   - Como usar o aqui-e-agora como ferramenta
   - Quando confrontar e quando sustentar

2. Sugerir intervencoes existenciais:
   - Exercicio da "cadeira vazia" para dialogos internos
   - "Revisao de vida" para trabalho com sentido
   - Exploracao de sonhos com lente existencial
   - Meditacao sobre finitude (quando terapeutico)

3. Indicar limites e cuidados:
   - Quando ansiedade existencial e produtiva vs paralisante
   - Diferenciar angustia existencial de depressao clinica
   - Quando encaminhar para avaliacao psiquiatrica

## Output Format

```yaml
existential_exploration:
  caso_summary: "{resumo do caso}"
  concerns:
    death: "{como a finitude aparece no caso}"
    freedom: "{como liberdade/responsabilidade aparece}"
    isolation: "{como isolamento existencial aparece}"
    meaninglessness: "{como falta de sentido aparece}"
    predominant: "{tema predominante}"
    existential_defenses: ["{defesa existencial usada}"]
    triggers: ["{gatilho existencial recente}"]
  here_and_now:
    session_dynamics: "{como o tema se manifesta na sessao}"
    relational_patterns: "{padroes na relacao terapeutica}"
    authenticity_moments: "{momentos de genuinidade}"
    avoidance_moments: "{momentos de evitacao}"
  meaning_work:
    current_sources: ["{fonte de sentido atual}"]
    lost_sources: ["{fonte de sentido perdida}"]
    potential_sources: ["{fonte de sentido potencial}"]
    void_type: "{perda|ausencia|fundamental}"
    rippling: "{como o paciente afeta outros}"
  therapeutic_direction:
    priority_concern: "{preocupacao a priorizar}"
    exploration_type: "{reflexiva|experiencial|relacional}"
    suggested_interventions: ["{intervencao sugerida}"]
    here_and_now_use: "{como usar o aqui-e-agora}"
    limits_and_care: ["{limite ou cuidado}"]
  clinical_notes: |
    {reflexoes sobre o caso e a condicao humana compartilhada}
```

## Veto Rules

1. **NUNCA banalizar angustia existencial** — questoes de sentido e mortalidade merecem profundidade
2. **NUNCA oferecer respostas prontas sobre sentido** — sentido e encontrado pelo paciente, nao prescrito
3. **NUNCA ignorar ideacao suicida** — diferenciar angustia existencial de risco iminente
4. **NUNCA filosofar sem enraizar no experiencial** — existencialismo clinico e vivido, nao abstrato
5. **NUNCA ignorar a dimensao relacional** — o encontro terapeutico genuino e a intervencao principal

## Completion Criteria

- [ ] Quatro preocupacoes existenciais avaliadas com tema predominante
- [ ] Aqui-e-agora explorado com dinamica da sessao
- [ ] Fontes de sentido mapeadas (atuais, perdidas, potenciais)
- [ ] Direcionamento terapeutico proposto com intervencoes
- [ ] Limites e cuidados indicados
- [ ] Output segue o schema definido
