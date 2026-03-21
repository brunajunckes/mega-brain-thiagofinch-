---
task: criarRoteiroVideoAnalise()
responsavel: Altair (Roteirista de Video Astrologico)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Gera ambos os roteiros (video longo + Reels) sem interacoes (1 prompt)
- interactive: Apresenta roteiro do video primeiro, pede feedback, depois Reels [DEFAULT]

**Entrada:**
- campo: post_aprovado
  tipo: string (Markdown)
  origem: Agente 3 (@astro-writer) — post Substack aprovado na Fase 3B
  obrigatorio: true
  validacao: |
    DEVE ser o post completo (free + paid) aprovado pelo usuario
    DEVE conter secoes de conteudo gratuito e pago
    DEVE conter 12 interpretacoes por ascendente
    Se contem {{PLACEHOLDER}}, REJEITAR — pedir post finalizado

- campo: materia_prima
  tipo: object
  origem: Agente 1 (@astro-analyst) — secao IV do relatorio
  obrigatorio: true
  validacao: |
    Deve conter: keywords, metafora_central, talking_points (3-5),
    temas_curadoria, arquetipos, materia_prima_ritual

- campo: relatorio_validado
  tipo: string (Markdown)
  origem: Agente 2 (@astro-conferencia) — relatorio com selo de qualidade
  obrigatorio: false
  nota: Opcional mas enriquece o roteiro com dados tecnicos (graus, orbes) para Victor citar

- campo: panorama_celeste
  tipo: string
  origem: Agente 1 — secao I do relatorio
  obrigatorio: false
  nota: Util para contexto geral do video

**Saida:**
- campo: roteiro_video_longo
  tipo: string (Markdown formatado)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: Talking points + timing + direcao emocional + dados de apoio + sugestoes visuais

- campo: roteiro_reels
  tipo: string (Markdown formatado)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: Gancho + 3 talking points + CTA + legenda + hashtags

- campo: instrucoes_edicao
  tipo: string
  destino: State (para Gabriel)
  persistido: true
  formato: Momentos para graficos, tom da musica, cortes sugeridos

- campo: legenda_reels
  tipo: string
  destino: State
  persistido: true
  formato: Legenda + hashtags para publicacao

pre-conditions:
  - [ ] Post aprovado existe e foi validado na Fase 3B
    tipo: pre-condition
    blocker: true
    error_message: "Post nao encontrado ou nao aprovado. Executar Fases 1-3B primeiro."

  - [ ] Materia-prima com talking points disponiveis
    tipo: pre-condition
    blocker: true
    error_message: "Materia-prima sem talking points. Verificar secao IV do relatorio."

  - [ ] Template roteiro-reels-jornal-sideral.md existe em templates/
    tipo: pre-condition
    blocker: false

  - [ ] Template roteiro-stories-spoiler-semanal.md existe em templates/
    tipo: pre-condition
    blocker: false

post-conditions:
  - [ ] Roteiro do video longo gerado com 7 blocos (Gancho→Contexto→Evento→Impacto→Casas→Ritual→CTA)
  - [ ] Cada bloco tem: tempo sugerido + direcao emocional + talking points + dados de apoio
  - [ ] Roteiro do Reels gerado com gancho (3s) + conteudo + CTA
  - [ ] Instrucoes de edicao para Gabriel incluidas
  - [ ] Legenda + hashtags prontas para publicacao
  - [ ] Dados tecnicos (graus, orbes) incluidos para Victor demonstrar autoridade
  - [ ] Tom de Victor respeitado — talking points, NAO teleprompter
  - [ ] Zero terrorismo astrologico

acceptance-criteria:
  - [ ] Victor consegue gravar usando apenas o roteiro como guia (sem precisar de outra fonte)
    blocker: true
  - [ ] Gabriel consegue editar usando apenas as instrucoes (sem precisar perguntar)
  - [ ] Arco emocional presente no video longo (forte→crescente→intenso→calmo→quente)
  - [ ] Gancho do Reels prende em 3 segundos
  - [ ] CTA natural, nunca vendedor
  - [ ] Dados tecnicos corretos (conferir com post/relatorio)

error_handling:
  strategy: retry-with-feedback
  common_errors:
    - name: Post nao aprovado
      cause: Fase 3B nao executada ou post rejeitado
      resolution: Informar usuario e sugerir executar Fase 3B.
    - name: Materia-prima incompleta
      cause: Relatorio falta talking points ou metafora central
      resolution: Extrair talking points diretamente do post aprovado.
    - name: Tom academico demais
      cause: Roteiro soa como texto escrito, nao como guia de video
      resolution: Reescrever como talking points com indicacoes de energia e performance.

performance:
  duration_expected: "5-10 min"
  token_usage: "~10,000-20,000 tokens para ambos os roteiros"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, video, content-pipeline, agente-4, roteiro]
  created_at: "2026-02-25"
  pipeline_position: 4
  upstream_producer: astro-writer
  downstream_consumers: [analista-final, gabriel-edicao, victor-gravacao]
---

# Criar Roteiro de Video — Analise Astrologica Semanal

## Proposito

Transformar o post Substack aprovado e a materia-prima do relatorio em dois roteiros audiovisuais: (1) Video Longo de 5-15 minutos (aula semanal do Camarin Sideral) e (2) Reels de 60-90 segundos (Jornal Sideral para alcance). Os roteiros sao ESTRUTURA para Victor improvisar, nao texto para teleprompter.

## Quando Usar

**Use quando:**
- O post Substack foi aprovado na Fase 3B
- O workflow de conteudo Pelicula esta na Fase 4 (Producao Paralela)
- Precisa gerar roteiros para Victor gravar

**Nao use quando:**
- O post ainda nao foi aprovado (Fases 1-3B pendentes)
- Precisa apenas de ajustes em um roteiro ja escrito (use *revisar)
- Quer gerar apenas legenda/hashtags (use *legenda)

## Instrucoes

### Step 1 — Validar Inputs

Verificar que todos os inputs estao disponiveis:

- [ ] Post aprovado: Contem conteudo free + paid completo
- [ ] Materia-prima: Keywords, metafora central, talking points (3-5), temas curadoria
- [ ] (Opcional) Relatorio validado: Dados tecnicos extras (graus, orbes, posicoes)

**VALIDACAO CRITICA:** Se o post contem `{{PLACEHOLDER}}` ou nao tem as 12 interpretacoes por ascendente, REJEITAR e pedir o post finalizado. Provavelmente recebeu um rascunho.

**Se algum input falta:**
- Post ausente: "Execute as Fases 1-3B primeiro."
- Materia-prima ausente: Extrair talking points diretamente do post (fallback).

### Step 2 — Ler Referencias

Carregar e analisar:

- [ ] Template: `templates/roteiro-reels-jornal-sideral.md` — estrutura e CTA do Reels
- [ ] Template: `templates/roteiro-stories-spoiler-semanal.md` — tom e formato Stories
- [ ] Post aprovado: Extrair conteudo-chave (ver Step 3)

### Step 3 — Extrair Conteudo-Chave do Post

Do post aprovado, identificar e anotar:

- [ ] **Evento principal:** Nome, dados tecnicos (graus, orbes, signo, casas), classificacao
- [ ] **Metafora central:** A imagem/analogia que ancora toda a narrativa da semana
- [ ] **Talking points:** 3-5 pontos da materia-prima (secao IV do relatorio)
- [ ] **Vivencia/Sintomatologia:** Como o evento se manifesta no corpo e emocoes
- [ ] **Curadoria cultural:** 1-2 pecas para Victor mencionar brevemente no video
- [ ] **Ritual da semana:** Resumo para explicar/guiar no video
- [ ] **Top 4-6 casas mais impactadas:** Para a secao de guia por casas
- [ ] **Dados de autoridade:** Graus exatos, orbes, ciclos historicos que Victor pode citar

### Step 4 — Gerar Roteiro do Video Longo (5-15 min)

Criar roteiro seguindo a estrutura de 7 blocos. Para CADA bloco, fornecer:
- **Timing sugerido** (Victor costuma expandir 20-30%)
- **Direcao emocional** (energia do bloco)
- **Talking points** (3-5 bullets por bloco)
- **Dados de apoio** (graus, nomes, fatos para Victor citar)
- **Sugestoes visuais** (graficos/overlays para Gabriel)

---

#### Bloco 1 — GANCHO (0:00-0:30)

**Energia:** Alta — Victor olha pra camera, tom de quem tem algo importante pra contar

**O que incluir:**
- [ ] Frase de impacto sobre o evento principal (deve ser compartilhavel sozinha)
- [ ] Contexto emocional imediato ("voce sentiu isso essa semana?")
- [ ] Preview do que vem ("vem comigo que eu vou te mostrar...")

**Sugestao visual:** Texto na tela com a frase de gancho nos primeiros 3 segundos

**Regras:**
- Primeira frase decide se o espectador fica — deve ser FORTE
- Nao entregar o conteudo, criar curiosidade
- Tom de conversa, nao de apresentacao

**Formato de entrega:**
```
## GANCHO (0:00-0:30) 🔴 Energia: ALTA
**Frase de abertura:** [frase compartilhavel]
**Contexto emocional:** [como Victor conecta com o espectador]
**Transicao:** [como passa pro proximo bloco]
📊 Visual: [instrucao para Gabriel]
```

---

#### Bloco 2 — CONTEXTO (0:30-2:00)

**Energia:** Media-alta — tom de professor entusiasmado

**O que incluir:**
- [ ] O que esta acontecendo no ceu — dados astronomicos simplificados
- [ ] Posicoes planetarias chave (com graus para autoridade)
- [ ] Contexto historico/ciclico se relevante ("ultima vez que isso aconteceu...")
- [ ] Traducao acessivel para leigos

**Sugestao visual:** Grafico com posicoes planetarias, overlay com dados

**Regras:**
- Incluir graus e dados para autoridade, MAS sempre com traducao acessivel
- Nao se perder em tecnicalidades — objetivo e dar contexto, nao aula de astronomia

**Formato de entrega:**
```
## CONTEXTO (0:30-2:00) 🟠 Energia: MEDIA-ALTA
**O que acontece no ceu:** [resumo em 2-3 bullets]
**Dados para citar:** [graus, orbes, signos — Victor escolhe o que usar]
**Contexto historico:** [se aplicavel]
**Analogia acessivel:** [metafora para leigos]
📊 Visual: [instrucao para Gabriel — ex: grafico de posicoes]
```

---

#### Bloco 3 — EVENTO PRINCIPAL (2:00-5:00)

**Energia:** Crescente — comeca tecnico, sobe pra poetico

**O que incluir:**
- [ ] Analise profunda do evento #1 (o mais importante da semana)
- [ ] Framework tripartite adaptado para video:
  - **Mecanica:** Dados puros com graus e orbes (30-45s)
  - **Metafora:** Imagem poetica/mitica que traduz o aspecto (30-45s)
  - **Vivencia:** Experiencia concreta — corpo, emocoes, decisoes (45-60s)
- [ ] Momento de micro-engajamento ("voce ta sentindo isso, ne?")

**Sugestao visual:** Corte no pico da metafora, overlay com dados no momento tecnico

**Regras:**
- Este e o bloco mais importante — merece mais tempo e profundidade
- A transicao de tecnico para poetico deve ser fluida (Victor faz isso naturalmente)
- Dados PRIMEIRO, depois a interpretacao

**Formato de entrega:**
```
## EVENTO PRINCIPAL (2:00-5:00) 🟡 Energia: CRESCENTE (tecnico → poetico)
**Mecanica (dados):**
- [bullet 1 — dado tecnico com graus]
- [bullet 2 — tipo de aspecto, orbe]
- [bullet 3 — contexto ciclico]

**Metafora:**
- [imagem poetica/mitica principal]
- [conexao com a vida real]

**Vivencia:**
- [como o corpo sente]
- [como as emocoes se manifestam]
- [que tipo de decisoes ficam dificeis/faceis]

**Micro-engajamento:** [pergunta para Victor fazer ao espectador]
📊 Visual: [instrucao para Gabriel]
```

---

#### Bloco 4 — IMPACTO PRATICO (5:00-7:00)

**Energia:** Intensa — conexao emocional forte

**O que incluir:**
- [ ] Como o evento afeta o dia a dia concreto (trabalho, relacoes, saude, dinheiro)
- [ ] Sintomas que o espectador pode estar sentindo (validacao)
- [ ] Transitos secundarios que amplificam o efeito (se houver)
- [ ] Momento de micro-engajamento forte ("rele e me diz se nao e exatamente...")

**Sugestao visual:** Momento intimo — camera mais proxima, sem graficos (so Victor)

**Regras:**
- Este e o bloco de CONEXAO EMOCIONAL — Victor precisa olhar na camera e falar direto
- Listar sintomas concretos, nao abstratos ("insonia" nao "mudanca energetica")
- NUNCA alarmista — observar, nao assustar

**Formato de entrega:**
```
## IMPACTO PRATICO (5:00-7:00) 🔴 Energia: INTENSA
**Areas da vida afetadas:**
- [area 1 — como se manifesta]
- [area 2 — como se manifesta]

**Sintomas para validar:**
- [sintoma concreto 1]
- [sintoma concreto 2]
- [sintoma concreto 3]

**Transitos secundarios:** [se amplificam o efeito]
**Micro-engajamento:** [frase de validacao para Victor usar]
📊 Visual: [camera proxima, sem graficos]
```

---

#### Bloco 5 — GUIA POR CASAS (7:00-11:00)

**Energia:** Variada — rapida e direta para cada casa

**O que incluir:**
- [ ] Top 4-6 casas/ascendentes mais impactados pelo evento
- [ ] Para cada casa: 2-3 frases rapidas sobre como o evento chega ali
- [ ] NÃO precisam ser as 12 — selecionar as mais relevantes (restante fica nos audios individuais)
- [ ] Formato rapido: "Se voce e ascendente em X: [impacto em 1 frase]. [Conselho em 1 frase]."

**Sugestao visual:** Texto na tela com signo/ascendente enquanto Victor fala

**Regras:**
- Rapido e direto — este bloco pode ficar longo demais se nao tiver disciplina
- Victor seleciona 4-6, nao precisa fazer todas (as 12 completas estao nos audios pagos)
- Priorizar casas onde o evento cai em angulares (1, 4, 7, 10) ou onde e mais intenso
- Se o video ja esta longo, reduzir para top 3-4

**Formato de entrega:**
```
## GUIA POR CASAS (7:00-11:00) 🟢 Energia: VARIADA
**Casas selecionadas (top 4-6 mais impactadas):**

**Ascendente em {Signo} (Casa {N}):**
- Impacto: [1-2 frases]
- Conselho: [1 frase direta]

[repetir para cada casa selecionada]

**Transicao:** "As outras casas eu detalho nos audios individuais — cada ascendente tem o seu."
📊 Visual: [texto na tela com signo + icone enquanto Victor fala]
```

---

#### Bloco 6 — RITUAL (11:00-13:00)

**Energia:** Calma e instrucional — como um guia

**O que incluir:**
- [ ] Explicacao breve do ritual da semana (o que e, por que funciona)
- [ ] Instrucoes basicas para fazer em casa
- [ ] Se o ritual tem versao longa paga, mencionar sem ser vendedor
- [ ] Conexao do ritual com o evento astronomico

**Sugestao visual:** Instrucoes na tela, tom contemplativo na edicao

**Regras:**
- Tom muda — sai da energia do video e entra no modo guia calmo
- Victor pode guiar parcialmente ou apenas explicar (depende do ritual)
- Se o ritual e longo demais para video, dar a essencia e direcionar para o post

**Formato de entrega:**
```
## RITUAL (11:00-13:00) 🔵 Energia: CALMA
**O que e o ritual:** [1 frase descritiva]
**Por que funciona:** [conexao com o evento astronomico]
**Instrucoes resumidas:**
1. [passo 1]
2. [passo 2]
3. [passo 3]
**Mencao paga:** [se houver versao completa no post — tom natural]
📊 Visual: [instrucoes na tela, musica suave, ritmo mais lento]
```

---

#### Bloco 7 — ENCERRAMENTO + CTA (13:00-15:00)

**Energia:** Quente — energia de conexao e carinho

**O que incluir:**
- [ ] Conclusao poetica que amarra a narrativa (callback para o gancho)
- [ ] CTA para o Camarin Sideral (extensao natural, NUNCA propaganda)
- [ ] Despedida calorosa no tom de Victor
- [ ] Opcional: provocacao para a semana seguinte (open loop)

**Sugestao visual:** Victor relaxado, camera normal, mood quente

**Regras:**
- CTA e convite, nao venda. "Quem ta no Camarin ja vai ter tudo isso detalhado..."
- Fechar com frase poetica que o espectador queira compartilhar
- Nao terminar com "link na bio" — terminar com carinho

**CTA rotacao (escolher 1):**
- A: "Quem ta no Camarin ja recebeu tudo isso personalizado pro seu mapa. Se faz sentido pra voce, o link ta na bio."
- B: "Toda semana eu aprofundo tudo isso la no Camarin. Se voce quer navegar com o ceu, te espero la."
- C: "No Camarin essa semana a gente vai [atividade especifica]. Quem quiser fazer parte, vem."

**Formato de entrega:**
```
## ENCERRAMENTO (13:00-15:00) 💜 Energia: QUENTE
**Conclusao poetica:** [frase que amarra a narrativa]
**CTA:** [variacao escolhida — tom natural]
**Despedida:** [frase de Victor — quente, pessoal]
📊 Visual: [Victor relaxado, sem graficos, mood intimista]
```

---

### Step 5 — Gerar Roteiro do Reels (60-90s)

Criar roteiro condensado para o Jornal Sideral.

- [ ] **Escolher tipo de gancho** baseado no evento da semana:
  - Tipo A: Alerta poetico — para eventos atmosfericos/emocionais
  - Tipo B: Pergunta provocativa — para eventos que geram curiosidade
  - Tipo C: Direto ao impacto — para eventos que afetam signos especificos
  - Tipo D: Narrativa — para eventos com historia/contexto ciclico
  - Tipo E: Controversia suave — para desmitificar medos (retrogrado, eclipse)

- [ ] **Condensar 3 talking points:**
  1. O que acontece no ceu (dado simplificado)
  2. O que isso significa na pratica (impacto direto)
  3. Conselho/insight (acao concreta)

- [ ] **CTA para comentarios** (ascendente) — escolher da rotacao no template

- [ ] **Gerar legenda** + hashtags usando template `roteiro-reels-jornal-sideral.md`

**Regras do Reels:**
- 3 segundos ou perde — a primeira frase e TUDO
- 1 insight profundo, nao 5 superficiais
- Energia alta CONSTANTE (nao tem espaco pra desacelerar em 60s)
- CTA como convite natural de amigo
- Max 3-5 bullets para Victor — ele expande naturalmente

**Formato de entrega:**
```
## REELS — JORNAL SIDERAL (60-90s)

### GANCHO (0-5s) — Tipo {A/B/C/D/E}
**Frase:** "[frase de impacto]"
**Instrucao:** Victor olha direto pra camera, energia alta

### CONTEUDO (5-50s)
**Talking point 1:** [o que acontece no ceu — 1 frase]
**Talking point 2:** [o que isso significa pra vida — 1-2 frases]
**Talking point 3:** [conselho pratico — 1 frase]

### CTA (50-60s)
**Frase:** "[variacao de CTA]"
**Tom:** Convite natural, nao propaganda

---

### LEGENDA
[texto da legenda com CTA + keyword ManyChat]

### HASHTAGS
[hashtags relevantes]
```

### Step 6 — Gerar Instrucoes de Edicao para Gabriel

Compilar instrucoes especificas para a edicao:

- [ ] **Video Longo:**
  - Momentos para inserir graficos/overlays (quais blocos, que dados mostrar)
  - Tom da musica de fundo por bloco (energetica no gancho, crescente no evento, calma no ritual)
  - Cortes sugeridos (momentos de transicao entre blocos)
  - Formato: 16:9 horizontal

- [ ] **Reels:**
  - Cortes dinamicos nos primeiros 3 segundos
  - Legenda automatica (CapCut)
  - Texto na tela no gancho
  - Musica alinhada ao tom da semana
  - Formato: 9:16 vertical

**Formato de entrega:**
```
## INSTRUCOES PARA GABRIEL

### Video Longo (16:9)
| Tempo | Acao de Edicao |
|-------|---------------|
| 0:00-0:03 | [instrucao] |
| ... | ... |

**Musica:** [descricao do tom por bloco]
**Graficos:** [lista de overlays necessarios]

### Reels (9:16)
| Tempo | Acao de Edicao |
|-------|---------------|
| 0-3s | [instrucao] |
| ... | ... |

**Musica:** [descricao]
**Legenda:** CapCut automatica
```

### Step 7 — Revisao Interna

Checklist final antes de entregar:

**Video Longo:**
- [ ] 7 blocos presentes (Gancho→Contexto→Evento→Impacto→Casas→Ritual→CTA)?
- [ ] Cada bloco tem timing + energia + talking points + dados + visual?
- [ ] Dados tecnicos incluidos para Victor demonstrar autoridade?
- [ ] Arco emocional coerente (forte→crescente→intenso→calmo→quente)?
- [ ] Nenhum bloco e "texto para ler" — tudo sao talking points?
- [ ] Duracao estimada entre 5-15 min?

**Reels:**
- [ ] Gancho prende em 3 segundos?
- [ ] Max 3 talking points?
- [ ] CTA natural e nao vendedor?
- [ ] Legenda + hashtags prontas?
- [ ] Duracao total 60-90s?

**Geral:**
- [ ] Tom de Victor consistente (conversacional, poetico, entusiasmado)?
- [ ] Zero terrorismo astrologico?
- [ ] Vocabulario da Pelicula Sideral respeitado ("ceu" nao "cosmos", etc.)?
- [ ] Instrucoes para Gabriel claras e acionaveis?
- [ ] Dados conferem com o post/relatorio?

### Step 8 — Entregar

No modo interativo:
- [ ] Apresentar roteiro do video longo primeiro
- [ ] Perguntar: "Quer ajustar algum bloco, tom ou timing?"
- [ ] Se aprovado, apresentar roteiro do Reels
- [ ] Perguntar: "Reels ok? Algo pra ajustar no gancho ou CTA?"
- [ ] Apresentar instrucoes para Gabriel
- [ ] Salvar outputs em `PELICULA SIDERAL/DATA/`:
  - `roteiro-video-{startDate}-{endDate}.md`
  - `roteiro-reels-{startDate}-{endDate}.md`

No modo yolo:
- [ ] Gerar tudo de uma vez (video + Reels + instrucoes)
- [ ] Apresentar completo + checklist de revisao
- [ ] Salvar automaticamente

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Roteiro do video longo com 7 blocos completos — Victor consegue gravar usando apenas este documento
2. Roteiro do Reels com gancho forte + 3 talking points + CTA — Gabriel consegue editar sem perguntas
3. Instrucoes de edicao claras para Gabriel (graficos, musica, cortes)
4. Legenda + hashtags prontas para publicacao
5. Dados tecnicos corretos (graus, orbes, posicoes conferem com post/relatorio)
6. Tom de Victor preservado — talking points, NAO teleprompter
7. Arco emocional coerente no video longo
8. Gancho do Reels prende nos primeiros 3 segundos
9. CTA natural em ambos os formatos — extensao da conversa, nunca propaganda
10. Zero terrorismo astrologico — "observe que" nao "cuidado com"
