---
task: feedbackUsuarioPost()
responsavel: Orion (AIOS Master)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: N/A (esta task e SEMPRE interativa por natureza)
- interactive: Apresenta post, coleta feedback, loop ate aprovacao [UNICO MODO]

**Entrada:**
- campo: post_completo
  tipo: string (Markdown)
  origem: Agente 3 (@astro-writer / Lyra) — post Substack completo
  obrigatorio: true

- campo: titulo
  tipo: string
  origem: Agente 3
  obrigatorio: true

- campo: subtitulo
  tipo: string
  origem: Agente 3
  obrigatorio: true

- campo: subject_line
  tipo: string
  origem: Agente 3
  obrigatorio: true

**Saida:**
- campo: post_aprovado
  tipo: string (Markdown)
  destino: State (para Fase 4)
  persistido: true
  descricao: Post com eventuais ajustes, aprovado pelo usuario

- campo: feedback_historico
  tipo: array
  destino: State
  persistido: false
  descricao: Historico de feedbacks para melhorar futuras geracoes

pre-conditions:
  - [ ] Post completo disponivel (Fase 3 concluida)
    tipo: pre-condition
    blocker: true

post-conditions:
  - [ ] Usuario aprovou explicitamente o post
  - [ ] Ajustes solicitados foram aplicados (se houver)
  - [ ] Post aprovado disponivel para Fase 4

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, feedback, content-pipeline, fase-3b]
  created_at: "2026-02-25"
  pipeline_position: 3.5
  upstream_producer: astro-writer
  downstream_consumers: [astro-roteirista, astro-casas, astro-curador, astro-ritualista]
---

# Feedback do Usuario — Post Substack

## Proposito

Apresentar o post Substack gerado pelo Agente 3 ao usuario para revisao. Coletar feedback, aplicar ajustes se necessario, e obter aprovacao explicita antes de avancar para a Fase 4 (Producao Paralela).

## Quando Usar

**Use quando:**
- O Agente 3 finalizou o post Substack
- O workflow Pelicula esta entre a Fase 3 e a Fase 4

## Instrucoes

### Step 1 — Apresentar Post ao Usuario

Exibir o post organizado em blocos para facilitar a revisao:

- [ ] **Titulo + Subtitulo + Subject Line:**
  ```
  Titulo: {titulo}
  Subtitulo: {subtitulo}
  Subject line: {subject_line}
  ```

- [ ] **Resumo executivo:**
  - Evento principal da semana
  - Tom geral do post
  - Word count (free / paid / total)
  - Numero de ascendentes cobertos

- [ ] **Conteudo gratuito (75%):**
  Apresentar na integra

- [ ] **Marcador de paywall**

- [ ] **Conteudo pago (25%):**
  Apresentar na integra (incluindo 12 ascendentes)

### Step 2 — Coletar Feedback

Perguntar ao usuario:

```
O post esta pronto. Aqui vai o resumo:
- Titulo: {titulo}
- Evento: {evento_principal}
- Words: {total} ({free} free + {paid} paid)
- 12 ascendentes: {presentes/ausentes}

Opcoes:
1. Aprovar — seguir para Fase 4 (producao paralela)
2. Ajustar tom — esta muito {formal/informal/tecnico/vago}
3. Ajustar conteudo — algo incorreto ou faltando
4. Ajustar titulo/subject — quero outra opcao
5. Reescrever secao especifica — me diz qual
```

### Step 3 — Processar Feedback

**Se opcao 1 (Aprovar):**
- [ ] Marcar `usuario_aprovou = true`
- [ ] Salvar post como `post_aprovado`
- [ ] Informar: "Post aprovado! Avancando para Fase 4 — Producao Paralela."
- [ ] Disponibilizar para agentes da Fase 4

**Se opcao 2 (Tom):**
- [ ] Perguntar: "O tom esta muito {X}. Como prefere? Mais conversacional? Mais tecnico? Mais poetico?"
- [ ] Aplicar ajuste de tom no post inteiro
- [ ] Voltar para Step 1 (apresentar versao revisada)

**Se opcao 3 (Conteudo):**
- [ ] Perguntar: "O que esta incorreto ou faltando? Me aponta a secao."
- [ ] Aplicar correcao pontual
- [ ] Voltar para Step 1

**Se opcao 4 (Titulo/Subject):**
- [ ] Gerar 3 novas opcoes de titulo e subject line
- [ ] Apresentar para escolha
- [ ] Voltar para Step 1

**Se opcao 5 (Reescrever secao):**
- [ ] Perguntar: "Qual secao? (ex: introducao, curadoria, ritual, ascendente X)"
- [ ] Reescrever a secao especifica mantendo o contexto
- [ ] Voltar para Step 1

### Step 4 — Loop ate Aprovacao

- [ ] Repetir Steps 1-3 ate o usuario escolher opcao 1 (Aprovar)
- [ ] Manter historico de feedbacks para referencia futura
- [ ] Max 5 iteracoes — se apos 5, sugerir: "Talvez seja melhor reexecutar a Fase 3 com diretrizes diferentes?"

### Step 5 — Salvar e Disponibilizar

- [ ] Salvar post aprovado em `PELICULA SIDERAL/DATA/spoiler-{startDate}-{endDate}.md`
- [ ] Disponibilizar para os 4 agentes da Fase 4:
  - @astro-roteirista (Altair) — base para roteiro video
  - @astro-casas (Polaris) — referencia de tom para audios
  - @astro-curador (Spica) — temas para curadoria (se nao tiver da materia-prima)
  - @astro-ritualista (Antares) — ritual base para expandir

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Usuario viu o post completo e deu feedback explicito
2. Ajustes solicitados foram aplicados
3. Aprovacao explicita obtida (opcao 1)
4. Post aprovado salvo e disponivel para Fase 4
5. Transicao para Fase 4 acontece sem ambiguidade
