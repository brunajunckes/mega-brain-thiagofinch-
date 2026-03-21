---
task: tokenizeDesign()
responsavel: "@jina-anne"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: creative_direction
    tipo: dict
    origem: Phase Output | User Input
    obrigatorio: true
  - campo: motion_strategy
    tipo: dict
    origem: Phase Output
    obrigatorio: false

Saida:
  - campo: token_architecture
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] Primitive tokens defined"
  - "[ ] Semantic tokens mapped"
  - "[ ] Component tokens created"
  - "[ ] Motion tokens included"
  - "[ ] Naming convention documented"
  - "[ ] Multi-brand support considered"
---

# Task: Tokenize Design — Design Token Architecture

## Metadata

| Field         | Value                              |
|---------------|------------------------------------|
| Task ID       | `webcraft-squad:tokenize-design`   |
| Command       | `*tokenize {name}`                 |
| Orchestrator  | `jina-anne`                        |
| Version       | 1.0.0                             |
| Created       | 2026-03-17                         |

## Purpose

Transform visual design decisions into a complete, systematic design token architecture.
Tokens are the single source of truth for design values — decoupling design decisions
from implementation details, enabling multi-brand, multi-platform, and theme support.

## Inputs

| Input              | Source          | Required |
|--------------------|----------------|----------|
| `creative_direction`| Phase 2 output | YES     |
| `motion_strategy`   | Phase 3 output | NO      |
| `existing_tokens`   | User provided  | NO      |
| `target_platforms`  | User prompt    | NO      |

## Execution Phases

### Phase 1: Audit & Inventory

1. Collect ALL design values from creative direction:
   - Colors (every hex/rgb/hsl value)
   - Typography (families, sizes, weights, line-heights, letter-spacing)
   - Spacing (all spacing values used)
   - Breakpoints
   - Border radius values
   - Shadow values
   - Z-index values
2. Collect motion values if available:
   - Duration values
   - Easing functions
   - Delay patterns
3. If existing tokens provided, audit current state:
   - Naming convention analysis
   - Completeness assessment
   - Inconsistency identification

### Phase 2: Token Architecture Design

1. Define the token hierarchy:
   - **Primitive (Global):** Raw values with no semantic meaning
   - **Semantic (Alias):** Purpose-driven mappings
   - **Component:** Component-specific tokens (use sparingly)
2. Define naming convention:
   - Format: `{category}-{property}-{variant}-{state}`
   - Example: `color-text-primary`, `spacing-layout-gap-lg`
3. **Elicit:** Present naming convention and hierarchy to user for approval
4. Define theme structure:
   - Light mode tokens
   - Dark mode tokens
   - High contrast mode tokens (accessibility)

### Phase 3: Primitive Tokens

Create the raw value layer:

```
color-primitive-blue-50: #eff6ff
color-primitive-blue-100: #dbeafe
...
font-family-heading: "Inter"
font-family-body: "Source Sans Pro"
font-size-100: 0.75rem
font-size-200: 0.875rem
...
spacing-100: 0.25rem
spacing-200: 0.5rem
...
radius-sm: 0.25rem
radius-md: 0.5rem
...
duration-fast: 150ms
duration-normal: 300ms
duration-slow: 500ms
easing-default: cubic-bezier(0.4, 0, 0.2, 1)
...
```

### Phase 4: Semantic Tokens

Map primitives to purpose:

```
color-text-primary: {ref: color-primitive-gray-900}
color-text-secondary: {ref: color-primitive-gray-600}
color-bg-surface: {ref: color-primitive-white}
color-bg-elevated: {ref: color-primitive-gray-50}
color-border-default: {ref: color-primitive-gray-200}
color-interactive-primary: {ref: color-primitive-blue-600}
color-interactive-hover: {ref: color-primitive-blue-700}
...
font-heading-xl: {family: heading, size: 800, weight: bold, line-height: tight}
font-body-md: {family: body, size: 300, weight: regular, line-height: normal}
...
spacing-content-gap: {ref: spacing-400}
spacing-section-gap: {ref: spacing-800}
...
motion-transition-default: {duration: normal, easing: default}
motion-enter: {duration: normal, easing: ease-out}
motion-exit: {duration: fast, easing: ease-in}
```

### Phase 5: Component Tokens (Selective)

Only create component tokens when a component needs values that differ from semantic tokens:

```
button-primary-bg: {ref: color-interactive-primary}
button-primary-text: {ref: color-text-on-primary}
button-primary-radius: {ref: radius-md}
button-primary-padding-x: {ref: spacing-400}
button-primary-padding-y: {ref: spacing-200}
...
```

**WARNING:** Avoid excessive component tokens — one client had 5,000+ component-specific tokens. Keep this layer thin.

### Phase 6: Theme & Mode Configuration

1. Define light mode token values (default)
2. Define dark mode overrides
3. Define high contrast overrides (accessibility)
4. Document the theme switching strategy
5. Consider prefers-color-scheme and prefers-contrast

### Phase 7: Export & Documentation

1. Generate token files in target formats:
   - CSS Custom Properties (always)
   - JSON (for design tools)
   - SCSS variables (if needed)
   - JavaScript/TypeScript constants (if needed)
2. Generate token documentation:
   - Visual reference (color swatches, type samples)
   - Usage guidelines
   - Do/don't examples
3. Define token governance rules

## Output Format

```yaml
token_architecture:
  naming_convention: "{format description}"
  hierarchy: [primitive, semantic, component]
  themes: [light, dark, high-contrast]
  statistics:
    total_tokens: {number}
    primitive: {number}
    semantic: {number}
    component: {number}
  categories:
    color:
      primitive: [{name, value}]
      semantic: [{name, ref, purpose}]
    typography:
      primitive: [{name, value}]
      semantic: [{name, refs, purpose}]
    spacing:
      primitive: [{name, value}]
      semantic: [{name, ref, purpose}]
    motion:
      primitive: [{name, value}]
      semantic: [{name, refs, purpose}]
    radius: [{name, value}]
    shadow: [{name, value}]
    z_index: [{name, value}]
  exports:
    css: "{file path}"
    json: "{file path}"
    documentation: "{file path}"
  governance:
    who_can_add: "{rule}"
    naming_enforcement: "{how}"
    review_process: "{description}"
```

## Veto Conditions

- **NEVER** create component tokens for every component — only when semantic tokens don't suffice
- **NEVER** use ambiguous naming — token names must be self-documenting
- **NEVER** skip dark mode and high contrast — accessibility is non-negotiable
- **NEVER** hardcode values that should be tokens — systematic design requires systematic values
- **NEVER** create tokens without documentation — undocumented tokens become abandoned tokens

## Completion Criteria

- [ ] All design values inventoried from creative direction
- [ ] Token hierarchy defined (primitive → semantic → component)
- [ ] Naming convention documented and consistent
- [ ] Primitive tokens created for all categories
- [ ] Semantic tokens mapped with clear purpose
- [ ] Component tokens created sparingly and justified
- [ ] Light/dark/high-contrast themes configured
- [ ] Export files generated in required formats
- [ ] Token documentation complete with visual references
