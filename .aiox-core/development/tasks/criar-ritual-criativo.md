---
task: criarRitualCriativo()
responsavel: Antares (Ritualista Criativo Astrologico)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Gera ritual completo (parcial + pago + narracao) sem interacoes (1 prompt)
- interactive: Apresenta tipo e camadas, pede feedback, depois escreve narracao [DEFAULT]

**Entrada:**
- campo: materia_prima_ritual
  tipo: object
  origem: Agente 1 (@astro-analyst) — secao IV do relatorio, campo materia_prima_ritual
  obrigatorio: true
  validacao: |
    Deve conter: elemento do ritual, objetivo experiencial,
    keywords de sensacao/corpo, referencias mitologicas

- campo: evento_principal
  tipo: object
  origem: Agente 1 — eventos_rankeados[0]
  obrigatorio: true
  validacao: Deve ter type, label, classification, signo

- campo: elemento_dominante
  tipo: string (fogo|terra|ar|agua)
  origem: Agente 1 — materia-prima
  obrigatorio: true

- campo: tom_emocional
  tipo: string
  origem: Agente 1 — materia-prima
  obrigatorio: false
  nota: Ajuda a calibrar a intensidade do ritual

**Saida:**
- campo: ritual_completo
  tipo: object
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: |
    {
      tipo: string,
      elemento: string,
      materiais: array,
      camadas: array (5),
      versao_gratuita: string (Markdown),
      versao_paga: string (Markdown),
      narracao_parcial: string (script com pausas),
      narracao_completa: string (script com pausas)
    }

pre-conditions:
  - [ ] Materia-prima ritual disponivel com elemento e objetivo
    tipo: pre-condition
    blocker: true
    error_message: "Materia-prima ritual nao encontrada. Verificar secao IV do relatorio."

  - [ ] Evento principal identificado com tipo e signo
    tipo: pre-condition
    blocker: true
    error_message: "Evento principal nao definido. Executar Fase 1 primeiro."

post-conditions:
  - [ ] Ritual desenhado com 5 camadas progressivas
  - [ ] Versao gratuita funciona sozinha (micro-transformacao real)
  - [ ] Versao paga aprofunda sem repetir o gratuito
  - [ ] Ponto de corte natural (open loop no momento de tensao)
  - [ ] Script de narracao parcial (3-5 min) e completo (8-15 min)
  - [ ] Materiais simples e acessiveis
  - [ ] Ritual conectado ao transito (nao e exercicio aleatorio)
  - [ ] Tom instrucional-poetico de Victor preservado
  - [ ] Zero esoterismo generico

acceptance-criteria:
  - [ ] Pessoa que faz apenas a versao gratuita sai com um insight real
    blocker: true
  - [ ] Corte entre free/paid gera curiosidade genuina, nao frustracao
  - [ ] Victor consegue gravar o audio usando apenas o script de narracao
  - [ ] Materiais sao coisas que qualquer pessoa tem em casa
  - [ ] Ritual responde ao transito especifico da semana
  - [ ] Nao e meditacao generica — a pessoa FAZ algo concreto

error_handling:
  strategy: retry-with-feedback
  common_errors:
    - name: Materia-prima vaga
      cause: Relatorio nao tem campo materia_prima_ritual detalhado
      resolution: Inferir a partir do evento principal e elemento dominante.
    - name: Ritual generico
      cause: Exercicio nao tem conexao clara com o transito
      resolution: Reescrever ancorando cada camada num aspecto especifico do evento.
    - name: Corte frustrante
      cause: Versao gratuita para no meio de uma instrucao
      resolution: Mover corte para apos uma camada completa que ja gerou insight.

performance:
  duration_expected: "5-15 min"
  token_usage: "~10,000-20,000 tokens"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, ritual, content-pipeline, agente-7, experiencial]
  created_at: "2026-02-25"
  pipeline_position: 4
  upstream_producer: astro-analyst
  downstream_consumers: [astro-writer, analista-final, victor-gravacao]
---

# Criar Ritual Criativo Semanal

## Proposito

Desenhar um ritual experiencial conectado ao transito astrologico da semana. O ritual e uma atividade criativa guiada — nao meditacao generica — que usa materiais simples para conectar a pessoa fisicamente com a energia do ceu. Produz duas versoes (gratuita parcial + paga completa) e script de narracao para Victor gravar como audio guiado.

## Quando Usar

**Use quando:**
- O relatorio foi gerado pelo Agente 1 e a materia-prima ritual esta disponivel
- O workflow Pelicula esta na Fase 4 (Producao Paralela)
- Precisa do ritual para o post Substack e audio guiado

**Nao use quando:**
- Materia-prima nao esta disponivel (Fase 1 pendente)
- Precisa de exercicio generico sem conexao astrologica
- Quer apenas ajustar um ritual existente (use chat mode)

## Instrucoes

### Step 1 — Validar Inputs e Definir Parametros

- [ ] Materia-prima ritual: elemento, objetivo experiencial, keywords corpo/sensacao
- [ ] Evento principal: tipo, signo, classificacao
- [ ] Elemento dominante: fogo, terra, ar, agua

**Extrair parametros do ritual:**

- [ ] **Tipo de ritual:** Baseado no elemento + casa/energia (ver banco no agente)
  - Fogo → ritual de vela/queima (Marte, Sol, Aries, Leao, Sagitario)
  - Terra → ritual de corpo/toque (Saturno, Touro, Virgem, Capricornio)
  - Ar → ritual de escrita/voz/respiracao (Mercurio, Gemeos, Libra, Aquario)
  - Agua → ritual de banho/copo/emocao (Lua, Venus, Cancer, Escorpiao, Peixes)
  - Eclipse/Plutao → ritual de espelho (confronto de identidade)
- [ ] **Objetivo experiencial:** O que a pessoa deve sentir/descobrir ao final?
- [ ] **Intensidade:** Leve (ingresso, sextil) / Media (trigono, conjuncao) / Forte (oposicao, quadratura, eclipse)
- [ ] **Materiais necessarios:** Max 3 itens simples

### Step 2 — Desenhar as 5 Camadas

Cada camada aprofunda a anterior progressivamente:

---

#### Camada 1 — PREPARACAO (1-2 min)

**Objetivo:** Materializar a intencao. Sair do modo "lendo" para o modo "fazendo".

- [ ] Instrucao para pegar os materiais
- [ ] Criar o espaco (sentar, silencio, desligar celular)
- [ ] Uma frase de intencao que ancora o exercicio ao transito
- [ ] Tom: direto, pratico ("Pega um caderno. Qualquer um.")

**Exemplo:**
> Pega um caderno e uma caneta. Senta num lugar quieto. Se tiver uma vela, acende.
> Essa semana o ceu ta pedindo que voce revise algo que voce acha que ja resolveu.
> Esse exercicio vai te ajudar a olhar de novo.

---

#### Camada 2 — AQUECIMENTO (2-3 min)

**Objetivo:** Exercicio leve que prepara para o aprofundamento. Baixar a guarda.

- [ ] Atividade introdutoria simples (lista, pergunta, observacao)
- [ ] Deve ser facil o suficiente para qualquer pessoa fazer
- [ ] Ja comeca a ativar a area do transito (ex: se Casa 7, pensar em relacoes)
- [ ] Tom: acessivel, sem pressao

**Exemplo:**
> Escreve 3 nomes. Pessoas que estiveram na sua cabeca essa semana.
> Nao precisa ser gente que voce gosta. So gente que apareceu no pensamento.
> Escreve rapido. Sem filtro.

---

#### Camada 3 — APROFUNDAMENTO (3-5 min)

**Objetivo:** O exercicio principal. Aqui comeca a mexer de verdade.

- [ ] Atividade que exige honestidade e vulnerabilidade
- [ ] Conectada diretamente com o aspecto astronomico
- [ ] Deve gerar um insight concreto (nao abstrato)
- [ ] A pessoa ja sai diferente daqui — mesmo sem as camadas 4-5

**Exemplo (ritual de escrita — "5 Porques"):**
> Agora olha pra um desses nomes. O que te incomoda nessa pessoa?
> Escreve. [PAUSA 10s]
> Agora pergunta: por que isso me incomoda? Escreve. [PAUSA 15s]
> Pergunta de novo: por que? [PAUSA 15s]
> E de novo: por que? [PAUSA 15s]
> A cada camada, a resposta muda de forma...

---

**>>> PONTO DE CORTE — VERSAO GRATUITA TERMINA AQUI <<<**

O corte acontece no FINAL da camada 3 ou INICIO da camada 4.

Regras do corte:
- [ ] A pessoa ja teve um insight real (micro-transformacao funcional)
- [ ] Mas sente que tem algo mais a explorar (curiosidade natural)
- [ ] A frase de corte CONVIDA, nao frustra
- [ ] Usar metafora que amplia: "Na quarta e quinta camadas, o monstro muda de forma..."

**Frase de transicao (escolher ou adaptar):**
- "Ate aqui voce ja descobriu algo importante. Mas tem mais 2 camadas — e e la que o exercicio vira outra coisa."
- "O que voce escreveu ate aqui ja e poderoso. A versao completa no Camarin aprofunda com {camada 4} e {camada 5}."
- "Na quarta e quinta camadas, a coisa muda de nivel. A versao guiada completa esta no Camarin."

---

#### Camada 4 — CONFRONTO (3-5 min) — PAGO

**Objetivo:** A camada que desconforta. Onde a transformacao real acontece.

- [ ] Atividade que confronta a pessoa com algo que ela evita
- [ ] Mais intensa que a camada 3 — exige coragem
- [ ] Guiada com cuidado (Victor acolhe enquanto desafia)
- [ ] Geralmente envolve: dizer em voz alta, olhar no espelho, queimar papel

**Exemplo (continuacao dos "5 Porques"):**
> Agora a quarta pergunta. Por que?
> Mas dessa vez, fala em voz alta. Olha pro que voce escreveu e fala.
> [PAUSA 20s]
> Notou? Quando sai da caneta e vai pra voz, a coisa muda.
> Agora a quinta e ultima pergunta...

---

#### Camada 5 — INTEGRACAO (2-3 min) — PAGO

**Objetivo:** Fechar o ciclo. Processar o que surgiu. Criar significado.

- [ ] Atividade de encerramento que integra o que surgiu
- [ ] Nao deixar a pessoa "aberta" — fechar com cuidado
- [ ] Pode envolver: escrever uma frase-sintese, guardar o papel, apagar a vela
- [ ] Tom: caloroso, de encerramento, gratidao

**Exemplo:**
> Agora releia tudo que voce escreveu. Do comeco.
> [PAUSA 20s]
> Escolhe UMA frase de tudo isso que voce quer levar pra semana.
> Escreve essa frase separada. Num papel novo se quiser.
> [PAUSA 10s]
> Guarda esse papel onde voce vai ver todo dia. Geladeira, espelho, mesa.
> Essa e a sua ancora dessa semana.
> Quando o ceu apertar, voce olha pra essa frase e lembra do que voce ja sabe.

---

### Step 3 — Escrever Script de Narracao para Victor

Produzir dois scripts de audio guiado:

#### Narracao Parcial (Gratuita) — 3-5 minutos

- [ ] Camadas 1-3 narradas por Victor
- [ ] Marcar pausas com `[PAUSA Xs]`
- [ ] Instrucoes claras: 1 instrucao por vez
- [ ] Imagens poeticas ENTRE instrucoes, nao durante
- [ ] Terminar com frase de corte/open loop

**Formato:**
```
## NARRACAO — Ritual da Semana (Versao Parcial)
**Duracao:** ~{X} minutos
**Para:** Post Substack (free)

[Victor, tom calmo e presente]

{texto com [PAUSA Xs] marcados}

[Frase de corte / open loop]
```

#### Narracao Completa (Paga) — 8-15 minutos

- [ ] Camadas 1-5 completas narradas
- [ ] Inclui tudo da versao parcial + camadas 4 e 5
- [ ] Camada 4 com tom mais intenso (Victor desafia)
- [ ] Camada 5 com tom de encerramento caloroso
- [ ] Terminar com despedida de Victor

**Formato:**
```
## NARRACAO — Ritual da Semana (Versao Completa)
**Duracao:** ~{X} minutos
**Para:** Camarin Sideral (paid)

[Victor, tom calmo e presente]

{camadas 1-3 identicas a versao parcial}

[Transicao para camada 4 — tom muda]

{camada 4 com [PAUSA Xs]}

[Transicao para camada 5 — tom acolhe]

{camada 5 com [PAUSA Xs]}

[Despedida de Victor]
```

### Step 4 — Revisao de Qualidade

**Ritual (conteudo):**
- [ ] 5 camadas progressivas desenhadas?
- [ ] Cada camada aprofunda a anterior?
- [ ] Materiais simples (max 3 itens que qualquer pessoa tem)?
- [ ] Ritual conectado ao transito especifico (nao generico)?
- [ ] Elemento dominante respeitado (fogo=vela, agua=banho, etc.)?

**Versao gratuita:**
- [ ] Funciona sozinha (micro-transformacao real)?
- [ ] Pessoa sai com insight concreto?
- [ ] Corte no momento de maior tensao (nao no meio de instrucao)?
- [ ] Frase de transicao convida, nao frustra?

**Versao paga:**
- [ ] Aprofunda sem repetir o gratuito?
- [ ] Camada 4 confronta com cuidado?
- [ ] Camada 5 fecha o ciclo (pessoa nao fica "aberta")?

**Narracao:**
- [ ] Pausas marcadas com [PAUSA Xs]?
- [ ] 1 instrucao por vez (nao blocos longos)?
- [ ] Tom de Victor (calmo, presente, caloroso)?
- [ ] Duracao parcial 3-5 min? Completa 8-15 min?
- [ ] Poetica entre instrucoes, nao durante?

**Geral:**
- [ ] Zero esoterismo generico ("chakras", "luz branca", "energias")?
- [ ] Zero terrorismo astrologico?
- [ ] Vocabulario Pelicula Sideral respeitado?
- [ ] A pessoa FAZ algo concreto (nao so imagina)?

### Step 5 — Entregar

No modo interativo:
- [ ] Apresentar tipo de ritual + materiais + resumo das 5 camadas
- [ ] Perguntar: "Esse tipo de ritual faz sentido pra energia da semana?"
- [ ] Se aprovado, apresentar versao gratuita + frase de corte
- [ ] Perguntar: "O corte ta bom? Gera curiosidade sem frustrar?"
- [ ] Apresentar versao paga + narracao completa
- [ ] Salvar em `PELICULA SIDERAL/DATA/ritual-{startDate}-{endDate}.md`

No modo yolo:
- [ ] Gerar tudo de uma vez (camadas + versoes + narracao)
- [ ] Apresentar completo + checklist
- [ ] Salvar automaticamente

## Criterios de Sucesso

A task e bem-sucedida quando:
1. Ritual com 5 camadas progressivas — cada uma aprofunda a anterior
2. Versao gratuita funciona SOZINHA (micro-transformacao real em camadas 1-3)
3. Corte gera curiosidade genuina, nao frustracao
4. Versao paga aprofunda com confronto (camada 4) e integracao (camada 5)
5. Script de narracao parcial (3-5 min) e completo (8-15 min) prontos para Victor gravar
6. Materiais simples: max 3 itens que qualquer pessoa tem em casa
7. Ritual RESPONDE ao transito — nao e exercicio aleatorio
8. Tom instrucional-poetico: "Pega um caderno. Sem filtro estetico."
9. Zero esoterismo generico — concreto, tangivel, criativo
10. Pessoa que faz o exercicio sai com insight especifico sobre sua vida
