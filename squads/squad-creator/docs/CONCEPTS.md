# Conceitos Fundamentais do Squad Creator

> **Documento avancado.** Leia primeiro [POR-ONDE-COMECAR.md](./POR-ONDE-COMECAR.md) e [FAQ.md](./FAQ.md).
>
> Entenda os conceitos por tras do sistema de criacao de squads.

---

## Indice

1. [O que e um Squad?](#1-o-que-e-um-squad)
2. [Mind vs Agent](#2-mind-vs-agent)
3. [DNA: Voice e Thinking](#3-dna-voice-e-thinking)
4. [Sistema de Tiers](#4-sistema-de-tiers)
5. [Sistema de Fontes](#5-sistema-de-fontes)
6. [Modos de Execucao](#6-modos-de-execucao)
7. [Quality Gates](#7-quality-gates)
8. [Fidelity Score](#8-fidelity-score)
9. [Smoke Tests](#9-smoke-tests)
10. [Base vs Pro Mode](#10-base-vs-pro-mode)
11. [Os Agentes do Squad Creator](#11-os-agentes-do-squad-creator)
12. [Template Enforcement](#12-template-enforcement)
13. [Consistency Chain](#13-consistency-chain)

---

## 1. O que e um Squad?

Um **Squad** e um conjunto de agentes especializados que trabalham juntos em um dominio especifico.

```
+-----------------------------------------------------------------+
|                         SQUAD: COPY                             |
+-----------------------------------------------------------------+
|                                                                 |
|  +-------------+                                                |
|  | Orchestrator| <- Roteia para o expert certo                  |
|  +------+------+                                                |
|         |                                                       |
|    +----+----+--------+--------+--------+                      |
|    v         v        v        v        v                      |
| +------+ +------+ +------+ +------+ +------+                   |
| |Gary  | |Eugene| |Dan   | |Claude| |David |                   |
| |Halbert| |Schwartz| |Kennedy| |Hopkins| |Ogilvy|                |
| +------+ +------+ +------+ +------+ +------+                   |
|  Tier 1   Tier 0   Tier 1   Tier 0   Tier 1                    |
|                                                                 |
+-----------------------------------------------------------------+
```

**Componentes de um Squad:**
- **Orchestrator:** Coordena os agents, roteia requests
- **Agents:** Especialistas baseados em elite minds reais ou archetypes funcionais
- **Tasks:** Operacoes atomicas
- **Workflows:** Operacoes multi-fase
- **Templates:** Formatos de output e scaffolding obrigatorio
- **Checklists:** Validacoes

---

## 2. Mind vs Agent

### Mind (Pessoa Real)
O **mind** e a pessoa real cujo conhecimento queremos capturar.

```yaml
mind:
  name: "{Expert Name}"  # e.g., Gary Halbert, Warren Buffett
  domain: "{Domain}"  # e.g., Direct Response Copywriting, Investment
  known_for: "{Notable Works}"  # e.g., The Boron Letters, Shareholder Letters
  has_documented_frameworks: true  # OBRIGATORIO
```

### Agent (Clone Digital)
O **agent** e o clone digital do mind, capaz de responder como ele responderia.

```yaml
agent:
  name: "{agent-name}"  # e.g., gary-halbert, contract-reviewer
  based_on: "{Mind Name}"  # e.g., Gary Halbert, Expert Name
  voice_dna: "Extraido de livros, entrevistas, cartas"
  thinking_dna: "Frameworks, heuristicas, decisoes"
```

### Regra Fundamental

```
+-----------------------------------------------------------------+
|                                                                 |
|   MINDS COM FRAMEWORKS DOCUMENTADOS                             |
|   > Bots genericos                                              |
|                                                                 |
|   Pessoas tem "skin in the game" = consequencias reais          |
|   = frameworks testados no mundo real                           |
|                                                                 |
+-----------------------------------------------------------------+
```

**Por isso:**
- Clone experts com frameworks documentados (e.g., Gary Halbert, Warren Buffett)
- Nao clone "{role} generico" (nao tem skin in the game)

> **Nota v4.0:** No modo Base, agents sao criados via template sem mind cloning.
> A clonagem de minds reais e uma funcionalidade [PRO] que extrai DNA de fontes
> reais e constroi agents com fidelidade alta. Veja secao 10 para detalhes.

---

## 3. DNA: Voice e Thinking

O **DNA** e a essencia capturada do mind, dividida em duas partes:

### Voice DNA (Como comunica)

```yaml
voice_dna:
  vocabulary:
    power_words: ["pile of money", "starving crowd", "A-pile"]
    signature_phrases: ["The answer is in the market"]
    never_use: ["synergy", "leverage", "optimize"]

  storytelling:
    recurring_stories: ["The Boron Letters origin"]
    anecdotes: ["Prison writing story"]

  tone:
    dimensions:
      formal_casual: 20/100      # Muito casual
      serious_playful: 60/100   # Levemente serio
      direct_indirect: 90/100   # Muito direto

  anti_patterns:
    never_say: ["It depends", "Maybe"]
    never_do: ["Use jargon corporativo"]
```

### Thinking DNA (Como decide)

```yaml
thinking_dna:
  primary_framework:
    name: "A-Pile Method"
    steps:
      - "Identify the starving crowd"
      - "Find what they're already buying"
      - "Create irresistible offer"

  heuristics:
    decision:
      - "When in doubt, test"
      - "Market > Copy"
    veto:
      - "Never sell to people who don't want to buy"

  recognition_patterns:
    first_notice: ["Market size", "Existing demand"]
    red_flags: ["No proven market", "Complicated offer"]

  objection_handling:
    "Copy is manipulative":
      response: "All communication is persuasion..."
      conviction_level: 10/10
```

### Por que separar?

```
Voice DNA  -> Como o agent ESCREVE/FALA
Thinking DNA -> Como o agent PENSA/DECIDE

Separados = podem ser extraidos em paralelo
Juntos = mind_dna_complete.yaml para criar agent
```

> **Nota v4.0:** A extracao de DNA e uma funcionalidade [PRO]. No modo Base,
> voice e thinking sao definidos diretamente no template do agente usando
> domain knowledge fornecido pelo usuario e pesquisa web.

---

## 4. Sistema de Tiers

Os agents sao organizados em **tiers** baseados em sua funcao:

```
+-----------------------------------------------------------------+
|                      TIER SYSTEM                                |
+-----------------------------------------------------------------+
|                                                                 |
|  ORCHESTRATOR                                                   |
|  +-- Coordena todos os tiers, roteia requests                  |
|                                                                 |
|  TIER 0: DIAGNOSTICO                                            |
|  +-- Analisa, classifica, diagnostica                          |
|  +-- Ex: Eugene Schwartz (awareness levels)                    |
|                                                                 |
|  TIER 1: MASTERS                                                |
|  +-- Executores principais com resultados comprovados          |
|  +-- Ex: Gary Halbert, Dan Kennedy                             |
|                                                                 |
|  TIER 2: SYSTEMATIZERS                                          |
|  +-- Criadores de frameworks e sistemas                        |
|  +-- Ex: Todd Brown (E5 Method)                                |
|                                                                 |
|  TIER 3: SPECIALISTS                                            |
|  +-- Especialistas em formato/canal especifico                 |
|  +-- Ex: Ben Settle (email daily)                              |
|                                                                 |
|  TOOLS                                                          |
|  +-- Validadores, calculadoras, checklists                     |
|                                                                 |
+-----------------------------------------------------------------+
```

### Regra: Todo Squad precisa de Tier 0

```
Tier 0 = Diagnostico ANTES de execucao

Sem Tier 0:
  User: "Escreva uma sales page"
  Agent: [escreve qualquer coisa]

Com Tier 0:
  User: "Escreva uma sales page"
  Tier 0: "Qual o awareness level do publico?"
  Tier 0: "Classified: Problem-aware. Routing to..."
  Tier 1: [escreve com contexto correto]
```

---

## 5. Sistema de Fontes

As fontes sao classificadas por **confianca**:

### Tiers de Fontes

| Tier | Tipo | Confianca | Exemplos |
|------|------|-----------|----------|
| **Tier 0** | Do usuario | MAXIMA | PDFs proprios, transcricoes |
| **Tier 1** | Primario (do expert) | ALTA | Livros, entrevistas diretas |
| **Tier 2** | Secundario (sobre expert) | MEDIA | Biografias, case studies |
| **Tier 3** | Terciario (agregado) | BAIXA | Wikipedia, resumos |

### Requisitos Minimos

```yaml
minimum_requirements:
  total_sources: 10
  tier_1_sources: 5
  source_types: 3  # livros, entrevistas, artigos
  content_volume: "5h audio OU 200 paginas"
  triangulation: "3+ fontes por claim principal"
```

### Triangulacao

```
"Single source = hypothesis"
"Three sources = pattern"

Claim: "Gary Halbert usava o A-pile method"

  1 fonte: Pode ser interpretacao errada
  2 fontes: Provavelmente verdade
  3+ fontes: Confirmado, pode usar
```

> **Nota v4.0:** O sistema completo de fontes e triangulacao se aplica ao modo
> [PRO] com @oalanicolas. No modo Base, o squad-chief usa pesquisa web e domain
> knowledge fornecido pelo usuario como fontes primarias.

---

## 6. Modos de Execucao

### YOLO Mode

```yaml
yolo_mode:
  quando_usar: "Nao tenho materiais, quer rapidez"
  fidelity_esperada: "60-75%"
  interacoes: "Minimas (so aprovacao final)"

  o_que_faz:
    - Pesquisa web automaticamente
    - Auto-acquire de YouTube, podcasts, artigos
    - Prossegue sem perguntar (exceto critico)

  para_quando:
    - "< 5 fontes encontradas"
    - "Expert muito obscuro"
    - "Quality gate critico falha"
```

### QUALITY Mode

```yaml
quality_mode:
  quando_usar: "Tenho livros/PDFs/materiais do expert"
  fidelity_esperada: "85-95%"
  interacoes: "Moderadas (coleta + validacao)"

  o_que_faz:
    - Pede materiais do usuario
    - Indexa como Tier 0 (maxima confianca)
    - Valida DNA extraido com usuario

  checkpoints:
    - "Validar minds selecionados"
    - "Coletar materiais"
    - "Validar DNA extraido"
    - "Aprovar agentes"
```

### HYBRID Mode

```yaml
hybrid_mode:
  quando_usar: "Tenho materiais de alguns experts"
  fidelity_esperada: "Variavel por expert"

  como_funciona:
    - Para cada mind pergunta: "Tem materiais?"
    - Se sim -> Quality mode para esse mind
    - Se nao -> YOLO mode para esse mind
```

### Comparacao Visual

```
                    YOLO        QUALITY
Tempo               ||||....    ||||||||
Interacoes          ||......    ||||||..
Fidelidade          ||||....    ||||||||
Materiais needed    ........    ||||||||
```

> **Nota v4.0:** Os modos YOLO/QUALITY/HYBRID se aplicam ao modo [PRO] com
> multi-agent orchestration. No modo Base, o squad-chief opera com um fluxo
> incremental (com checkpoints humanos) ou YOLO (autonomo sem paradas).

---

## 7. Quality Gates

**Quality Gates** sao checkpoints que validam a qualidade em cada fase:

```
+-----------------------------------------------------------------+
|                      QUALITY GATES                              |
+-----------------------------------------------------------------+
|                                                                 |
|  SOURCE_QUALITY (Phase 0) --- BLOCKING                          |
|  +-- 10+ fontes totais                                         |
|  +-- 5+ fontes Tier 1                                          |
|  +-- 3+ tipos diferentes                                       |
|  +-- Triangulacao possivel                                     |
|  +-- FAIL = Nao prossegue                                      |
|                                                                 |
|  VOICE_QUALITY (Phase 1) --- WARNING                            |
|  +-- 10+ power words                                           |
|  +-- 5+ signature phrases                                      |
|  +-- 3+ stories                                                |
|  +-- Min: 8/10                                                 |
|                                                                 |
|  THINKING_QUALITY (Phase 2) --- WARNING                         |
|  +-- Framework com 3+ steps                                    |
|  +-- 5+ heuristicas                                            |
|  +-- Recognition patterns                                      |
|  +-- Min: 7/9                                                  |
|                                                                 |
|  SYNTHESIS_QUALITY (Phase 3) --- BLOCKING                       |
|  +-- Voice + Thinking consistentes                             |
|  +-- YAML valido                                               |
|                                                                 |
|  SMOKE_TEST (Phase 4) --- BLOCKING                              |
|  +-- Test 1: Domain knowledge                                  |
|  +-- Test 2: Decision making                                   |
|  +-- Test 3: Objection handling                                |
|  +-- 3/3 devem passar                                          |
|                                                                 |
+-----------------------------------------------------------------+
```

### Blocking vs Warning

```
BLOCKING: Falhou = PARA tudo, precisa corrigir
WARNING:  Falhou = Avisa, mas continua
```

> **Nota v4.0:** Os quality gates SOURCE_QUALITY, VOICE_QUALITY e THINKING_QUALITY
> se aplicam ao fluxo [PRO] com @oalanicolas. No modo Base, os quality gates sao:
> Discovery Gate (SC_DSC_001), Template Selection Gate (SC_TPL_001),
> Architecture Gate (SC_ARC_001), Agent Quality Gate (SC_AGT_001),
> Integration Gate (SC_INT_001) e Validation Gate (SC_VAL_001).

---

## 8. Fidelity Score

**Fidelity** e o quanto o agent se comporta como o mind real.

```
+-----------------------------------------------------------------+
|                    FIDELITY ESTIMATION                          |
+-----------------------------------------------------------------+
|                                                                 |
|  95% -+-----------------------------------------------------   |
|       |                              +---------------------     |
|  85% -+                              | QUALITY + Materiais     |
|       |                    +---------+ do usuario              |
|  75% -+                    | QUALITY |                          |
|       |          +---------+ so web  |                          |
|  65% -+          | YOLO +  +---------+                          |
|       |  +-------+ algumas                                      |
|  55% -+  | YOLO  | fontes                                       |
|       |  | basic |                                              |
|  45% -+--+-------+----------------------------------------     |
|                                                                 |
+-----------------------------------------------------------------+

Formula simplificada:
Fidelity = (tier1_ratio x 0.4) + (voice_score x 0.3) + (thinking_score x 0.3)
```

### O que afeta fidelidade

| Fator | Impacto |
|-------|---------|
| Materiais do usuario (Tier 0) | +20% |
| Mais fontes Tier 1 | +10% |
| Voice DNA completo | +15% |
| Thinking DNA completo | +15% |
| Smoke tests passando | Validacao |

> **Nota v4.0:** No modo Base, o conceito de fidelity score e substituido
> pelo quality score geral do squad (>= 7.0 para PASS). A fidelity granular
> por expert e uma metrica [PRO].

---

## 9. Smoke Tests

**Smoke Tests** validam se o agent realmente se comporta como o mind.

```
+-----------------------------------------------------------------+
|                      3 SMOKE TESTS                              |
+-----------------------------------------------------------------+
|                                                                 |
|  TEST 1: CONHECIMENTO DO DOMINIO                                |
|  +-- Prompt: "Explique {framework principal}..."               |
|  +-- Valida: Usa power_words? Signature phrases?               |
|  +-- Pass: 4/5 checks                                          |
|                                                                 |
|  TEST 2: TOMADA DE DECISAO                                      |
|  +-- Prompt: "Devo fazer A ou B? Por que?"                     |
|  +-- Valida: Aplica heuristicas? Segue pipeline?               |
|  +-- Pass: 4/5 checks                                          |
|                                                                 |
|  TEST 3: RESPOSTA A OBJECAO                                     |
|  +-- Prompt: "Discordo porque {objecao}..."                    |
|  +-- Valida: Mantem conviccao? Parece autentico?               |
|  +-- Pass: 4/5 checks                                          |
|                                                                 |
+-----------------------------------------------------------------+
|                                                                 |
|  PASS = 3/3 tests passam                                        |
|  FAIL = Re-trabalhar DNA ou agent.md                           |
|                                                                 |
+-----------------------------------------------------------------+
```

### Por que Smoke Tests importam

```
DNA extraido =/= Agent funcional

Voce pode ter:
- 15 fontes coletadas
- Voice DNA completo
- Thinking DNA completo
- Score 9/10

Mas se o agent responde de forma generica...
-> O DNA nao foi bem aplicado
-> Smoke test vai FALHAR
-> Voce descobre ANTES de usar em producao
```

> **Nota v4.0:** No modo Base, os smoke tests verificam: ativacao do squad,
> comando *help e execucao de uma task basica (operational-test.md).
> Os 3 smoke tests por expert com validacao de DNA sao [PRO].

---

## 10. Base vs Pro Mode

A versao 4.0.0 introduziu o split **Base / Pro**, separando o Squad Creator em dois niveis de operacao:

### Base Mode (squad-creator)

```
+-----------------------------------------------------------------+
|                    BASE MODE (Default)                           |
+-----------------------------------------------------------------+
|                                                                 |
|  Abordagem: Template-driven                                     |
|  Domain knowledge: Fornecido pelo usuario + pesquisa web        |
|  Agentes: 1 (@squad-chief opera sozinho)                        |
|  Tasks: 24                                                      |
|  Workflows: 3                                                   |
|                                                                 |
|  Fluxo:                                                         |
|    Discovery -> Template Selection -> Architecture              |
|       -> Creation -> Integration -> Validation                  |
|                                                                 |
|  Foco: Criar squads funcionais e bem estruturados usando        |
|  templates como fundacao, sem necessidade de mind cloning       |
|  ou extracao de DNA.                                            |
|                                                                 |
+-----------------------------------------------------------------+
```

O modo Base e o padrao. O @squad-chief opera sozinho, utilizando templates obrigatorios (config-tmpl.yaml, agent-tmpl.md, readme-tmpl.md) como fundacao para toda criacao. O usuario fornece domain knowledge (3 perguntas maximo) e o squad-chief complementa com pesquisa web.

### Pro Mode (squad-creator-pro)

```
+-----------------------------------------------------------------+
|                    PRO MODE (AIOX Pro)                           |
+-----------------------------------------------------------------+
|                                                                 |
|  Abordagem: Research automatizado + DNA extraction              |
|  Domain knowledge: Extraido de fontes reais (livros,            |
|                    entrevistas, artigos, transcricoes)           |
|  Agentes: 4 (@squad-chief + @oalanicolas +                     |
|             @pedro-valerio + @thiago_finch)                     |
|  Tasks: 53                                                      |
|  Workflows: 10+                                                 |
|                                                                 |
|  Fluxo:                                                         |
|    Research -> Mind Cloning -> DNA Extraction                   |
|       -> Artifact Build -> Integration -> Validation            |
|                                                                 |
|  Foco: Criar squads com agentes de alta fidelidade              |
|  baseados em experts reais, com DNA extraction,                 |
|  multi-agent orchestration e model routing.                     |
|                                                                 |
+-----------------------------------------------------------------+
```

### Pro Detection

A deteccao de modo Pro acontece **automaticamente no boot time**:

```yaml
pro_detection:
  check: "squads/squad-creator-pro/config.yaml"
  behavior:
    exists: "pro_mode = true, funcionalidades PRO habilitadas"
    not_exists: "pro_mode = false, modo Base ativo"
  automatic: true  # Nenhuma configuracao manual necessaria
```

### O que acontece no Base quando o usuario pede funcionalidade PRO?

```
User: "*clone-mind Gary Halbert"

Base Response:
  "Essa funcionalidade requer o AIOX Pro (squad-creator-pro).
   O modo Base cria agentes via templates com domain research.
   Para mind cloning com DNA extraction, instale o squad-creator-pro.
   Deseja criar o agente usando o fluxo template-driven?"
```

### Comparacao Base vs Pro

| Aspecto | Base | Pro |
|---------|------|-----|
| Agents | 1 (squad-chief) | 4 (squad-chief + 3 especialistas) |
| Tasks | 24 | 53 |
| Workflows | 3 | 10+ |
| Mind Cloning | Nao | Sim (via @oalanicolas) |
| DNA Extraction | Nao | Sim (Voice + Thinking) |
| Fidelity Score | Quality score geral | Fidelity por expert |
| Source System | Pesquisa web | Tier 0-3 + triangulacao |
| Model Routing | Nao | Sim (Opus/Sonnet/Haiku) |
| Criacao de agents | Template-driven | DNA-driven |
| Handoffs | Nao (single agent) | INSUMOS_READY / ARTIFACTS_READY |

---

## 11. Os Agentes do Squad Creator

O Squad Creator v4.0.0 opera com um modelo hibrido: **1 agente no Base**, **4 agentes no Pro**.

### Arquitetura v4.0

```
+-----------------------------------------------------------------+
|            SQUAD CREATOR v4.0 - AGENTES                         |
+-----------------------------------------------------------------+
|                                                                 |
|  BASE MODE:                                                     |
|                                                                 |
|            +---------------------+                              |
|            |   @squad-chief      |                              |
|            |   (Orchestrator)    |                              |
|            |                     |                              |
|            | * Ponto de entrada  |                              |
|            | * Triagem + Routing |                              |
|            | * Criacao de squads |                              |
|            | * Template-driven   |                              |
|            | * Validacao final   |                              |
|            +---------------------+                              |
|                                                                 |
+-----------------------------------------------------------------+
|                                                                 |
|  PRO MODE (adiciona 3 agentes):                                 |
|                                                                 |
|            +---------------------+                              |
|            |   @squad-chief      |                              |
|            |   (Orchestrator)    |                              |
|            +----------+----------+                              |
|                       |                                         |
|          +------------+------------+                            |
|          |            |            |                             |
|          v            v            v                             |
|  +---------------+ +---------------+ +---------------+          |
|  | @oalanicolas  | | @pedro-valerio| | @thiago_finch |          |
|  | [PRO]         | | [PRO]         | | [PRO]         |          |
|  |               | |               | |               |          |
|  | Mind Cloning  | | Process Design| | Performance   |          |
|  | DNA Extraction| | Veto Conds    | | Model Routing |          |
|  | Curadoria     | | Artifact Build| | Optimization  |          |
|  +---------------+ +---------------+ +---------------+          |
|                                                                 |
+-----------------------------------------------------------------+
```

### @squad-chief (Orchestrator) -- Base + Pro

**Papel:** Ponto de entrada, coordenacao, triagem, criacao de squads.

| Funcao | Base | Pro |
|--------|------|-----|
| Triagem | Diagnostica e executa | Diagnostica e roteia |
| Research | Pesquisa web + domain knowledge | Delega para @oalanicolas |
| Criacao | Template-driven, executa tudo | Delega para @pedro-valerio |
| Integration | Monta squad final | Monta squad final |
| Validation | Valida qualidade e apresenta | Valida qualidade e apresenta |

No modo Base, o squad-chief e o unico agente e lida com TODAS as fases:
template selection, architecture, creation, integration e validation.

No modo Pro, o squad-chief orquestra os 3 agentes especialistas, delegando
DNA extraction para @oalanicolas e artifact building para @pedro-valerio.

### @oalanicolas (Tier 1 - Mind Cloning) [PRO]

**Papel:** Especialista em extracao de conhecimento e clonagem de mentes.

| Funcao | Descricao |
|--------|-----------|
| Curadoria | Classifica fontes (ouro vs bronze) |
| Voice DNA | Extrai como o expert comunica |
| Thinking DNA | Extrai como o expert decide |
| Validation | Self-validation antes do handoff |

**Filosofia:** "Curadoria > Volume" / "Se entrar cocoo, sai cocoo"

**Comandos:** `*assess-sources`, `*extract-framework`, `*find-0.8`, `*validate-extraction`

### @pedro-valerio (Tier 1 - Process Design) [PRO]

**Papel:** Especialista em processos, workflows, e construcao de artefatos.

| Funcao | Descricao |
|--------|-----------|
| Process Design | Mapeia e estrutura processos |
| Veto Conditions | Define bloqueios impossiveis de ignorar |
| Artifact Build | Cria agents, tasks, workflows |
| Audit | Audita processos existentes |

**Filosofia:** "A melhor coisa e impossibilitar caminhos errados"

**Comandos:** `*create-task`, `*create-workflow`, `*create-agent`, `*audit`, `*veto-check`

### @thiago_finch (Tier 1 - Performance) [PRO]

**Papel:** Especialista em otimizacao de performance e model routing.

| Funcao | Descricao |
|--------|-----------|
| Model Routing | Decide Opus vs Sonnet vs Haiku por task |
| Optimization | Token economy, context reduction |
| Performance Audit | Benchmark de latencia e custo |

### DNA Mental Architecture (@oalanicolas) [PRO]

O modelo de 8 camadas para clonar mentes:

```yaml
dna_mental_8_layers:
  layer_1: "Behavioral Patterns"      # O que fazem
  layer_2: "Communication Style"      # Como falam
  layer_3: "Routines & Rituals"       # Habitos
  layer_4: "Recognition Patterns"     # O que notam
  layer_5: "Mental Models"            # Como pensam
  layer_6: "Values Hierarchy"         # O que importa
  layer_7: "Core Obsessions"          # O que os move
  layer_8: "Productive Paradoxes"     # Contradicoes autenticas
```

### Process Absolutism (@pedro-valerio) [PRO]

A filosofia de design de processos:

```yaml
process_absolutism:
  principle: "Impossibilitar caminhos errados"

  pillars:
    - "Veto conditions that BLOCK, not warn"
    - "Automation with guardrails"
    - "Every step has expected_output"
    - "If task repeated 3x -> must automate"

  anti_patterns:
    - "Processes that only suggest"
    - "Automation without rollback"
    - "Human compliance as safety"
```

### Fluxo de Colaboracao [PRO]

```
USER -> @squad-chief (triage)
              |
              +-- Precisa DNA? -> @oalanicolas
              |                        |
              |                        v
              |                 INSUMOS_READY
              |                        |
              +-- Precisa artefatos? --+---> @pedro-valerio
                                       |            |
                                       |            v
                                       |     ARTIFACTS_READY
                                       |            |
                                       +------------+
                                              |
                                              v
                                     @squad-chief (integrate)
                                              |
                                              v
                                         SQUAD READY
```

### Quando Usar Cada Especialista

| Situacao | Base | Pro |
|----------|------|-----|
| Extrair DNA de expert | Usuario fornece knowledge | `@oalanicolas` |
| Avaliar fontes | Pesquisa web | `@oalanicolas` |
| Clone nao soa autentico | Re-criar via template | `@oalanicolas` |
| Criar workflow | `@squad-chief` com templates | `@pedro-valerio` |
| Definir veto conditions | `@squad-chief` com templates | `@pedro-valerio` |
| Auditar processo | `@squad-chief` com checklists | `@pedro-valerio` |
| Criar squad completo | `@squad-chief` | `@squad-chief` (orquestra) |
| Nao sei qual usar | `@squad-chief` | `@squad-chief` (roteia) |

**Documentacao completa:** [AGENT-COLLABORATION.md](./AGENT-COLLABORATION.md)

---

## 12. Template Enforcement

Templates sao a fundacao para TODOS os componentes de um squad. No v4.0.0,
o uso de templates e obrigatorio -- nao opcional.

### Templates Obrigatorios

| Template | Proposito | Usado em |
|----------|-----------|----------|
| `config-tmpl.yaml` | Estrutura do config.yaml do squad | create-squad, create-template |
| `agent-tmpl.md` | Estrutura de agentes (6 niveis) | create-agent, create-squad Phase 3 |
| `readme-tmpl.md` | Documentacao do squad | create-squad Phase 4 |

### Regra VETO: Write sem Read de Template

```
VETO-TMPL-001:
  condition: "Write() chamado para criar agent/config/readme SEM prior Read() de template"
  action: BLOCK
  message: "Template DEVE ser lido antes de criar componente. Use Read(template) primeiro."
```

Essa regra garante que nenhum componente e criado ad-hoc. O template sempre
serve como base, e o agente preenche os campos com conteudo especifico.

### Estrutura de 6 Niveis do Agent Template

```
+-----------------------------------------------------------------+
|              AGENT TEMPLATE: 6 NIVEIS                           |
+-----------------------------------------------------------------+
|                                                                 |
|  Level 0: LOADER CONFIGURATION                                  |
|  +-- activation-instructions, IDE-FILE-RESOLUTION              |
|  +-- REQUEST-RESOLUTION, command mapping                       |
|                                                                 |
|  Level 1: IDENTITY & PERSONA                                    |
|  +-- agent metadata (name, id, title, icon)                    |
|  +-- persona (role, style, identity, focus)                    |
|  +-- core_principles                                           |
|                                                                 |
|  Level 2: OPERATIONAL FRAMEWORKS                                |
|  +-- commands, dependencies                                    |
|  +-- handoff_to, decision_heuristics                           |
|  +-- completion_criteria                                       |
|                                                                 |
|  Level 3: VOICE DNA                                             |
|  +-- vocabulary, tone, anti_patterns                           |
|  +-- output_examples                                           |
|  +-- [PRO] Extracted voice_dna from real expert                |
|                                                                 |
|  Level 4: QUALITY ASSURANCE                                     |
|  +-- quality_gates, veto_conditions                            |
|  +-- self_critique_checklist                                   |
|                                                                 |
|  Level 5: INTEGRATION                                           |
|  +-- workspace_integration                                     |
|  +-- related_agents, ecosystem_position                        |
|                                                                 |
+-----------------------------------------------------------------+
```

### Workflow de Uso

```
1. Read(templates/agent-tmpl.md)       <- Obrigatorio
2. Research domain via WebSearch        <- Preenche conteudo
3. Fill template sections               <- Mescla template + research
4. Write(agents/{agent-id}.md)          <- Output final
5. Validate via agent-quality-gate      <- Gate de qualidade
```

---

## 13. Consistency Chain

A Consistency Chain e o pipeline de validacao pos-criacao que garante que
todo squad criado atende aos padroes de qualidade antes de ser declarado pronto.

### Pipeline de Validacao

```
+-----------------------------------------------------------------+
|              CONSISTENCY CHAIN v4.0                              |
+-----------------------------------------------------------------+
|                                                                 |
|  STEP 1: TEMPLATE ENFORCEMENT                                   |
|  +-- Verificar que todos os componentes foram criados           |
|  |   a partir de templates (config-tmpl, agent-tmpl, readme-tmpl)|
|  +-- VETO se algum componente foi criado ad-hoc                 |
|                                                                 |
|  STEP 2: STRUCTURAL COMPLETENESS                                |
|  +-- config.yaml existe (NAO squad.yaml)                       |
|  +-- entry_agent presente e valido                             |
|  +-- tested field presente                                     |
|  +-- README.md, CHANGELOG.md, ARCHITECTURE.md existem          |
|  +-- Tasks de lifecycle existem (update-*, delete-*)           |
|  +-- BLOCKING: qualquer falha = ABORT                          |
|                                                                 |
|  STEP 3: QA-AFTER-CREATION                                      |
|  +-- Quick Checks (syntax, fields)                             |
|  +-- Security Scan (SEC-001 a SEC-018)                         |
|  +-- Structure Validation (cross-references)                   |
|  +-- Quality Scoring (>= 7.0 para PASS)                       |
|  +-- BLOCKING para HIGH severity                               |
|                                                                 |
|  STEP 4: VALIDATE-SQUAD                                         |
|  +-- Tier 1: Structure validation                              |
|  +-- Tier 2: Dependency validation                             |
|  +-- Tier 3: Quality scoring                                   |
|  +-- Tier 4: Operational test                                  |
|  +-- Score final >= 7.0                                        |
|                                                                 |
|  STEP 5: VALIDATE-FINAL-ARTIFACTS                               |
|  +-- Structure Gate (files exist, entry agent valid)           |
|  +-- Execution Gate (runnable workflow, no circular deps)      |
|  +-- Quality Gate (score >= 7.0, no veto triggered)            |
|  +-- Chief Activation Gate (command + codex skill exist)       |
|  +-- Usability Gate (README com exemplos)                      |
|  +-- Result: PASS | CONDITIONAL | FAIL                        |
|                                                                 |
+-----------------------------------------------------------------+
```

### Por que 5 Steps?

```
Step 1 (Template Enforcement)   -> Previne componentes ad-hoc
Step 2 (Structural Completeness)-> Detecta erros estruturais basicos
Step 3 (QA After Creation)      -> Valida qualidade pos-criacao
Step 4 (Validate Squad)         -> Validacao completa multi-tier
Step 5 (Validate Final Artifacts)-> Gate final antes de declarar READY
```

Cada step captura uma categoria diferente de erro. Erros estruturais basicos
(Step 2) sao detectados antes de rodar validacao pesada (Steps 3-5).
Falhas em qualquer step BLOCKING param o pipeline.

### Auto-Heal Integration

Quando um step da Consistency Chain falha, o sistema pode tentar correcao
automatica via `auto-heal`:

```
Consistency Chain FAIL
        |
        v
  auto-heal --diagnose
        |
        +-- auto_fixable? -> auto-heal --fix -> Re-run step
        |
        +-- not fixable? -> Escalate to user
```

---

## Resumo Visual

```
+-----------------------------------------------------------------+
|                    SQUAD CREATOR FLOW v4.0                       |
+-----------------------------------------------------------------+
|                                                                 |
|  BASE MODE:                                                     |
|  --------                                                       |
|  Template      ->  Architecture  ->  Creation     ->  Validation|
|  Selection        (tier design)     (template-      (consistency|
|  (squad type)                        driven)          chain)    |
|                                                                 |
|  PRO MODE:                                                      |
|  --------                                                       |
|  RESEARCH         CLONE           CREATE          VALIDATE      |
|  --------         -----           ------          --------      |
|                                                                 |
|  Elite Minds  ->  Voice DNA    ->  Agent.md    ->  Smoke Tests  |
|  (pesquisa)      Thinking DNA    (template)     (3 testes)     |
|                  (extracao)                                     |
|                                                                 |
|       |              |               |               |          |
|                                                                 |
|  Tier 0-3       Fontes         Quality         Fidelity        |
|  Framework      Tier 0-3       Gates           Score           |
|  Validation     Triangulation  BLOCKING        60-95%          |
|                                                                 |
+-----------------------------------------------------------------+
```

---

## Proximos Passos

- **Criar seu primeiro squad:** [QUICK-START.md](./QUICK-START.md)
- **Ver diagramas:** [ARCHITECTURE-DIAGRAMS.md](./ARCHITECTURE-DIAGRAMS.md)
- **Referencia de comandos:** [COMMANDS.md](./COMMANDS.md)

---

**Squad Creator | Concepts v4.0.0**
*"Entenda o sistema, domine o processo."*
