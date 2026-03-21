---
task: criarRoteiros12Casas()
responsavel: Polaris (Roteirista das 12 Casas)
responsavel_type: Agente
atomic_layer: Organism

## Execution Modes
- yolo: Gera os 12 scripts de uma vez sem interacoes (1 prompt)
- interactive: Apresenta tabela de casas + 3 primeiros scripts, pede feedback, depois completa [DEFAULT]

**Entrada:**
- campo: relatorio_validado
  tipo: string (Markdown)
  origem: Agente 2 (@astro-conferencia) — relatorio com selo de qualidade
  obrigatorio: true
  validacao: |
    DEVE conter selo "APROVADO" do Agente 2
    DEVE conter secoes I-V com eventos rankeados e framework tripartite
    Se contem {{PLACEHOLDER}}, REJEITAR

- campo: eventos_rankeados
  tipo: array
  origem: Agente 1 (@astro-analyst) — secao III do relatorio
  obrigatorio: true
  validacao: |
    Pelo menos 3 eventos com type, label, weight, classification
    Evento #1 deve ter signo identificado

- campo: materia_prima
  tipo: object
  origem: Agente 1 (@astro-analyst) — secao IV do relatorio
  obrigatorio: true
  validacao: |
    Deve conter: keywords, metafora_central, tom_emocional

- campo: post_aprovado
  tipo: string (Markdown)
  origem: Agente 3 (@astro-writer) — post Substack aprovado
  obrigatorio: false
  nota: |
    Se disponivel, usar as 12 interpretacoes do post como REFERENCIA DE TOM.
    Os scripts de audio sao mais profundos e detalhados que as interpretacoes
    do post (que sao 3-4 frases). Os audios sao 60-90s cada.

**Saida:**
- campo: roteiros_casas
  tipo: array (12 strings Markdown)
  destino: File (PELICULA SIDERAL/DATA/)
  persistido: true
  formato: 12 scripts de audio, 120-180 palavras cada

- campo: tabela_casas
  tipo: string (Markdown table)
  destino: State
  persistido: true
  formato: Tabela signo → casa → area da vida

pre-conditions:
  - [ ] Relatorio validado existe e tem selo do Agente 2
    tipo: pre-condition
    blocker: true
    error_message: "Relatorio nao validado. Executar Fases 1-2 primeiro."

  - [ ] Evento principal identificado com signo
    tipo: pre-condition
    blocker: true
    error_message: "Evento principal nao tem signo definido. Verificar eventos rankeados."

post-conditions:
  - [ ] 12 scripts gerados (Aries a Peixes), cada um com 120-180 palavras
  - [ ] Cada script menciona qual casa e ativada e o que essa casa governa
  - [ ] Cada script tem: abertura + desenvolvimento + conselho + dica
  - [ ] Nenhum script e copia de outro com signo trocado
  - [ ] Conselhos sao concretos e acionaveis
  - [ ] Tom de Victor consistente (intimo, pessoal, acolhedor)
  - [ ] Zero terrorismo astrologico
  - [ ] Tabela de casas gerada como referencia

acceptance-criteria:
  - [ ] Victor consegue gravar cada audio usando apenas o script (autossuficiente)
    blocker: true
  - [ ] Ouvinte entende o audio sem ter ouvido os outros 11
  - [ ] Cada script e genuinamente diferente em estrutura e abordagem
  - [ ] Casa astrologica correta para cada ascendente (calculo verificavel)
  - [ ] Conselhos sao praticos e especificos para a area da vida da casa

error_handling:
  strategy: retry-with-feedback
  common_errors:
    - name: Evento sem signo
      cause: Relatorio nao especifica em que signo o evento ocorre
      resolution: Buscar no JSON bruto ou pedir ao usuario.
    - name: Scripts genericos
      cause: Todos soam parecidos com signo trocado
      resolution: Reescrever variando a abordagem — uns comecam pelo corpo, outros pela emocao, outros pela situacao pratica.
    - name: Casas calculadas errado
      cause: Erro no mapeamento ascendente → casa
      resolution: Recalcular usando a formula ou tabela de referencia.

performance:
  duration_expected: "10-20 min"
  token_usage: "~20,000-40,000 tokens para 12 scripts completos"

metadata:
  story: "N/A"
  version: "1.0.0"
  tags: [pelicula, audio, content-pipeline, agente-5, casas, ascendente]
  created_at: "2026-02-25"
  pipeline_position: 4
  upstream_producer: astro-writer
  downstream_consumers: [analista-final, victor-gravacao]
---

# Criar Roteiros de Audio — 12 Casas/Ascendentes

## Proposito

Produzir 12 scripts de audio independentes (60-90 segundos cada), um para cada signo ascendente, explicando como o evento astrologico principal da semana afeta especificamente quem tem aquele ascendente. Estes audios sao conteudo pago do Camarin Sideral — a personalizacao e o principal diferencial de valor.

## Quando Usar

**Use quando:**
- O relatorio foi validado pelo Agente 2 e o post aprovado na Fase 3B
- O workflow Pelicula esta na Fase 4 (Producao Paralela)
- Precisa gerar os 12 audios personalizados da semana

**Nao use quando:**
- O relatorio nao foi validado (Fases 1-2 pendentes)
- Precisa apenas ajustar 1-2 scripts existentes (use *casa {signo})
- Quer as interpretacoes em formato texto para o post (isso e responsabilidade do Agente 3)

## Instrucoes

### Step 1 — Validar Inputs

- [ ] Relatorio validado: Contem selo do Agente 2, secoes I-V completas
- [ ] Eventos rankeados: Pelo menos 3, evento #1 com signo claro
- [ ] Materia-prima: Keywords, metafora central, tom emocional
- [ ] (Opcional) Post aprovado: Referencia de tom para as 12 interpretacoes

**VALIDACAO CRITICA:** Se o evento principal nao tem signo definido, impossivel calcular as casas. ABORTAR e pedir esclarecimento.

**Se o post aprovado estiver disponivel:**
- Ler as 12 interpretacoes do post como referencia de TOM e conteudo
- Os audios devem ser MAIS PROFUNDOS que o texto do post (post = 3-4 frases, audio = 60-90s)
- Nao copiar literalmente — expandir e aprofundar

### Step 2 — Identificar Evento Principal e Signo

Do relatorio validado, extrair:

- [ ] **Evento #1:** Nome completo (ex: "Eclipse Lunar em Virgem a 14°22'")
- [ ] **Signo do evento:** (ex: Virgem)
- [ ] **Tipo:** Conjuncao, oposicao, eclipse, ingresso, etc.
- [ ] **Dados tecnicos:** Grau exato, orbe, planetas envolvidos
- [ ] **Classificacao:** Critico / Estrutural / Ciclico / Ambiente
- [ ] **Tom geral:** Extrair do campo tom_emocional da materia-prima

**Se houver 2+ eventos igualmente importantes:**
- Focar nos 2 mais impactantes
- Para cada ascendente, mencionar qual dos 2 e mais relevante para aquela casa
- Priorizar o de maior peso

### Step 3 — Calcular Tabela de Casas

Gerar a tabela completa: para cada ascendente, em qual casa o evento cai.

**Metodo de calculo:**
O signo do ascendente = Casa 1. Contar signos a partir do ascendente ate chegar ao signo do evento.

**Exemplo: Evento em Virgem**

| Ascendente | Casa ativada | Area da vida |
|------------|-------------|--------------|
| Aries | Casa 6 | Saude, rotina, trabalho diario |
| Touro | Casa 5 | Criatividade, romance, prazer |
| Gemeos | Casa 4 | Lar, familia, raizes |
| Cancer | Casa 3 | Comunicacao, estudos, irmaos |
| Leao | Casa 2 | Dinheiro, valores, autoestima |
| Virgem | Casa 1 | Identidade, corpo, comecos |
| Libra | Casa 12 | Inconsciente, finalizacoes, sonhos |
| Escorpiao | Casa 11 | Amizades, grupos, futuro |
| Sagitario | Casa 10 | Carreira, reputacao, proposito |
| Capricornio | Casa 9 | Filosofia, viagens, fe |
| Aquario | Casa 8 | Transformacao, crises, intimidade |
| Peixes | Casa 7 | Parcerias, casamento, contratos |

- [ ] Verificar calculo: contar posicoes zodiacais corretamente
- [ ] Anotar a area da vida para cada casa (ver referencia no agente)

**No modo interativo:** Apresentar tabela ao usuario para validacao antes de escrever os scripts.

### Step 4 — Classificar Intensidade por Casa

Nem todas as casas sao impactadas com a mesma forca:

- [ ] **Casas angulares (1, 4, 7, 10):** Impacto FORTE, visivel, imediato. Mudancas concretas.
- [ ] **Casas sucedentes (2, 5, 8, 11):** Impacto MEDIO, material/emocional. Movimentos internos com resultado externo.
- [ ] **Casas cadentes (3, 6, 9, 12):** Impacto SUTIL, mental/espiritual. Mudancas de perspectiva.

Marcar na tabela a intensidade de cada ascendente. Isso influencia:
- O tom do script (mais urgente para angulares, mais reflexivo para cadentes)
- A profundidade do conselho (mais concreto para angulares, mais contemplativo para cadentes)

### Step 5 — Escrever os 12 Scripts de Audio

Para CADA ascendente (Aries → Peixes), escrever um script seguindo a estrutura:

---

#### Estrutura de cada script (60-90s / 120-180 palavras)

**A. Abertura (10-15s / ~25-35 palavras)**

Saudar o ascendente e contextualizar onde o evento cai no mapa.

- [ ] Comecar com "Voce que e ascendente em {Signo}..." (ou variacao)
- [ ] Mencionar: "Essa semana o/a {evento} cai na sua Casa {N}"
- [ ] Explicar brevemente o que essa casa governa

**Variacoes de abertura (rotacionar entre os 12):**
- Direta: "Voce que e ascendente em Aries, presta atencao: o {evento} cai na sua Casa 6..."
- Emocional: "Se voce e ascendente em Touro, ja deve ter sentido que algo ta mexendo com..."
- Contextualizando: "Pra quem e ascendente em Gemeos, essa semana ativa a Casa 4 — e quando a gente fala de Casa 4, a gente fala de..."
- Provocativa: "Ascendente em Cancer? Entao se prepara, porque a Casa 3 vai te pedir pra..."

**B. Desenvolvimento (30-45s / ~65-100 palavras)**

Explicar como o evento se manifesta nessa casa especifica.

- [ ] Como o transito afeta essa area da vida especificamente
- [ ] O que pode mudar, intensificar ou revelar
- [ ] Emocoes ou situacoes concretas que podem surgir
- [ ] Se aplicavel: conectar com transitos secundarios que amplificam

**Regras:**
- Ser ESPECIFICO para a area da casa (Casa 10 = falar de carreira, nao de emocoes genericas)
- Usar exemplos cotidianos ("aquela conversa que voce ta adiando", "aquele projeto parado")
- Conectar o tipo de aspecto com o tipo de impacto (oposicao = tensao, trigono = fluidez)

**C. Conselho (10-15s / ~20-30 palavras)**

1 frase pratica, direta e acionavel.

- [ ] Deve ser algo que a pessoa pode FAZER essa semana
- [ ] Conectado com a casa ativada (Casa 2 = conselho sobre dinheiro/valores)
- [ ] Tom imperativo gentil ("Faz isso:", "Experimenta:", "Essa semana, tenta:")

**Exemplos por tipo de casa:**
- Casa 1: "Muda algo no visual. Sério. Corta o cabelo, troca a roupa, faz algo que te lembre que voce ta vivo."
- Casa 4: "Liga pra alguem da sua familia essa semana. Mesmo que seja rapido."
- Casa 7: "Tem alguem que voce ta evitando? Essa semana e hora de sentar e conversar."
- Casa 10: "Pega aquele objetivo profissional e escreve 3 passos concretos pra essa semana."

**D. Dica Final (5-10s / ~10-20 palavras)**

Dica curta de encerramento — ritual, atitude ou reflexao.

- [ ] Algo breve e memoravel
- [ ] Conectado ao tema mas nao repetitivo
- [ ] Tom de cuidado/carinho

**Exemplos:**
- "Essa semana, antes de dormir, anota um sonho."
- "Escolhe uma musica que te represente e escuta 3 vezes."
- "Quando sentir pressao, para e respira 4-7-8."
- "Escreve 3 coisas que voce fez bem essa semana."

---

### Step 6 — Variar Abordagem entre Scripts

**REGRA CRITICA:** Os 12 scripts NAO podem seguir a mesma estrutura interna. Variar:

- [ ] **Tom de abertura:** Alguns diretos, outros emocionais, outros provocativos
- [ ] **Angulo do desenvolvimento:** Alguns pelo corpo, outros pela emocao, outros pela situacao
- [ ] **Tipo de conselho:** Alguns de acao, outros de reflexao, outros de conversa
- [ ] **Ritmo:** Alguns mais rapidos (casas angulares), outros mais contemplativos (cadentes)

**Checklist anti-repeticao — confirmar apos escrever os 12:**
- [ ] Nenhum script comeca exatamente igual a outro?
- [ ] Nenhum conselho e a mesma frase com signo trocado?
- [ ] Pelo menos 3 abordagens diferentes de abertura usadas?
- [ ] Pelo menos 3 tipos diferentes de conselho (acao, reflexao, conversa, ritual)?
- [ ] Scripts de casas angulares soam mais urgentes que os de casas cadentes?

### Step 7 — Revisao de Qualidade

Checklist final antes de entregar:

**Por script (repetir para cada um dos 12):**
- [ ] Casa astrologica correta para o ascendente?
- [ ] Menciona o que a casa governa?
- [ ] Conteudo e especifico para a area da casa (nao generico)?
- [ ] Conselho e concreto e acionavel?
- [ ] Entre 120-180 palavras?
- [ ] Tom de Victor (intimo, acolhedor, direto)?
- [ ] Script funciona sozinho (ouvinte nao precisa de contexto externo)?
- [ ] Zero terrorismo astrologico?
- [ ] Vocabulario da Pelicula Sideral respeitado?

**Conjunto dos 12:**
- [ ] Todos os 12 ascendentes presentes (Aries → Peixes)?
- [ ] Nenhum script e copia de outro?
- [ ] Pelo menos 3 abordagens diferentes de abertura?
- [ ] Intensidade coerente com tipo de casa (angular > sucedente > cadente)?
- [ ] Tabela de casas inclusa como referencia?

### Step 8 — Entregar

No modo interativo:
- [ ] Apresentar tabela de casas primeiro (Step 3)
- [ ] Perguntar: "Tabela correta? Posso comecar a escrever os scripts?"
- [ ] Apresentar os 3 primeiros scripts (casas angulares ou mais impactadas)
- [ ] Perguntar: "Tom ok? Profundidade ok? Algum ajuste antes dos outros 9?"
- [ ] Se aprovado, apresentar os 9 restantes
- [ ] Perguntar: "Todos ok? Algum ascendente que precisa de ajuste?"
- [ ] Salvar em `PELICULA SIDERAL/DATA/roteiros-12-casas-{startDate}-{endDate}.md`

No modo yolo:
- [ ] Gerar tabela + 12 scripts de uma vez
- [ ] Apresentar tudo + checklist de revisao
- [ ] Salvar automaticamente

## Criterios de Sucesso

A task e bem-sucedida quando:
1. 12 scripts completos (Aries → Peixes), cada um com 120-180 palavras / 60-90s falado
2. Casa astrologica CORRETA para cada ascendente (calculo verificavel)
3. Cada script menciona a casa e o que ela governa
4. Cada script tem abertura + desenvolvimento + conselho + dica (4 partes)
5. Nenhum script e copia de outro — variacao genuina de abordagem
6. Conselhos sao CONCRETOS e ACIONAVEIS (nao vagos)
7. Cada script e autossuficiente (funciona sem os outros 11)
8. Tom de Victor preservado — intimo, pessoal, como micro-consulta 1:1
9. Intensidade coerente: angulares mais urgentes, cadentes mais contemplativos
10. Zero terrorismo astrologico
