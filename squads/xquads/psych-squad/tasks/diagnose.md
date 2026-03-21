---
task: diagnose()
responsavel: "@psych-chief"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: query
    tipo: string
    origem: User Input
    obrigatorio: true

Saida:
  - campo: diagnosis
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Caso analisado com classificacao de dominio"
  - "[ ] Resposta rapida fornecida"
  - "[ ] Roteamento executado ou resposta direta"
---

# Task: Diagnose — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `psych-squad:diagnose` |
| Command | `*diagnose "{caso}"` |
| Orchestrator | `psych-chief` |
| Purpose | Analisar o caso clinico, fornecer orientacao inicial e rotear ao melhor especialista |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `query` | User prompt | Sim | Descricao do caso ou questao clinica |
| `context` | Session | Nao | Contexto previo da conversa |
| `domain_hint` | User/Auto | Nao | Dominio sugerido (psicanalise, tcc, etc.) |

## Preconditions

- Routing catalog carregado (`data/routing-catalog.yaml`)
- Pelo menos um agente especialista disponivel

## Phases

### Phase 1: Analise do Caso (psych-chief)

1. Ler a descricao do caso e extrair:
   - **Queixa principal**: O que o paciente apresenta
   - **Demanda clinica**: O que o profissional precisa
   - **Dominio keywords**: Match contra routing catalog
   - **Complexidade**: Simples (resposta direta) vs Complexo (precisa de especialista)

2. Classificar o tipo de demanda:
   - `avaliacao` — Precisa de avaliacao diagnostica
   - `intervencao` — Precisa de estrategia de intervencao
   - `compreensao` — Precisa de compreensao do caso
   - `abordagem` — Precisa de orientacao sobre abordagem com paciente
   - `transcricao` — Precisa de analise de transcricao de sessao

### Phase 2: Match de Routing

1. Consultar `data/routing-catalog.yaml`
2. Pontuar cada dominio contra keywords extraidas
3. Identificar:
   - **Agente primario**: Melhor match
   - **Agente secundario**: Perspectiva complementar
   - **Confianca**: ALTA (>= 3 keywords), MEDIA (2), BAIXA (0-1)

4. Guia de selecao:
   | Area do Problema | Agente Primario | Agente Secundario |
   |-----------------|-----------------|-------------------|
   | Inconsciente/defesas | sigmund-freud | jacques-lacan |
   | Estrutura do sujeito | jacques-lacan | sigmund-freud |
   | Arquetipos/individuacao | carl-jung | irvin-yalom |
   | Cognicao/pensamentos | aaron-beck | daniel-kahneman |
   | Relacao terapeutica | carl-rogers | irvin-yalom |
   | Existencial/sentido | irvin-yalom | carl-jung |
   | Vieses/decisao | daniel-kahneman | aaron-beck |
   | Trauma/adicao | gabor-mate | marsha-linehan |
   | Regulacao emocional | marsha-linehan | carl-rogers |

### Phase 3: Resposta Inicial

1. **Sempre fornecer orientacao rapida primeiro** — 3-5 sentencas
2. Incluir:
   - Resposta direta ao caso
   - Qual framework e mais relevante
   - Que valor o especialista traria

### Phase 4: Routing

1. Se confianca ALTA ou MEDIA:
   - Anunciar alvo: "Roteando para @{agent} para analise aprofundada"
   - Passar contexto: caso + intent + classificacao
2. Se confianca BAIXA:
   - Responder diretamente como psych-chief
   - Oferecer escolha de especialistas

## Output Format

```yaml
diagnosis:
  caso_summary: "{resumo em 1 linha}"
  demanda: "{avaliacao|intervencao|compreensao|abordagem|transcricao}"
  dominio: "{psicanalise|tcc|humanista|existencial|comportamental|trauma|regulacao}"
  orientacao_rapida: |
    {3-5 sentencas de orientacao}
  routing:
    confianca: "{ALTA|MEDIA|BAIXA}"
    agente_primario: "{agent-id}"
    agente_secundario: "{agent-id}"
    razao: "{por que este especialista}"
  roteado: {true|false}
```

## Veto Rules

1. **NUNCA rotear sem fornecer orientacao rapida primeiro**
2. **NUNCA rotear com confianca BAIXA** — responder diretamente
3. **NUNCA rotear para mais de um agente simultaneamente**
4. **NUNCA fornecer diagnostico clinico definitivo** — o squad orienta, nao diagnostica
5. **NUNCA ignorar questoes eticas ou de seguranca do paciente**

## Completion Criteria

- [ ] Caso analisado com identificacao de demanda e dominio
- [ ] Routing catalog consultado e confianca pontuada
- [ ] Orientacao rapida fornecida (obrigatoria, independente do routing)
- [ ] Roteamento executado se confianca >= MEDIA, ou resposta direta se BAIXA
- [ ] Output segue o schema definido
