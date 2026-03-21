---
task: exportNotionSemanal()
responsavel: Orion (AIOS Master)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Cria hub + todas as paginas sem confirmacao (1 prompt)
- interactive: Apresenta mapeamento, confirma estrutura, cria em lotes [DEFAULT]

**Entrada:**
- campo: periodo
  tipo: object { startDate, endDate }
  origem: Pipeline input
  obrigatorio: true

- campo: titulo_episodio
  tipo: string
  origem: Agente 3 (@astro-writer) via Fase 3
  obrigatorio: true

- campo: numero_semana
  tipo: number
  origem: Calculado (sequencial)
  obrigatorio: true

- campo: arquivos_gerados
  tipo: array (file paths)
  origem: Fase 6 (export-substack)
  obrigatorio: true
  validacao: |
    Minimo 8 arquivos em PELICULA SIDERAL/DATA/:
    - spoiler-{dates}.md
    - pacote-victor-{dates}.md
    - instrucoes-gabriel-{dates}.md
    - checklist-pub-{dates}.md
    - relatorio-{dates}.md
    - curadoria-{dates}.md
    - ritual-{dates}.md
    - consolidacao-{dates}.md

**Saida:**
- campo: notion_hub_id
  tipo: string (UUID)
  descricao: Page ID do hub da semana no Notion
  persistido: true

- campo: notion_pages
  tipo: array of { name, page_id }
  descricao: Lista de paginas criadas com IDs
  persistido: true

- campo: notion_report
  tipo: string
  descricao: Resumo da exportacao (paginas criadas, erros, links)

pre-conditions:
  - [ ] Fase 6 (export-substack) concluida com sucesso
    tipo: pre-condition
    blocker: true
    error_message: "Fase 6 nao concluida. Executar export-substack primeiro."
  - [ ] Arquivos existem em PELICULA SIDERAL/DATA/
    tipo: pre-condition
    blocker: true
  - [ ] Notion MCP disponivel (notion-create-pages, notion-update-page)
    tipo: pre-condition
    blocker: true
    error_message: "Notion MCP indisponivel. Verificar .mcp.json."

post-conditions:
  - [ ] Hub da semana criado sob portal Pelicula Sideral
  - [ ] Todas as sub-paginas criadas e populadas
  - [ ] Pagina-indice (hub) com links para todas as sub-paginas

acceptance-criteria:
  - [ ] Hub acessivel no Notion com titulo correto
    blocker: true
  - [ ] Cada sub-pagina contem o conteudo completo do arquivo correspondente
    blocker: true
  - [ ] Pagina-indice lista todos os entregaveis com status
  - [ ] Victor, Gabriel e Karol podem acessar seus materiais via Notion

error_handling:
  strategy: continue-on-error
  common_errors:
    - name: Notion API timeout
      cause: API lenta ou indisponivel
      resolution: Retry ate 3x com backoff. Se falhar, salvar report local e informar usuario.
    - name: Pagina duplicada
      cause: Pipeline re-executado para mesma semana
      resolution: Buscar hub existente via notion-search. Se encontrar, atualizar paginas em vez de criar novas.
    - name: Conteudo truncado
      cause: Arquivo muito grande para Notion API
      resolution: Dividir em blocos de ~2000 caracteres por chamada.

performance:
  duration_expected: "1-3 min"
  token_usage: "~3,000-5,000 tokens"
  api_calls: "9-10 (1 search + 1 hub + 7-8 sub-pages)"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, notion, content-pipeline, fase-6b, export, automacao]
  created_at: "2026-02-26"
  pipeline_position: "6B"
  upstream_producer: export-substack
  downstream_consumers: [victor, gabriel, karol, equipe]
---

# Export para Notion — Conteudo Semanal Pelicula Sideral

## Proposito

Automatizar a criacao de paginas no Notion com todo o conteudo semanal produzido pelo pipeline. Cria um hub (pagina-indice) para a semana e sub-paginas para cada entregavel, organizadas por destinatario. Substitui o processo manual de copiar/colar 9 paginas.

## Quando Usar

**Use quando:**
- A Fase 6 (export-substack) concluiu e todos os arquivos estao em `PELICULA SIDERAL/DATA/`
- O pipeline esta na etapa final de distribuicao
- Precisa disponibilizar materiais para a equipe no Notion

**Nao use quando:**
- Os arquivos ainda nao foram gerados (executar Fases 1-6 primeiro)
- O conteudo precisa de revisao (voltar a Fase 5)

## Constantes

```yaml
NOTION_PORTAL_PELICULA: "311a973e-04ac-8153-bd52-ccfb7965c468"
DATA_DIR: "PELICULA SIDERAL/DATA"
DATE_FORMAT: "{startDate}-{endDate}"  # ex: 2026-03-01-2026-03-08
```

## Instrucoes

### Step 1 — Verificar Pre-Condicoes

- [ ] Confirmar que Notion MCP esta funcional:
  ```
  notion-search(query: "Pelicula Sideral")
  ```
  Se falhar → abortar com mensagem de erro.

- [ ] Listar arquivos esperados em `PELICULA SIDERAL/DATA/`:
  ```
  Glob("PELICULA SIDERAL/DATA/*-{startDate}-{endDate}*")
  ```

- [ ] Validar que pelo menos 8 arquivos existem. Mapear:

  | Arquivo | Variavel |
  |---------|----------|
  | `spoiler-{dates}.md` | $POST |
  | `pacote-victor-{dates}.md` | $PACOTE_VICTOR |
  | `instrucoes-gabriel-{dates}.md` | $INSTRUCOES_GABRIEL |
  | `checklist-pub-{dates}.md` | $CHECKLIST |
  | `relatorio-{dates}.md` | $RELATORIO |
  | `curadoria-{dates}.md` | $CURADORIA |
  | `ritual-{dates}.md` | $RITUAL |
  | `consolidacao-{dates}.md` | $CONSOLIDACAO |

  Arquivos opcionais (incluidos no Pacote Victor):
  | `roteiros-video-reels-{dates}.md` | $ROTEIROS_VIDEO |
  | `roteiros-12-casas-{dates}.md` | $ROTEIROS_CASAS |
  | `roteiro-narrado-video-{dates}.md` | $ROTEIRO_NARRADO |

### Step 2 — Verificar Duplicata

- [ ] Buscar hub existente para esta semana:
  ```
  notion-search(query: "[S{numero_semana}] Semana {DD/MM}")
  ```

- [ ] Se encontrou hub existente:
  - **Modo interativo:** Perguntar ao usuario:
    1. Atualizar paginas existentes (sobrescrever)
    2. Criar novo hub (sufixo "-v2")
    3. Cancelar
  - **Modo yolo:** Atualizar paginas existentes automaticamente.

- [ ] Se nao encontrou: prosseguir com criacao.

### Step 3 — Criar Hub (Pagina-Indice)

- [ ] Criar pagina hub sob o portal Pelicula Sideral:
  ```
  notion-create-pages(
    parentPageId: NOTION_PORTAL_PELICULA,
    title: "[S{N}] Semana {DD/MM} — {titulo_episodio}",
    content: <ver template abaixo>
  )
  ```

**Template do Hub:**

```markdown
# [S{N}] Semana {DD/MM} a {DD/MM} — {titulo_episodio}

**Score:** {score}/10 | **Status:** Publicacao pendente
**Pipeline executado em:** {data_execucao}

---

## Entregaveis

### Para Victor (Gravacao)
- [ ] Pacote Victor — roteiros de video, reels, 12 audios, rituais
- [ ] Tempo estimado de gravacao: ~45-55 min

### Para Gabriel (Edicao)
- [ ] Instrucoes Gabriel — direcao de edicao video longo + reels

### Para Karol (Publicacao)
- [ ] Checklist de Publicacao — todas as etapas da semana

### Conteudo
- [ ] Post Substack — pronto para importar
- [ ] Relatorio Astrologico — dados tecnicos da semana
- [ ] Curadoria Cultural — recomendacoes conectadas ao transito
- [ ] Ritual 5 Camadas — exercicio experiencial free + paid

### QA
- [ ] Consolidacao QG — score e analise do quality gate

---

## Timeline Sugerida

| Dia | Acao |
|-----|------|
| Sab/Dom | Publicar post Substack |
| Dom/Seg | Victor grava video longo + 12 audios + ritual |
| Seg/Ter | Gabriel edita video + reels |
| Ter | Karol publica reels + ativa ManyChat |
| Qua | Stories teaser |
| Sex | Stories lembrete |
```

- [ ] Salvar `$HUB_ID` retornado.

### Step 4 — Criar Sub-Paginas

Criar cada sub-pagina sob o hub, na seguinte ordem:

#### 4.1 — Pacote Victor
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Pacote Victor — Gravacao",
  content: <conteudo de $PACOTE_VICTOR>
)
```

#### 4.2 — Instrucoes Gabriel
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Instrucoes Gabriel — Edicao",
  content: <conteudo de $INSTRUCOES_GABRIEL>
)
```

#### 4.3 — Checklist Publicacao
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Checklist de Publicacao",
  content: <conteudo de $CHECKLIST>
)
```

#### 4.4 — Post Substack
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Post Substack",
  content: <conteudo de $POST>
)
```

#### 4.5 — Relatorio Astrologico
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Relatorio Astrologico",
  content: <conteudo de $RELATORIO>
)
```

#### 4.6 — Curadoria Cultural
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Curadoria Cultural",
  content: <conteudo de $CURADORIA>
)
```

#### 4.7 — Ritual 5 Camadas
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Ritual 5 Camadas",
  content: <conteudo de $RITUAL>
)
```

#### 4.8 — Consolidacao QG
```
notion-create-pages(
  parentPageId: $HUB_ID,
  title: "Consolidacao Quality Gate",
  content: <conteudo de $CONSOLIDACAO>
)
```

### Step 5 — Atualizar Hub com Links

- [ ] Buscar o hub criado:
  ```
  notion-fetch(pageId: $HUB_ID)
  ```

- [ ] Atualizar o hub adicionando links reais para cada sub-pagina:
  ```
  notion-update-page(
    pageId: $HUB_ID,
    content: <hub com links notion:// para cada sub-pagina>
  )
  ```

### Step 6 — Gerar Relatorio

- [ ] Montar relatorio da exportacao:

```markdown
## Notion Export Report — Semana {N}

**Hub:** [S{N}] Semana {DD/MM} — {titulo}
**Hub ID:** {hub_id}
**Data:** {timestamp}

### Paginas Criadas

| # | Pagina | Page ID | Status |
|---|--------|---------|--------|
| 1 | Pacote Victor | {id} | OK |
| 2 | Instrucoes Gabriel | {id} | OK |
| 3 | Checklist Publicacao | {id} | OK |
| 4 | Post Substack | {id} | OK |
| 5 | Relatorio Astrologico | {id} | OK |
| 6 | Curadoria Cultural | {id} | OK |
| 7 | Ritual 5 Camadas | {id} | OK |
| 8 | Consolidacao QG | {id} | OK |

### Erros
{nenhum ou lista de erros}
```

- [ ] Apresentar relatorio ao usuario.

### Step 7 — Modo Interativo (se aplicavel)

No modo interativo:
- [ ] Apresentar relatorio com links para cada pagina
- [ ] Perguntar: "Todas as paginas estao corretas no Notion?"
- [ ] Se nao: identificar qual pagina tem problema e re-exportar

No modo yolo:
- [ ] Salvar relatorio e prosseguir

## Tratamento de Conteudo Grande

Paginas do Notion tem limite pratico de conteudo por chamada. Para arquivos grandes (>4000 caracteres):

1. Criar a pagina com as primeiras ~3500 caracteres
2. Usar `notion-update-page` para append do restante em blocos
3. Verificar que o conteudo completo foi transferido

**Pacote Victor** e o maior arquivo (~30k chars). Estrategia:
- Criar pagina com indice + Secao 1
- Append Secao 2, 3, 4, 5 em chamadas separadas

## Idempotencia

Se o pipeline for re-executado para a mesma semana:
1. `notion-search` encontra o hub existente
2. Atualiza sub-paginas com conteudo novo (sobrescreve)
3. NAO cria duplicatas
4. Relatorio indica "ATUALIZADO" em vez de "CRIADO"

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Hub da semana existe no Notion sob o portal Pelicula Sideral
2. Todas as 8 sub-paginas criadas e populadas com conteudo completo
3. Hub tem pagina-indice com links para cada sub-pagina
4. Nenhum conteudo truncado ou faltante
5. Victor, Gabriel e Karol podem navegar direto para seus materiais
6. Relatorio de exportacao gerado com todos os IDs
7. Re-execucao atualiza em vez de duplicar
