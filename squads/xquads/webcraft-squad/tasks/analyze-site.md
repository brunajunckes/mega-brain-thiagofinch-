---
task: analyzeSite()
responsavel: "@vitaly-friedman"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: site_url
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: analysis_scope
    tipo: string
    origem: User Input
    obrigatorio: false

Saida:
  - campo: structure_analysis
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] Tech stack identified"
  - "[ ] Layout patterns documented"
  - "[ ] Component inventory completed"
  - "[ ] Navigation architecture mapped"
  - "[ ] Responsive strategy assessed"
---

# Task: Analyze Website Structure & Patterns

## Metadata

| Field         | Value                           |
|---------------|---------------------------------|
| Task ID       | `webcraft-squad:analyze-site`   |
| Command       | `*analyze-site {url}`           |
| Orchestrator  | `vitaly-friedman`               |
| Version       | 1.0.0                          |
| Created       | 2026-03-17                      |

## Purpose

Deep structural analysis of a website — reverse-engineering the tech stack, layout patterns,
component architecture, navigation, responsive strategy, and design decisions. Produces
a comprehensive map that serves as foundation for all other specialist analyses.

## Inputs

| Input            | Source       | Required | Default        |
|------------------|-------------|----------|----------------|
| `site_url`       | User prompt  | YES      | —              |
| `analysis_scope` | User prompt  | NO       | "full"         |
| `competitor_urls`| User prompt  | NO       | —              |

## Preconditions

1. Valid URL provided
2. Site is accessible (not behind auth wall, or credentials provided)

## Execution Phases

### Phase 1: Tech Stack Discovery

1. Identify frontend framework/library (React, Vue, Next.js, Nuxt, Astro, etc.)
2. Identify CSS approach (Tailwind, CSS Modules, Styled Components, vanilla, etc.)
3. Identify build tools (Vite, Webpack, Turbopack, etc.)
4. Identify CMS/backend (WordPress, Contentful, Sanity, custom, etc.)
5. Identify hosting/CDN (Vercel, Netlify, Cloudflare, AWS, etc.)
6. Identify analytics and tracking tools
7. Document third-party dependencies and their versions

### Phase 2: Layout Pattern Analysis

1. Identify the grid system (CSS Grid, Flexbox, custom)
2. Map page templates and their layouts
3. Document spacing system (consistent or ad-hoc?)
4. Identify container/max-width strategy
5. Assess visual rhythm and vertical spacing patterns
6. Document z-index layering strategy

### Phase 3: Component Inventory

1. Catalog all unique UI components
2. Classify by complexity (atomic → molecular → organism)
3. Identify component variants and states
4. Document reuse patterns (which components appear on multiple pages?)
5. Identify inconsistencies (same component, different implementations)
6. Note component quality (well-built vs. fragile)

### Phase 4: Navigation Architecture

1. Map primary navigation structure
2. Map secondary/utility navigation
3. Document mobile navigation pattern (hamburger, bottom nav, etc.)
4. Assess information architecture depth
5. Evaluate breadcrumb strategy
6. Check for sitemap and navigation accessibility

### Phase 5: Responsive Strategy

1. Identify breakpoints used
2. Assess mobile-first vs desktop-first approach
3. Document responsive patterns (reflow, reorder, hide, adapt)
4. Test critical breakpoints for layout breaks
5. Evaluate touch target sizes on mobile
6. Check for responsive images (srcset, picture element)

### Phase 6: Design Decision Analysis

1. Assess overall design quality and cohesion
2. Identify design system presence (or lack thereof)
3. Document typography hierarchy and font choices
4. Map color usage patterns
5. Evaluate whitespace utilization
6. Note any innovative or unique patterns worth highlighting

## Output Format

```yaml
structure_analysis:
  url: "{analyzed URL}"
  date: "{analysis date}"
  tech_stack:
    frontend: "{framework}"
    css: "{approach}"
    build: "{tool}"
    cms: "{platform}"
    hosting: "{provider}"
    analytics: ["{tool1}", "{tool2}"]
  layout:
    grid_system: "{type}"
    max_width: "{value}"
    spacing_system: "systematic | ad-hoc"
    templates_count: {number}
  components:
    total_unique: {number}
    atoms: {number}
    molecules: {number}
    organisms: {number}
    reuse_score: "high | medium | low"
    inconsistencies: [{description}]
  navigation:
    primary_pattern: "{type}"
    mobile_pattern: "{type}"
    ia_depth: {levels}
    breadcrumbs: true|false
  responsive:
    approach: "mobile-first | desktop-first"
    breakpoints: ["{bp1}", "{bp2}"]
    quality: "excellent | good | adequate | poor"
  assessment:
    design_quality: "1-10 score"
    design_system_present: true|false
    unique_patterns: [{description}]
    improvement_areas: [{description}]
```

## Veto Conditions

- **NEVER** assess design quality without fully analyzing structure first
- **NEVER** assume tech stack from visual appearance alone — verify with source inspection
- **NEVER** skip mobile analysis — responsive strategy is critical
- **NEVER** report without documenting inconsistencies — they are the most valuable finding

## Completion Criteria

- [ ] Tech stack fully identified and verified
- [ ] Layout patterns documented with grid system
- [ ] Component inventory complete with classification
- [ ] Navigation architecture mapped at all levels
- [ ] Responsive strategy assessed across breakpoints
- [ ] Design decisions analyzed with quality assessment
- [ ] Inconsistencies documented
- [ ] Improvement areas identified
