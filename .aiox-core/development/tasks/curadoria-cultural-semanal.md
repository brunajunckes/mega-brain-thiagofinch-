---
task: curadoriaCulturalSemanal()
responsavel: Spica (Curadora Cultural Astrologica)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Pesquisa e gera curadoria completa sem interacoes (1 prompt)
- interactive: Apresenta temas de pesquisa, pede validacao, depois pesquisa e entrega [DEFAULT]

**Entrada:**
- campo: materia_prima
  tipo: object
  origem: Agente 1 (@astro-analyst) — secao IV do relatorio
  obrigatorio: true
  validacao: |
    Deve conter: temas_curadoria, arquetipos, elemento_dominante,
    metafora_central, referencias_mitologicas

- campo: panorama_celeste
  tipo: string
  origem: Agente 1 — secao I do relatorio
  obrigatorio: true
  validacao: Resumo narrativo da semana (minimo 4 frases)

- campo: evento_principal
  tipo: object
  origem: Agente 1 — eventos_rankeados[0]
  obrigatorio: true
  validacao: Deve ter type, label, classification

**Saida:**
- campo: curadoria
  tipo: object (categorias com obras + mini-interpretacoes)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: Markdown categorizado com mini-interpretacoes

- campo: obras_selecionadas
  tipo: array
  destino: State (para Agente 3 e Agente 8)
  persistido: true
  formato: Lista com nome, autor, categoria, conexao

pre-conditions:
  - [ ] Materia-prima com temas de curadoria disponiveis
    tipo: pre-condition
    blocker: true
    error_message: "Materia-prima sem temas de curadoria. Verificar secao IV do relatorio."

  - [ ] Panorama celeste disponivel para contexto
    tipo: pre-condition
    blocker: true
    error_message: "Panorama celeste nao encontrado. Executar Fase 1 primeiro."

  - [ ] EXA MCP acessivel para pesquisa web
    tipo: pre-condition
    blocker: false
    nota: Se EXA indisponivel, usar apenas classicos atemporais (fallback)

post-conditions:
  - [ ] Minimo 4 obras recomendadas, maximo 8
  - [ ] Pelo menos 3 categorias diferentes cobertas
  - [ ] Cada obra tem mini-interpretacao de 2-4 frases conectando com transito
  - [ ] Prioridade para eventos atuais/em cartaz em SP
  - [ ] Nenhuma obra inventada (todas verificaveis)
  - [ ] Tom de curador acessivel (descoberta, nao obrigacao)
  - [ ] Informacao pratica inclusa quando disponivel (local, datas)

acceptance-criteria:
  - [ ] Leitor encontra pelo menos 1 recomendacao que quer consumir essa semana
    blocker: true
  - [ ] Conexoes astro-culturais sao tematicas/emocionais, nao literais
  - [ ] Obras existem e sao verificaveis
  - [ ] Mix de atuais (SP) + classicos atemporais
  - [ ] Tom Pelicula Sideral (lifestyle cultural, nao pedante)

error_handling:
  strategy: graceful-fallback
  common_errors:
    - name: EXA indisponivel
      cause: MCP nao conectado ou rate limit
      resolution: Usar repertorio de classicos atemporais. Informar usuario que pesquisa web nao foi possivel.
    - name: Nenhum evento atual encontrado
      cause: Pesquisa nao retornou resultados relevantes para SP
      resolution: Usar classicos atemporais para todas as categorias. Nota no output.
    - name: Conexao forcada
      cause: Obra nao tem conexao natural com o transito
      resolution: Descartar e buscar outra. Nunca forcar.

performance:
  duration_expected: "5-15 min (depende de pesquisa EXA)"
  token_usage: "~10,000-15,000 tokens"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, cultura, content-pipeline, agente-6, curadoria]
  created_at: "2026-02-25"
  pipeline_position: 4
  upstream_producer: astro-analyst
  downstream_consumers: [astro-writer, analista-final]
---

# Curadoria Cultural Semanal

## Proposito

Pesquisar e selecionar obras culturais (artes visuais, teatro, cinema, literatura, poesia, musica) que ressoam tematicamente com a energia astrologica da semana. Cada recomendacao vem com uma mini-interpretacao que conecta a obra ao transito — nao e uma lista generica, e uma leitura cultural do ceu.

## Quando Usar

**Use quando:**
- O relatorio foi gerado pelo Agente 1 e a materia-prima esta disponivel
- O workflow Pelicula esta na Fase 4 (Producao Paralela)
- Precisa da curadoria para o post Substack ou aula consolidada

**Nao use quando:**
- Materia-prima nao esta disponivel (Fase 1 pendente)
- Precisa recomendar algo sem conexao com astrologia (nao e o proposito)
- Quer apenas uma recomendacao avulsa (use *buscar ou *conectar)

## Instrucoes

### Step 1 — Validar Inputs e Extrair Temas

- [ ] Materia-prima: temas_curadoria, arquetipos, elemento_dominante
- [ ] Panorama celeste: contexto geral da semana
- [ ] Evento principal: tipo, label, classificacao

Do relatorio, extrair:

- [ ] **Temas centrais:** O que o transito "fala sobre"? (ex: transformacao, identidade, comunicacao)
- [ ] **Arquetipos ativados:** Mitos, figuras, simbolos (ex: Medeia, Prometeu, Afrodite)
- [ ] **Elemento dominante:** Fogo (acao), Terra (materia), Ar (pensamento), Agua (emocao)
- [ ] **Tom emocional:** Qual a "sensacao" da semana? (ex: inquietacao, abertura, pressao)
- [ ] **Metafora central:** A imagem-ancora do relatorio (ex: "atualizacao de software", "muda de pele")
- [ ] **Palavras-chave:** Extrair 5-8 termos que guiam a pesquisa

**Exemplo de extracao:**
```
Evento: Eclipse Lunar em Virgem 14°22'
Temas: transformacao, revisao, ordem vs caos, corpo, servico
Arquetipos: Persephone (descida ao submundo), Deméter (busca)
Elemento: Terra (Virgem)
Tom: inquietacao produtiva
Metafora: "Faxina que encontra coisas esquecidas"
Keywords: revisao, limpeza, detalhe, cura, rotina, corpo, transformar
```

### Step 2 — Pesquisar Eventos Atuais (EXA MCP)

Usar EXA MCP para buscar eventos culturais atuais em Sao Paulo.

**Queries de pesquisa (adaptar ao tema da semana):**

- [ ] `"exposicoes em cartaz Sao Paulo {mes} {ano}"`
- [ ] `"filmes em cartaz cinema Sao Paulo {mes} {ano}"`
- [ ] `"pecas teatro Sao Paulo {mes} {ano}"`
- [ ] `"shows musica Sao Paulo {mes} {ano}"`
- [ ] `"{tema_central} arte contemporanea"`
- [ ] `"{arquetipo} filme cinema"`
- [ ] `"{tema_central} livro lancamento {ano}"`

**Regras de pesquisa:**
- Fazer pelo menos 3 queries diferentes
- Priorizar resultados com datas/locais em SP
- Se EXA indisponivel: pular para Step 3 (fallback classicos)
- NUNCA usar resultados que nao existem — verificar credibilidade

**Para cada resultado encontrado, anotar:**
- Nome da obra/evento
- Artista/diretor/autor
- Onde/quando (se em cartaz)
- Por que conecta com o tema (nota interna)

### Step 3 — Completar com Classicos Atemporais

Se a pesquisa web nao retornou opcoes suficientes (minimo 4), completar com classicos:

**Banco de referencia por tema:**

| Tema | Cinema | Literatura | Arte | Musica |
|------|--------|------------|------|--------|
| Transformacao | Oldboy, Mulholland Drive, A Metamorfose (anime) | Kafka, Clarice Lispector | Francis Bacon, Frida Kahlo | Bjork, Radiohead |
| Identidade | Persona (Bergman), Zelig (Allen) | Borges, Fernando Pessoa | Cindy Sherman, Magritte | David Bowie |
| Comunicacao | Arrival, Lost in Translation | Italo Calvino, Guimaraes Rosa | Barbara Kruger, Jenny Holzer | Laurie Anderson |
| Poder/Controle | There Will Be Blood, O Poderoso Chefao | Shakespeare, Dostoievski | Ai Weiwei, Banksy | Wagner, Nina Simone |
| Amor/Relacoes | Brilho Eterno, In the Mood for Love | Neruda, Adelia Prado | Klimt, Chagall | Tom Jobim, Chet Baker |
| Espiritualidade | Stalker (Tarkovsky), Spring Summer Fall Winter | Rumi, Hesse, Manoel de Barros | Rothko, Bill Viola | Brian Eno, Alice Coltrane |
| Morte/Renascimento | A Arvore da Vida, Enter the Void | Saramago, Tolstoi | Anselm Kiefer, Marina Abramovic | Bach, Nick Cave |

**Regras para classicos:**
- Escolher obras que o publico Pelicula (25-40 anos, urbano, culto-curioso) provavelmente NAO conhece profundamente
- Variar entre brasileiros e internacionais
- Poesia e sempre bem-vinda como complemento

### Step 4 — Selecionar 4-8 Obras Finais

Critérios de selecao:

- [ ] **Conexao real:** A obra tem conexao tematica/emocional GENUINA com o transito?
- [ ] **Diversidade:** Pelo menos 3 categorias diferentes cobertas?
- [ ] **Acessibilidade:** O publico consegue consumir? (em cartaz, no streaming, em livraria)
- [ ] **Mix temporal:** Pelo menos 1 atual + pelo menos 1 classico?
- [ ] **Impacto:** A pessoa vai sair diferente depois de consumir?

**Quantidade por categoria (sugestao):**
- 1-2 Artes visuais (exposicao ou artista)
- 1-2 Cinema (em cartaz ou classico)
- 1 Teatro (em cartaz SP ou classico)
- 1-2 Literatura (livro ou poema)
- 0-1 Musica (show, album ou musica especifica)

### Step 5 — Escrever Mini-Interpretacoes

Para cada obra selecionada, escrever 2-4 frases que conectam a obra ao transito.

**Estrutura da mini-interpretacao:**
1. O que a obra e/faz (1 frase de contexto)
2. Por que ressoa com a semana (1-2 frases de conexao)
3. O que o leitor ganha ao consumir (1 frase de convite — opcional)

**Tom:** Descoberta entusiasmada. Como alguem que acabou de ver a obra e esta compartilhando a experiencia.

**Exemplos de BOA mini-interpretacao:**

> **Oldboy** (2003) — Park Chan-wook
> Venus retrograda revisita o amor. Em Escorpiao, revisita o que o amor fez de voce. Park Chan-wook sabe filmar obsessao como ninguem. Se voce aguenta olhar de frente, esse filme e uma catarse.

> **Torres Garcia** — Museu da Cidade (SP)
> Ele pintava cidades de cabeca pra baixo. Eclipse solar e isso: o que voce achava que era o chao pode ser o teto. Se a exposicao ainda tiver em cartaz, va. Se nao, pesquisa as obras online — vale cada minuto.

**Exemplos de MA mini-interpretacao (NAO fazer):**
- "Um filme muito bom que vale a pena assistir." (generica, sem conexao)
- "Esse livro fala de transformacao, e essa semana e de transformacao." (literal demais)
- "Recomendo demais." (nao diz nada)

**Checklist por mini-interpretacao:**
- [ ] Conexao com o transito e clara mas nao literal?
- [ ] Tom de descoberta, nao de obrigacao?
- [ ] O leitor entende POR QUE essa obra e relevante ESTA semana?
- [ ] Informacao pratica inclusa (onde ver, se em cartaz)?

### Step 6 — Formatar Output

Organizar a curadoria no formato padrao:

```markdown
## Curadoria Cultural — Semana de {inicio} a {fim}
*O ceu desta semana pede: {tom_emocional em 1 frase}*

---

### Artes Visuais

**{Nome da Exposicao/Obra}** — {Artista}
{Local, datas — se em cartaz} | {ou: classico atemporal}
> {Mini-interpretacao: 2-4 frases}

---

### Cinema

**{Nome do Filme}** ({Ano}) — {Diretor}
{Em cartaz em SP / streaming ({plataforma}) / classico}
> {Mini-interpretacao: 2-4 frases}

---

### Teatro

**{Nome da Peca}** — {Dramaturgo/Companhia}
{Teatro, datas — se em cartaz} | {ou: texto classico para leitura}
> {Mini-interpretacao: 2-4 frases}

---

### Literatura

**{Nome do Livro/Conto}** — {Autor}
{Editora, ano} | {ou: disponivel em {local}}
> {Mini-interpretacao: 2-4 frases}

---

### Poesia

**{Poema/Coletanea}** — {Poeta}
> {Mini-interpretacao + trecho do poema se relevante}

---

### Musica

**{Album/Musica/Show}** — {Artista}
{Show: local, data} | {Streaming: Spotify/etc}
> {Mini-interpretacao: 2-4 frases}
```

### Step 7 — Revisao de Qualidade

**Checklist final:**

**Conteudo:**
- [ ] Minimo 4 obras, maximo 8?
- [ ] Pelo menos 3 categorias diferentes?
- [ ] Cada obra tem mini-interpretacao de 2-4 frases?
- [ ] Conexoes sao tematicas/emocionais, nao literais?
- [ ] Nenhuma obra inventada (todas verificaveis)?
- [ ] Mix de atuais + classicos?

**Tom e Marca:**
- [ ] Tom de curador acessivel (descoberta, nao pedante)?
- [ ] Nenhuma obrigacao ("deve ver") — apenas convite?
- [ ] Vocabulario Pelicula Sideral respeitado?
- [ ] Nivel cultural adequado ao publico (25-40, urbano, curioso)?

**Informacao pratica:**
- [ ] Obras em cartaz tem local e datas?
- [ ] Filmes em streaming tem plataforma mencionada?
- [ ] Links ou referencias para encontrar as obras?

### Step 8 — Entregar

No modo interativo:
- [ ] Apresentar temas de pesquisa extraidos (Step 1) — pedir validacao
- [ ] Apresentar obras selecionadas (nomes + categorias) — pedir feedback
- [ ] Se aprovado, apresentar curadoria completa com mini-interpretacoes
- [ ] Perguntar: "Quer trocar alguma obra ou ajustar alguma conexao?"
- [ ] Salvar em `PELICULA SIDERAL/DATA/curadoria-{startDate}-{endDate}.md`

No modo yolo:
- [ ] Pesquisar + selecionar + escrever tudo de uma vez
- [ ] Apresentar curadoria completa + checklist de revisao
- [ ] Salvar automaticamente

## Criterios de Sucesso

A task e bem-sucedida quando:
1. 4-8 obras recomendadas, cobrindo pelo menos 3 categorias
2. Cada obra tem mini-interpretacao GENUINA conectando com o transito
3. Conexoes sao tematicas/emocionais, nunca literais ("o filme fala de estrelas")
4. Nenhuma obra inventada — todas verificaveis
5. Mix de atuais em SP + classicos atemporais
6. Informacao pratica inclusa quando disponivel
7. Tom de curador acessivel — descoberta, nao obrigacao
8. Leitor encontra pelo menos 1 obra que quer consumir essa semana
9. Curadoria reforça posicionamento Pelicula Sideral como lifestyle cultural
10. Zero recomendacoes de conteudo SOBRE astrologia (a curadoria e sobre ARTE)
