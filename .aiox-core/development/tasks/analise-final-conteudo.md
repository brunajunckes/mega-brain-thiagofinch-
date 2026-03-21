---
task: analiseFinalConteudo()
responsavel: Rigel (Editor Final & Consolidador)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Analisa tudo e entrega score + relatorio completo (1 prompt)
- interactive: Apresenta checklist primeiro, depois score por dimensao, depois decisao [DEFAULT]

**Entrada:**
- campo: post_completo
  tipo: string (Markdown)
  origem: Agente 3 (@astro-writer)
  obrigatorio: true
  validacao: Post Substack com free + paid + 12 ascendentes

- campo: roteiro_video
  tipo: string (Markdown)
  origem: Agente 4 (@astro-roteirista)
  obrigatorio: true
  validacao: 7 blocos com timing + talking points

- campo: roteiro_reels
  tipo: string (Markdown)
  origem: Agente 4 (@astro-roteirista)
  obrigatorio: true
  validacao: Gancho + 3 bullets + CTA + legenda

- campo: roteiros_casas
  tipo: array (12 strings)
  origem: Agente 5 (@astro-casas)
  obrigatorio: true
  validacao: 12 scripts, cada um 120-180 palavras

- campo: curadoria
  tipo: string (Markdown)
  origem: Agente 6 (@astro-curador)
  obrigatorio: true
  validacao: 4-8 obras com mini-interpretacoes

- campo: ritual
  tipo: object
  origem: Agente 7 (@astro-ritualista)
  obrigatorio: true
  validacao: Versao free + paid + narracao parcial + completa

- campo: instrucoes_edicao
  tipo: string
  origem: Agente 4 (@astro-roteirista)
  obrigatorio: false

- campo: relatorio_validado
  tipo: string (Markdown)
  origem: Agente 2 (@astro-conferencia) — referencia de dados corretos
  obrigatorio: true
  nota: Usado como fonte de verdade para cruzamento de dados

**Saida:**
- campo: relatorio_consolidacao
  tipo: string (Markdown)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: Score + dimensoes + erros + decisao

- campo: score_final
  tipo: number (0-10)
  destino: State
  persistido: false

- campo: decisao
  tipo: string (APROVADO | RETORNAR)
  destino: State
  persistido: false

- campo: aula_consolidada
  tipo: string (Markdown)
  destino: Fase 6 (se aprovado)
  persistido: true
  descricao: Todos os outputs organizados num unico documento

pre-conditions:
  - [ ] Todos os 5 outputs dos agentes 3-7 disponiveis
    tipo: pre-condition
    blocker: true
    error_message: "Outputs incompletos. Verificar quais agentes da Fase 4 nao entregaram."

  - [ ] Relatorio validado (Agente 2) disponivel como referencia de dados
    tipo: pre-condition
    blocker: true
    error_message: "Relatorio validado nao encontrado. Necessario como fonte de verdade."

post-conditions:
  - [ ] Score ponderado calculado (6 dimensoes)
  - [ ] Relatorio de consolidacao gerado com erros e melhorias
  - [ ] Decisao de gate tomada (APROVAR se >= 7, RETORNAR se < 7)
  - [ ] Se aprovado: aula consolidada montada
  - [ ] Se rejeitado: feedback especifico para cada agente que precisa corrigir

acceptance-criteria:
  - [ ] Dados tecnicos cruzados entre todos os outputs
    blocker: true
  - [ ] Contradicoes identificadas com localizacao precisa
  - [ ] Feedback de rejeicao e acionavel (agente sabe exatamente o que corrigir)
  - [ ] Score reflete a rubrica objetiva (6 dimensoes ponderadas)

error_handling:
  strategy: partial-analysis
  common_errors:
    - name: Output ausente
      cause: Um ou mais agentes nao entregaram
      resolution: |
        Analisar o que esta disponivel. Score automatico 0 na dimensao
        Completude para componentes ausentes. Listar gaps no relatorio.
    - name: Formatos incompativeis
      cause: Outputs nao seguem o formato esperado
      resolution: Analisar conteudo mesmo com formato diferente. Flag no relatorio.

performance:
  duration_expected: "5-10 min"
  token_usage: "~15,000-25,000 tokens (leitura de todos os outputs + analise)"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, consolidacao, content-pipeline, agente-8, quality-gate]
  created_at: "2026-02-25"
  pipeline_position: 5
  upstream_producers: [astro-writer, astro-roteirista, astro-casas, astro-curador, astro-ritualista]
  downstream_consumers: [export-substack]
---

# Analise Final de Conteudo

## Proposito

Receber todos os outputs da Fase 4 (post, roteiro video, 12 audios, curadoria, ritual) e analisar como um conjunto coeso. Verificar coerencia de dados, narrativa, tom e completude. Produzir relatorio de consolidacao com score ponderado e decisao de gate (aprovar para Fase 6 ou retornar com feedback).

## Quando Usar

**Use quando:**
- Todos os agentes da Fase 4 entregaram seus outputs
- O workflow Pelicula esta na Fase 5
- Precisa validar a aula completa antes de publicacao

**Nao use quando:**
- Fase 4 ainda esta em andamento (outputs incompletos)
- Quer avaliar um unico output isolado (use o agente de conferencia especifico)
- Quer editar conteudo (este agente analisa, nao edita)

## Instrucoes

### Step 1 — Coletar e Verificar Presenca dos Outputs

Checklist de componentes:

- [ ] **Post Substack** (Agente 3 / Lyra):
  - Parte gratuita (75%) presente?
  - Parte paga (25%) presente?
  - 12 interpretacoes por ascendente?
  - Titulo + subtitulo + subject line?

- [ ] **Roteiro Video Longo** (Agente 4 / Altair):
  - 7 blocos (Gancho → Contexto → Evento → Impacto → Casas → Ritual → CTA)?
  - Timing + energia + talking points por bloco?
  - Dados tecnicos para Victor?

- [ ] **Roteiro Reels** (Agente 4 / Altair):
  - Gancho (0-5s)?
  - 3 talking points?
  - CTA + legenda + hashtags?

- [ ] **12 Scripts de Audio** (Agente 5 / Polaris):
  - Todos os 12 presentes (Aries → Peixes)?
  - Cada um com 120-180 palavras?
  - Casa astrologica mencionada em cada um?

- [ ] **Curadoria Cultural** (Agente 6 / Spica):
  - 4-8 obras recomendadas?
  - Pelo menos 3 categorias?
  - Mini-interpretacoes para cada obra?

- [ ] **Ritual Criativo** (Agente 7 / Antares):
  - Versao gratuita (camadas 1-3)?
  - Versao paga (camadas 4-5)?
  - Script narracao parcial (3-5 min)?
  - Script narracao completa (8-15 min)?

- [ ] **Instrucoes Gabriel** (Agente 4 / Altair):
  - Video longo: graficos, musica, cortes?
  - Reels: edicao, legenda, formato?

**Se componente ausente:**
- Marcar como GAP no relatorio
- Score automatico 0 na dimensao Completude para aquele componente
- Nao bloquear analise dos demais — analisar o que esta disponivel

### Step 2 — Cruzar Dados Tecnicos (Coerencia de Dados — 25%)

Usar o relatorio validado (Agente 2) como FONTE DE VERDADE.

Para cada dado tecnico, verificar consistencia em TODOS os outputs:

- [ ] **Evento principal:** Nome identico em todos?
- [ ] **Graus:** Mesmo grau reportado no post, video, audios?
  - Tolerancia: +/- 0.5°
  - Se diverge: [CRITICO] com valor correto do relatorio
- [ ] **Signo:** Mesmo signo em todos os outputs?
- [ ] **Tipo de aspecto:** Conjuncao, oposicao, eclipse — consistente?
- [ ] **Planetas:** Mesmos planetas envolvidos mencionados?
- [ ] **Casas nos audios:** As casas calculadas batem com as mencionadas no post e video?
  - Verificar: se o post diz "Casa 10 para Sagitario", o audio de Sagitario fala de Casa 10?
- [ ] **Periodo/Datas:** Mesmo periodo em todos os outputs?

**Registrar divergencias no formato:**
```
[CRITICO] Grau divergente
  - Post: 14°22'
  - Video: 14°02'
  - Referencia (relatorio): 14°22'
  - Corrigir em: Roteiro Video, Bloco 3
```

### Step 3 — Verificar Coerencia Narrativa (20%)

A mesma historia esta sendo contada em formatos diferentes:

- [ ] **Metafora central:** Usada no post, retomada no video, presente nos audios?
- [ ] **Tom emocional:** Post, video e audios transmitem a mesma energia da semana?
- [ ] **Evento #1:** O evento principal do post e o mesmo destaque do video?
- [ ] **Curadoria:** As obras se conectam com os temas do post e relatorio?
- [ ] **Ritual:** Usa o mesmo elemento/energia descrito no relatorio e post?
- [ ] **Progressao logica:** Ler post → assistir video → ouvir audio → fazer ritual faz sentido como jornada?

**Registrar inconsistencias:**
```
[MELHORIA] Metafora inconsistente
  - Post: "atualizacao de software"
  - Video: "muda de pele"
  - Sugestao: Alinhar metafora central em ambos
```

### Step 4 — Verificar Tom e Marca (15%)

Scan de TODOS os outputs para aderencia ao brand DNA:

- [ ] **Vocabulario proibido** — buscar em cada output:
  - "cuidado com..." → [CRITICO]
  - "perigo" → [CRITICO]
  - "cosmos" (em vez de "ceu") → [MELHORIA]
  - "nativo" (em vez de "voce") → [MELHORIA]
  - "energias cosmicas" → [MELHORIA]
  - "previsao" (em vez de "tendencia") → [MELHORIA]
  - "eclipse como punicao" → [CRITICO]
  - "retrogrado e ruim" → [CRITICO]

- [ ] **Tom de Victor:** Conversacional, poetico, entusiasmado em todos?
- [ ] **CTAs:** Naturais em todos os formatos (nao vendedores)?
- [ ] **Metaforas culturais:** Cinema, teatro, literatura presentes?
- [ ] **Zero terrorismo astrologico** em todos os outputs?

### Step 5 — Verificar Qualidade Individual (10%)

Checar se cada output atende seus criterios internos:

- [ ] **Post:** 1500-2500 palavras? Paywall posicionado? PAS aplicado? 2+ open loops?
- [ ] **Video:** Arco emocional (forte→crescente→calmo→quente)? Timing por bloco?
- [ ] **Reels:** Gancho 3s? Max 3 talking points? CTA natural?
- [ ] **Audios:** Todos entre 120-180 palavras? Todos genuinamente diferentes? Casas corretas?
- [ ] **Curadoria:** Min 3 categorias? Conexoes nao literais? Obras verificaveis?
- [ ] **Ritual:** 5 camadas? Corte natural? Materiais simples? Narracao com pausas?

### Step 6 — Avaliar Experiencia do Usuario (10%)

Pensar como assinante do Camarin Sideral:

- [ ] **Jornada coesa:** Post → video → audio → ritual forma uma experiencia completa?
- [ ] **Sem repeticao excessiva:** Cada formato agrega algo UNICO?
  - Post = profundidade e leitura
  - Video = energia e performance
  - Audio = personalizacao 1:1
  - Curadoria = lifestyle e cultura
  - Ritual = experiencia corporal
- [ ] **Valor real:** O assinante sente que valeu a pena pagar?
- [ ] **Acessibilidade:** Diferentes formatos atendem diferentes preferencias?

### Step 7 — Calcular Score Ponderado

```
Score = (Coerencia_Dados * 0.25) + (Coerencia_Narrativa * 0.20) +
        (Completude * 0.20) + (Tom_Marca * 0.15) +
        (Qualidade_Individual * 0.10) + (Experiencia_Usuario * 0.10)
```

Arredondar para 1 casa decimal.

### Step 8 — Gerar Relatorio e Decisao

**Se Score >= 7 (APROVADO):**
- [ ] Gerar relatorio de consolidacao com selo de aprovacao
- [ ] Listar melhorias sugeridas (nao-bloqueantes)
- [ ] Montar aula consolidada (todos os outputs organizados num documento unico)
- [ ] Aula pronta para Fase 6 (Export)

**Formato da aula consolidada:**
```markdown
---
AULA SEMANAL — Pelicula Sideral
Periodo: {startDate} a {endDate}
Evento Principal: {evento}
Score Consolidacao: {score}/10
Aprovado por: Rigel (@astro-editor)
Data: {data}
---

## 1. Post Substack
{post_completo}

## 2. Roteiro Video Longo
{roteiro_video}

## 3. Roteiro Reels
{roteiro_reels}

## 4. 12 Audios por Ascendente
{12_scripts}

## 5. Curadoria Cultural
{curadoria}

## 6. Ritual
### Versao Gratuita
{ritual_free}
### Versao Paga
{ritual_paid}
### Narracao (Parcial)
{narracao_parcial}
### Narracao (Completa)
{narracao_completa}

## 7. Instrucoes de Edicao (Gabriel)
{instrucoes}
```

**Se Score < 7 (RETORNAR):**
- [ ] Gerar relatorio com erros criticos e melhorias
- [ ] Para cada erro [CRITICO], indicar:
  - Qual agente precisa corrigir
  - O que esta errado (com localizacao exata)
  - O dado correto de referencia
  - Sugestao de correcao
- [ ] Retornar para os agentes especificos

### Step 9 — Apresentar ao Usuario

No modo interativo:
- [ ] Apresentar checklist de completude (Step 1)
- [ ] Apresentar score por dimensao
- [ ] Perguntar: "Quer ver os detalhes de alguma dimensao?"
- [ ] Apresentar erros criticos (se houver)
- [ ] Apresentar decisao: APROVADO ou RETORNAR
- [ ] Se aprovado: "Aula consolidada pronta. Seguir para Fase 6 (Export)?"
- [ ] Salvar em `PELICULA SIDERAL/DATA/consolidacao-{startDate}-{endDate}.md`

No modo yolo:
- [ ] Gerar tudo de uma vez
- [ ] Apresentar relatorio completo + decisao
- [ ] Se aprovado, salvar aula consolidada automaticamente

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Todos os outputs analisados como conjunto coeso
2. Dados tecnicos cruzados entre todos os outputs — inconsistencias flagged
3. Score ponderado calculado com 6 dimensoes
4. Relatorio de consolidacao gerado com localizacao precisa dos erros
5. Decisao de gate clara (APROVAR >= 7, RETORNAR < 7)
6. Se aprovado: aula consolidada montada num unico documento
7. Se rejeitado: cada agente sabe EXATAMENTE o que corrigir
8. Nenhum erro de dados ignorado — graus, signos, casas conferem em todos
9. Tom e marca verificados em TODOS os outputs simultaneamente
10. Experiencia do usuario avaliada como jornada completa
