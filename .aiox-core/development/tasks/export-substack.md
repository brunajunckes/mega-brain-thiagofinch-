---
task: exportSubstack()
responsavel: Orion (AIOS Master)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Formata e salva automaticamente (1 prompt)
- interactive: Apresenta preview, pede confirmacao, depois salva [DEFAULT]

**Entrada:**
- campo: aula_consolidada
  tipo: string (Markdown)
  origem: Agente 8 (@astro-editor / Rigel) — aula com selo de aprovacao
  obrigatorio: true
  validacao: |
    DEVE conter selo "APROVADO" do Agente 8 (score >= 7)
    DEVE conter todas as 7 secoes (post, video, reels, audios, curadoria, ritual, instrucoes)

- campo: titulo
  tipo: string
  origem: Agente 3 (@astro-writer)
  obrigatorio: true

- campo: subtitulo
  tipo: string
  origem: Agente 3 (@astro-writer)
  obrigatorio: true

- campo: subject_line
  tipo: string
  origem: Agente 3 (@astro-writer)
  obrigatorio: true

**Saida:**
- campo: substack_post
  tipo: string (Markdown)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: Markdown compativel com import Substack
  descricao: Post formatado com paywall marker, pronto para colar no Substack

- campo: pacote_producao
  tipo: object
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  descricao: |
    Pacote com todos os materiais separados para a equipe:
    - Post Substack (para publicacao)
    - Roteiro Video (para Victor)
    - Roteiro Reels (para Victor)
    - 12 Scripts Audio (para Victor)
    - Curadoria (para post)
    - Ritual narracao parcial (para post)
    - Ritual narracao completa (para Victor gravar)
    - Instrucoes edicao (para Gabriel)
    - Legenda + hashtags Reels (para Karol)

pre-conditions:
  - [ ] Aula consolidada aprovada pelo Agente 8 (score >= 7)
    tipo: pre-condition
    blocker: true
    error_message: "Aula nao aprovada. Executar Fase 5 primeiro."

post-conditions:
  - [ ] Post Substack formatado e pronto para import
  - [ ] Pacote de producao com materiais separados por destinatario
  - [ ] Checklist de publicacao gerada

acceptance-criteria:
  - [ ] Post pode ser colado direto no editor Substack sem ajuste
    blocker: true
  - [ ] Paywall marker no lugar correto
  - [ ] Cada membro da equipe tem seu material separado

error_handling:
  strategy: fail-fast
  common_errors:
    - name: Aula nao aprovada
      cause: Fase 5 nao executada ou score < 7
      resolution: Informar usuario. Executar Fase 5 primeiro.
    - name: Componente faltante na aula
      cause: Um output nao foi incluido na consolidacao
      resolution: Listar componente faltante. Voltar ao agente responsavel.

performance:
  duration_expected: "2-5 min"
  token_usage: "~5,000-10,000 tokens (formatacao)"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, substack, content-pipeline, fase-6, export]
  created_at: "2026-02-25"
  pipeline_position: 6
  upstream_producer: astro-editor
  downstream_consumers: [substack, victor, gabriel, karol]
---

# Export para Substack

## Proposito

Pegar a aula consolidada aprovada pela Fase 5 e formata-la em dois outputs: (1) post Substack pronto para import/publicacao e (2) pacote de producao com materiais separados para cada membro da equipe (Victor, Gabriel, Karol).

## Quando Usar

**Use quando:**
- A Fase 5 aprovou a aula (score >= 7)
- Tudo esta pronto para publicacao
- O workflow Pelicula esta na fase final

**Nao use quando:**
- A aula nao foi aprovada (voltar a Fase 5)
- Precisa editar conteudo (voltar aos agentes especificos)

## Instrucoes

### Step 1 — Validar Aula Consolidada

- [ ] Aula tem selo de aprovacao do Agente 8 (Rigel)?
- [ ] Score >= 7?
- [ ] Todas as 7 secoes presentes?

### Step 2 — Formatar Post Substack

Extrair a secao "Post Substack" da aula consolidada e formatar:

- [ ] **Header do post:**
  ```
  # {titulo}
  ### {subtitulo}
  ```

- [ ] **Conteudo gratuito (75%):**
  - Introducao/Gancho
  - Didatica do Evento
  - Choque no Corpo
  - Ritual Parcial
  - Curadoria Cultural
  - Transicao para Paywall

- [ ] **Paywall marker:**
  ```
  ---
  > *Este conteudo e exclusivo para assinantes do Camarin Sideral.*
  ---
  ```

- [ ] **Conteudo pago (25%):**
  - Video embed placeholder: `[VIDEO: Analise completa da semana]`
  - Tutorial mapa pessoal placeholder: `[VIDEO: Como encontrar no seu mapa]`
  - 12 Interpretacoes por Ascendente
  - Ritual Completo (narracao placeholder: `[AUDIO: Ritual guiado completo]`)
  - CTA + Encerramento + Assinatura Victor

- [ ] **Metadados Substack:**
  ```
  Subject line: {subject_line}
  Preview text: {primeira frase do gancho}
  Tags: astrologia, {signo_evento}, spoiler-semanal
  ```

- [ ] **Formatacao Markdown limpa:**
  - Headers hierarquicos (H1 titulo, H2 secoes, H3 subsecoes)
  - Blockquotes para destaques poeticos
  - Separadores `---` entre secoes
  - Sem HTML customizado (Substack nao suporta bem)
  - Imagens como placeholder: `[IMAGEM: descricao]`

### Step 3 — Montar Pacote de Producao

Separar materiais por destinatario:

#### Para Victor (gravacao)
- [ ] Roteiro Video Longo (7 blocos com timing)
- [ ] Roteiro Reels (gancho + bullets + CTA)
- [ ] 12 Scripts de Audio (Aries → Peixes)
- [ ] Script Narracao Ritual — Versao Parcial (free, 3-5 min)
- [ ] Script Narracao Ritual — Versao Completa (paid, 8-15 min)

#### Para Gabriel (edicao)
- [ ] Instrucoes de Edicao Video Longo (graficos, musica, cortes)
- [ ] Instrucoes de Edicao Reels (formato, legenda auto, musica)

#### Para Karol (publicacao)
- [ ] Legenda do Reels + hashtags
- [ ] Horario sugerido de publicacao
- [ ] Checklist Stories (se aplicavel)

#### Para Substack (publicacao)
- [ ] Post formatado (Step 2)
- [ ] Subject line + preview text
- [ ] Agendamento sugerido (domingo de manha)

### Step 4 — Gerar Checklist de Publicacao

```markdown
## Checklist de Publicacao — Semana {periodo}

### Substack (Domingo)
- [ ] Post importado no editor Substack
- [ ] Paywall configurado no ponto correto
- [ ] Subject line: "{subject_line}"
- [ ] Preview text configurado
- [ ] Embeds de video/audio inseridos (quando prontos)
- [ ] Agendado ou publicado

### Video Longo (Domingo/Segunda)
- [ ] Victor gravou usando roteiro
- [ ] Gabriel editou com instrucoes
- [ ] Video publicado no YouTube / Camarin
- [ ] Embed inserido no post Substack

### Reels (Terca)
- [ ] Victor gravou usando roteiro Reels
- [ ] Gabriel editou (cortes, legenda, musica)
- [ ] Karol publicou com legenda + hashtags
- [ ] ManyChat ativo para captar comentarios

### 12 Audios (Domingo)
- [ ] Victor gravou os 12 audios
- [ ] Audios publicados no Camarin (area paga)

### Ritual (Domingo)
- [ ] Victor gravou narracao parcial (free)
- [ ] Victor gravou narracao completa (paid)
- [ ] Audio parcial no post Substack
- [ ] Audio completo no Camarin

### Stories (Quarta + Sexta + Domingo)
- [ ] Quarta: teaser + caixinha
- [ ] Sexta: lembrete + prova social
- [ ] Domingo: highlights + FOMO
```

### Step 5 — Salvar e Entregar

- [ ] Salvar post Substack: `PELICULA SIDERAL/DATA/substack-{startDate}-{endDate}.md`
- [ ] Salvar pacote Victor: `PELICULA SIDERAL/DATA/pacote-victor-{startDate}-{endDate}.md`
- [ ] Salvar instrucoes Gabriel: `PELICULA SIDERAL/DATA/instrucoes-gabriel-{startDate}-{endDate}.md`
- [ ] Salvar checklist publicacao: `PELICULA SIDERAL/DATA/checklist-pub-{startDate}-{endDate}.md`

No modo interativo:
- [ ] Apresentar preview do post Substack (primeiros 500 palavras)
- [ ] Perguntar: "Post pronto pra importar no Substack?"
- [ ] Apresentar pacote de producao (lista de materiais por pessoa)
- [ ] Apresentar checklist de publicacao
- [ ] Confirmar salvamento

No modo yolo:
- [ ] Salvar tudo automaticamente
- [ ] Apresentar resumo final

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Post Substack formatado e pronto para colar no editor sem ajustes
2. Paywall marker no lugar correto (75% free / 25% paid)
3. Pacote separado por destinatario (Victor, Gabriel, Karol)
4. Victor tem TODOS os roteiros/scripts que precisa para gravar
5. Gabriel tem TODAS as instrucoes de edicao
6. Karol tem legenda + hashtags + checklist Stories
7. Checklist de publicacao gerada com todas as etapas
8. Subject line e preview text prontos
9. Markdown limpo e compativel com Substack
10. Todos os arquivos salvos em PELICULA SIDERAL/DATA/
