# Human-in-the-Loop Flow: Squad Creation

> **Documento avancado.** Detalha os checkpoints de interacao humana.
>
> **Primeira vez?** Comece por [POR-ONDE-COMECAR.md](./POR-ONDE-COMECAR.md).
>
> **Filosofia:** "Template-driven in Base, Mind-cloned in PRO"

---

## Base vs PRO: Checkpoint Differences

> **IMPORTANTE:** O Squad Creator opera em dois modos distintos com checkpoints diferentes.
>
> - **Base Mode:** Todos os checkpoints sao gerenciados por @squad-chief. O fluxo e template-driven com input do usuario. Nao ha mind cloning, DNA extraction, ou delegacao para especialistas.
> - **PRO Mode:** Ativado quando `squads/squad-creator-pro/config.yaml` existe. Habilita mind cloning, delegacao para especialistas (@oalanicolas, @pedro-valerio, @thiago_finch), e modos YOLO/QUALITY/HYBRID.
>
> Para verificar modo ativo: se `squads/squad-creator-pro/config.yaml` existe, pro_mode=true.

---

## Agentes Envolvidos (v4.0.0)

Os checkpoints sao gerenciados por diferentes agentes dependendo do modo:

| Checkpoint | Agente Base | Agente PRO | Funcao |
|------------|-------------|------------|--------|
| PRE-FLIGHT | @squad-chief | @squad-chief | Triagem, domain questions (max 3) |
| TEMPLATE_LOAD | @squad-chief | @squad-chief | Carregar templates antes de criacao |
| VALIDATE_MINDS | - | @squad-chief | Apresentar elite minds |
| MATERIALS | - | @squad-chief | Coletar materiais |
| VOICE_DNA | - | @oalanicolas [PRO] | Validar DNA de voz extraido |
| THINKING_DNA | - | @oalanicolas [PRO] | Validar DNA de pensamento |
| AGENTS | - | @pedro-valerio [PRO] | Validar agents criados |
| QUALITY_GATE | @squad-chief | @squad-chief | validate-squad score >= 7.0 |
| STRUCTURAL_COMPLETENESS | @squad-chief | @squad-chief | 14 blocking requirements |
| CP_FINAL | @squad-chief | @squad-chief | Aprovacao final do usuario (sempre) |

**Em Base Mode:** Todos os checkpoints sao handled internamente por @squad-chief. Nao ha delegacao para especialistas.

**Em PRO Mode:** Checkpoints marcados [PRO] sao delegados para os respectivos especialistas.

**Ver tambem:** [AGENT-COLLABORATION.md](./AGENT-COLLABORATION.md)

---

## Base Mode Checkpoints

O fluxo base e simples, template-driven, e focado em input do usuario:

```
+========================================================================+
| PRE-FLIGHT (SEMPRE)                                                     |
|                                                                         |
| @squad-chief faz ate 3 perguntas sobre o dominio:                       |
| 1. Qual o dominio e proposito do squad?                                 |
| 2. Quem vai usar e para quais use cases?                                |
| 3. Alguma preferencia de estrutura ou agents?                           |
|                                                                         |
| REGRA: Maximo 3 perguntas. Depois, proceder com criacao.                |
+========================================================================+
                                  |
                                  v
+========================================================================+
| TEMPLATE_LOAD (OBRIGATORIO)                                             |
|                                                                         |
| Antes de criar QUALQUER arquivo do squad:                               |
| - Read() config-tmpl.yaml antes de Write() config.yaml                  |
| - Read() agent-tmpl.md antes de Write() agent file                      |
| - Read() task-tmpl.md antes de Write() task file                        |
| - Read() readme-tmpl.md antes de Write() README.md                      |
|                                                                         |
| VETO: Write() sem Read() do template = BLOQUEADO                        |
+========================================================================+
                                  |
                                  v
+========================================================================+
| CREATION (TEMPLATE-DRIVEN)                                              |
|                                                                         |
| @squad-chief cria todos os componentes usando templates:                |
| - config.yaml (de config-tmpl.yaml)                                     |
| - Entry agent (de agent-tmpl.md)                                        |
| - Tasks (de task-tmpl.md)                                               |
| - Workflows (de workflow-tmpl.yaml)                                     |
| - README.md (de readme-tmpl.md)                                         |
+========================================================================+
                                  |
                                  v
+========================================================================+
| QUALITY_GATE (AUTOMATICO)                                               |
|                                                                         |
| Executa validate-squad automaticamente:                                 |
| - Score >= 7.0 = PASS                                                   |
| - Score < 7.0 = HALT, fix cycle (max 2 retries)                         |
| - Score < 7.0 apos retries = FAIL (manual intervention)                 |
+========================================================================+
                                  |
                                  v
+========================================================================+
| STRUCTURAL_COMPLETENESS (AUTOMATICO)                                    |
|                                                                         |
| 14 blocking requirements (SC_STRUCT_001):                               |
| - config.yaml existe (NAO squad.yaml)                                   |
| - Campo entry_agent presente                                            |
| - Campo version presente (semver)                                       |
| - Arquivo do entry_agent existe                                         |
| - Entry agent tem activation-instructions                               |
| - Entry agent tem comando *help                                         |
| - README.md existe                                                      |
| - Template compliance validada                                          |
| - E demais checks do checklist                                          |
|                                                                         |
| QUALQUER falha = ABORT. Threshold: 14/14 (100%)                         |
+========================================================================+
                                  |
                                  v
+========================================================================+
| CP_FINAL: APROVACAO DO USUARIO (SEMPRE)                                 |
|                                                                         |
| Apresenta squad completo para aprovacao:                                 |
| - Lista de agents criados com quality score                             |
| - Lista de tasks e workflows                                            |
| - Score geral do validate-squad                                         |
| - Structural completeness: PASS/FAIL                                    |
|                                                                         |
| Opcoes: [DEPLOY] [AJUSTAR] [CANCELAR]                                   |
+========================================================================+
```

---

## PRO Mode: Modos de Execucao

> **NOTA:** Os modos YOLO, QUALITY, e HYBRID so se aplicam quando PRO mode esta ativo (mind cloning habilitado). Em base mode, o fluxo e sempre template-driven com input do usuario.

| Modo | Quando Usar | Interacoes | Qualidade Esperada |
|------|-------------|------------|-------------------|
| **YOLO** | Nao tem materiais | So aprovacao final | 60-75% |
| **QUALITY** | Tem livros/PDFs/cursos | Coleta + Validacao | 85-95% |
| **HYBRID** | Materiais de alguns experts | Por expert | Variavel |

---

## Fluxo Visual PRO

```
+=========================================================================+
| PRE-FLIGHT (SEMPRE) [PRO]                                                |
|                                                                          |
| "Vou criar um squad de {domain}. Para maxima qualidade, voce teria:"     |
| - 2-3 livros por expert                                                  |
| - 5-10 entrevistas/podcasts                                              |
| - Artigos/newsletters                                                    |
|                                                                          |
| PERGUNTAS:                                                               |
| 1. Modo: [YOLO] [QUALITY] [HYBRID]                                      |
| 2. Conhece algum expert? [Sim] [Nao]                                     |
| 3. Tempo para interacoes? [Minimo] [Moderado] [Alto]                     |
+=========================================================================+
                                      |
                    +-----------------+-----------------+
                    v                 v                 v
              +---------+      +-----------+     +----------+
              |  YOLO   |      |  QUALITY  |     |  HYBRID  |
              +----+----+      +-----+-----+     +----+-----+
                   |                 |                |
                   v                 v                v
            +------------------------------------------------------+
            | PHASE 1: MIND RESEARCH (AUTO)                         |
            | - Pesquisa elite minds no dominio                     |
            | - 3-5 iteracoes com devil's advocate                  |
            | - Valida frameworks documentados                      |
            +------------------------------------------------------+
                                      |
                   +------------------+------------------+
                   v                  v                  v
            +------------+    +===================+    +------------+
            | YOLO:      |    | QUALITY/HYBRID:   |    | HYBRID:    |
            | Auto-      |    | CP1: VALIDATE     |    | CP1 se     |
            | approve    |    |    MINDS           |    | pediu      |
            | minds      |    +===================+    |            |
            +------------+              |               +------------+
                   |                    |                     |
                   |         +=============================+  |
                   |         | CP_MATERIALS: COLETA         |  |
                   |         |                              |  |
                   |         | "Voce tem materiais de X?"   |  |
                   |         | - Livros: ___                |  |
                   |         | - Cursos: ___                |  |
                   |         | - Entrevistas: ___           |  |
                   |         +=============================+  |
                   |                    |                     |
                   +--------------------+---------------------+
                                        v
            +------------------------------------------------------+
            | PHASE 2: SOURCE COLLECTION (PER MIND)                 |
            | - Processa materiais do usuario (Tier 0)              |
            | - Pesquisa web complementar (Tier 1-2)                |
            | - Valida triangulacao (3+ fontes por claim)           |
            +------------------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   v                    v                    v
            +------------+    +===================+    +------------+
            | YOLO:      |    | QUALITY:          |    | <5 fontes: |
            | Auto se    |    | CP_SOURCES:       |    | PARAR      |
            | 10+ fontes |    |    VALIDAR        |    | Pedir mais |
            +------------+    +===================+    +------------+
                   |                    |                     |
                   +--------------------+---------------------+
                                        v
            +------------------------------------------------------+
            | PHASE 3: DNA EXTRACTION (AUTO)                        |
            | - Voice DNA: vocabulario, historias, tom              |
            | - Thinking DNA: frameworks, heuristicas, decisoes    |
            | - Synthesis: mind_dna_complete.yaml                   |
            +------------------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   v                    v                    v
            +------------+    +===================+    +------------+
            | YOLO:      |    | CONHECE EXPERT:   |    | Score <7:  |
            | Auto se    |    | CP_DNA:           |    | PARAR      |
            | score >=7  |    |    VALIDAR DNA    |    | Revisar    |
            +------------+    +===================+    +------------+
                   |                    |                     |
                   +--------------------+---------------------+
                                        v
            +------------------------------------------------------+
            | PHASE 4: AGENT CREATION (AUTO)                        |
            | - Gera agent.md usando mind_dna_complete.yaml         |
            | - Quality gate SC_AGT_001                             |
            | - Smoke tests (3 cenarios)                            |
            +------------------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   v                    v                    v
            +------------+    +===================+    +------------+
            | YOLO:      |    | QUALITY/Alto:     |    | Test fail: |
            | Auto se    |    | CP_AGENT:         |    | PARAR      |
            | tests pass |    |    SMOKE TEST     |    | Ajustar    |
            +------------+    +===================+    +------------+
                   |                    |                     |
                   +--------------------+---------------------+
                                        v
                    ============================================
                    | REPETIR PHASES 2-4 PARA CADA MIND         |
                    ============================================
                                        v
            +------------------------------------------------------+
            | PHASE 5: SQUAD ASSEMBLY (AUTO)                        |
            | - Cria orchestrator agent                             |
            | - Define handoffs entre agentes                       |
            | - Gera config.yaml, README.md                         |
            | - Integration test                                    |
            +------------------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   v                    v                    v
            +------------+    +===================+    +------------+
            | YOLO:      |    | Moderado/Alto:    |    | Int. fail: |
            | Auto se    |    | CP_ARCH:          |    | PARAR      |
            | int. pass  |    |    ARQUITETURA    |    | Debug      |
            +------------+    +===================+    +------------+
                   |                    |                     |
                   +--------------------+---------------------+
                                        v
            +================================================================+
            | CP_FINAL: APROVACAO FINAL (SEMPRE)                              |
            |                                                                 |
            | +-----------------------------------------------------------+  |
            | | SQUAD PRONTO: {squad_name}                                 |  |
            | |                                                           |  |
            | | | Componente    | Status | Quality | Fidelity |           |  |
            | | |---------------|--------|---------|----------|           |  |
            | | | {agent-1}     | OK     | 8.5/10  | 85%      |           |  |
            | | | {agent-2}     | OK     | 7.2/10  | 65%      |           |  |
            | | | {squad}-chief | OK     | 8.0/10  | N/A      |           |  |
            | |                                                           |  |
            | | [DEPLOY] [AJUSTAR] [CANCELAR]                             |  |
            | +-----------------------------------------------------------+  |
            +================================================================+
```

---

## Checkpoints por Modo

| Checkpoint | BASE | YOLO [PRO] | QUALITY [PRO] | HYBRID [PRO] |
|------------|------|------------|---------------|--------------|
| PRE-FLIGHT (domain questions) | 3 max questions | Auto | Auto | Auto |
| TEMPLATE_LOAD | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| CP1: Minds | - | Auto | STOP | STOP |
| CP_MAT: Materials | - | Skip | STOP | Per mind |
| CP_SRC: Sources | - | Auto (>=10) | STOP | Per mind |
| CP_DNA: Validation | - | Auto (>=7) | STOP if knows | STOP if knows |
| CP_AGT: Smoke Test | - | Auto (pass) | STOP | Auto |
| CP_ARCH: Architecture | - | Auto | STOP | STOP |
| QUALITY_GATE (>= 7.0) | Automatico | Automatico | Automatico | Automatico |
| STRUCTURAL_COMPLETENESS | 14/14 blocking | 14/14 blocking | 14/14 blocking | 14/14 blocking |
| CP_FINAL: Approval | STOP | STOP | STOP | STOP |

**Legenda:** STOP = Para e pede input | Auto = Prossegue automaticamente | - = Nao se aplica neste modo

---

## Post-Creation Automatic Gates

Apos a criacao do squad, duas validacoes automaticas sao executadas:

### 1. qa-after-creation

Executada automaticamente apos criacao de qualquer componente (squad, agent, task, workflow). Para squads, inclui PHASE 0 (Structural Completeness) como gate blocking.

### 2. validate-squad

Validacao granular com scoring por dimensoes:
- Pipeline coherence (20%)
- Checklist actionability (20%)
- Documentation (20%)
- Structural completeness (20%)
- Overall quality (20%)

**Threshold:** Score >= 7.0 para PASS. Score < 7.0 aciona fix cycle (max 2 retries).

---

## Quando YOLO Mode Para [PRO]

Mesmo em YOLO, o workflow PARA se:

1. **Fontes Insuficientes:** < 5 fontes para um mind
2. **Mind Muito Obscuro:** Nao encontra framework documentado
3. **Quality Gate Critico Falha:** Score < 5/10
4. **Usuario Indicou Materiais:** Mas nao forneceu path
5. **Contradicao Nao Resolvida:** DNA extraction encontra conflito

---

## Qualidade Esperada [PRO]

```
+---------------------------------------------------------------------+
|                    QUALITY EXPECTATION MATRIX                         |
+---------------------------------------------------------------------+
|                                                                      |
|  100% -+-----------------------------------------------------       |
|        |                                     +---------------        |
|   95% -+                                     | QUALITY + Known       |
|        |                           +---------+ Expert Validation     |
|   85% -+                           | QUALITY |                       |
|        |                           | Mode    |                       |
|   75% -+               +-----------+         +---------------        |
|        |               |           |                                 |
|   65% -+   +-----------+ YOLO +    +-------------------------        |
|        |   | YOLO      | Some                                        |
|   55% -+   | Basic     | Sources                                     |
|        |   |           |                                             |
|   45% -+---+-----------+-------------------------------------        |
|        |                                                             |
|    0% -+-----------------------------------------------------        |
|        |           |           |           |           |             |
|      Web Only   + Books    + Courses   + Validation  + Expert        |
|                                                        Review        |
+---------------------------------------------------------------------+
```

---

## Comandos

```bash
# Base Mode (template-driven)
*create-squad copywriting

# PRO: YOLO Mode
*create-squad copywriting --mode yolo

# PRO: Quality Mode
*create-squad copywriting --mode quality

# PRO: Hybrid Mode
*create-squad copywriting --mode hybrid

# PRO: Com materiais ja indicados
*create-squad copywriting --materials /path/to/materials/
```

---

## Trade-off Summary

| Aspecto | BASE | YOLO [PRO] | QUALITY [PRO] |
|---------|------|------------|---------------|
| **Tempo** | 2-4h | 4-6h | 6-8h |
| **Interacoes** | 1-3 | 1-2 | 5-8 |
| **Fidelidade** | Template-driven | 60-75% | 85-95% |
| **Voice DNA** | N/A | Aproximado | Preciso |
| **Frameworks** | Template patterns | Publicos so | Completos |
| **Contradicoes** | N/A | Podem faltar | Capturadas |
| **Recomendado** | Squads operacionais | POC, testes | Producao |

---

**Squad Creator | HITL Flow v4.0.0 | 2026-03-06**
*"Template-driven in Base, Mind-cloned in PRO"*
