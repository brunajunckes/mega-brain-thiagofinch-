---
task: auditAccessibility()
responsavel: "@heydon-pickering"
responsavel_type: Agent
atomic_layer: Task
elicit: false

Entrada:
  - campo: site_url
    tipo: string
    origem: User Input
    obrigatorio: true

Saida:
  - campo: accessibility_report
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] WCAG conformance level assessed"
  - "[ ] Semantic HTML evaluated"
  - "[ ] Keyboard navigation tested"
  - "[ ] Screen reader compatibility checked"
  - "[ ] Color contrast verified"
  - "[ ] Remediation plan created"
---

# Task: Audit Accessibility — WCAG 2.2 Compliance

## Metadata

| Field         | Value                                |
|---------------|--------------------------------------|
| Task ID       | `webcraft-squad:audit-accessibility` |
| Command       | `*audit-a11y {url}`                  |
| Orchestrator  | `heydon-pickering`                   |
| Version       | 1.0.0                               |
| Created       | 2026-03-17                           |

## Purpose

Comprehensive accessibility audit against WCAG 2.2 guidelines. Evaluates semantic HTML,
keyboard navigation, screen reader compatibility, color contrast, focus management,
and inclusive design patterns. Produces actionable remediation plan.

## Execution Phases

### Phase 1: Automated Scan

1. Run automated accessibility testing (axe-core rules)
2. Catalog all violations by severity (critical, serious, moderate, minor)
3. Identify false positives and manual review needs
4. Generate baseline violation count

### Phase 2: Semantic HTML Audit

1. Check heading hierarchy (h1 → h2 → h3, no skips)
2. Verify landmark regions (main, nav, header, footer, aside)
3. Check list usage (ul/ol for lists, not divs)
4. Verify table structure (thead, th, scope, caption)
5. Check form labels and fieldsets
6. Assess overall semantic quality vs. "div soup"

### Phase 3: Keyboard Navigation

1. Test tab order (logical, follows visual order)
2. Check focus indicators (visible, sufficient contrast)
3. Test all interactive elements via keyboard
4. Check for keyboard traps
5. Test skip links presence and functionality
6. Verify custom widget keyboard patterns (e.g., arrow keys in tabs)

### Phase 4: Screen Reader Compatibility

1. Check ARIA usage (correct roles, states, properties)
2. Verify ARIA is NOT overused (semantic HTML first)
3. Check image alt text quality (descriptive, not redundant)
4. Test dynamic content announcements (live regions)
5. Check form error handling and announcements
6. Verify modal/dialog focus management

### Phase 5: Visual Accessibility

1. Check color contrast ratios (WCAG AA: 4.5:1 normal, 3:1 large)
2. Check focus indicator contrast (WCAG 2.2: 3:1)
3. Verify information not conveyed by color alone
4. Check text resizing up to 200% without loss
5. Test with reduced motion preference
6. Check touch target sizes (minimum 24x24px, target 44x44px)

### Phase 6: Content & Media

1. Check video captions and transcripts
2. Check audio descriptions
3. Verify link text is descriptive (not "click here")
4. Check for content that flashes (seizure risk)
5. Verify timeout controls if applicable
6. Check language attributes (html lang, lang on foreign text)

## Output Format

```yaml
accessibility_report:
  url: "{analyzed URL}"
  date: "{analysis date}"
  wcag_level: "A | AA | AAA | Non-conformant"
  overall_score: "{0-100}"
  violations:
    critical: [{rule, element, description, wcag_criterion, fix}]
    serious: [{rule, element, description, wcag_criterion, fix}]
    moderate: [{rule, element, description, wcag_criterion, fix}]
    minor: [{rule, element, description, wcag_criterion, fix}]
  semantic_html:
    heading_hierarchy: "correct | broken"
    landmarks: "present | missing | incomplete"
    semantic_quality: "high | medium | low"
  keyboard:
    tab_order: "logical | broken"
    focus_indicators: "visible | missing | insufficient"
    keyboard_traps: [{location, description}]
    skip_links: "present | missing"
  screen_reader:
    aria_quality: "good | overused | missing"
    alt_text_quality: "descriptive | generic | missing"
    live_regions: "correct | missing | broken"
  visual:
    contrast_pass_rate: "{%}"
    contrast_failures: [{element, ratio, required}]
    reduced_motion: "supported | not-supported"
    touch_targets: "adequate | too-small"
  remediation_plan:
    immediate: [{issue, fix, wcag_criterion, effort}]
    short_term: [{issue, fix, wcag_criterion, effort}]
    long_term: [{issue, fix, wcag_criterion, effort}]
```

## Veto Conditions

- **NEVER** rely solely on automated tools — manual testing is essential
- **NEVER** dismiss minor violations — they compound into poor UX
- **NEVER** recommend ARIA as first solution — semantic HTML first, ARIA as enhancement
- **NEVER** skip keyboard testing — it's the foundation of accessibility
- **NEVER** report without a remediation plan — problems without solutions are useless

## Completion Criteria

- [ ] Automated scan completed
- [ ] Semantic HTML manually audited
- [ ] Keyboard navigation tested end-to-end
- [ ] Screen reader compatibility checked
- [ ] Color contrast verified for all text
- [ ] Touch targets measured
- [ ] WCAG conformance level determined
- [ ] Prioritized remediation plan created
