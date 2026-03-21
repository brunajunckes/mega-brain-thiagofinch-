---
task: reviewDeliverables()
responsavel: "@webcraft-chief"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: specialist_reports
    tipo: array
    origem: Phase Outputs
    obrigatorio: true

Saida:
  - campo: final_report
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] All specialist reports collected"
  - "[ ] Cross-dimensional conflicts resolved"
  - "[ ] Multi-dimensional scorecard created"
  - "[ ] Priority matrix generated"
  - "[ ] Phased roadmap documented"
---

# Task: Review & Synthesize — Final Quality Gate

## Metadata

| Field         | Value                      |
|---------------|----------------------------|
| Task ID       | `webcraft-squad:review`     |
| Command       | `*review`                  |
| Orchestrator  | `webcraft-chief`           |
| Version       | 1.0.0                      |
| Created       | 2026-03-17                  |

## Purpose

Final quality gate that synthesizes all specialist outputs into a cohesive,
multi-dimensional report. Resolves cross-dimensional conflicts, creates a
unified scorecard, and produces a prioritized, phased roadmap.

## Execution Phases

### Phase 1: Collect & Validate Reports

1. Verify all specialist reports are present
2. Check for completeness of each report
3. Flag any missing dimensions as "NOT ASSESSED"

### Phase 2: Cross-Dimensional Conflict Resolution

1. Identify conflicts between specialists:
   - Performance vs. Design (heavy visuals vs. speed)
   - Animation vs. Performance (motion vs. loading)
   - SEO vs. UX (content for crawlers vs. users)
   - Accessibility vs. Design (contrast requirements vs. palette)
2. Resolve conflicts with priority hierarchy:
   - Accessibility > Performance > SEO/GEO > Design > Animation
   - Document trade-offs and justifications

### Phase 3: Multi-Dimensional Scorecard

Create unified scoring across all dimensions (0-100 each):

| Dimension | Score | Rating | Agent |
|-----------|-------|--------|-------|
| Structure & Patterns | — | — | vitaly-friedman |
| Visual Design | — | — | tobias-van-schneider |
| Animation & Motion | — | — | val-head |
| Design Tokens | — | — | jina-anne |
| Performance | — | — | addy-osmani |
| Accessibility | — | — | heydon-pickering |
| SEO | — | — | lily-ray |
| GEO | — | — | fabrice-canel |
| **Overall** | — | — | **weighted average** |

Weights: Performance 20%, Accessibility 20%, SEO 15%, GEO 10%, Design 15%, Tokens 10%, Motion 5%, Structure 5%

### Phase 4: Priority Matrix

Plot all findings on impact vs. effort matrix:
- **Quick Wins:** High impact, low effort → Do first
- **Strategic:** High impact, high effort → Plan for
- **Fill-ins:** Low impact, low effort → Do when convenient
- **Deprioritize:** Low impact, high effort → Skip or defer

### Phase 5: Phased Roadmap

Create implementation roadmap:
1. **Immediate (Week 1-2):** Critical fixes, quick wins
2. **Short-term (Month 1):** High-impact improvements
3. **Medium-term (Quarter 1):** Strategic enhancements
4. **Long-term (Quarter 2+):** Aspirational goals

### Phase 6: Executive Summary

1. One-paragraph overall assessment
2. Top 3 strengths
3. Top 3 critical issues
4. Key recommendation
5. Expected impact of implementing roadmap

## Veto Conditions

- **NEVER** synthesize without all critical reports (performance, accessibility, SEO at minimum)
- **NEVER** hide conflicts between dimensions — transparency is essential
- **NEVER** create a roadmap without clear priorities — everything can't be "urgent"

## Completion Criteria

- [ ] All specialist reports collected and validated
- [ ] Cross-dimensional conflicts identified and resolved
- [ ] Multi-dimensional scorecard created with weighted scoring
- [ ] Priority matrix generated (impact vs effort)
- [ ] Phased roadmap with clear timelines
- [ ] Executive summary with top findings and key recommendation
