---
task: criarSpoilerSemanal()
responsavel: Lyra (Escritora do Spoiler Semanal)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Gera post completo sem interacoes (1 prompt max)
- interactive: Apresenta titulo/intro primeiro, pede feedback, depois completa [DEFAULT]

**Entrada:**
- campo: relatorio_validado
  tipo: string (Markdown)
  origem: Agente 2 (@astro-conferencia) — relatorio com selo de qualidade
  obrigatorio: true
  validacao: |
    DEVE conter selo "APROVADO" do Agente 2 (score >= 7)
    DEVE conter secoes I-V do template de relatorio
    Se contem {{PLACEHOLDER}}, REJEITAR — pedir relatorio validado

- campo: materia_prima
  tipo: object
  origem: Agente 1 (@astro-analyst) — secao IV do relatorio
  obrigatorio: true
  validacao: |
    Deve conter: keywords, metafora_central, gancho_emocional,
    talking_points, temas_curadoria, arquetipos, materia_prima_ritual

- campo: panorama_celeste
  tipo: string
  origem: Agente 1 — secao I do relatorio
  obrigatorio: true

- campo: eventos_rankeados
  tipo: array
  origem: Agente 1 — secao III do relatorio
  obrigatorio: true
  validacao: Pelo menos 3 eventos com framework tripartite

**Saida:**
- campo: post_completo
  tipo: string (Markdown)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: Markdown compativel com Substack

- campo: titulo
  tipo: string
  destino: State
  persistido: true

- campo: subtitulo
  tipo: string
  destino: State
  persistido: true

- campo: subject_line
  tipo: string
  destino: State (para email do Substack)
  persistido: true

pre-conditions:
  - [ ] Relatorio validado existe e tem selo do Agente 2
    tipo: pre-condition
    blocker: true
    error_message: "Relatorio nao validado. Executar Fase 2 primeiro."

  - [ ] Template post-substack-semanal.md existe em templates/
    tipo: pre-condition
    blocker: false

  - [ ] Exemplo de referencia existe em PELICULA SIDERAL/DOCS/
    tipo: pre-condition
    blocker: false

post-conditions:
  - [ ] Post completo gerado com parte gratuita (75%) e paga (25%)
  - [ ] 12 interpretacoes por ascendente escritas e diferenciadas
  - [ ] Titulo, subtitulo e subject line definidos
  - [ ] PAS Identitario aplicado (intro→agitacao→solucao)
  - [ ] Pelo menos 2 Open Loops antes do paywall
  - [ ] Curadoria cultural presente (4+ obras)
  - [ ] Ritual parcial gratuito com open loop para versao paga
  - [ ] Word count entre 1.500-2.500 palavras
  - [ ] Tom de Victor consistente (zero terrorismo astrologico)

acceptance-criteria:
  - [ ] Post e publicavel no Substack sem edicao adicional
    blocker: true
  - [ ] Conteudo gratuito entrega valor real (compartilhavel)
  - [ ] Paywall posicionado no momento de maior curiosidade
  - [ ] 12 ascendentes com interpretacao especifica (nao generica)
  - [ ] CTA natural, nao vendedor

error_handling:
  strategy: retry-with-feedback
  common_errors:
    - name: Relatorio nao validado
      cause: Agente 2 nao executou ou rejeitou
      resolution: Informar usuario e sugerir executar Fase 2.
    - name: Materia-prima incompleta
      cause: Relatorio falta secao IV ou campos obrigatorios
      resolution: Gerar materia-prima a partir dos dados disponiveis + marcar gaps.
    - name: Tom inconsistente
      cause: Trechos soam academicos demais ou genéricos
      resolution: Reescrever aplicando filtro de voz de Victor.

performance:
  duration_expected: "10-20 min"
  token_usage: "~30,000-50,000 tokens para post completo com 12 ascendentes"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, substack, content-pipeline, agente-3]
  created_at: "2026-02-25"
  pipeline_position: 3
  downstream_consumers: [feedback-usuario, roteirista-video, roteirista-12-casas, analista-final, export-substack]
---

# Criar Spoiler Astrologico Semanal

## Proposito

Transformar o relatorio astrologico validado em um post completo para o Substack da Pelicula Sideral ("Spoiler Astrologico da Semana"). O post combina conteudo gratuito de alto valor com conteudo pago personalizado, usando tecnicas de copywriting estrategico para conversao natural.

## Quando Usar

**Use quando:**
- O relatorio da semana foi validado pelo Agente 2 (score >= 7)
- E hora de criar o conteudo semanal do Substack
- O workflow de conteudo Pelicula esta na Fase 3

**Nao use quando:**
- O relatorio ainda nao foi validado (Fase 2 pendente)
- Precisa apenas de ajustes em um post ja escrito (use *revisar)
- Quer gerar apenas uma secao especifica (use comandos individuais)

## Instrucoes

### Step 1 — Validar Inputs

Verificar que todos os inputs estao disponiveis e validos:

- [ ] Relatorio validado: Contem secoes I-V, selo do Agente 2
- [ ] Materia-prima: Keywords, metafora central, gancho emocional, temas curadoria
- [ ] Panorama celeste: Resumo executivo da semana
- [ ] Eventos rankeados: Pelo menos 3 com framework tripartite

**VALIDACAO CRITICA:** Se o relatorio contem `{{PLACEHOLDER}}` ou nao tem narrativas tripartite (Mecanica + Metafora + Vivencia), REJEITAR e pedir o relatorio correto. Provavelmente recebeu o output bruto do script em vez do relatorio narrativo.

**Se algum input falta:**
- Informar usuario sobre o que falta
- Sugerir acao: "Execute a Fase 1 e 2 primeiro" ou "Falta a secao X do relatorio"

### Step 2 — Ler Referencias

Carregar e analisar:

- [ ] Template: `templates/post-substack-semanal.md` — estrutura base
- [ ] Exemplo: `PELICULA SIDERAL/DOCS/spoiler-astrologico-22-02.md` — referencia de tom

**IMPORTANTE:** O exemplo e a referencia PRIMARIA de tom, voz e estrategia. O template e uma grade estrutural. Em caso de conflito, seguir o exemplo.

Extrair do exemplo:
- Tecnicas de copy aplicadas (PAS, Open Loops, Ponte Pratica)
- Voz de Victor (conversacional, poetica, metaforas de cinema)
- Estrutura do paywall (onde corta, como faz a transicao)
- Formato da curadoria cultural

### Step 3 — Definir Titulo, Subtitulo e Subject Line

Gerar **3 opcoes** de cada, usando dados do relatorio:

**Titulo:**
- Opcao A: `{Evento Principal}: O que esperar na semana de {inicio} a {fim}`
- Opcao B: Variacao criativa com metafora central
- Opcao C: Variacao com tom urgente (se evento for critico/estrutural)

**Subtitulo:**
- Frase poetica curta (max 15 palavras) que capture o tom da semana
- Usar campo `tom_emocional` do relatorio como guia

**Subject line do email:**
- Gerar curiosidade + urgencia SEM entregar o conteudo
- Max 60 caracteres
- Exemplos: "O carnaval acabou. O eclipse nao." / "Voce acordou diferente. Nao e impressao."

No modo interativo: apresentar opcoes e pedir escolha do usuario.
No modo yolo: escolher a melhor opcao automaticamente.

### Step 4 — Escrever Introducao/Gancho (Gratuito)

**Tecnica: PAS Identitario — Fase 1 (Problema)**

- [ ] Comecar validando a emocao que o leitor esta sentindo
- [ ] Usar campo `gancho_emocional` da materia-prima
- [ ] Conectar a emocao com o evento astronomico de forma acessivel
- [ ] NÃO usar jargao tecnico neste ponto
- [ ] Terminar com transicao para o proximo bloco

**Tom:** Como Victor falaria no Stories — direto, pessoal, "voce".
**Tamanho:** 3-4 paragrafos (150-250 palavras)

**Checklist de qualidade:**
- [ ] O leitor se reconhece na primeira frase?
- [ ] A emocao e validada antes de ser explicada?
- [ ] Ha uma transicao clara para "o que aconteceu no ceu"?

### Step 5 — Escrever Didatica do Evento (Gratuito)

**Secao de autoridade — demonstrar dominio tecnico de forma acessivel**

- [ ] Explicar o evento principal usando dados do relatorio (campo Mecanica)
- [ ] Traduzir graus, orbes e aspectos em linguagem acessivel
- [ ] Incluir contexto historico/ciclico se relevante (ex: "isso nao acontece ha X anos")
- [ ] Usar a metafora central do relatorio como ancora narrativa
- [ ] Incluir dados astronomicos que demonstram autoridade (graus exatos, tipo de eclipse, etc.)

**Tom:** Academico mas acessivel. "Professora que sabe explicar sem ser chata."
**Tamanho:** 4-6 paragrafos (200-350 palavras)

**Checklist de qualidade:**
- [ ] Os dados tecnicos estao corretos (conferir com relatorio)?
- [ ] Ha uma imagem/metafora que ancora a explicacao?
- [ ] Um leigo entenderia o que aconteceu no ceu?

### Step 6 — Escrever Choque no Corpo (Gratuito)

**Tecnica: PAS Identitario — Fase 2 (Agitacao)**

- [ ] Usar campos de Vivencia e Sintomatologia do relatorio
- [ ] Conectar os planetas com experiencia cotidiana concreta
- [ ] Listar sintomas que o leitor pode estar sentindo
- [ ] Incluir micro-engajamento: "rele e me diz se nao e exatamente..."
- [ ] Conectar transitos secundarios que amplificam o efeito

**Tom:** Intenso mas nao alarmista. "Eu sei que doi — e por isso."
**Tamanho:** 3-5 paragrafos (200-300 palavras)

**PROIBIDO:**
- "Cuidado com..." → usar "Observe que..." ou "Preste atencao em..."
- Terrorismo astrologico — eclipse nao e punicao, retrogrado nao e ruim

### Step 7 — Escrever Ritual Parcial (Gratuito)

**Tecnica: Ponte Pratica + Open Loop**

- [ ] Criar exercicio pratico usando campo `materia_prima_ritual` do relatorio
- [ ] DAR as primeiras camadas funcional (ex: 3 de 5 "porques")
- [ ] O exercicio parcial DEVE funcionar sozinho (micro-transformacao)
- [ ] CORTAR no ponto de maior tensao ("Na quarta e quinta camada, o monstro muda de forma")
- [ ] Fazer referencia mitica/poetica que amplia o exercicio
- [ ] Abrir o open loop: "Na versao completa, eu guio voce ate..."

**Tom:** Instrucional mas poetico. "Pega um caderno. Sem filtro estetico."
**Tamanho:** 5-8 paragrafos (250-400 palavras)

**Checklist:**
- [ ] O exercicio parcial ja gera valor sozinho?
- [ ] O corte gera curiosidade genuina (nao frustração)?
- [ ] A referencia mitica enriquece (nao confunde)?

### Step 8 — Escrever Curadoria Cultural (Gratuito)

**Secao de identidade de marca — posiciona Pelicula como lifestyle**

- [ ] Usar campos `temas_curadoria` e `arquetipos` do relatorio
- [ ] Pesquisar/sugerir 4-6 obras que ressoam com o tema da semana:
  - Artes visuais (exposicoes em cartaz se possivel)
  - Teatro (pecas em cartaz)
  - Cinema (filmes em cartaz ou classicos relevantes)
  - Literatura (livros/poemas conectados ao tema)
- [ ] Para cada obra: mini-interpretacao conectando com o aspecto astronomico
- [ ] Priorizar obras em cartaz em Sao Paulo (publico-alvo)

**Tom:** Curador culto mas acessivel. "Eu vi e te recomendo porque..."
**Tamanho:** 4-8 paragrafos (200-400 palavras)

**NOTA:** Se nao tiver dados sobre eventos culturais atuais, usar classicos atemporais
conectados ao tema (filmes, livros, mitos). Nunca inventar eventos.

### Step 9 — Escrever Transicao para Paywall (Gratuito)

**Tecnica: Open Loop + Desqualificacao Implicita**

- [ ] Resumir: "Tudo ate aqui e o [evento] GERAL"
- [ ] Introduzir a personalizacao: "Mas esse [evento] cai numa casa ESPECIFICA do seu mapa"
- [ ] Dar 3-4 exemplos rapidos de como muda por casa (Casa 10 = carreira, Casa 7 = relacoes...)
- [ ] Criar a lacuna identitaria: "Se voce nao sabe onde isso cai no seu mapa, esta vivendo [metafora] sem saber [consequencia]"
- [ ] Usar metafora teatral: "roteiro", "personagem", "cena"

**Tom:** Transicao natural, nao abrupta. Climax da leitura.
**Tamanho:** 3-4 paragrafos (150-200 palavras)

**PROIBIDO:** Tom vendedor. A transicao e narrativa, nao comercial.

### Step 10 — Escrever Conteudo Pago

**10a. Bloco de Video/Tutorial (placeholders)**

- [ ] Descricao do video da semana (2-3 frases)
- [ ] Se aplicavel: descricao do tutorial "como encontrar no mapa"
- [ ] Usar marcacao `<video>` ou `[EMBED VIDEO]` como placeholder

**10b. 12 Interpretacoes por Ascendente (CORE PAGO)**

Para CADA um dos 12 signos/ascendentes:

- [ ] **O que chega pra voce:** 2-3 frases sobre como o evento ativa casas especificas
  - Identificar qual casa do mapa e ativada pelo evento para aquele ascendente
  - Explicar o que isso significa na pratica (area da vida afetada)
  - Tom pessoal e direto

- [ ] **Conselho da semana:** 1 frase pratica e direta
  - Acao concreta, nao abstracoes
  - Ex: "Pega aquela ideia e escreve um primeiro passo real"

- [ ] **Dica:** Dica curta sobre ritual, atitude ou reflexao
  - Ex: "Essa semana, antes de dormir, anote um sonho"

**REGRAS das 12 interpretacoes:**
- Cada uma DEVE ser diferente e especifica (nunca copiar estrutura entre signos)
- Conectar com a casa astrologica correta para aquele ascendente
- Tom pessoal: "voce" (nao "o nativo de Aries")
- Se o evento cai na Casa 1: corpo/identidade. Casa 2: dinheiro/valores. Casa 3: comunicacao. Etc.
- Usar dados do relatorio para manter precisao tecnica

**Ordem dos signos:**
Aries → Touro → Gemeos → Cancer → Leao → Virgem → Libra → Escorpiao → Sagitario → Capricornio → Aquario → Peixes

**10c. Ritual Completo (placeholder)**

- [ ] Descricao do que a versao completa inclui (2-3 frases)
- [ ] Placeholder para video/audio guiado
- [ ] Convite para compartilhar nos comentarios ("Sem terapia coletiva forcada. So troca real.")

### Step 11 — Escrever CTA + Encerramento (Pago)

- [ ] Escolher CTA da rotacao (A, B, C ou D):
  - A: Camarin Sideral (principal)
  - B: Camarin intimista
  - C: Curso para iniciantes
  - D: Duplo (Camarin + Curso)
- [ ] Links com UTM parametrizado:
  - Camarin: `{link}?utm_source=substack&utm_medium=email&utm_campaign=spoiler-semanal&utm_content=cta-substack`
  - Curso: `{link}?utm_source=substack&utm_medium=email&utm_campaign=spoiler-semanal&utm_content=cta-curso-substack`
- [ ] Assinatura de Victor:
  ```
  Nos vemos na proxima semana. Cuida do que o ceu ta pedindo.
  Com carinho,
  **Victor**
  *Pelicula Sideral — Astrologia como linguagem de autoconhecimento.*
  ```
- [ ] P.S. se relevante (escassez real — nunca fake)

### Step 12 — Revisao Interna

Checklist final antes de entregar:

**Estrutura:**
- [ ] Parte gratuita: 800-1.200 palavras?
- [ ] Parte paga: 700-1.300 palavras?
- [ ] Total: 1.500-2.500 palavras?
- [ ] Paywall posicionado corretamente (apos valor real, antes de personalizacao)?

**Tecnicas de Copy:**
- [ ] PAS Identitario aplicado? (introducao valida emocao → agitacao aprofunda → solucao ritual)
- [ ] Pelo menos 2 Open Loops antes do paywall?
- [ ] Ponte Pratica presente? (exercicio parcial funcional)
- [ ] Desqualificacao Implicita na transicao para paywall?
- [ ] Micro-engajamento em pelo menos 1 ponto?

**Conteudo:**
- [ ] 12 ascendentes completos e DIFERENCIADOS?
- [ ] Curadoria cultural presente (4+ obras)?
- [ ] Ritual parcial funciona sozinho?
- [ ] Dados tecnicos conferem com relatorio validado?

**Voz e Marca:**
- [ ] Tom de Victor consistente do inicio ao fim?
- [ ] Zero terrorismo astrologico?
- [ ] Metaforas de cinema/teatro/literatura presentes?
- [ ] Nenhuma palavra proibida usada (cosmos, nativo, energias cosmicas, cuidado com)?
- [ ] CTA natural, nao vendedor?

**Output:**
- [ ] Titulo definido?
- [ ] Subtitulo definido?
- [ ] Subject line definida?

### Step 13 — Entregar

No modo interativo:
- [ ] Apresentar titulo + introducao primeiro
- [ ] Perguntar: "Gostou do tom? Quer ajustar antes de eu completar?"
- [ ] Se aprovado, apresentar post completo
- [ ] Perguntar: "Aprovado para seguir a Fase 3B (Feedback)?"

No modo yolo:
- [ ] Gerar tudo de uma vez
- [ ] Apresentar post completo + checklist de revisao

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Post completo com parte gratuita (75%) e paga (25%) — publicavel no Substack
2. 12 interpretacoes por ascendente escritas, diferenciadas e especificas
3. Titulo, subtitulo e subject line definidos
4. PAS Identitario + Open Loops + Ponte Pratica aplicados
5. Curadoria cultural presente (4+ obras conectadas ao tema)
6. Ritual parcial funcional (free) com open loop para versao completa (paid)
7. Tom de Victor consistente — conversacional, poetico, zero terrorismo astrologico
8. Word count entre 1.500-2.500 palavras
