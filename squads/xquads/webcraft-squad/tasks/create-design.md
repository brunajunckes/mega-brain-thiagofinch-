---
task: createDesign()
responsavel: "@tobias-van-schneider"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: design_brief
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: research_foundation
    tipo: dict
    origem: Phase Output
    obrigatorio: false

Saida:
  - campo: creative_direction
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] Mood board defined"
  - "[ ] Color palette created"
  - "[ ] Typography system selected"
  - "[ ] Spacing system defined"
  - "[ ] Visual hierarchy established"
  - "[ ] Originality verified — NOT generic AI template"
---

# Task: Create Design — Creative Direction & Visual Concept

## Metadata

| Field         | Value                           |
|---------------|---------------------------------|
| Task ID       | `webcraft-squad:create-design`  |
| Command       | `*create-design`                |
| Orchestrator  | `tobias-van-schneider`          |
| Version       | 1.0.0                          |
| Created       | 2026-03-17                      |

## Purpose

Create an original, bold visual direction for a web design project. The design MUST be
distinctive and NOT look like generic AI-generated templates. Focus on art direction,
typography, color, spacing, and visual hierarchy that creates a unique identity.

## NON-NEGOTIABLE: Anti-Generic Design

This task exists because most AI-generated designs look identical. Every design produced
by this task MUST pass the "would a human designer be proud of this?" test.

**Anti-patterns to AVOID:**
- Generic gradient hero sections with stock-looking illustrations
- Predictable card grids with rounded corners and drop shadows
- Safe, boring color palettes (blue + gray + white)
- System fonts with no typographic personality
- Cookie-cutter spacing with no visual rhythm
- "Clean and modern" that means "empty and forgettable"

**Patterns to EMBRACE:**
- Bold typographic choices that create identity
- Unexpected color combinations backed by theory
- Asymmetric layouts that create tension and interest
- Purposeful whitespace (not just "lots of space")
- Visual hierarchy through contrast, not just size
- Design details that reward attention (texture, subtle gradients, micro-interactions)

## Inputs

| Input              | Source          | Required |
|--------------------|----------------|----------|
| `design_brief`     | User prompt     | YES      |
| `research_foundation` | Phase 1 output | NO   |
| `brand_guidelines` | User provided   | NO       |
| `target_audience`  | User prompt     | NO       |

## Execution Phases

### Phase 1: Brief Analysis & Positioning

1. **Elicit:** Ask the user:
   - What is the product/service/brand?
   - Who is the target audience?
   - What feeling should the design evoke?
   - Any existing brand guidelines or constraints?
   - Sites they admire (for direction, not copying)?
   - What should this design absolutely NOT look like?
2. Analyze the brief for creative opportunities
3. Define the design positioning: where does this sit on the spectrum?
   - Minimal ←→ Maximal
   - Serious ←→ Playful
   - Traditional ←→ Experimental
   - Corporate ←→ Creative

### Phase 2: Mood Board & Direction

1. Define 2-3 mood board directions (not just one)
2. Each direction should include:
   - Visual references (described, not just named)
   - Color temperature and emotional range
   - Typography personality
   - Layout density and rhythm
   - Texture and depth
3. **Elicit:** Present directions and ask user to choose or combine
4. Refine chosen direction with specifics

### Phase 3: Color System

1. Create primary palette (2-3 primary colors)
2. Create secondary palette (2-3 accent colors)
3. Define neutral palette (grays, background, text)
4. Ensure contrast ratios meet WCAG AA (coordinate with heydon-pickering)
5. Define color usage rules (not just the colors, but WHEN to use each)
6. Test palette in context: light mode, dark mode, on images

### Phase 4: Typography System

1. Select heading typeface (with personality)
2. Select body typeface (with readability)
3. Define type scale (modular scale ratio)
4. Define line heights and letter spacing per size
5. Define responsive type behavior
6. Test with real content (not lorem ipsum)

### Phase 5: Spacing & Layout System

1. Define base spacing unit
2. Create spacing scale
3. Define grid system (columns, gutters, margins)
4. Define container widths and breakpoints
5. Create layout patterns for key page types
6. Define visual rhythm rules

### Phase 6: Visual Hierarchy & Identity

1. Define hierarchy through size, weight, color, and position
2. Create signature visual elements (the "wow" factor)
3. Define image treatment style (photography, illustration, abstract)
4. Define icon style and rules
5. Create border/radius/shadow system
6. Define any special effects or textures

## Output Format

```yaml
creative_direction:
  name: "{concept name}"
  positioning:
    spectrum: "{minimal-maximal scale}"
    mood: "{emotional description}"
    personality: "{3-5 adjectives}"
  color:
    primary: [{hex, name, usage}]
    secondary: [{hex, name, usage}]
    neutral: [{hex, name, usage}]
    dark_mode: true|false
  typography:
    heading: "{font family, weight, style}"
    body: "{font family, weight, style}"
    scale_ratio: "{ratio}"
    sizes: [{name, size, line_height, letter_spacing}]
  spacing:
    base_unit: "{value}"
    scale: [{name, value}]
    grid_columns: {number}
    gutter: "{value}"
    max_width: "{value}"
  visual_identity:
    signature_elements: [{description}]
    image_treatment: "{style}"
    icon_style: "{style}"
    border_radius: "{strategy}"
    shadows: "{strategy}"
    textures: [{description}]
  originality_check:
    unique_elements: [{what makes this design distinctive}]
    anti_generic_score: "1-10"
    differentiation_from: [{competitor, how_different}]
```

## Veto Conditions

- **NEVER** produce a design that looks like a generic AI template
- **NEVER** use safe/boring color palettes without creative justification
- **NEVER** skip the brief analysis — understanding context is everything
- **NEVER** present only one direction — always offer choices
- **NEVER** use lorem ipsum for typography testing — use real representative content
- **NEVER** ignore brand guidelines if provided — push boundaries within them

## Completion Criteria

- [ ] Brief analyzed and positioning defined
- [ ] 2-3 mood board directions presented
- [ ] User-approved direction refined
- [ ] Color system with contrast validation
- [ ] Typography system with type scale
- [ ] Spacing and layout system defined
- [ ] Visual hierarchy and identity elements created
- [ ] Originality verified — design is distinctive and memorable
