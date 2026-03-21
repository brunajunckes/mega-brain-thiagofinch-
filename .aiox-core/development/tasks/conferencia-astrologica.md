---
task: conferenciaAstrologica()
responsavel: Vega (Conferente de Qualidade)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Executa conferencia completa e entrega score + feedback (1 prompt)
- interactive: Apresenta score por dimensao, permite drill-down em erros (2-4 prompts) [DEFAULT]

**Entrada:**
- campo: relatorio_md
  tipo: string (Markdown narrativo completo)
  origem: Agente 1 (output fase_1_analise)
  obrigatorio: true
  validacao: |
    Nao vazio
    Contem pelo menos secoes I-V do relatorio narrativo
    Mais de 500 palavras
    Contem blocos "A Mecanica", "A Metafora", "A Vivencia" (framework tripartite)
    NAO contem {{PLACEHOLDER}} nao preenchidos (se tiver, e o arquivo errado)
  nota: |
    IMPORTANTE: O relatorio a conferir e o NARRATIVO COMPLETO gerado pelo Agente 1,
    NAO o output bruto do script astrologer-api.js. O output bruto e apenas uma tabela
    de dados sem interpretacoes. O relatorio narrativo contem: Panorama Celeste com
    paragrafos, eventos com framework tripartite, materia-prima com campos preenchidos.
    Se o arquivo recebido contem {{PLACEHOLDER}}, pedir o arquivo correto.

- campo: dados_json
  tipo: object (JSON estruturado)
  origem: Agente 1 (output fase_1_analise)
  obrigatorio: true
  validacao: |
    Segue astro-data-schema.json
    Contem metadata, planetPositions, events
    events.length >= 3

- campo: eventos_rankeados
  tipo: array
  origem: Agente 1 (output fase_1_analise)
  obrigatorio: true
  validacao: |
    Array nao vazio
    Cada evento tem type, label, weight, classification

**Saida:**
- campo: score
  tipo: number (0-10, 1 decimal)
  destino: State (pipeline)
  persistido: false

- campo: feedback
  tipo: string (Markdown formatado)
  destino: Agente 1 (em caso de rejeicao) ou State (em caso de aprovacao)
  persistido: true

- campo: relatorio_validado
  tipo: string (Markdown com selo de qualidade)
  destino: Agente 3 (@astro-writer)
  persistido: true
  description: Relatorio original + header de aprovacao + score

- campo: erros_encontrados
  tipo: array
  destino: State (para tracking de qualidade ao longo do tempo)
  persistido: false

pre-conditions:
  - [ ] Relatorio MD existe e nao esta vazio
    tipo: pre-condition
    blocker: true
    error_message: "Relatorio MD nao encontrado ou vazio. Executar Fase 1 primeiro."

  - [ ] JSON de dados brutos existe e e valido
    tipo: pre-condition
    blocker: true
    error_message: "JSON de dados brutos nao encontrado ou invalido."

  - [ ] Lista de eventos rankeados disponivel
    tipo: pre-condition
    blocker: true
    error_message: "Lista de eventos rankeados nao disponivel."

post-conditions:
  - [ ] Score calculado e entregue (0-10)
  - [ ] Feedback estruturado gerado
  - [ ] Decisao de gate tomada (aprovar/retornar)
  - [ ] Se aprovado: relatorio_validado com selo de qualidade
  - [ ] Se rejeitado: feedback com erros especificos e dados de referencia

acceptance-criteria:
  - [ ] Todos os dados tecnicos do relatorio cruzados com JSON
    blocker: true
  - [ ] Score reflete a rubrica objetiva (nao subjetivo)
  - [ ] Feedback de rejeicao e acionavel (Agente 1 consegue corrigir sem adivinhar)
  - [ ] Relatorio validado inclui selo com score e data

error_handling:
  strategy: fail-fast
  common_errors:
    - name: JSON Invalido
      cause: JSON nao parsea ou nao segue schema
      resolution: Reportar erro e pedir reexecucao da Fase 1
    - name: Relatorio Incompleto
      cause: Secoes faltantes no template
      resolution: Score automatico 0 na dimensao Completude, feedback listando secoes faltantes
    - name: Dados Inconsistentes
      cause: JSON e relatorio referem-se a periodos diferentes
      resolution: Verificar metadata.startDate/endDate vs cabecalho do relatorio

performance:
  duration_expected: "2-5 min"
  cost_estimated: "~5,000-10,000 tokens para analise comparativa"
  token_usage: "Leitura de 2 documentos + geracao de feedback"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, astrologia, content-pipeline, agente-2, quality-gate]
  created_at: "2026-02-25"
  pipeline_position: 2
  upstream_producer: astro-analyst
  downstream_consumers: [astro-writer]
---

# Conferencia Astrologica

## Proposito

Validar o relatorio astrologico do Agente 1 (Sirius) contra os dados brutos da API, avaliando precisao tecnica, completude, tom e qualidade geral. Serve como quality gate do pipeline: so libera o conteudo para a Fase 3 se o score atingir o threshold (>= 7/10).

## Quando Usar

**Use quando:**
- O Agente 1 entregou o relatorio e o JSON brutos
- O workflow de conteudo Pelicula avanca da Fase 1 para a Fase 2
- Precisa validar que os dados narrativos conferem com os dados computados

**Nao use quando:**
- Nao tem JSON bruto para cruzar (conferencia impossivel sem dados de referencia)
- O relatorio ainda esta em rascunho (esperar o Agente 1 finalizar)

## Instrucoes

### 1. Carregar e Validar Inputs

- [ ] Ler o relatorio MD completo
- [ ] **Verificar que e o relatorio NARRATIVO** (nao o output bruto do script):
  - Contem secoes "I. PANORAMA CELESTE", "III. EVENTOS RANKEADOS" com blocos tripartite?
  - Contem blocos "A Mecanica", "A Metafora", "A Vivencia"?
  - NAO contem {{PLACEHOLDER}} nao preenchidos?
  - Se falhar: **ABORTAR** — "Este e o output bruto do script, nao o relatorio narrativo. Fornecer o arquivo correto."
- [ ] Ler o JSON de dados brutos
- [ ] Confirmar que o JSON segue o schema (`astro-data-schema.json`)
- [ ] Confirmar que ambos referem-se ao mesmo periodo (cruzar datas)
- [ ] Carregar a lista de eventos rankeados

**Se algum input falhar:** Abortar e reportar o problema especifico.

**Como identificar o arquivo correto:**
- Relatorio narrativo: `relatorio-YYYY-MM-DD-YYYY-MM-DD.md` — contem paragrafos, metaforas, vivencias
- Output bruto do script: `relatorio-semana-*.md` — contem apenas tabelas e bullets numericos

### 2. Dimensao 1 — Precisao Tecnica (25%)

Cruzar cada dado tecnico do relatorio com o JSON bruto.

**Checklist:**

- [ ] **Posicoes planetarias:** Para cada planeta mencionado no relatorio, comparar com `planetPositions.weekStart[]`
  - Tolerancia de grau: +/- 0.5°
  - Signo deve ser identico
  - Status retrogrado deve conferir
- [ ] **Aspectos:** Para cada aspecto mencionado, encontrar no `aspects[]` ou `events[]`
  - Planetas envolvidos devem conferir
  - Tipo de aspecto (conjuncao, oposicao, etc) deve conferir
  - Orbe reportado deve estar dentro de tolerancia (+/- 0.5°)
- [ ] **Eclipses/Fases lunares:** Cruzar com `lunarPhases[]`
  - Tipo de fase deve conferir
  - Signo deve conferir
  - Status de eclipse (true/false) deve conferir
- [ ] **Ingressos:** Cruzar com `ingresses[]`
  - Planeta e signos (de/para) devem conferir
- [ ] **Retrogradacoes:** Cruzar com `retrogradeChanges[]` e `planetPositions.weekStart[].retrograde`

**Scoring:**
- 10/10: Zero erros tecnicos
- 8-9/10: 1-2 erros menores (arredondamento, casa decimal)
- 6-7/10: 1 erro de signo ou planeta errado
- 4-5/10: Multiplos erros de posicao/signo
- 0-3/10: Dados fundamentalmente incorretos

### 3. Dimensao 2 — Rankeamento (15%)

Validar que a ordem dos eventos segue os pesos do sistema.

- [ ] Extrair os eventos do relatorio na ordem apresentada
- [ ] Comparar com `events[]` ordenados por `weight` descendente
- [ ] Verificar: evento #1 do relatorio = evento de maior peso no JSON?
- [ ] Verificar: top 3 estao na ordem correta?
- [ ] Verificar: eclipses (peso >= 100) estao no topo se existem?
- [ ] Verificar: nao ha aspecto menor (ambiente) rankeado acima de um maior (estrutural/critico)?

**Scoring:**
- 10/10: Ordem perfeita para top 5
- 8-9/10: Top 3 correto, minor shuffles nos demais
- 6-7/10: Evento #1 correto, mas 2-3 fora de ordem
- 4-5/10: Evento #1 errado
- 0-3/10: Rankeamento completamente desalinhado

### 4. Dimensao 3 — Completude (20%)

Verificar presenca e substancia de cada secao do relatorio narrativo.

**Estrutura esperada do relatorio do Agente 1 (5 secoes):**

- [ ] **Secao I — Panorama Celeste:** Presente? Minimo 4 frases narrativas? Menciona evento principal, tom da semana e palavra-chave?
- [ ] **Secao II — Mapa de Transitos:** Tabela completa com 14 planetas rastreados? Ingressos listados? Retrogrados ativos?
- [ ] **Secao III — Eventos Rankeados:** Pelo menos 3 eventos com framework tripartite completo (Mecanica + Metafora + Vivencia + Sintomatologia)?
- [ ] **Secao IV — Materia-Prima:** Campos preenchidos para cada agente downstream?
  - Para Agente 3 (Post): Titulo, subtitulo, keywords SEO, metafora central, gancho emocional
  - Para Agente 4 (Video): Talking points (3-5), analogia visual
  - Para Agente 6 (Curadoria): Temas, arquetipos, elemento dominante
  - Para Agente 7 (Ritual): Materia-prima ritual, elemento, objetivo experiencial
  - Referencias Mitologicas
- [ ] **Secao V — Dados Brutos:** Resumo de metricas (dias processados, eventos, ingressos) + referencia ao arquivo JSON

**NAO avaliar:**
- "Guia por Casa" / 12 interpretacoes por casa — responsabilidade dos Agentes 3 e 5
- Post Substack — responsabilidade do Agente 3

**Scoring:**
- 10/10: Todas as 5 secoes completas e substanciais
- 8-9/10: 1 secao com campo vazio nao-critico
- 6-7/10: 1 secao inteira ausente ou materia-prima muito incompleta
- 4-5/10: 2+ secoes ausentes
- 0-3/10: Relatorio esqueleto / template nao preenchido

### 5. Dimensao 4 — Framework Tripartite (15%)

Avaliar qualidade das narrativas dos top 3 eventos.

Para cada evento dos top 3:
- [ ] **Mecanica presente?** Cita dados astronomicos puros com graus e orbes?
- [ ] **Mecanica correta?** Dados batem com o JSON?
- [ ] **Metafora presente?** Analogia, imagem poetica ou mito?
- [ ] **Metafora relevante?** A metafora traduz o aspecto de forma clara?
- [ ] **Vivencia presente?** Experiencia concreta no corpo/emocao/vida?
- [ ] **Vivencia conectada?** Liga-se logicamente a mecanica e metafora?
- [ ] **Cada bloco substantivo?** Minimo 2-3 frases por bloco?

**Scoring:**
- 10/10: Top 3 com M+M+V exemplares
- 8-9/10: Top 3 com M+M+V completos mas 1 bloco superficial
- 6-7/10: 1 evento com bloco faltante
- 4-5/10: 2 eventos sem framework completo
- 0-3/10: Framework nao aplicado

### 6. Dimensao 5 — Tom e Marca (15%)

Verificar aderencia ao brand DNA da Pelicula Sideral.

- [ ] **Scan negativo:** Buscar termos proibidos no relatorio:
  - "cuidado com..." -> REJEITAR
  - "perigo" -> REJEITAR
  - "pode trazer problemas" -> REJEITAR
  - "fase dificil" -> SUGERIR ALTERNATIVA
  - "eclipse como punicao" -> REJEITAR
  - "retrogrado e ruim" -> REJEITAR
- [ ] **Scan positivo:** Confirmar presenca de:
  - Metaforas de cinema, teatro ou literatura
  - Tom poetico mas acessivel
  - Ao menos 1 referencia mitologica
  - Linguagem que convida, nao que assusta
- [ ] **Vocabulario:** Usa "ceu" em vez de "cosmos"? "transito" em vez de "aspecto planetario"? Nao abusa de "energia"?

**Scoring:**
- 10/10: Tom impecavel, 100% on-brand
- 8-9/10: Tom bom, 1 deslize menor
- 6-7/10: 1 frase problematica (terrorismo astrologico leve)
- 4-5/10: Multiplas frases fora do tom
- 0-3/10: Tom completamente errado (alarmista, hermetico, ou generico)

### 7. Dimensao 6 — Materia-Prima (10%)

Verificar se os insumos para agentes downstream estao completos na Secao IV do relatorio.

- [ ] **Para Agente 3 (Post):** Titulo sugerido, subtitulo poetico, keywords SEO, metafora central, gancho emocional
- [ ] **Para Agente 4 (Video):** Talking points (3-5 minimo), analogia visual
- [ ] **Para Agente 6 (Curadoria):** Temas de pesquisa cultural, arquetipos ativados, elemento dominante
- [ ] **Para Agente 7 (Ritual):** Materia-prima ritual, elemento do ritual, objetivo experiencial
- [ ] **Geral:** Referencias mitologicas (com contexto, nao apenas nomes)
- [ ] **Qualidade:** Campos sao substanciais e uteis (nao genericos tipo "Saturno = estrutura")

**Scoring:**
- 10/10: Todos os campos preenchidos com substancia — agentes downstream podem comecar a trabalhar diretamente
- 8-9/10: 1-2 campos vagos ou genericos demais
- 6-7/10: 3-4 campos vazios ou sem substancia
- 4-5/10: Uma categoria inteira de agente sem insumos
- 0-3/10: Secao inteira vazia ou com placeholders

### 8. Calcular Score Ponderado

```
Score Final = (D1 * 0.25) + (D2 * 0.15) + (D3 * 0.20) + (D4 * 0.15) + (D5 * 0.15) + (D6 * 0.10)
```

Arredondar para 1 casa decimal.

### 9. Gerar Feedback

**Se Score >= 7 (APROVADO):**
- [ ] Gerar feedback no formato de aprovacao (ver agent definition)
- [ ] Criar `relatorio_validado` = relatorio original + header com selo:

```markdown
---
SELO DE QUALIDADE — Conferencia Astrologica
Score: {score}/10
Conferente: Vega (@astro-conferencia)
Data: {data}
Status: APROVADO
---
{relatorio_original}
```

- [ ] Entregar relatorio_validado para pipeline state

**Se Score < 7 (RETORNAR):**
- [ ] Gerar feedback no formato de rejeicao (ver agent definition)
- [ ] Listar TODOS os erros encontrados com:
  - Severidade: [CRITICO] ou [MELHORIA]
  - Localizacao no relatorio (secao e trecho)
  - Dado correto do JSON para referencia
  - Sugestao de correcao
- [ ] Entregar feedback ao Agente 1 para correcao

### 10. Entregar

No modo interativo:
- [ ] Apresentar score geral primeiro
- [ ] Perguntar: "Quer ver o detalhamento por dimensao?"
- [ ] Se rejeitado, perguntar: "Envio o feedback ao Agente 1 para correcao?"

No modo yolo:
- [ ] Entregar tudo de uma vez (score + feedback + decisao)

## Criterios de Sucesso

A task e bem-sucedida quando:
1. O arquivo correto foi conferido (relatorio narrativo, NAO output bruto do script)
2. Todos os dados tecnicos foram cruzados com o JSON
3. Score reflete a rubrica objetiva (6 dimensoes ponderadas)
4. Feedback e acionavel e especifico
5. Decisao de gate e clara (aprovar ou retornar)
6. Se aprovado, relatorio_validado contem selo de qualidade
7. Se rejeitado, Agente 1 consegue corrigir apenas lendo o feedback
8. NAO penalizou por ausencia de "Guia por Casa" (responsabilidade dos Agentes 3/5)
