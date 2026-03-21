---
task: auditGEO()
responsavel: "@fabrice-canel"
responsavel_type: Agent
atomic_layer: Task
elicit: false

Entrada:
  - campo: site_url
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: seo_report
    tipo: dict
    origem: Phase Output
    obrigatorio: false

Saida:
  - campo: geo_report
    tipo: dict
    destino: Console | File
    persistido: true

Checklist:
  - "[ ] AI visibility assessed"
  - "[ ] Entity optimization evaluated"
  - "[ ] Citability scored"
  - "[ ] Content authority analyzed"
  - "[ ] AI-friendly architecture assessed"
  - "[ ] Optimization roadmap created"
---

# Task: Audit GEO — Generative Engine Optimization

## Metadata

| Field         | Value                      |
|---------------|----------------------------|
| Task ID       | `webcraft-squad:audit-geo`  |
| Command       | `*audit-geo {url}`         |
| Orchestrator  | `fabrice-canel`            |
| Version       | 1.0.0                      |
| Created       | 2026-03-17                  |

## Purpose

Audit a website's visibility and citation potential in AI-powered search engines —
Google AI Overviews, ChatGPT Search, Perplexity, Bing Chat, Claude, and Gemini.
GEO is the emerging discipline of optimizing content to be found, understood, and
cited by Large Language Models in their search responses.

## Context: The GEO Landscape

Traditional SEO optimizes for crawlers and ranking algorithms. GEO optimizes for
LLMs that synthesize information from multiple sources into direct answers.

**AI Search Engines:**
- Google AI Overviews (SGE)
- ChatGPT with browsing (OpenAI)
- Perplexity AI
- Bing Chat / Copilot (Microsoft)
- Claude with search (Anthropic)
- Gemini with grounding (Google)

**Key difference:** In traditional search, you compete for clicks. In AI search,
you compete to be THE cited source in the AI's answer.

## Execution Phases

### Phase 1: Entity Optimization

1. **Brand entity presence:**
   - Is the brand in Google Knowledge Graph?
   - Is the brand recognized as an entity by LLMs?
   - Wikipedia/Wikidata presence
   - Consistent NAP (Name, Address, Phone) across the web
2. **Topic entity mapping:**
   - Are key topics structured as definable entities?
   - Is entity context provided (definitions, relationships)?
   - Are entities connected via internal linking?
3. **Author entities:**
   - Are authors established as entities?
   - Do authors have external authority signals?
   - Is author schema properly implemented?

### Phase 2: Citability Assessment

1. **Content structure for citation:**
   - Clear, quotable statements and definitions
   - Factual claims with supporting data
   - Original research, data, or insights
   - Structured answers to common questions
2. **Source authority signals:**
   - Domain authority and backlink quality
   - Content freshness and update frequency
   - Expert authorship signals
   - Trust indicators (citations, references)
3. **Content format for LLM consumption:**
   - Clear heading hierarchy (aids passage extraction)
   - Definition-answer format (query → direct answer)
   - Data tables and structured comparisons
   - Lists and step-by-step formats

### Phase 3: AI-Friendly Content Architecture

1. **Structured data completeness:**
   - Schema.org coverage depth
   - FAQ schema for common questions
   - HowTo schema for processes
   - Article schema with full metadata
   - Speakable schema (for voice assistants)
2. **Content organization:**
   - Topic clusters with pillar-spoke model
   - Clear information hierarchy
   - Cross-referencing between related content
   - Content freshness signals (dateModified)
3. **Technical AI signals:**
   - Clean HTML (parseable by LLMs)
   - robots.txt allows AI crawlers (GPTBot, ChatGPT-User, anthropic-ai, PerplexityBot)
   - IndexNow support (instant indexing for Bing/AI)
   - Sitemap with lastmod dates

### Phase 4: AI Crawler Access

1. Check robots.txt for AI bot directives:
   - GPTBot (OpenAI)
   - ChatGPT-User (ChatGPT browsing)
   - Google-Extended (Gemini training)
   - anthropic-ai (Claude)
   - PerplexityBot (Perplexity)
   - CCBot (Common Crawl)
2. Assess AI TOS/opt-in decisions
3. Check for AI-specific meta tags
4. Verify content is accessible without JavaScript (many AI crawlers don't render JS)

### Phase 5: Competitive GEO Analysis

1. Search key brand queries in AI engines
2. Check which competitors are being cited
3. Identify citation patterns (what content format gets cited?)
4. Assess brand mention sentiment in AI responses
5. Identify gaps where brand should appear but doesn't

### Phase 6: GEO-SEO Alignment

1. Map overlap between SEO and GEO priorities
2. Identify where GEO requires different optimization than SEO
3. Assess content that ranks well in Google but isn't cited by AI
4. Identify "AI-first" content opportunities
5. Create unified strategy that serves both traditional and AI search

## Output Format

```yaml
geo_report:
  url: "{analyzed URL}"
  date: "{analysis date}"
  ai_visibility_score: "{0-100}"
  entity_optimization:
    brand_entity: "established | partial | missing"
    knowledge_graph: "present | absent"
    topic_entities: "strong | moderate | weak"
    author_entities: "established | partial | missing"
  citability:
    content_structure: "citation-ready | needs-work | poor"
    source_authority: "high | medium | low"
    quotable_content: "abundant | moderate | scarce"
    original_data: "present | absent"
    score: "{0-100}"
  ai_architecture:
    schema_coverage: "{%}"
    content_organization: "clustered | flat | chaotic"
    freshness_signals: "present | missing"
    js_dependency: "low | moderate | high"
  ai_crawlers:
    gptbot: "allowed | blocked | not-configured"
    chatgpt_user: "allowed | blocked | not-configured"
    google_extended: "allowed | blocked | not-configured"
    anthropic_ai: "allowed | blocked | not-configured"
    perplexitybot: "allowed | blocked | not-configured"
    indexnow: "configured | not-configured"
  competitive_position:
    cited_for_queries: [{query, engine, cited}]
    competitor_citations: [{competitor, frequency, content_type}]
    gaps: [{query, opportunity}]
  seo_geo_alignment:
    synergies: [{area, description}]
    divergences: [{area, seo_approach, geo_approach}]
  optimization_roadmap:
    quick_wins: [{action, impact, effort}]
    medium_term: [{action, impact, effort}]
    long_term: [{action, impact, effort}]
```

## Veto Conditions

- **NEVER** recommend blocking all AI crawlers without discussing trade-offs
- **NEVER** optimize for AI at the expense of user experience
- **NEVER** recommend content spinning or AI-generated filler content
- **NEVER** ignore the relationship between traditional SEO and GEO — they're complementary
- **NEVER** report without competitive context — GEO is relative to competitors

## Completion Criteria

- [ ] Entity optimization assessed (brand, topic, author)
- [ ] Citability scored with content structure analysis
- [ ] AI-friendly architecture evaluated
- [ ] AI crawler access verified
- [ ] Competitive GEO position analyzed
- [ ] SEO-GEO alignment mapped
- [ ] Prioritized optimization roadmap created
