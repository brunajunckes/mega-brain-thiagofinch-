# Psych Squad — Base de Conhecimento (References)

Sistema de enriquecimento de conhecimento dos agentes do Psych Squad.

## Como Funciona

Cada especialista tem uma pasta onde voce pode depositar materiais de referencia. Quando um agente e ativado ou uma task e executada, o sistema consulta o catalogo de referencias para enriquecer a analise com conhecimento especifico.

## Estrutura

```
data/references/
├── README.md                    # Este arquivo
├── catalog.yaml                 # Indice geral de todas as referencias
├── sigmund-freud/               # Obras e artigos de Freud
├── carl-jung/                   # Obras e artigos de Jung
├── jacques-lacan/               # Seminarios e escritos de Lacan
├── aaron-beck/                  # Artigos e manuais de TCC
├── carl-rogers/                 # Obras de Rogers
├── irvin-yalom/                 # Obras de Yalom
├── daniel-kahneman/             # Artigos e pesquisas de Kahneman
├── gabor-mate/                  # Obras de Mate
├── marsha-linehan/              # Manuais e protocolos DBT
└── general/                     # Material transversal (DSM, CID, protocolos)
```

## Formatos Aceitos

| Formato | Extensao | Uso Recomendado |
|---------|----------|-----------------|
| Markdown | `.md` | Resumos, fichamentos, notas de leitura |
| PDF | `.pdf` | Artigos academicos, capitulos de livros |
| YAML | `.yaml` | Frameworks estruturados, protocolos |
| Texto | `.txt` | Transcricoes, citacoes, trechos |

## Como Adicionar Material

### 1. Material Bruto (PDFs, artigos)
Coloque o arquivo na pasta do especialista correspondente:
```
data/references/aaron-beck/cognitive-therapy-depression-1979.pdf
```

### 2. Fichamento Estruturado (Recomendado)
Crie um arquivo `.md` com o formato padrao:
```markdown
---
title: "Titulo da Obra"
author: "Autor"
year: 1979
type: livro | artigo | capitulo | manual | protocolo
specialist: aaron-beck
tags: [tcc, depressao, distorcoes-cognitivas]
relevance: alta | media | baixa
---

## Conceitos-Chave
- Conceito 1: descricao
- Conceito 2: descricao

## Aplicacao Clinica
Como o material se aplica na pratica

## Citacoes Relevantes
> "Citacao importante" (p. XX)

## Conexoes com Outros Especialistas
- Relacao com framework de outro autor
```

### 3. Protocolo Clinico (YAML)
```yaml
protocol:
  name: "Nome do Protocolo"
  specialist: marsha-linehan
  source: "DBT Skills Training Manual, 2015"
  steps:
    - step: 1
      name: "Nome do passo"
      description: "Descricao detalhada"
      techniques: ["tecnica1", "tecnica2"]
```

## Como o Squad Usa as Referencias

1. **Na triagem (`*diagnose`):** O psych-chief consulta o catalogo para identificar material relevante ao caso
2. **Na analise especializada:** Cada agente pode citar e aplicar material da sua pasta
3. **Na analise de transcricao (`*analyze-transcript`):** Referencias enriquecem a identificacao de padroes
4. **Na revisao (`*review`):** Checagem contra literatura de referencia

## Catalogo (catalog.yaml)

O arquivo `catalog.yaml` indexa todo o material disponivel. Atualize-o sempre que adicionar novo material usando o comando `*update-references`.

## Prioridade de Material

| Prioridade | Tipo | Exemplo |
|-----------|------|---------|
| 1 (mais alta) | Protocolos clinicos estruturados | Manual DBT, Protocolo TCC |
| 2 | Fichamentos de obras fundamentais | Interpretacao dos Sonhos (fichamento) |
| 3 | Artigos academicos recentes | Meta-analises, RCTs |
| 4 | Material bruto (PDFs sem fichamento) | Livro em PDF |
| 5 | Notas e resumos informais | Anotacoes de aula |
