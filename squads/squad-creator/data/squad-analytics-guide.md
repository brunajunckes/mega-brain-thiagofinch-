# Squad Analytics Guide

**Version:** 1.0.0
**Last Updated:** 2026-02-01
**Author:** squad-chief

---

## Overview

O comando `*squad-analytics` fornece uma visão detalhada de todo o ecossistema AIOX, incluindo contagens precisas de todos os componentes por squad.

---

## Quick Start

```bash
# Ativar squad-chief
/squad-creator

# Executar analytics
*squad-analytics
```

---

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `*squad-analytics` | Tabela padrão ordenada por total de componentes |
| `*squad-analytics --detailed` | Inclui nomes dos componentes |
| `*squad-analytics --format json` | Exporta em JSON |
| `*squad-analytics --sort-by agents` | Ordena por número de agents |
| `*squad-analytics --sort-by tasks` | Ordena por número de tasks |
| `*squad-analytics --sort-by name` | Ordena alfabeticamente |

---

## Métricas Capturadas

### Por Squad

| Métrica | Descrição | Extensões |
|---------|-----------|-----------|
| **Agents** | Arquivos de agente | `.md` em `/agents/` |
| **Tasks** | Tarefas atômicas | `.md` em `/tasks/` |
| **Workflows** | Workflows multi-fase | `.md`, `.yaml` em `/workflows/` |
| **Templates** | Templates de output | `.md`, `.yaml` em `/templates/` |
| **Checklists** | Checklists de validação | `.md` em `/checklists/` |
| **Data** | Arquivos de dados/KB | `.md`, `.yaml`, `.json` em `/data/` |
| **Scripts** | Scripts de automação | `.py`, `.js`, `.ts`, `.sh` em `/scripts/` |

### Totais do Ecossistema

- Total de Squads
- Total de Agents
- Total de Tasks
- Total de Workflows
- Total de Templates
- Total de Checklists
- Total de Data files
- Total de Scripts
- **Total de Componentes** (soma de todos)

---

## Quality Indicators

| Indicador | Significado | Score |
|-----------|-------------|-------|
| ⭐⭐⭐ | Squad completo | 9+ pontos |
| ⭐⭐ | Squad bom | 6-8 pontos |
| ⭐ | Squad básico | 3-5 pontos |
| 🔨 | Work in progress | 0-2 pontos |

### Cálculo do Score

```
+2 pontos: tem agents
+2 pontos: tem tasks
+1 ponto: tem workflows
+1 ponto: tem templates
+1 ponto: tem checklists
+1 ponto: tem data files
+1 ponto: tem README.md
+1 ponto: tem config.yaml
─────────────────────────
Máximo: 10 pontos
```

---

## Output Formats

### Table (Padrão)

```
====================================================================================================
📊 AIOX SQUAD ANALYTICS
Generated: 2026-02-01
====================================================================================================

📈 ECOSYSTEM SUMMARY
   Squads: 21 | Agents: 127 | Tasks: 293 | Workflows: 50
   Templates: 161 | Checklists: 96 | Data: 79 | Scripts: 142
   Total Components: 948

----------------------------------------------------------------------------------------------------
Squad                 Agents   Tasks   WFs  Tmpls  Checks   Data  Scripts  Total Quality
----------------------------------------------------------------------------------------------------
{squad-a}                 22      58    11     23      17      3        3    137 ⭐⭐⭐
{squad-b}                  9      31     2     57      16     15        7    137 ⭐⭐⭐
...
```

### Detailed (com `--detailed`)

```
{squad-name}              22      58    11     23      17      3        3    137 ⭐⭐⭐
   └─ agents: {agent-1}, {agent-2}, {agent-3}, {agent-4}, {agent-5} (+17 more)
   └─ tasks: {task-1}, {task-2}, {task-3} (+55 more)
   └─ workflows: {workflow-1}, {workflow-2} (+9 more)
   └─ checklists: {checklist-1}, {checklist-2} (+15 more)
```

### JSON (com `--format json`)

```json
{
  "metadata": {
    "scan_date": "2026-02-01T15:30:00",
    "generated_by": "squad-analytics.py"
  },
  "squads": [
    {
      "name": "copy",
      "domain": "copywriting",
      "counts": {
        "agents": 22,
        "tasks": 58,
        "workflows": 11,
        "templates": 23,
        "checklists": 17,
        "data": 3,
        "scripts": 3
      },
      "total": 137,
      "quality_score": "⭐⭐⭐"
    }
  ],
  "totals": {
    "squads": 21,
    "agents": 127,
    "tasks": 293,
    "total_components": 948
  }
}
```

---

## Casos de Uso

### 1. Visão Geral do Ecossistema

```bash
*squad-analytics
```

Use para: Entender o tamanho e composição do ecossistema.

### 2. Identificar Squads Incompletos

```bash
*squad-analytics --sort-by total
```

Squads no final da lista (🔨 ou ⭐) precisam de mais desenvolvimento.

### 3. Encontrar Squads com Mais Tasks

```bash
*squad-analytics --sort-by tasks
```

Útil para identificar squads mais operacionais.

### 4. Exportar para Análise Externa

```bash
*squad-analytics --format json > ecosystem-report.json
```

### 5. Auditoria Detalhada de Componentes

```bash
*squad-analytics --detailed
```

Mostra nomes dos componentes para verificar o que cada squad contém.

---

## Integração com Outros Comandos

| Comando | Relação |
|---------|---------|
| `*show-registry` | Mostra metadados (domain, keywords, highlights) |
| `*squad-analytics` | Mostra contagens detalhadas de componentes |
| `*refresh-registry` | Atualiza o registry com novos squads |
| `*validate-squad {name}` | Valida qualidade de um squad específico |

---

## Script Location

```
squads/squad-creator/scripts/squad-analytics.py
```

**Dependências:** Python 3.8+ (usa apenas standard library)

---

## Troubleshooting

### "Could not find squads/ directory"

Execute a partir da raiz do projeto:
```bash
cd ${PROJECT_ROOT}
python3 squads/squad-creator/scripts/squad-analytics.py
```

### Contagens diferentes do esperado

O script exclui automaticamente:
- `README.md` e `template.md` das contagens
- Diretórios: `.DS_Store`, `__pycache__`, `node_modules`, `.git`
- Squads sem `config.yaml` E sem pasta `agents/`

---

## Changelog

### v1.0.0 (2026-02-01)
- Initial release
- Table, JSON output formats
- Quality indicators
- Detailed view with component names
- Sort by name, agents, tasks, total
