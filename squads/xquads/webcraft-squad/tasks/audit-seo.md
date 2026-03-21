---
task: auditSEO()
responsavel: "@lily-ray"
responsavel_type: Agent
atomic_layer: Task
elicit: false

Entrada:
  - campo: site_url
    tipo: string
    origem: User Input
    obrigatorio: true

Saida:
  - campo: seo_report
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] Technical SEO audited"
  - "[ ] On-page optimization assessed"
  - "[ ] Structured data evaluated"
  - "[ ] E-E-A-T signals analyzed"
  - "[ ] Content quality scored"
  - "[ ] Action plan created"
---

# Task: Audit SEO — Technical, Content & E-E-A-T

## Metadata

| Field         | Value                      |
|---------------|----------------------------|
| Task ID       | `webcraft-squad:audit-seo`  |
| Command       | `*audit-seo {url}`         |
| Orchestrator  | `lily-ray`                 |
| Version       | 1.0.0                      |
| Created       | 2026-03-17                  |

## Purpose

Comprehensive SEO audit covering technical SEO, on-page optimization, structured data,
E-E-A-T signals, content quality, and indexation. Covers Google, Bing, and emerging
search landscape. Integrates with performance and accessibility data when available.

## Execution Phases

### Phase 1: Technical SEO Foundation

1. **Crawlability:**
   - Check robots.txt configuration
   - Verify XML sitemap(s) presence and quality
   - Test canonical tags implementation
   - Check for noindex/nofollow misuse
   - Assess internal linking structure and depth
2. **Indexation:**
   - Check indexed page count vs. total pages
   - Identify index bloat or thin content
   - Verify hreflang for multilingual sites
   - Check for duplicate content issues
3. **Mobile:**
   - Verify mobile-first indexing readiness
   - Check mobile usability issues
   - Test viewport configuration

### Phase 2: On-Page Optimization

1. **Title tags:** Unique, descriptive, within 60 chars
2. **Meta descriptions:** Compelling, within 160 chars, unique
3. **Heading hierarchy:** H1 presence, logical H2-H6 structure
4. **URL structure:** Clean, descriptive, no excessive parameters
5. **Image SEO:** Alt text quality, file names, image sitemaps
6. **Internal linking:** Anchor text quality, link equity distribution
7. **Content depth:** Thin pages, content quality, word count where relevant

### Phase 3: Structured Data & Rich Results

1. Audit existing schema markup (JSON-LD preferred)
2. Check for common schema types:
   - Organization/LocalBusiness
   - BreadcrumbList
   - Article/BlogPosting
   - Product (if e-commerce)
   - FAQ/HowTo
   - WebSite (sitelinks search)
3. Validate schema against Google's requirements
4. Identify rich result opportunities not yet implemented
5. Check for schema errors in Google Search Console

### Phase 4: E-E-A-T Assessment

1. **Experience:** Evidence of first-hand experience with the topic
2. **Expertise:** Author credentials, qualifications, demonstrations of knowledge
3. **Authoritativeness:** Domain reputation, backlink profile quality, brand mentions
4. **Trustworthiness:** HTTPS, contact info, privacy policy, transparent ownership
5. **YMYL assessment:** Is this content "Your Money or Your Life"? Higher E-E-A-T bar if so
6. Author pages and author schema presence

### Phase 5: Content Quality

1. Content uniqueness and originality
2. Search intent alignment (informational, transactional, navigational)
3. Content freshness and update frequency
4. Content depth vs. thin content
5. Topical authority assessment (content clusters, pillar pages)
6. AI content detection signals and quality markers

### Phase 6: Page Experience Integration

1. Integrate Core Web Vitals data (from addy-osmani if available)
2. Integrate accessibility data (from heydon-pickering if available)
3. Check HTTPS status
4. Check for intrusive interstitials
5. Mobile-friendliness assessment
6. Overall page experience signal assessment

## Output Format

```yaml
seo_report:
  url: "{analyzed URL}"
  date: "{analysis date}"
  overall_health: "{0-100}"
  technical:
    crawlability_score: "{0-100}"
    indexation_health: "{0-100}"
    mobile_readiness: "pass | fail"
    issues: [{severity, description, fix}]
  on_page:
    title_tags: "optimized | needs-work | missing"
    meta_descriptions: "optimized | needs-work | missing"
    heading_structure: "correct | broken"
    url_structure: "clean | messy"
    internal_linking: "strong | adequate | weak"
  structured_data:
    types_found: [{type, valid, errors}]
    missing_opportunities: [{type, pages, potential_impact}]
    rich_result_eligibility: [{type, status}]
  eeat:
    experience_signals: "strong | moderate | weak"
    expertise_signals: "strong | moderate | weak"
    authority_signals: "strong | moderate | weak"
    trust_signals: "strong | moderate | weak"
    overall_eeat: "high | medium | low"
    ymyl: true|false
  content:
    quality_score: "{0-100}"
    topical_authority: "established | growing | weak"
    thin_pages: [{url, issue}]
    opportunities: [{description, potential_impact}]
  page_experience:
    cwv_status: "all-good | needs-improvement | poor"
    https: true|false
    mobile_friendly: true|false
    no_intrusive_interstitials: true|false
  action_plan:
    critical: [{action, impact, effort, timeline}]
    important: [{action, impact, effort, timeline}]
    nice_to_have: [{action, impact, effort, timeline}]
```

## Veto Conditions

- **NEVER** audit SEO without checking technical foundation first — crawlability is prerequisite
- **NEVER** recommend keyword stuffing or manipulative tactics
- **NEVER** ignore E-E-A-T for YMYL content — it's the most important signal
- **NEVER** recommend against Google's guidelines — sustainable SEO only
- **NEVER** report without actionable recommendations — every issue needs a fix

## Completion Criteria

- [ ] Technical SEO foundation audited
- [ ] On-page optimization assessed for key pages
- [ ] Structured data evaluated and opportunities identified
- [ ] E-E-A-T signals analyzed
- [ ] Content quality scored
- [ ] Page experience signals integrated
- [ ] Prioritized action plan created
