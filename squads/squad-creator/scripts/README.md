# Squad Creator Scripts

> Worker scripts para operações determinísticas - 100% Python, zero tokens LLM.

## Arquitetura de Execução

O Squad Creator usa o **Executor Decision Tree** para decidir quem executa cada operação:

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTOR DECISION TREE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  É DETERMINÍSTICO? (mesma entrada = mesma saída sempre)          │
│       │                                                          │
│       ├── SIM → WORKER (Python script)                           │
│       │         • Operações de arquivo                           │
│       │         • Parse YAML/JSON                                │
│       │         • Contagem e inventário                          │
│       │         • Validação de sintaxe                           │
│       │                                                          │
│       └── NÃO → Requer análise semântica?                        │
│                 │                                                │
│                 ├── SIM → AGENT (LLM)                            │
│                 │         • Inferir domínio                      │
│                 │         • Gerar highlights                     │
│                 │         • Análise de qualidade                 │
│                 │                                                │
│                 └── MISTO → HYBRID                               │
│                             • Worker coleta dados                │
│                             • Agent enriquece/analisa            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Scripts por Categoria

### 🔧 IDE Sync (Worker)

| Script | Linhas | Propósito |
|--------|--------|-----------|
| `sync-ide-command.py` | 430 | Sincroniza squad components para IDEs |

```bash
# Sincronizar squad completo
python3 scripts/sync-ide-command.py squad squad-creator

# Preview sem executar
python3 scripts/sync-ide-command.py squad squad-creator --dry-run

# Forçar sobrescrita
python3 scripts/sync-ide-command.py agent oalanicolas --force
```

**Suporta:**
- Claude Code: `.claude/agents/{slashPrefix}/`
- Cursor: `.cursor/rules/` (converte MD → MDC)

---

### ✅ Validação (Worker/Hybrid)

| Script | Linhas | Propósito | Tipo |
|--------|--------|-----------|------|
| `validate-squad-structure.py` | 535 | Phases 0-2 da validação | Worker |
| `quality_gate.py` | 414 | Quality gates e thresholds | Worker |
| `yaml_validator.py` | 487 | Validação de sintaxe YAML | Worker |
| `checklist_validator.py` | 419 | Validação de checklists | Worker |
| `naming_validator.py` | 284 | Validação de nomenclatura | Worker |

```bash
# Validar estrutura (JSON output para Agent)
python3 scripts/validate-squad-structure.py squad-creator --output json

# Validar YAML
python3 scripts/yaml_validator.py squads/squad-creator/config.yaml

# Quality gate
python3 scripts/quality_gate.py squads/squad-creator/
```

---

### 📊 Analytics (Hybrid)

| Script | Linhas | Propósito | Tipo |
|--------|--------|-----------|------|
| `refresh-registry.py` | 267 | Escaneia squads, gera JSON | Worker |
| `squad-analytics.py` | 335 | Métricas e estatísticas | Worker |
| `inventory.py` | 268 | Inventário de componentes | Worker |
| `coherence-validator.py` | adapter | Bridge Base↔Pro para coherence modular (`SKIPPED_PRO_ONLY` sem pro) | Adapter |
| `scoring.py` | adapter | Bridge Base↔Pro para scoring modular (`SKIPPED_PRO_ONLY` sem pro) | Adapter |

```bash
# Refresh registry (output JSON para Agent enriquecer)
python3 scripts/refresh-registry.py --output json

# Analytics
python3 scripts/squad-analytics.py squad-creator

# Inventário completo
python3 scripts/inventory.py squads/squad-creator/
```

---

## Orphan Script Governance (SC-INT-6)

Cross-check Base↔Pro realizado para scripts sinalizados no audit de orfandade. Resultado:

| Script (Base) | Counterpart no Pro | Decisão | Justificativa |
|---------------|--------------------|---------|---------------|
| `scaffold-squad.cjs` | Não identificado | KEEP | Utilitário local de scaffold; não há versão promovida no pro. |
| `validate-squad-structure.py` | `validate-squad.sh`/`quality_gate.py` (escopo diferente) | KEEP | Continua referenciado por workflow/package do base; não é substituído 1:1 no pro. |
| `validate-all.sh` | Não identificado | DEPRECATE (manter) | Script legado sem referências ativas; mantido temporariamente para compatibilidade manual. |
| `verify-squad-completeness.sh` | Não identificado | KEEP | Referenciado em checklist estrutural; utilitário manual de governança. |
| `yaml_validator.py` | Testes no pro (`scripts/tests/test_yaml_validator.py`) | KEEP | Validador base segue útil e ainda é alvo de testes/integrações relacionadas. |

Política aplicada:
- `KEEP`: permanece oficial no base.
- `DEPRECATE (manter)`: não remover sem plano de migração explícito.
- Remoções só ocorrem com prova de substituição funcional.

---

### 🔍 Dependências

| Script | Linhas | Propósito |
|--------|--------|-----------|
| `dependency_check.py` | 345 | Verifica dependências entre componentes |

```bash
python3 scripts/dependency_check.py squads/squad-creator/
```

---

## Padrão de Execução

Todos os scripts seguem o padrão **EXEC-W-001** (Worker - Deterministic):

```python
#!/usr/bin/env python3
"""
{Script Name} - Worker Script (Deterministic)

{Description of what it does}

Usage:
    python scripts/{script}.py {args}

Pattern: EXEC-W-001 (Worker - Deterministic)
"""
```

### Output Formats

| Flag | Formato | Uso |
|------|---------|-----|
| `--output text` | Human-readable | Terminal (default) |
| `--output json` | JSON estruturado | Para Agent processar |
| `--verbose` | Detalhado | Debug |

---

## Fluxo Hybrid (Worker → Agent)

Para tasks Hybrid, o Worker coleta dados e o Agent enriquece:

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID EXECUTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1] WORKER SCRIPT (Determinístico)                              │
│      │                                                           │
│      │  python3 scripts/refresh-registry.py --output json        │
│      │                                                           │
│      └──→ JSON com dados factuais:                               │
│           • Contagens (agents, tasks, etc.)                      │
│           • Metadados de config.yaml                             │
│           • Lista de arquivos                                    │
│           • Timestamps                                           │
│                                                                  │
│  [2] AGENT (LLM - Semântico)                                     │
│      │                                                           │
│      │  Recebe JSON do Worker                                    │
│      │                                                           │
│      └──→ Enriquece com:                                         │
│           • Inferir domínio (content_marketing, technical, etc.) │
│           • Extrair keywords do README                           │
│           • Gerar highlights                                     │
│           • Análise de gaps                                      │
│                                                                  │
│  [3] OUTPUT FINAL                                                │
│      │                                                           │
│      └──→ Resultado combinado (dados + análise)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testes

Suite base em `squads/squad-creator/scripts/tests/`:

```bash
# Rodar todos os testes da suite base (a partir da raiz do repo)
python3 -m pytest squads/squad-creator/scripts/tests -v

# Rodar arquivo específico
python3 -m pytest squads/squad-creator/scripts/tests/test_adapters.py -v
```

| Área | Teste | Cobertura |
|------|-------|-----------|
| Adapters Base↔Pro | `test_adapters.py` | Delegação com Pro + fallback JSON sem Pro |
| Refresh Registry | `test_refresh_registry_contract.py` | Version/counts essenciais + merge policy semântica |
| Validator YOLO | `test_validate_squad_yolo_warning.py` | Warning com/sem `settings.activation.yolo_required` |

---

## Economia de Custos

A separação Worker/Agent reduz custos significativamente:

| Métrica | Valor |
|---------|-------|
| **Economia mensal** | ~$45/mês |
| **Economia anual** | ~$540/ano |
| **Tokens LLM evitados** | ~15M tokens/mês |

### Por que Worker é mais barato?

```
AGENT (LLM):
  - Custo por operação: ~$0.01-0.10
  - Tempo: 2-10 segundos
  - Variabilidade: Alta

WORKER (Python):
  - Custo por operação: ~$0.00
  - Tempo: 0.1-1 segundo
  - Variabilidade: Zero (determinístico)
```

---

## Contribuindo

Ao criar novos scripts:

1. **Docstring completa** com Usage e Pattern
2. **Suporte a `--output json`** para integração com Agent
3. **Criar teste** em `scripts/tests/`
4. **Atualizar este README**

---

_Versão: 1.0.0_
_Compatível com: Squad Creator v2.9.0+_
