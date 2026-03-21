# Referencia de Comandos

> **Documento de referencia.** Consulte quando precisar saber como usar um comando.
>
> **Primeira vez?** Comece por [POR-ONDE-COMECAR.md](./POR-ONDE-COMECAR.md).
>
> **Version:** 4.0.0 | **Updated:** 2026-03-06

---

## Base vs Pro Feature Matrix

| Capability | Base | [PRO] |
|------------|:----:|:-----:|
| Squad creation (template-driven) | YES | YES |
| Agent creation | YES | YES |
| Workflow / Task / Template / Pipeline creation | YES | YES |
| Tool Discovery | YES | YES |
| Squad validation (6-phase system) | YES | YES |
| Component validation (agent, task, workflow, template, checklist) | YES | YES |
| Squad upgrade | YES | YES |
| Recovery (reexecute-phase) | YES | YES |
| Planning (*next-squad) | YES | YES |
| Analytics / Registry / Overview | YES | YES |
| Smart creation (context-aware) | -- | YES |
| Brownfield upgrade | -- | YES |
| Mind Cloning (Voice DNA + Thinking DNA) | -- | YES |
| Auto-Acquire Sources | -- | YES |
| Quality Dashboard (mind/fidelity) | -- | YES |
| Review Extraction / Artifacts | -- | YES |
| Optimize (squad / workflow) | -- | YES |
| Specialist Agents (@oalanicolas, @pedro-valerio) | -- | YES |

---

## Base Commands

### Comandos de Criacao

#### `*create-squad`

Cria um squad completo atraves do workflow guiado (template-driven).

```bash
*create-squad
*create-squad copywriting
*create-squad legal --mode yolo
```

**Parametros:**
| Param | Descricao | Default |
|-------|-----------|---------|
| `domain` | Area do squad | (pergunta) |
| `--mode` | incremental, yolo | incremental |
| `--materials` | Path para materiais | (nenhum) |

**Fluxo (Base):**
1. Phase 0: Discovery (viabilidade, squad existente, estrutura)
2. Phase 1: Template Selection (tipo, abordagem, roster)
3. Phase 2: Architecture (tiers, relacionamentos, quality gates)
4. Phase 3: Creation (agents via template, workflows, tasks)
5. Phase 4: Integration (dependencias, docs, command sync)
6. Phase 5: Validation (checklist, scoring, fix blocking)
7. Phase 6: Handoff (summary, next steps)

**PRO Detection:** Se `squads/squad-creator-pro/config.yaml` existe, delega para `wf-create-squad.yaml` pro override automaticamente.

---

#### `*create-agent`

Cria um agent individual para um squad existente.

```bash
*create-agent {agent-name} --squad {squad-name}
*create-agent {agent-name} --squad {squad-name} --tier 1
```

**Parametros:**
| Param | Descricao | Default |
|-------|-----------|---------|
| `name` | Nome do agent (kebab-case) | (obrigatorio) |
| `--squad` | Squad de destino | (obrigatorio) |
| `--tier` | 0, 1, 2, 3, orchestrator | (pergunta) |

---

#### `*create-workflow`

Cria workflow multi-fase (preferido sobre tasks standalone).

```bash
*create-workflow high-ticket-copy --squad copy
```

**Quando usar:**
- Operacao tem 3+ fases
- Multiplos agents envolvidos
- Precisa checkpoints entre fases

---

#### `*create-task`

Cria task atomica com Task Anatomy (8 campos obrigatorios).

```bash
*create-task write-headline --squad copy
```

**Quando usar:**
- Operacao single-session
- Um agent so e suficiente
- Nao precisa checkpoints

---

#### `*create-template`

Cria template de output para squad.

```bash
*create-template sales-page-tmpl --squad copy
```

---

#### `*create-pipeline`

Cria pipeline de execucao para squad.

```bash
*create-pipeline etl-pipeline --squad data
```

---

### Comandos de Tool Discovery

#### `*discover-tools`

Pesquisa MCPs, APIs, CLIs, Libraries e GitHub projects para um dominio.

```bash
*discover-tools {domain}
*discover-tools squad-creator
*discover-tools copywriting
```

**O que pesquisa:**
- MCP Servers (Model Context Protocol)
- APIs REST/GraphQL
- CLI tools
- Libraries (Python, Node)
- GitHub projects

**Protocolo obrigatorio (anti-assumption):**
- Validar escopo do dominio por fontes canonicas antes de pesquisar.
- E proibido inferir escopo apenas por nome/slug do dominio.
- Se houver ambiguidade ou conflito entre fontes, pausar e pedir clarificacao ao usuario.

**Output:**
- Matriz de priorizacao (Impacto vs Esforco)
- Quick wins identificados
- Plano de integracao

**Documentacao:** Ver [TOOL-RECOMMENDATIONS.md](./TOOL-RECOMMENDATIONS.md)

---

#### `*show-tools`

Exibe o registro global de ferramentas (instaladas e recomendadas).

```bash
*show-tools
```

---

#### `*add-tool`

Adiciona ferramenta descoberta as dependencias do squad.

```bash
*add-tool mcp-youtube-transcript
*add-tool firecrawl-mcp
```

**Nota:** Delegado para @devops para instalacao real no `.mcp.json`.

---

### Comandos de Upgrade

#### `*upgrade-squad`

Upgrade de squad existente (brownfield).

```bash
*upgrade-squad copy
*upgrade-squad legal --focus agents
```

---

### Comandos de Validacao (Task-Backed)

#### `*validate-squad`

Valida squad inteiro com o sistema de 6 fases (Type Detection, Structure, Coverage, Quality, Contextual, Veto Check, Scoring).

```bash
*validate-squad copy
*validate-squad legal --verbose
*validate-squad books --type=pipeline
```

**Sistema de validacao:**
- Phase 0: Type Detection (Expert/Pipeline/Hybrid)
- Phase 1: Structure (BLOCKING - config, entry agent, refs, security)
- Phase 2: Coverage (BLOCKING - checklists, orphans, data usage)
- Phase 3: Quality (SCORING - prompts, coherence, docs, optimization)
- Phase 4: Contextual (type-specific checks)
- Phase 5: Veto Check (universal + type-specific vetos)
- Phase 6: Scoring (Tier3 x 0.80 + Tier4 x 0.20)

**Worker Scripts:** `scripts/validate-squad.sh` (all-in-one) ou scripts modulares Python.

---

#### `*validate-final-artifacts`

Valida artefatos finais de um squad criado.

```bash
*validate-final-artifacts copy
```

---

### Comandos de Validacao (Behavioral)

#### `*validate-agent`

Valida agent individual contra AIOX 6-level structure.

```bash
*validate-agent squads/{squad-name}/agents/{agent-name}.md
```

**Criterios:**
- Lines >= 300
- voice_dna presente (Expert squads)
- output_examples >= 3
- anti_patterns definidos
- completion_criteria

---

#### `*validate-task`

Valida task contra Task Anatomy (8 campos).

```bash
*validate-task squads/{squad-name}/tasks/{task-name}.md
```

---

#### `*validate-workflow`

Valida workflow (fases, checkpoints, fluxo unidirecional).

```bash
*validate-workflow squads/{squad-name}/workflows/{workflow-name}.yaml
```

---

#### `*validate-template`

Valida template de output contra padrao AIOX.

```bash
*validate-template squads/{squad-name}/templates/{template-name}.md
```

---

#### `*validate-checklist`

Valida checklist (items mensuraveis, scoring, pass/fail).

```bash
*validate-checklist squads/{squad-name}/checklists/{checklist-name}.md
```

---

### Comandos de Recovery

#### `*reexecute-phase`

Re-executa uma fase especifica de um workflow de squad.

```bash
*reexecute-phase {squad} {workflow} {phase}
*reexecute-phase copy wf-create-squad phase_3
```

**Quando usar:**
- Fase falhou e precisa re-executar
- Quality gate nao passou
- Veto condition precisa ser resolvida

---

### Comandos de Planning

#### `*next-squad`

Sugere proximo squad a ser criado com base em gaps detectados.

```bash
*next-squad
```

---

### Comandos Script-Backed

#### `*guide`

Mostra guia completo de uso do Squad Creator.

```bash
*guide
```

---

#### `*squad-analytics`

Dashboard detalhado de analytics por squad.

```bash
*squad-analytics
*squad-analytics copy
```

**Mostra:**
- Agents por tier
- Tasks por tipo
- Workflows
- Templates
- Checklists
- Usage stats

---

#### `*refresh-registry`

Escaneia squads/ e atualiza registro.

```bash
*refresh-registry
```

**Quando usar:**
- Apos criar squad manualmente
- Apos mover/renomear squads
- Sincronizar estado

---

### Comandos Task-Backed Utility

#### `*squad-overview`

Mostra visao geral de um squad especifico.

```bash
*squad-overview copy
*squad-overview legal
```

---

#### `*sync`

Sincroniza IDE commands e codex skills com estado do squad.

```bash
*sync
```

---

### Comandos Behavioral

#### `*show-tools`

Exibe ferramentas registradas e recomendadas.

#### `*add-tool`

Adiciona ferramenta ao squad.

#### `*list-squads`

Lista todos os squads criados.

```bash
*list-squads
```

**Output:**
```
+----------+-------------+--------+-----------+
| Squad    | Agents      | Score  | Status    |
+----------+-------------+--------+-----------+
| copy     | 6           | 8.2    | Active    |
| legal    | 4           | 7.8    | Active    |
| data     | 3           | 6.5    | Draft     |
+----------+-------------+--------+-----------+
```

---

#### `*show-registry`

Mostra registro de squads (existentes, padroes, gaps).

```bash
*show-registry
```

---

#### `*show-context`

Mostra contexto atual do squad-creator (modo, squad ativo, estado).

```bash
*show-context
```

---

#### `*chat-mode`

Alterna para modo conversacional (sem execucao de workflows).

```bash
*chat-mode
```

---

#### `*help`

Mostra lista de comandos disponiveis.

```bash
*help
```

---

#### `*exit`

Desativa o Squad Architect.

```bash
*exit
```

---

## [PRO] Commands

> Requer `squad-creator-pro` instalado (`squads/squad-creator-pro/config.yaml` existe).

### [PRO] Comandos de Criacao Smart

#### `*create-squad-smart`

Criacao de squad context-aware (detecta greenfield, brownfield, partial).

```bash
*create-squad-smart
*create-squad-smart copywriting
```

**Fluxo:**
1. `detect-squad-context` (greenfield_pure, pre_existing_brief, partial_squad, legacy_assets)
2. Rota para `wf-context-aware-create-squad` ou `wf-brownfield-upgrade-squad`

---

#### `*brownfield-upgrade`

Upgrade de squad existente com analise profunda de gaps.

```bash
*brownfield-upgrade copy
```

---

### [PRO] Comandos de Mind Cloning

#### `*clone-mind`

Executa clonagem completa (Voice + Thinking DNA).

```bash
*clone-mind "Gary Halbert" --domain copywriting
*clone-mind "Dan Kennedy" --domain marketing --focus voice
```

**Parametros:**
| Param | Descricao | Default |
|-------|-----------|---------|
| `name` | Nome do expert | (obrigatorio) |
| `--domain` | Area de expertise | (obrigatorio) |
| `--focus` | voice, thinking, both | both |
| `--sources` | Path para materiais | (nenhum) |
| `--auto-acquire` | true, false | true |

**Output:**
```
outputs/minds/{slug}/
  sources_inventory.yaml
  voice_dna.yaml
  thinking_dna.yaml
  mind_dna_complete.yaml
  smoke_test_result.yaml
  quality_dashboard.md
```

---

#### `*extract-voice-dna`

Extrai apenas Voice DNA (comunicacao/escrita).

```bash
*extract-voice-dna "Gary Halbert" --sources ./materials/
```

**O que extrai:**
- Power words
- Signature phrases
- Stories/anecdotes
- Writing style
- Tone dimensions
- Anti-patterns
- Immune system

---

#### `*extract-thinking-dna`

Extrai apenas Thinking DNA (frameworks/decisoes).

```bash
*extract-thinking-dna "Dan Kennedy" --sources ./materials/
```

**O que extrai:**
- Recognition patterns
- Primary framework
- Secondary frameworks
- Heuristics
- Decision architecture
- Objection handling
- Handoff triggers

---

#### `*update-mind`

Atualiza mind existente com novas fontes (brownfield).

```bash
*update-mind gary_halbert --sources ./new-materials/
*update-mind dan_kennedy --focus thinking
```

**Parametros:**
| Param | Descricao | Default |
|-------|-----------|---------|
| `slug` | Slug do mind existente | (obrigatorio) |
| `--sources` | Path para novas fontes | (nenhum) |
| `--focus` | voice, thinking, both | both |
| `--mode` | merge, replace, selective | merge |

---

#### `*auto-acquire-sources`

Busca fontes automaticamente na web.

```bash
*auto-acquire-sources "Gary Halbert" --domain copywriting
```

**O que busca:**
- YouTube transcripts
- Book summaries
- Podcast appearances
- Articles/blogs

---

### [PRO] Comandos de Quality

#### `*quality-dashboard`

Gera dashboard de qualidade para mind ou squad.

```bash
*quality-dashboard gary_halbert
*quality-dashboard copy
```

**Metricas:**
- Sources count & tier ratio
- Voice score
- Thinking score
- Fidelity estimate
- Gaps & recommendations

---

#### `*review-extraction`

Revisa resultado de extracao de DNA.

```bash
*review-extraction gary_halbert
```

---

#### `*review-artifacts`

Revisa artefatos gerados por squad/mind.

```bash
*review-artifacts copy
```

---

### [PRO] Comandos de Otimizacao

#### `*optimize`

Otimiza squad existente com analise profunda.

```bash
*optimize copy
```

**Analisa:**
- Tasks que podem ser convertidas de Agent para Worker
- Executor type mismatches
- Cost savings potenciais
- Coverage gaps

---

#### `*optimize-workflow`

Otimiza workflow especifico.

```bash
*optimize-workflow copy wf-high-ticket-copy
```

---

## [PRO] Specialist Agents

### `@oalanicolas` - Mind Cloning Specialist

Ativa o especialista em clonagem de mentes (DNA Mental 8-Layer).

```bash
# Dentro do squad-creator
@oalanicolas

# Ou diretamente
/squad-creator @oalanicolas
```

**Comandos exclusivos:**
| Comando | Descricao |
|---------|-----------|
| `*extract-dna` | Extrai Voice + Thinking DNA de um mind |
| `*assess-sources` | Avalia qualidade das fontes (ouro vs bronze) |
| `*design-clone` | Desenha arquitetura de clone |
| `*validate-clone` | Valida fidelidade do clone |
| `*diagnose-clone` | Diagnostica problemas de fidelidade |

**Quando usar:**
- Extracao de DNA (voice, thinking)
- Curadoria de fontes
- Validacao de fidelidade
- Problemas de autenticidade do clone

---

### `@pedro-valerio` - Process Specialist

Ativa o especialista em processos, tarefas e checklists.

```bash
# Dentro do squad-creator
@pedro-valerio

# Ou diretamente
/squad-creator @pedro-valerio
```

**Comandos exclusivos:**
| Comando | Descricao |
|---------|-----------|
| `*audit` | Audita workflows/tasks |
| `*design-heuristic` | Desenha heuristica de decisao |
| `*find-automation` | Identifica oportunidades de automacao |
| `*gap-analysis` | Analise de gaps em processos |
| `*veto-check` | Define condicoes de veto |

**Quando usar:**
- Design de workflows
- Criacao de checklists
- Definicao de veto conditions
- Automacao de processos
- Validacao de tasks

---

### Specialist Selection

```
+-------------------------------------------------------------------+
|                 QUANDO USAR CADA ESPECIALISTA [PRO]                |
+-------------------------------------------------------------------+
|                                                                    |
|  "Preciso extrair DNA de um expert"                                |
|  -> @oalanicolas                                                   |
|                                                                    |
|  "As fontes estao boas?"                                           |
|  -> @oalanicolas                                                   |
|                                                                    |
|  "Clone nao esta autentico"                                       |
|  -> @oalanicolas                                                   |
|                                                                    |
|  "Preciso criar um workflow"                                       |
|  -> @pedro-valerio                                                 |
|                                                                    |
|  "Quero adicionar veto conditions"                                 |
|  -> @pedro-valerio                                                 |
|                                                                    |
|  "Checklist esta completo?"                                        |
|  -> @pedro-valerio                                                 |
|                                                                    |
+-------------------------------------------------------------------+
```

---

## Quick Reference

```
+-------------------------------------------------------------------+
|                    COMANDOS MAIS USADOS                            |
+-------------------------------------------------------------------+
|                                                                    |
|  BASE - CRIAR                                                      |
|  *create-squad {domain}      Criar squad (template-driven)         |
|  *create-agent {name}        Criar agent individual                |
|  *create-workflow {name}     Criar workflow multi-fase              |
|  *create-task {name}         Criar task atomica                    |
|                                                                    |
|  BASE - VALIDAR                                                    |
|  *validate-squad {name}      Validar squad (6-phase system)        |
|  *validate-agent {file}      Validar agent individual              |
|  *validate-task {file}       Validar task                          |
|                                                                    |
|  BASE - GERENCIAR                                                  |
|  *list-squads                Ver squads disponiveis                |
|  *squad-overview {name}      Visao geral de um squad               |
|  *refresh-registry           Atualizar registro                    |
|  *discover-tools {domain}    Pesquisar ferramentas                 |
|                                                                    |
|  BASE - RECOVERY                                                   |
|  *reexecute-phase            Re-executar fase de workflow          |
|  *upgrade-squad {name}       Upgrade de squad existente            |
|                                                                    |
|  [PRO] - MIND CLONING                                              |
|  *clone-mind {name}          Clonar expert especifico              |
|  *extract-voice-dna          Extrair Voice DNA                     |
|  *extract-thinking-dna       Extrair Thinking DNA                  |
|  *auto-acquire-sources       Buscar fontes automaticamente         |
|                                                                    |
|  [PRO] - QUALITY                                                   |
|  *quality-dashboard {name}   Ver metricas de qualidade             |
|  *optimize {name}            Otimizar squad existente              |
|                                                                    |
|  [PRO] - SMART CREATION                                            |
|  *create-squad-smart         Criacao context-aware                 |
|  *brownfield-upgrade         Upgrade com analise profunda          |
|                                                                    |
+-------------------------------------------------------------------+
```

---

**Squad Architect | Commands Reference v4.0.0**
**Last Updated: 2026-03-06**
