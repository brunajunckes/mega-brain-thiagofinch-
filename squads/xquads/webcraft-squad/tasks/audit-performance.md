---
task: auditPerformance()
responsavel: "@addy-osmani"
responsavel_type: Agent
atomic_layer: Task
elicit: false

Entrada:
  - campo: site_url
    tipo: string
    origem: User Input
    obrigatorio: true

Saida:
  - campo: performance_report
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] Core Web Vitals measured"
  - "[ ] Bottlenecks identified"
  - "[ ] Image optimization assessed"
  - "[ ] Bundle analysis completed"
  - "[ ] Prioritized fixes documented"
---

# Task: Audit Performance — Core Web Vitals & Speed

## Metadata

| Field         | Value                              |
|---------------|------------------------------------|
| Task ID       | `webcraft-squad:audit-performance` |
| Command       | `*audit-performance {url}`         |
| Orchestrator  | `addy-osmani`                      |
| Version       | 1.0.0                             |
| Created       | 2026-03-17                         |

## Purpose

Comprehensive web performance audit focused on Core Web Vitals and Google's page
experience signals. Identifies bottlenecks, measures real-world performance metrics,
and provides a prioritized optimization roadmap.

## Inputs

| Input        | Source       | Required |
|-------------|-------------|----------|
| `site_url`  | User prompt  | YES      |
| `pages`     | User prompt  | NO       |
| `budget`    | User prompt  | NO       |

## Execution Phases

### Phase 1: Core Web Vitals Assessment

Measure the three Core Web Vitals:

1. **LCP (Largest Contentful Paint)** — Loading performance
   - Target: ≤ 2.5s (Good), ≤ 4.0s (Needs Improvement), > 4.0s (Poor)
   - Identify LCP element
   - Analyze LCP sub-parts: TTFB, resource load delay, resource load time, element render delay
2. **INP (Interaction to Next Paint)** — Interactivity
   - Target: ≤ 200ms (Good), ≤ 500ms (Needs Improvement), > 500ms (Poor)
   - Identify slow interactions
   - Analyze main thread blocking
3. **CLS (Cumulative Layout Shift)** — Visual stability
   - Target: ≤ 0.1 (Good), ≤ 0.25 (Needs Improvement), > 0.25 (Poor)
   - Identify layout shift sources
   - Document missing dimension attributes

### Phase 2: Loading Strategy Analysis

1. Analyze critical rendering path
2. Identify render-blocking resources (CSS, JS)
3. Assess preload/prefetch strategy
4. Check for proper resource hints (preconnect, dns-prefetch)
5. Evaluate code splitting implementation
6. Check service worker presence and caching strategy

### Phase 3: Image Optimization

1. Identify unoptimized images (format, size, compression)
2. Check for modern formats (WebP, AVIF)
3. Verify responsive images (srcset, sizes, picture)
4. Assess lazy loading implementation
5. Check image CDN usage
6. Calculate potential savings from image optimization

### Phase 4: JavaScript Analysis

1. Analyze total JavaScript payload
2. Identify unused JavaScript (code coverage)
3. Check for main thread blocking scripts
4. Assess third-party script impact
5. Evaluate tree-shaking effectiveness
6. Check for proper async/defer attributes

### Phase 5: CSS Analysis

1. Analyze total CSS payload
2. Identify unused CSS
3. Check for critical CSS extraction
4. Assess CSS-in-JS performance impact (if applicable)
5. Evaluate animation performance (compositor vs main thread)
6. Check for efficient selectors

### Phase 6: Infrastructure Assessment

1. Evaluate server response time (TTFB)
2. Check CDN configuration
3. Verify HTTP/2 or HTTP/3 support
4. Check compression (Brotli/gzip)
5. Assess caching headers (Cache-Control, ETag)
6. Verify HTTPS and security headers

## Output Format

```yaml
performance_report:
  url: "{analyzed URL}"
  date: "{analysis date}"
  overall_score: "{0-100}"
  core_web_vitals:
    lcp:
      value: "{time}"
      rating: "good | needs-improvement | poor"
      element: "{LCP element}"
      bottleneck: "{primary cause}"
    inp:
      value: "{time}"
      rating: "good | needs-improvement | poor"
      slow_interactions: [{description}]
    cls:
      value: "{score}"
      rating: "good | needs-improvement | poor"
      shift_sources: [{element, contribution}]
  loading:
    ttfb: "{time}"
    render_blocking_resources: [{url, type, size}]
    preload_opportunities: [{resource, potential_saving}]
  images:
    total_size: "{size}"
    optimization_opportunities: [{image, current_size, potential_size, format_suggestion}]
    potential_savings: "{total savings}"
  javascript:
    total_size: "{size}"
    unused_percentage: "{%}"
    blocking_scripts: [{url, size}]
    third_party_impact: [{domain, size, blocking_time}]
  css:
    total_size: "{size}"
    unused_percentage: "{%}"
    critical_css: "present | missing"
  infrastructure:
    ttfb: "{time}"
    cdn: "present | missing"
    http_version: "{version}"
    compression: "{type}"
  prioritized_fixes:
    high_impact:
      - action: "{what to do}"
        metric_impact: "{which CWV and expected improvement}"
        effort: "low | medium | high"
    medium_impact:
      - action: "{what to do}"
        metric_impact: "{which CWV and expected improvement}"
        effort: "low | medium | high"
    low_impact:
      - action: "{what to do}"
        metric_impact: "{which CWV and expected improvement}"
        effort: "low | medium | high"
```

## Veto Conditions

- **NEVER** report performance without measuring actual Core Web Vitals
- **NEVER** recommend optimization without estimating impact
- **NEVER** ignore third-party script impact — it's often the biggest bottleneck
- **NEVER** skip mobile performance — Google uses mobile-first indexing

## Completion Criteria

- [ ] Core Web Vitals measured (LCP, INP, CLS)
- [ ] Loading strategy analyzed
- [ ] Image optimization opportunities identified
- [ ] JavaScript analysis completed
- [ ] CSS analysis completed
- [ ] Infrastructure assessed
- [ ] Prioritized fix list with effort/impact matrix
