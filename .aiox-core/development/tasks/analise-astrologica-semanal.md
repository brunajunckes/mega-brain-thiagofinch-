---
task: analiseAstrologicaSemanal()
responsavel: Sirius (Analista Astrologico)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Executa analise completa sem interacoes (1 prompt max)
- interactive: Apresenta dados, pede feedback, permite ajustes (3-5 prompts) [DEFAULT]

**Entrada:**
- campo: periodo
  tipo: object { startDate: string, endDate: string }
  origem: User Input
  obrigatorio: true
  validacao: |
    Datas no formato YYYY-MM-DD
    endDate >= startDate
    Periodo maximo: 14 dias

- campo: localizacao
  tipo: object { city: string, nation: string, longitude: float, latitude: float, timezone: string }
  origem: User Input (opcional, default Sao Paulo)
  obrigatorio: false

**Saida:**
- campo: relatorio_md
  tipo: string (Markdown formatado)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true

- campo: dados_json
  tipo: object (JSON estruturado)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true

- campo: eventos_rankeados
  tipo: array
  destino: State (para agentes downstream)
  persistido: true

pre-conditions:
  - [ ] API Astrologer acessivel (RapidAPI)
    tipo: pre-condition
    blocker: true
    validacao: |
      Testar com GET simples antes de iniciar
    error_message: "API Astrologer indisponivel. Verificar chave RapidAPI."

  - [ ] Script astrologer-api.js existe em scripts/
    tipo: pre-condition
    blocker: true

  - [ ] Template relatorio-astrologico-semanal.md existe em templates/
    tipo: pre-condition
    blocker: false

post-conditions:
  - [ ] Relatorio MD narrativo gerado com secoes I-V preenchidas
  - [ ] JSON bruto salvo para auditoria
  - [ ] Pelo menos 3 eventos rankeados com framework tripartite completo
  - [ ] Secao Materia-Prima preenchida com insumos para agentes 3, 4, 6, 7
  - [ ] Referencias mitologicas incluidas

acceptance-criteria:
  - [ ] Dados da API conferem com ephemeris publica (astro.com)
    blocker: true
  - [ ] Rankeamento respeita hierarquia de planetas
  - [ ] Tom segue brand DNA da Pelicula Sideral
  - [ ] Framework tripartite (Mecanica+Metafora+Vivencia) aplicado aos top 3 eventos

error_handling:
  strategy: retry-then-escalate
  common_errors:
    - name: API Timeout
      cause: RapidAPI indisponivel ou rate limit
      resolution: Retry com backoff (500ms, 1s, 2s). Max 3 tentativas por dia.
      recovery: Pular dia e continuar com os demais.
    - name: Dados incompletos
      cause: API retorna planeta sem posicao
      resolution: Marcar planeta como "dados indisponiveis" e continuar analise.
    - name: Periodo muito longo
      cause: Mais de 14 dias solicitados
      resolution: Dividir em blocos de 7 dias e processar sequencialmente.

performance:
  duration_expected: "5-15 min (7 dias)"
  cost_estimated: "~14 API calls (2 per day)"
  token_usage: "~15,000-30,000 tokens para narrativas"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, astrologia, content-pipeline, agente-1]
  created_at: "2026-02-24"
  pipeline_position: 1
  downstream_consumers: [conferencia, criador-post, roteirista-video, roteirista-12-casas, curador-cultural, criador-ritual, analista-final]
---

# Analise Astrologica Semanal

## Proposito

Executar analise completa dos transitos planetarios de um periodo, gerando relatorio tecnico-pedagogico estruturado que serve como materia-prima para toda a cadeia de conteudo da Pelicula Sideral.

## Quando Usar

**Use quando:**
- O usuario pede para analisar transitos de uma semana
- O workflow de conteudo Pelicula e iniciado (Fase 1)
- Precisa gerar briefing astrologico para a equipe

**Nao use quando:**
- O usuario quer apenas uma interpretacao rapida de um aspecto
- Precisa de mapa natal pessoal (use API de birth-chart)

## Instrucoes

### 1. Parsear Periodo

Extrair datas do input do usuario:

- [ ] Identificar data inicio e data fim
- [ ] Converter para formato YYYY-MM-DD
- [ ] Validar: endDate >= startDate, periodo <= 14 dias
- [ ] Se "proxima semana": calcular a partir da segunda-feira seguinte

**Formatos aceitos:**
- "semana de 03 a 09 de marco 2026"
- "2026-03-03 a 2026-03-09"
- "proxima semana"
- "esta semana"

### 2. Coletar Dados da API

Executar script de integracao:

```bash
node scripts/astrologer-api.js --start {YYYY-MM-DD} --end {YYYY-MM-DD} --output "PELICULA SIDERAL/DATA/astro-data-{start}-{end}.json"
```

- [ ] Verificar que o script retorna sem erros
- [ ] Confirmar que todos os dias foram processados
- [ ] Ler o JSON de output

### 3. Analisar Dados

Com os dados brutos em maos:

- [ ] Identificar o evento principal da semana (maior peso)
- [ ] Listar os top 5 eventos rankeados
- [ ] Identificar ingressos (planetas mudando de signo)
- [ ] Listar planetas retrogrados
- [ ] Detectar fases lunares significativas (Nova, Cheia, Eclipse)
- [ ] Calcular elemento dominante
- [ ] Identificar graus criticos ativados

### 4. Gerar Narrativas (Framework Tripartite)

Para cada evento top (3-5 eventos):

- [ ] **Mecanica:** O que esta acontecendo no ceu — dados puros com graus e orbes
- [ ] **Metafora:** Analogia, imagem poetica ou mito que traduz o aspecto
- [ ] **Vivencia:** Como a pessoa sente — sintomatologia emocional/fisica/pratica

**Regras de tom:**
- Academico mas acessivel
- Poetico quando cabe, pragmatico quando necessario
- NUNCA alarmista
- Seguir vocabulario da Pelicula Sideral

### 5. Preencher Materia-Prima

> NOTA: "Guia por Casa" (12 interpretacoes) foi movido para os Agentes 3 e 5.
> O Agente 1 NAO precisa escrever interpretacoes por casa.

- [ ] Keywords para SEO e conteudo
- [ ] Tom emocional da semana (1 palavra + descricao)
- [ ] Palavra-chave central
- [ ] Metafora central da semana
- [ ] Titulo sugerido para Substack
- [ ] Subtitulo poetico
- [ ] Talking points para video (3-5 pontos)
- [ ] Temas para curadoria cultural
- [ ] Arquetipos mitologicos relevantes
- [ ] Materia-prima para ritual criativo

### 6. Formatar Output

- [ ] Preencher template `relatorio-astrologico-semanal.md` (secoes I-V)
- [ ] Salvar em `PELICULA SIDERAL/DATA/relatorio-{start}-{end}.md`
- [ ] Incluir resumo de dados brutos + referencia ao arquivo JSON na secao V

### 7. Entregar

No modo interativo:
- [ ] Apresentar Panorama Celeste primeiro
- [ ] Perguntar: "Quer ver os eventos detalhados ou ajustar algo?"
- [ ] Apresentar relatorio completo
- [ ] Perguntar: "Aprovado para seguir ao Agente 2 (Conferencia)?"

No modo yolo:
- [ ] Gerar tudo de uma vez e entregar

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Relatorio completo com todas as 5 secoes preenchidas (I-V)
2. Dados conferem com a API (resumo + referencia ao JSON incluso)
3. Top 3 eventos tem narrativa tripartite completa (Mecanica + Metafora + Vivencia)
4. Materia-prima fornece insumos para todos os agentes downstream (3, 4, 6, 7)
5. Tom segue brand DNA da Pelicula Sideral
6. NOTA: "Guia por Casa" nao e mais avaliado aqui (responsabilidade dos Agentes 3/5)
