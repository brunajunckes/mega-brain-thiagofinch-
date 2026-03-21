---
task: analyzeTranscript()
responsavel: "@psych-chief"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: transcript
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: session_info
    tipo: object
    origem: User Input
    obrigatorio: false
  - campo: patient_history
    tipo: string
    origem: Session
    obrigatorio: false

Saida:
  - campo: transcript_analysis
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Transcricao segmentada em blocos tematicos"
  - "[ ] Momentos-chave identificados e marcados"
  - "[ ] Padroes comportamentais e emocionais extraidos"
  - "[ ] Mecanismos de defesa observados"
  - "[ ] Distorcoes cognitivas identificadas"
  - "[ ] Padroes relacionais mapeados"
  - "[ ] Analise multi-abordagem executada com 2-3 especialistas"
  - "[ ] Sintese clinica com hipoteses gerada"
  - "[ ] Direcionamento para proximas sessoes elaborado"
  - "[ ] Indicadores de risco verificados"
---

# Task: Analyze Transcript — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-009` |
| Command | `*analyze-transcript` |
| Orchestrator | `psych-chief` |
| Purpose | Analise de transcricoes de sessoes terapeuticas para extracao de padroes comportamentais, avaliacao clinica e direcionamento de novas abordagens |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `transcript` | User prompt | Sim | Transcricao completa ou parcial da sessao terapeutica |
| `session_info` | User prompt | Nao | Metadados da sessao (data, duracao, numero da sessao) |
| `patient_history` | Session | Nao | Historico do paciente, diagnosticos, sessoes previas |
| `therapist_notes` | User | Nao | Notas do terapeuta sobre impressoes da sessao |
| `focus_areas` | User | Nao | Areas especificas que o terapeuta quer analisar |
| `previous_analyses` | Session | Nao | Analises de sessoes anteriores para comparacao longitudinal |

## Preconditions

- Transcricao contem dialogo identificavel entre terapeuta (T) e paciente (P)
- Material tem extensao suficiente para analise significativa (minimo 10-15 trocas de fala)
- Consentimento etico do paciente para analise por IA (lembrar ao profissional)

## Alerta Etico Obrigatorio

**ANTES de qualquer analise, apresentar ao profissional:**

> **Lembrete Etico:** Esta analise e uma ferramenta de suporte clinico, nao substitui supervisao presencial.
> Certifique-se de que o paciente consentiu com o uso de IA para analise de sessoes.
> Os achados sao hipoteses para reflexao, nao diagnosticos definitivos.

---

## Phases

### Phase 1: Leitura e Segmentacao da Transcricao

1. **Leitura integral com atencao flutuante:**
   - Ler a transcricao completa sem interpretar prematuramente
   - Anotar impressoes iniciais e reacoes (equivalente a contratransferencia do leitor)
   - Identificar o "tom geral" da sessao (tenso, fluido, superficial, profundo)

2. **Segmentacao em blocos tematicos:**
   - Dividir a transcricao em segmentos por mudanca de tema ou dinamica
   - Para cada bloco, identificar:
     - Tema central do segmento
     - Quem iniciou a mudanca de tema (paciente ou terapeuta)
     - Nivel de profundidade emocional (superficial, medio, profundo)
     - Duracao relativa do segmento

3. **Identificacao de momentos-chave:**
   - **Momentos de abertura**: Quando o paciente revelou algo novo ou vulneravel
   - **Momentos de fechamento**: Quando o paciente recuou, mudou de assunto, intelectualizou
   - **Momentos de ruptura**: Quando houve tensao ou desconexao na relacao
   - **Momentos de reparacao**: Quando a conexao foi restabelecida
   - **Momentos de insight**: Quando o paciente demonstrou nova compreensao
   - **Momentos de resistencia**: Quando o paciente evitou ativamente um tema
   - **Momentos de emocao intensa**: Choro, raiva, silencio prolongado

4. **Marcacao de falas significativas:**
   - Falas do paciente que revelam crencas centrais
   - Falas do paciente com carga emocional alta
   - Falas do terapeuta que facilitaram abertura
   - Falas do terapeuta que podem ter fechado o paciente
   - Contradicoes entre falas (diz uma coisa, faz outra)
   - Repeticoes de palavras ou frases (temas inconscientes)

### Phase 2: Extracao de Padroes

1. **Padroes de fala recorrentes:**
   - Palavras ou expressoes repetidas pelo paciente
   - Metaforas recorrentes e seu significado potencial
   - Estruturas de frase reveladoras ("Eu sempre...", "Nunca consigo...", "Deveria...")
   - Uso de terceira pessoa para falar de si
   - Generalizacoes e absolutos ("todo mundo", "ninguem", "sempre", "nunca")
   - Tom predominante (vitimizacao, racionalizacao, minimizacao, dramatizacao)

2. **Temas emocionais predominantes:**
   - Emocoes nomeadas pelo paciente vs emocoes observadas no texto
   - Emocoes ausentes (que seriam esperadas mas nao aparecem)
   - Sequencias emocionais (uma emocao que leva a outra)
   - Discrepancia entre conteudo e afeto (fala de algo triste sorrindo)
   - Intensidade emocional por segmento (mapear picos e vales)

3. **Mecanismos de defesa observados:**
   - Racionalizacao (explicar excessivamente em vez de sentir)
   - Intelectualizacao (falar abstratamente de experiencias concretas)
   - Projecao (atribuir aos outros sentimentos proprios)
   - Negacao (minimizar ou negar impacto emocional)
   - Deslocamento (direcionar emocao a alvo seguro)
   - Humor defensivo (rir do que doi)
   - Mudanca de assunto (evitar temas dolorosos)
   - Somatizacao (trazer queixas fisicas quando o tema emocional aquece)

4. **Distorcoes cognitivas identificadas:**
   - Pensamento tudo-ou-nada em falas do paciente
   - Catastrofizacao sobre o futuro
   - Leitura mental sobre intencoes de terceiros
   - Personalizacao de eventos externos
   - Rotulacao de si ou dos outros
   - Raciocinio emocional ("sinto que sou um fracasso, entao sou")

5. **Padroes relacionais (transferencia/contratransferencia):**
   - Como o paciente se posiciona em relacao ao terapeuta (dependente, desafiador, sedutor, evasivo)
   - Como o terapeuta responde (acolhedor, distante, ansioso, diretivo)
   - Padroes relacionais do paciente que se repetem fora da terapia
   - Momentos onde a dinamica relacional muda significativamente
   - Pedidos implicitos do paciente ao terapeuta

6. **Momentos de resistencia:**
   - Mudancas abruptas de assunto
   - Respostas vagas ou monossilabicas em temas especificos
   - "Sim, mas..." repetitivo
   - Chegar atrasado, faltar, "esquecer" temas entre sessoes
   - Intelectualizacao quando o terapeuta se aproxima de material doloroso

7. **Momentos de abertura:**
   - Vulnerabilidade expressa espontaneamente
   - Conexao emocional com o material
   - Novos insights ou percepcoes
   - Pedidos de ajuda genuinos
   - Emocao congruente com o conteudo

### Phase 3: Avaliacao Multi-Abordagem

1. **Selecao de especialistas para analise:**
   Baseado nos padroes encontrados na Phase 2, selecionar 2-3 especialistas:

   | Padroes Encontrados | Especialista 1 | Especialista 2 | Foco |
   |-------------------|----------------|----------------|------|
   | Defesas, repeticoes, material latente | sigmund-freud | jacques-lacan | Dinamica inconsciente |
   | Distorcoes cognitivas, pensamentos automaticos | aaron-beck | daniel-kahneman | Padroes cognitivos |
   | Desregulacao emocional, impulsividade | marsha-linehan | carl-rogers | Regulacao e vinculo |
   | Indicadores de trauma, somatizacao | gabor-mate | marsha-linehan | Trauma e corpo |
   | Questoes existenciais, vazio, sentido | irvin-yalom | carl-jung | Sentido e proposito |
   | Problemas na relacao terapeutica | carl-rogers | sigmund-freud | Alianca e transferencia |
   | Arquetipos, simbolismo, individuacao | carl-jung | irvin-yalom | Profundidade simbolica |

2. **Analise por especialista:**
   Para cada especialista selecionado:
   - **Lente teorica**: Qual framework o especialista aplica
   - **Segmentos analisados**: Quais partes da transcricao sao relevantes para esta lente
   - **Achados**: O que o especialista identifica
   - **Significancia clinica**: Por que isso importa para o tratamento
   - **Recomendacoes**: O que o especialista sugeriria como proximo passo

3. **Registro de divergencias:**
   - Onde os especialistas concordam (convergencias fortes)
   - Onde os especialistas discordam (tensoes produtivas)
   - O que cada perspectiva adiciona que as outras nao captam

### Phase 4: Sintese e Direcionamento

1. **Integracao das analises:**
   - Reunir achados de todos os especialistas
   - Identificar convergencias: quando multiplas lentes apontam o mesmo fenomeno
   - Identificar divergencias: quando as lentes oferecem leituras diferentes
   - Mapear areas "cegas" — o que nenhuma lente captou mas merece atencao

2. **Geracao de hipoteses clinicas:**
   - Formular 2-3 hipoteses sobre o funcionamento do paciente
   - Cada hipotese deve ser:
     - Baseada em evidencias da transcricao
     - Falsificavel (pode ser testada)
     - Clinicamente util (direciona o tratamento)
   - Classificar hipoteses por nivel de confianca (alta, media, baixa)

3. **Guia para proximas sessoes:**
   - **Perguntas sugeridas**: Perguntas que o terapeuta pode fazer para testar hipoteses
   - **Areas a explorar**: Temas que merecem aprofundamento
   - **Recomendacoes de abordagem**: Mudancas na postura terapeutica ou tecnica
   - **Tecnicas a considerar**: Intervencoes especificas de cada abordagem
   - **O que observar**: Indicadores para confirmar ou refutar hipoteses

4. **Analise longitudinal (se houver sessoes previas):**
   - Comparar padroes entre sessoes
   - Identificar evolucoes (melhora, piora, estagnacao)
   - Mapear temas que persistem vs temas resolvidos
   - Avaliar efetividade das intervencoes tentadas

5. **Alertas e indicadores de risco:**
   - Indicadores de risco suicida ou de autolesao
   - Sinais de deterioracao clinica
   - Questoes eticas que merecem atencao
   - Necessidade de encaminhamento ou intervencao de urgencia

## Output Format

```yaml
transcript_analysis:
  session_info:
    date: "{data da sessao}"
    duration: "{duracao}"
    session_number: "{numero}"
    general_tone: "{tom geral da sessao}"
  segmentation:
    key_moments:
      - type: "{abertura|fechamento|ruptura|reparacao|insight|resistencia|emocao_intensa}"
        location: "{referencia no texto}"
        description: "{descricao do momento}"
        significance: "{por que e clinicamente relevante}"
    thematic_blocks:
      - theme: "{tema do bloco}"
        initiated_by: "{paciente|terapeuta}"
        depth: "{superficial|medio|profundo}"
        emotional_intensity: "{baixa|media|alta}"
  patterns:
    recurring_speech:
      - pattern: "{padrao de fala}"
        frequency: "{quantas vezes aparece}"
        possible_meaning: "{significado potencial}"
    emotional_themes:
      - theme: "{tema emocional}"
        named_vs_observed: "{nomeado pelo paciente|observado na analise}"
        intensity: "{baixa|media|alta}"
    defense_mechanisms:
      - defense: "{mecanismo de defesa}"
        evidence: "{trecho ou comportamento que evidencia}"
        frequency: "{isolado|recorrente|pervasivo}"
        protects_against: "{contra que ansiedade protege}"
    cognitive_distortions:
      - distortion: "{tipo de distorcao}"
        evidence: "{fala ou pensamento que evidencia}"
        impact: "{como afeta o funcionamento}"
    relational_patterns:
      - pattern: "{padrao relacional}"
        in_session: "{como aparece na sessao}"
        outside_session: "{como aparece na vida}"
        transference_type: "{tipo de transferencia se aplicavel}"
    resistance_moments:
      - moment: "{descricao do momento de resistencia}"
        trigger: "{o que o precedeu}"
        defense_used: "{mecanismo de defesa ativado}"
    opening_moments:
      - moment: "{descricao do momento de abertura}"
        facilitated_by: "{o que facilitou a abertura}"
        depth_reached: "{nivel de profundidade alcancado}"
  multi_approach_analysis:
    - specialist: "{agent-id}"
      lens: "{framework teorico usado}"
      segments_analyzed: ["{segmentos da transcricao}"]
      findings: "{achados principais}"
      significance: "{importancia clinica}"
      recommendations: "{recomendacoes do especialista}"
    - specialist: "{agent-id}"
      lens: "{framework teorico usado}"
      segments_analyzed: ["{segmentos da transcricao}"]
      findings: "{achados principais}"
      significance: "{importancia clinica}"
      recommendations: "{recomendacoes do especialista}"
  synthesis:
    clinical_hypotheses:
      - hypothesis: "{formulacao da hipotese}"
        evidence: ["{evidencias na transcricao}"]
        confidence: "{alta|media|baixa}"
        testable_by: "{como testar esta hipotese}"
    convergences:
      - finding: "{achado convergente}"
        agreed_by: ["{especialistas que concordam}"]
        strength: "{forca da convergencia}"
    divergences:
      - finding: "{achado divergente}"
        perspectives: ["{perspectiva 1}", "{perspectiva 2}"]
        productive_tension: "{por que a divergencia e util}"
    blind_spots: ["{area nao coberta pelas analises}"]
  next_session_guidance:
    suggested_questions:
      - question: "{pergunta sugerida}"
        purpose: "{por que fazer esta pergunta}"
        hypothesis_tested: "{qual hipotese testa}"
    areas_to_explore:
      - area: "{area a explorar}"
        rationale: "{por que merece aprofundamento}"
        approach: "{como abordar}"
    approach_recommendations:
      - recommendation: "{recomendacao de abordagem}"
        rationale: "{justificativa clinica}"
        specialist_source: "{de qual perspectiva vem}"
    techniques_to_consider:
      - technique: "{tecnica sugerida}"
        from_approach: "{abordagem de origem}"
        when_to_use: "{quando e indicada}"
        expected_outcome: "{resultado esperado}"
  longitudinal_notes:
    evolution: "{comparacao com sessoes anteriores se disponivel}"
    persistent_themes: ["{tema que persiste}"]
    resolved_themes: ["{tema resolvido}"]
    intervention_effectiveness: "{avaliacao das intervencoes}}"
  alerts:
    risk_indicators:
      - indicator: "{indicador de risco}"
        severity: "{baixo|moderado|alto|critico}"
        recommended_action: "{acao recomendada}"
    ethical_considerations:
      - consideration: "{questao etica}"
        action_needed: "{acao necessaria}"
```

## Veto Rules

1. **NUNCA diagnosticar com base em uma unica transcricao** — padroes precisam de confirmacao longitudinal
2. **NUNCA ignorar indicadores de risco** (suicidio, autolesao, violencia) — estes devem ser sinalizados IMEDIATAMENTE como alerta prioritario
3. **NUNCA substituir supervisao clinica presencial** — esta analise e suporte, nao supervisao
4. **NUNCA analisar sem consentimento etico do paciente** — lembrar ao profissional sobre consentimento no inicio de cada analise
5. **NUNCA simplificar padroes complexos em rotulos** — manter a complexidade e nuance do material clinico
6. **NUNCA interpretar silencio ou ausencia sem contexto** — silencio pode significar muitas coisas
7. **NUNCA fornecer certezas** — toda analise e hipotetica e deve ser tratada como tal
8. **NUNCA ignorar o contexto cultural do paciente** — padroes devem ser lidos no contexto sociocultural

## Completion Criteria

- [ ] Transcricao lida integralmente com atencao flutuante
- [ ] Segmentacao em blocos tematicos realizada
- [ ] Momentos-chave identificados e classificados (abertura, fechamento, ruptura, insight, resistencia)
- [ ] Padroes de fala recorrentes extraidos com significado potencial
- [ ] Temas emocionais predominantes mapeados
- [ ] Mecanismos de defesa observados e documentados
- [ ] Distorcoes cognitivas identificadas com evidencia
- [ ] Padroes relacionais e transferenciais mapeados
- [ ] Momentos de resistencia e abertura contrastados
- [ ] 2-3 especialistas selecionados e analise multi-abordagem executada
- [ ] Convergencias e divergencias entre perspectivas identificadas
- [ ] Hipoteses clinicas geradas com evidencias e nivel de confianca
- [ ] Perguntas sugeridas para proximas sessoes elaboradas
- [ ] Areas a explorar e recomendacoes de abordagem listadas
- [ ] Tecnicas especificas sugeridas com contexto de uso
- [ ] Indicadores de risco verificados e alertados se presentes
- [ ] Questoes eticas revisadas
- [ ] Output segue o schema definido
