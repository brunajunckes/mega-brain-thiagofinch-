---
task: diagnoseWebChallenge()
responsavel: "@webcraft-chief"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: user_message
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: routing_catalog
    tipo: string
    origem: data/routing-catalog.yaml
    obrigatorio: true

Saida:
  - campo: diagnosis
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] User intent parsed and categorized"
  - "[ ] Web dimensions identified"
  - "[ ] Cross-cutting answer delivered to user"
  - "[ ] Confidence level assessed"
---

# Task: Diagnose & Route — WebCraft Squad

## Metadata

| Field         | Value                                            |
|---------------|--------------------------------------------------|
| Task ID       | `webcraft-squad:diagnose`                        |
| Command       | `@webcraft-squad` or `@webcraft-squad:webcraft-chief` |
| Orchestrator  | `webcraft-chief`                                 |
| Version       | 1.0.0                                            |
| Created       | 2026-03-17                                       |

## Purpose

Analyze the user's web challenge, provide an immediate cross-cutting answer,
and determine whether specialist routing is needed. The chief NEVER loads a specialist
agent file during diagnosis — it only identifies the best route.

## Inputs

| Input            | Source              | Required |
|------------------|---------------------|----------|
| `user_message`   | User prompt         | YES      |
| `routing_catalog` | `data/routing-catalog.yaml` | YES |
| `conversation_history` | Session context | NO       |

## Preconditions

1. User message is not empty
2. Routing catalog is loaded and accessible

## Execution Phases

### Phase 1: Parse Request

1. Extract the core question or intent from the user message
2. Identify keywords, web domains, and technical context
3. Determine the web dimension(s) involved:
   - **Analysis:** website dissection, structure, patterns, competitive
   - **Design:** creative direction, visual design, layout, typography
   - **Motion:** animation, transitions, micro-interactions, effects
   - **Tokens:** design tokens, tokenization, systematic design
   - **Performance:** speed, Core Web Vitals, optimization
   - **Accessibility:** WCAG, inclusive design, assistive technology
   - **SEO:** search engine optimization, rankings, structured data
   - **GEO:** AI search visibility, LLM optimization, citability
4. Determine if multi-dimensional routing is needed

### Phase 2: Match Routing Catalog

1. Load `data/routing-catalog.yaml`
2. Match extracted keywords against domain keyword lists
3. Score each domain by keyword overlap and contextual relevance
4. Identify `primary_agent` and `secondary_agent` for the top-scoring domain
5. If multiple domains score equally, use dimension priority:
   - Analysis questions: prefer vitaly-friedman
   - Design questions: prefer tobias-van-schneider
   - Motion questions: prefer val-head
   - Token questions: prefer jina-anne
   - Performance questions: prefer addy-osmani
   - Accessibility questions: prefer heydon-pickering
   - SEO questions: prefer lily-ray
   - GEO questions: prefer fabrice-canel
   - Multi-dimensional: stay with webcraft-chief, orchestrate workflow

### Phase 3: Cross-Cutting Answer

**MANDATORY — Always execute this phase before any routing.**

1. Provide an immediate, useful answer to the user's question
2. The answer should be actionable and demonstrate web domain competence
3. Include relevant context: methodologies, tools, or web standards applicable
4. Reference the applicable framework or methodology by name
5. This answer must stand alone — even if the user never follows the routing suggestion

### Phase 4: Confidence Assessment

Assess routing confidence:

| Level  | Criteria                                      | Action                        |
|--------|-----------------------------------------------|-------------------------------|
| HIGH   | Clear keyword match, single domain, unambiguous | Route to primary specialist  |
| MEDIUM | Multiple domains match, slight ambiguity       | Suggest primary + secondary   |
| LOW    | No clear match, vague request, cross-domain    | Stay with chief, ask clarifying questions |

## Output Format

```yaml
diagnosis:
  intent: "{parsed user intent}"
  web_dimensions: ["dimension1", "dimension2"]
  matched_domain: "{domain from routing catalog}"
  confidence: "HIGH | MEDIUM | LOW"
  primary_agent: "{agent-id}"
  secondary_agent: "{agent-id}"
  cross_cutting_answer: |
    {The immediate answer provided to the user}
  routing_suggestion: |
    {Why this specialist was chosen and what they can add}
  workflow_suggestion: "{wf-id if multi-dimensional}"
```

## Veto Conditions

- **NEVER** route without providing a cross-cutting answer first
- **NEVER** route when confidence is LOW — stay with chief and ask clarifying questions
- **NEVER** load a specialist agent file during diagnosis — only identify the route
- **NEVER** default to a single agent for every question — match the actual web dimension
- **NEVER** ignore multi-dimensional requests — suggest a workflow when 3+ dimensions are involved

## Completion Criteria

- [ ] User intent parsed and categorized
- [ ] Web dimension(s) identified
- [ ] Routing catalog consulted and domain matched
- [ ] Cross-cutting answer delivered to user
- [ ] Confidence level assessed
- [ ] Routing suggestion provided (if confidence >= MEDIUM)
- [ ] Workflow suggestion provided (if multi-dimensional)
- [ ] No specialist agent files loaded during diagnosis
