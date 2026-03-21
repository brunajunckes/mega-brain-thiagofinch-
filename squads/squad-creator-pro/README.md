# Squad Creator Pro

**O upgrade pack que transforma o Squad Creator base em uma fábrica de squads de elite.**

> O Squad Creator base já vem incluído no [AIOX](https://github.com/SynkraAI/aiox-core). O Pro é um upgrade pack que adiciona capacidades avançadas sem substituir o base.

---

## Free vs Pro em 30 segundos

| | **Free (incluso no AIOX)** | **Pro (este pacote)** |
|---|---|---|
| **Como funciona** | Você responde 3 perguntas, ele cria o squad | Pesquisa automática + 3 agentes especialistas criam o squad |
| **Agents** | 1 (squad-chief faz tudo) | +3 especialistas delegados |
| **Tasks** | 24 | +34 exclusivas |
| **Workflows** | 3 | +18 (15 workflows + 3 módulos composáveis) |
| **Mind cloning** | Não disponível | Voice DNA + Thinking DNA extraction |
| **Model routing** | Não disponível | 60-70% economia de tokens |
| **Testes** | Não disponível | 17 test cases + 19 test scripts |
| **Benchmarks** | Não disponível | Golden baselines + tracking de regressão |

---

## O que o Pro adiciona

### 1. Agentes Especialistas

O base tem 1 agente (squad-chief) que faz tudo. O Pro adiciona 3 especialistas que o chief delega:

| Agent | Role | Especialidade |
|-------|------|---------------|
| **@oalanicolas** | Knowledge Architect | DNA extraction, classificação de fontes, mind cloning |
| **@pedro-valerio** | Process Absolutist | Axioma assessment, auditoria, scoring de modernização |
| **@thiago_finch** | Business Strategy Architect | Estratégia, posicionamento, market intelligence |

### 2. Mind Cloning

A feature principal do Pro. Clona a mente de um especialista real em um agente:

```
*clone-mind
  → auto-acquire-sources (YouTube, podcasts, artigos)
  → extract-voice-dna (como a pessoa fala)
  → extract-thinking-dna (como a pessoa decide)
  → an-fidelity-score (quão fiel é o clone)
```

Cada mind clonada inclui:
- **Heurísticas** — regras SE/ENTÃO extraídas do especialista
- **Anchor words** — vocabulário característico
- **Anti-patterns** — o que o especialista nunca diria
- **Output examples** — pares concretos de input/output

### 3. Model Routing

Reduz 60-70% do custo de tokens roteando tasks para o modelo certo:

| Complexidade da Task | Modelo |
|---------------------|--------|
| Baixa (templates, formatting) | haiku |
| Média (análise, síntese) | sonnet |
| Alta (criação, decisão complexa) | opus |

### 4. Axioma Assessment

10 meta-axiomas para validação profunda de squads:

- Score ponderado com PASS/FAIL por dimensão
- Modernization score
- Fidelity scoring (clone vs original)
- Veto conditions configuráveis

### 5. Workflows Avançados

15 workflows exclusivos + 3 módulos composáveis:

| Categoria | Workflows |
|-----------|-----------|
| **Mind Cloning** | clone-mind, extraction-pipeline, mind-research-loop |
| **Research** | research-then-create-agent, auto-acquire-sources |
| **Criação** | context-aware-create, squad-fusion, brownfield-upgrade |
| **Otimização** | optimize-squad, model-tier-qualification, cross-provider |
| **Qualidade** | validate-squad (pro override), workspace-integration-hardening |
| **Módulos** | module-discovery, module-integration, module-quality-gates |

---

## Comandos Exclusivos do Pro

```
*create-squad-smart       Criação com detecção de contexto (greenfield/resume)
*brownfield-upgrade       Upgrade seguro de squad existente
*clone-mind               Clonagem completa (Voice + Thinking DNA)
*extract-voice-dna        Extração de estilo de comunicação
*extract-thinking-dna     Extração de frameworks/heurísticas
*update-mind              Atualizar DNA com novas fontes
*auto-acquire-sources     Aquisição automática de fontes
*quality-dashboard        Dashboard de métricas de qualidade
*optimize                 Otimização (Worker vs Agent) + economia
*optimize-workflow        Otimização em 6 dimensões
```

---

## Como funciona a criação no Pro vs Free

### Free: Template-Driven

```
Usuário pede squad
  → squad-chief faz triage
  → 3 perguntas ao usuário
  → Carrega templates
  → Cria squad preenchendo templates
  → Quality gate básico
```

### Pro: Research-Driven + Specialist Delegation

```
Usuário pede squad
  → squad-chief detecta contexto (greenfield/resume)
  → Delega para @oalanicolas
    → Pesquisa automática (YouTube, podcasts, artigos)
    → Extrai Voice DNA + Thinking DNA
    → Fidelity score do clone
  → Delega para @pedro-valerio
    → Axioma assessment (10 dimensões)
    → Otimiza routing (Worker vs Agent)
  → Delega para @thiago_finch
    → Posicionamento e market intelligence
  → squad-chief integra e cria o squad final
    → Validação pro com axiomas
    → Model routing (economia 60-70% tokens)
```

---

## Instalação

### Pré-requisito

- [AIOX](https://github.com/SynkraAI/aiox-core) >= 4.0.0 (o Squad Creator base já vem incluído)

### Instalar o Pro

Copie esta pasta para seu projeto:

```bash
cp -r squads/squad-creator-pro /seu-projeto/squads/squad-creator-pro
```

O base **detecta automaticamente** a presença do Pro via `squads/squad-creator-pro/config.yaml`.

### Desinstalar

Remova a pasta. Volta para o modo base sem quebrar nada (degradação limpa).

```bash
rm -rf squads/squad-creator-pro
```

---

## Quando usar cada um

| Cenário | Free | Pro |
|---------|------|-----|
| Squad operacional/utility simples | Ideal | Overkill |
| Squad baseado em domínio técnico | Bom | Melhor (pesquisa automatizada) |
| Squad baseado em expert real | Limitado (input manual) | Ideal (DNA extraction) |
| Clonar mente de especialista | Não disponível | Core feature |
| Otimizar custos de tokens | Não disponível | Model routing |
| Primeiro squad do ecossistema | Ideal | Não necessário |
| Squad de elite/produção | Possível | Recomendado |

---

## Estrutura

```
squads/squad-creator-pro/
├── config.yaml            # Auto-detecção pelo base
├── agents/                # 3 agentes especialistas
├── tasks/                 # 34 tasks avançadas
├── workflows/             # 15 workflows + 3 módulos
├── checklists/            # 7 checklists avançados
├── data/                  # 22 data files (anchor words, axiomas, signals)
├── config/                # 7 configs (routing, scoring, veto, axiomas)
├── scripts/               # 42 scripts (inclui cross-provider, tests)
├── minds/                 # 2 minds clonadas
├── benchmarks/            # Golden baselines + runs
├── test-cases/            # 17 diretórios de test cases
└── assessments/           # Axioma assessments
```

> O Squad Creator Pro é um produto pago. Este README documenta suas capacidades. Para adquirir, entre em contato via [GitHub Discussions](https://github.com/SynkraAI/aiox-squads/discussions).

---

## Licença

MIT &copy; 2026 AIOX Squads
