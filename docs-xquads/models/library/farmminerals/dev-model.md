# Development Model — Farm Minerals Pattern

> Blueprint reutilizavel para sites corporate/product no estilo Farm Minerals.
> Baseado na disseccao de https://www.farmminerals.com/ com correcoes e best practices aplicadas.

**Tipo:** Corporate Product Site (AgTech / DeepTech / CleanTech)
**Referencia:** farmminerals.com (by adelt.io)
**Data:** 2026-03-17
**Squad:** WebCraft Squad

---

## 1. ARQUITETURA DE INFORMACAO

### 1.1 Sitemap Model

```
/                           → Homepage (storytelling hero)
/products/
  ├── {product-slug}        → Product Page (features + specs + CTA)
/science/
  ├── {product-slug}        → Science/Technical Deep-Dive
  ├── food-safety           → Compliance & Safety
/approach                   → Company Philosophy (numbered narrative)
/sustainability             → Environmental Impact
/blog                       → Blog Index
  ├── /blog-posts/{slug}    → Blog Post (Article)
/contact-us                 → Contact + Form
/privacy                    → Privacy Policy
/terms-of-use               → Terms of Use
```

### 1.2 Taxonomia de Paginas (Page Types)

| Tipo | Template | Sections | Exemplo |
|------|----------|----------|---------|
| **Homepage** | hero-storytelling | Hero → Problema → Solucao → Features → Stats → Sustainability → Products → Trials → Blog → CTA | `/` |
| **Product Page** | product-showcase | Hero → Diferencial (3-col) → Ciencia → How It Works → Field Results → Usage → Formats → FAQ → CTA | `/products/croptab` |
| **Science Page** | technical-deep-dive | Hero → Overview → Sticky TOC sidebar → Sections tecnicas → Data Tables → CTA | `/science/croptab` |
| **Narrative Page** | numbered-story | Hero → Numbered sections (01-05) com parallax → CTA | `/approach` |
| **Blog Index** | grid-listing | Hero → Cards grid → Pagination | `/blog` |
| **Blog Post** | article | Hero image → Content → Related posts | `/blog-posts/{slug}` |
| **Contact** | form-page | Info → Form + Turnstile captcha | `/contact-us` |
| **Legal** | text-only | Simple content | `/privacy`, `/terms-of-use` |

### 1.3 Navegacao

```
HEADER (sticky, transparent → solid on scroll)
├── [Hamburger Menu] (esquerda) — abre fullscreen/sidebar nav
├── [Logo] (centro)
└── [CTA Button] (direita) — "Contact us"

FOOTER (4 colunas)
├── Col 1: Products (links)
├── Col 2: Science (links)
├── Col 3: About (links)
├── Col 4: Blog + Contact (links)
├── Contact info: email + social
└── Bottom bar: © + logo badge + Privacy + Terms + "website by"
```

**MELHORIA vs original:**
- Adicionar `<nav>` semantico com role no menu mobile
- Adicionar `<footer>` com `role="contentinfo"`
- Adicionar skip link: `<a href="#main" class="skip-link">Skip to content</a>`
- Considerar nav visivel no desktop (nao so hamburger) para melhor UX e SEO

---

## 2. DESIGN SYSTEM

### 2.1 Paleta de Cores (Design Tokens)

```json
{
  "color": {
    "primitive": {
      "green-900": "#2A3318",
      "green-800": "#3B4A23",
      "green-700": "#4A5A2B",
      "green-600": "#5C6B3A",
      "green-500": "#6E7D4C",
      "green-400": "#8A9668",
      "green-300": "#A8B48A",
      "green-200": "#C5CEAF",
      "green-100": "#E2E7D5",
      "cream-100": "#F5F0E8",
      "cream-200": "#EDE8DD",
      "cream-300": "#E0D9CC",
      "white": "#FFFFFF",
      "black": "#1A1A1A",
      "gray-600": "#4A4A4A",
      "gray-400": "#8A8A8A",
      "gray-200": "#D0D0D0"
    },
    "semantic": {
      "surface-primary": "{color.primitive.cream-100}",
      "surface-secondary": "{color.primitive.green-700}",
      "surface-dark": "{color.primitive.green-900}",
      "surface-white": "{color.primitive.white}",
      "text-primary": "{color.primitive.black}",
      "text-on-dark": "{color.primitive.cream-100}",
      "text-secondary": "{color.primitive.gray-600}",
      "text-muted": "{color.primitive.gray-400}",
      "accent-primary": "{color.primitive.green-600}",
      "accent-hover": "{color.primitive.green-500}",
      "border-default": "{color.primitive.gray-200}",
      "border-subtle": "{color.primitive.cream-300}"
    }
  }
}
```

### 2.2 Tipografia

```json
{
  "typography": {
    "family": {
      "heading": "'Editorial New', Georgia, 'Times New Roman', serif",
      "body": "'Inter', 'Helvetica Neue', Arial, sans-serif",
      "mono": "'JetBrains Mono', 'Fira Code', monospace"
    },
    "scale": {
      "display": { "size": "clamp(3rem, 8vw, 7rem)", "weight": 400, "lineHeight": 0.95, "letterSpacing": "-0.03em" },
      "h1": { "size": "clamp(2.5rem, 6vw, 5rem)", "weight": 400, "lineHeight": 1.0, "letterSpacing": "-0.02em" },
      "h2": { "size": "clamp(1.75rem, 3.5vw, 3rem)", "weight": 400, "lineHeight": 1.1, "letterSpacing": "-0.01em" },
      "h3": { "size": "clamp(1.25rem, 2vw, 1.75rem)", "weight": 500, "lineHeight": 1.2 },
      "body-lg": { "size": "1.125rem", "weight": 400, "lineHeight": 1.6 },
      "body": { "size": "1rem", "weight": 400, "lineHeight": 1.65 },
      "body-sm": { "size": "0.875rem", "weight": 400, "lineHeight": 1.5 },
      "caption": { "size": "0.75rem", "weight": 500, "lineHeight": 1.4, "letterSpacing": "0.05em", "textTransform": "uppercase" }
    }
  }
}
```

### 2.3 Espacamento

```json
{
  "spacing": {
    "unit": "0.5rem",
    "scale": {
      "0": "0",
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "6": "1.5rem",
      "8": "2rem",
      "12": "3rem",
      "16": "4rem",
      "20": "5rem",
      "24": "6rem",
      "32": "8rem",
      "48": "12rem"
    },
    "section-gap": "clamp(4rem, 10vw, 8rem)",
    "container-max": "1280px",
    "container-padding": "clamp(1rem, 5vw, 3rem)"
  }
}
```

### 2.4 Motion Tokens

```json
{
  "motion": {
    "duration": {
      "instant": "100ms",
      "fast": "200ms",
      "normal": "400ms",
      "slow": "600ms",
      "dramatic": "1000ms"
    },
    "easing": {
      "default": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      "enter": "cubic-bezier(0, 0, 0.2, 1)",
      "exit": "cubic-bezier(0.4, 0, 1, 1)",
      "bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      "smooth": "cubic-bezier(0.4, 0, 0.2, 1)"
    },
    "stagger": {
      "children": "50ms",
      "words": "30ms",
      "letters": "20ms"
    }
  }
}
```

### 2.5 Breakpoints

```json
{
  "breakpoints": {
    "mobile": "0px",
    "tablet": "768px",
    "desktop": "1024px",
    "wide": "1440px",
    "ultra": "1920px"
  }
}
```

---

## 3. COMPONENT INVENTORY

### 3.1 Global Components

| Componente | Descricao | Variantes |
|-----------|-----------|-----------|
| **Header** | Sticky, transparent→solid, hamburger+logo+CTA | `transparent`, `solid`, `dark` |
| **Footer** | 4-col links + contact + bottom bar | `light`, `dark` |
| **Skip Link** | Hidden visually, focusable | (single) |
| **CTA Banner** | Full-width section com heading + subtext + 2 buttons | `light-bg`, `dark-bg`, `image-bg` |
| **Section Wrapper** | Container com spacing padrao | `cream-bg`, `green-bg`, `white-bg`, `dark-bg` |

### 3.2 Content Components

| Componente | Descricao | Usado em |
|-----------|-----------|----------|
| **Hero Storytelling** | H1 animado (SplitText) + imagem produto + H2 + paragraph | Homepage |
| **Hero Simple** | Breadcrumb-label + H1 + paragraph | Product, Science |
| **Problem Statement** | H2 + paragraph + stat callout com source | Homepage |
| **Feature Grid** | 3 cards com H3 + paragraph (sem icones) | Homepage, Product |
| **Stat Bar** | Row de 4 stats (numero grande + label) + footnote | Homepage |
| **Product Card** | Imagem + H3 + description + arrow link | Homepage (products section) |
| **Numbered Section** | "01" badge + H2 + paragraph + parallax image | Approach page |
| **FAQ Accordion** | Question (toggle) + answer (collapsible) | Product page |
| **Blog Carousel** | Splide slider com cards (imagem + titulo + excerpt) | Homepage |
| **Data Table** | Header row + data rows com alternating bg | Science page |
| **Tab Panel** | Tab bar + content panels | Science (mechanism, formulations) |
| **Sticky TOC** | Sidebar navigation com anchor links | Science page |
| **How It Works** | 3-phase visual (N/P/K cards com timing) | Product page |
| **Trial Results** | Stat highlight (percentage/number) + description | Product, Science |
| **Usage Instructions** | 2-column layout (method name + instructions) | Product, Science |
| **Compatibility Table** | Factor + Range + Result columns | Science page |

### 3.3 UI Components

| Componente | Variantes | Notas |
|-----------|-----------|-------|
| **Button** | `primary` (green), `secondary` (outline), `ghost` (text+arrow) | Todos com hover state |
| **Link Arrow** | Text + animated arrow icon | "learn more →" |
| **Breadcrumb Label** | Uppercase small text above H1 | "PRODUCTS / croptab" |
| **Badge** | Small label tag | "PERFECT FOR NITROGEN-RESPONSIVE CROPS" |
| **Source Citation** | Small italic text | "Source: FAO, 2023" |
| **Form Input** | Text, email, textarea, select | **COM labels (melhoria)** |
| **Carousel Controls** | Prev/Next buttons | Splide integration |

---

## 4. PAGE BLUEPRINTS

### 4.1 Homepage Blueprint

```
┌─────────────────────────────────────────────────┐
│ HEADER (transparent, sticky)                     │
│ [☰]           [LOGO]           [Contact us →]   │
├─────────────────────────────────────────────────┤
│ HERO — dark green bg                             │
│                                                  │
│   "Headline, Reinvented."  ← SplitText anim     │
│   [Product Image]          ← 3D or hero photo    │
│   "Subheadline statement."                       │
│   "Supporting paragraph with value prop."        │
│                                                  │
├─────────────────────────────────────────────────┤
│ PROBLEM STATEMENT — cream bg                     │
│                                                  │
│   [Left col]                  [Right col]        │
│   H2: Problem headline        H2: Stat + source  │
│   Body: Problem description                      │
│                                                  │
├─────────────────────────────────────────────────┤
│ SOLUTION — green bg                              │
│                                                  │
│   H2: Question headline                          │
│   H2: "We found a better way"                    │
│   Body: Solution introduction                    │
│                                                  │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   │Feature 1│ │Feature 2│ │Feature 3│           │
│   │H3 + body│ │H3 + body│ │H3 + body│           │
│   └─────────┘ └─────────┘ └─────────┘           │
│                                                  │
│   H2: "Meet [Product]"                           │
│   ┌─────────────┐ ┌─────────────┐               │
│   │ Usage demo  │ │ Key stat    │               │
│   │ H3 + body   │ │ H3 + body   │               │
│   └─────────────┘ └─────────────┘               │
│                                                  │
├─────────────────────────────────────────────────┤
│ SOCIAL PROOF — cream bg                          │
│                                                  │
│   H2: "Field-Tested. [Audience]-Approved."       │
│                                                  │
│   [Stat 1]  [Stat 2]  [Stat 3]  [Stat 4]       │
│   number    number    number    number           │
│   label     label     label     label            │
│                                                  │
│   * footnote/source                              │
│                                                  │
├─────────────────────────────────────────────────┤
│ SUSTAINABILITY — dark bg + farmer photo          │
│                                                  │
│   H2: Environmental headline                     │
│   Body: Sustainability pitch                     │
│   [learn more →]                                 │
│                                                  │
├─────────────────────────────────────────────────┤
│ PRODUCTS — cream bg                              │
│                                                  │
│   H2: Product line headline                      │
│                                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │[Image]   │ │[Image]   │ │[Image]   │       │
│   │Product 1 │ │Product 2 │ │Product 3 │       │
│   │Desc      │ │Desc      │ │Desc      │       │
│   │    [→]   │ │    [→]   │ │    [→]   │       │
│   └──────────┘ └──────────┘ └──────────┘       │
│                                                  │
├─────────────────────────────────────────────────┤
│ FIELD TRIALS — green bg + landscape photo        │
│                                                  │
│   H2: Trial status                               │
│   Body: Global presence                          │
│                                                  │
│   H2: Early access CTA                           │
│   [CTA Button]                                   │
│                                                  │
├─────────────────────────────────────────────────┤
│ BLOG CAROUSEL — cream bg                         │
│                                                  │
│   H2: "Latest from the community"                │
│   [← →]  [Card 1] [Card 2] [Card 3]            │
│                                                  │
├─────────────────────────────────────────────────┤
│ FINAL CTA BANNER — landscape photo bg            │
│                                                  │
│   H2: Call to action headline                    │
│   Body: Supporting text                          │
│   [Primary CTA]  [Secondary CTA]                │
│                                                  │
├─────────────────────────────────────────────────┤
│ FOOTER                                           │
│ [Products] [Science] [About] [Blog] [Contact]   │
│ email | linkedin                                │
│ © 2026 | Privacy | Terms | "website by"          │
└─────────────────────────────────────────────────┘
```

### 4.2 Product Page Blueprint

```
HERO: Breadcrumb label + H1 (product name) + H2 (value prop) + paragraph + hero image
DIFFERENTIALS: H2 + subtitle + 3-column feature cards (icon-less, stat-led)
SCIENCE INTRO: H2 (long-form) + paragraph + link to science page
HOW IT WORKS: H2 + tab/card system showing mechanism phases
FIELD RESULTS: H2 + stat highlights + trial data summary + expandable detail
USAGE: H2 + image + instructions + specs grid (coverage, filter size, application)
FORMATS: H2 + subtitle + carousel of product variants (N, P, K, NPK, NPK+)
SCARCITY CTA: H2 (urgency) + H2 (aspiration) + paragraph + 2 CTAs
FAQ: H2 + accordion (10-15 questions)
FOOTER CTA + FOOTER
```

### 4.3 Science Page Blueprint

```
HERO: Breadcrumb label + H1 (product name)
STICKY TOC SIDEBAR: Anchor links to all sections (scrolls with page)
CONTENT SECTIONS (each with H2 anchor):
  - Overview (3-pathway summary)
  - Formulation (expandable product variants)
  - Mechanism of Action (tabbed: 01, 02, 03)
  - Biological Efficiency (visual + explanation)
  - Controlled Release (phase table: Fast/Mid/Slow)
  - Zero-Loss Pathway (list + visual steps)
  - Directions for Use (2-method layout)
  - Field Trials (data tables + stat highlights)
  - Sustainability Impact (5-subsection grid)
  - Testing & QA (spec tables: batch-level)
  - Compatibility (stability parameter table)
FOOTER CTA + FOOTER
```

### 4.4 Narrative Page Blueprint (Approach/About)

```
HERO: Label + H1 (mission statement) + paragraph
NUMBERED SECTIONS (01-05):
  Each section:
  ├── Number badge (large, muted)
  ├── H2 title
  ├── Paragraph(s)
  └── Optional: parallax background image or illustration
FOOTER CTA + FOOTER
```

---

## 5. SCROLL STORYTELLING PATTERN

### 5.1 Narrativa da Homepage

A homepage segue o framework **PROBLEM → AGITATE → SOLVE → PROVE → CTA**:

| Section | Narrativa | Emocao |
|---------|-----------|--------|
| Hero | Headline disruptiva + produto | Curiosidade |
| Problem | "A maioria dos fertilizantes nunca chega" | Frustacao |
| Stat | "70% do nitrogenio e perdido" | Choque |
| Question | "E se nada fosse desperdicado?" | Esperanca |
| Solution | "Encontramos um caminho melhor" | Confianca |
| Features | 3 diferenciais | Compreensao |
| Product Demo | "Just drop it" + "0 run-off" | Simplicidade |
| Social Proof | 4 stats em row | Credibilidade |
| Sustainability | Planeta + custo zero | Valores |
| Products | 3 product cards | Escolha |
| Field Trials | Global + early access | Urgencia |
| Blog | Community content | Autoridade |
| Final CTA | "See the difference for yourself" | Acao |

### 5.2 Animation Triggers

```javascript
// PATTERN: Revelar conteudo conforme scroll
// Usar SOMENTE em headings e elementos-chave, NAO em body text

// Headlines — SplitText reveal
gsap.from("[data-animate='split']", {
  scrollTrigger: { trigger: el, start: "top 80%" },
  y: 40,
  opacity: 0,
  duration: 0.8,
  stagger: { each: 0.03 },  // letters
  ease: "power3.out"
});

// Sections — fade up
gsap.from("[data-animate='fade-up']", {
  scrollTrigger: { trigger: el, start: "top 85%" },
  y: 30,
  opacity: 0,
  duration: 0.6,
  ease: "power2.out"
});

// Stats — count up
gsap.from("[data-animate='count']", {
  scrollTrigger: { trigger: el, start: "top 80%" },
  textContent: 0,
  duration: 1.5,
  snap: { textContent: 1 },
  ease: "power1.out"
});

// MELHORIA: NÃO animar word-by-word em paragrafos
// MELHORIA: Respeitar prefers-reduced-motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) {
  // Skip all scroll animations, show content immediately
}
```

---

## 6. TECH STACK RECOMENDADO

### 6.1 Stack (mantendo Webflow)

| Camada | Tecnologia | Notas |
|--------|-----------|-------|
| **CMS** | Webflow | Manter se equipe nao-tecnica gerencia conteudo |
| **Animacao** | GSAP 3.14+ | ScrollTrigger + SplitText (licenca paga necessaria) |
| **Smooth Scroll** | Lenis | Leve, performatico |
| **Carousel** | Splide.js | Acessivel por padrao |
| **Bot Protection** | Cloudflare Turnstile | Gratuito, melhor UX que reCAPTCHA |
| **Imagens** | AVIF (primary) + WebP (fallback) | `<picture>` com fallback |
| **CDN** | Cloudflare | Ja incluido no Webflow |

### 6.2 Stack Alternativo (Code-Based)

| Camada | Tecnologia | Vantagem |
|--------|-----------|----------|
| **Framework** | Next.js 15+ (App Router) | SSG/ISR, melhor SEO, sem jQuery |
| **Styling** | Tailwind CSS v4 | Design tokens como CSS vars |
| **CMS** | Sanity / Contentful / Strapi | API-first, melhor para escalar |
| **Animacao** | GSAP + Framer Motion | Mesmo resultado sem Webflow overhead |
| **Deploy** | Vercel + Cloudflare | Edge rendering |
| **Forms** | React Hook Form + Turnstile | Type-safe, acessivel |

**MELHORIA:** O stack code-based elimina jQuery, permite CSS custom properties nativas, melhor controle de performance e acessibilidade.

---

## 7. SEO & STRUCTURED DATA

### 7.1 Schema.org Templates

#### Organization (site-wide, inline no `<head>`)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{company_name}}",
  "url": "{{site_url}}",
  "logo": { "@type": "ImageObject", "url": "{{logo_url}}" },
  "description": "{{company_description}}",
  "email": "{{contact_email}}",
  "sameAs": ["{{linkedin_url}}", "{{twitter_url}}"],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "{{contact_email}}",
    "contactType": "Customer Service"
  }
}
</script>
```

#### Product (por pagina de produto)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{product_name}}",
  "description": "{{product_description}}",
  "brand": { "@type": "Brand", "name": "{{company_name}}" },
  "manufacturer": { "@type": "Organization", "name": "{{company_name}}" },
  "image": [{{ product_images }}],
  "category": "{{product_category}}",
  "url": "{{product_url}}",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "{{prop_name}}", "value": "{{prop_value}}" }
  ],
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/PreOrder",
    "description": "{{availability_description}}"
  },
  "hasVariant": [{{ product_variants }}]
}
</script>
```

#### FAQPage (por pagina com FAQ)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{question}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{answer}}"
      }
    }
  ]
}
</script>
```

#### Article (blog posts e science pages)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{title}}",
  "description": "{{description}}",
  "image": "{{hero_image}}",
  "url": "{{page_url}}",
  "datePublished": "{{publish_date}}",
  "dateModified": "{{modified_date}}",
  "author": { "@type": "Organization", "name": "{{company_name}}" },
  "publisher": {
    "@type": "Organization",
    "name": "{{company_name}}",
    "logo": { "@type": "ImageObject", "url": "{{logo_url}}" }
  }
}
</script>
```

### 7.2 Meta Tags Template (por pagina)

```html
<head>
  <title>{{page_title}} | {{company_name}}</title>
  <meta name="description" content="{{meta_description_max_160chars}}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{{canonical_url}}">

  <!-- Open Graph -->
  <meta property="og:title" content="{{og_title}}">
  <meta property="og:description" content="{{og_description}}">
  <meta property="og:image" content="{{og_image_1200x630}}">
  <meta property="og:url" content="{{canonical_url}}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{{company_name}}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{og_title}}">
  <meta name="twitter:description" content="{{og_description}}">
  <meta name="twitter:image" content="{{og_image_1200x630}}">

  <!-- MELHORIA: hreflang se multi-mercado -->
  <link rel="alternate" hreflang="en" href="{{en_url}}">
  <link rel="alternate" hreflang="x-default" href="{{default_url}}">

  <!-- Preload critical fonts -->
  <link rel="preload" href="{{font_heading_url}}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{{font_body_url}}" as="font" type="font/woff2" crossorigin>

  <!-- JSON-LD INLINE (nao como script externo!) -->
  <script type="application/ld+json">{{ schema_json }}</script>
</head>
```

---

## 8. ACESSIBILIDADE (WCAG 2.2 AA)

### 8.1 Checklist Obrigatorio

```markdown
## Pre-Launch A11y Gate

### Nivel A (obrigatorio)
- [ ] Todas as imagens tem `alt` text descritivo (ou `alt=""` se decorativas)
- [ ] Skip link presente e funcional
- [ ] Todos os form inputs tem `<label>` associado via `for`/`id`
- [ ] Headings em ordem hierarquica (H1 → H2 → H3, sem pulos)
- [ ] Links tem texto descritivo (nao "click here")
- [ ] Nenhum link aponta para `#` sem funcionalidade
- [ ] Keyboard navigation funciona em todos os interativos
- [ ] Focus indicators visiveis em todos os elementos focaveis
- [ ] Video/audio tem captions se aplicavel

### Nivel AA (target)
- [ ] Contraste de texto >= 4.5:1 (normal) e >= 3:1 (large)
- [ ] Texto pode ser redimensionado ate 200% sem perda
- [ ] Carousel pode ser pausado e controlado por teclado
- [ ] Accordion usa `aria-expanded`, `aria-controls`
- [ ] Tabs usam `role="tablist"`, `role="tab"`, `role="tabpanel"`
- [ ] Formularios tem mensagens de erro associadas via `aria-describedby`
- [ ] `prefers-reduced-motion` desativa animacoes

### Landmarks semanticos
- [ ] `<header>` com `<nav>` para navegacao principal
- [ ] `<main>` envolvendo conteudo principal
- [ ] `<footer>` para rodape
- [ ] `<section>` com `aria-label` para secoes de pagina
- [ ] `<article>` para blog posts
```

### 8.2 Patterns de Componentes Acessiveis

```html
<!-- Skip Link -->
<a href="#main" class="skip-link">Skip to main content</a>

<!-- Image com alt -->
<img src="product.avif" alt="CropTab NPK fertilizer tablet dissolving in water"
     loading="lazy" width="800" height="600">

<!-- Image decorativa -->
<img src="bg-pattern.svg" alt="" role="presentation">

<!-- Form Input com Label -->
<div class="form-field">
  <label for="farm-name">Farm name</label>
  <input type="text" id="farm-name" name="farm_name" required
         aria-describedby="farm-name-help">
  <span id="farm-name-help" class="help-text">Enter your farm or operation name</span>
</div>

<!-- FAQ Accordion -->
<div class="faq-item">
  <button aria-expanded="false" aria-controls="faq-1-answer">
    How can a 13g tablet replace 150kg?
  </button>
  <div id="faq-1-answer" role="region" hidden>
    <p>Because the crop needs less to achieve the same yield...</p>
  </div>
</div>

<!-- Reduced motion -->
<style>
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
```

---

## 9. PERFORMANCE BUDGET

### 9.1 Targets

| Metrica | Target | Farm Minerals Atual |
|---------|--------|-------------------|
| **LCP** | ≤ 2.5s | ~3-4s (estimado) |
| **INP** | ≤ 200ms | OK |
| **CLS** | ≤ 0.1 | OK (lazy loading ajuda) |
| **Total JS** | ≤ 200KB gzipped | ~250KB+ (jQuery incluso) |
| **Total CSS** | ≤ 50KB gzipped | ~40KB |
| **Hero Image** | ≤ 200KB | Variavel |
| **Total Page Weight** | ≤ 1.5MB | ~2MB+ |
| **Requests** | ≤ 30 | 44+ |

### 9.2 Otimizacoes Obrigatorias

```markdown
- [ ] Schemas JSON-LD inline no HTML (nao como scripts externos)
- [ ] Preload hero image e critical fonts
- [ ] Lazy load todas as imagens below-the-fold (loading="lazy")
- [ ] AVIF como formato primario, WebP fallback, JPEG fallback
- [ ] Responsive images com srcset e sizes
- [ ] Critical CSS inline no <head>
- [ ] Defer non-critical JS
- [ ] Remove jQuery se possivel (ou ao menos nao carregar no critical path)
- [ ] GSAP: carregar ScrollTrigger e SplitText somente quando necessarios
```

---

## 10. GEO (AI SEARCH VISIBILITY)

### 10.1 Checklist de Citabilidade

```markdown
- [ ] Schema.org detalhado para todos os produtos (properties, variants, offers)
- [ ] FAQ schema em todas as paginas com perguntas
- [ ] Claims com fontes citaveis ("Source: FAO, 2023")
- [ ] Entidades nomeadas consistentes (usar TM em todas as ocorrencias)
- [ ] Dados numericos em formatos parseables (tabelas HTML, nao imagens)
- [ ] Content chunks claros com headings descritivos
- [ ] Internal linking entre Product ↔ Science ↔ Blog
- [ ] robots.txt permite AI crawlers (GPTBot, ChatGPT-User, Google-Extended)
- [ ] About/Team page para entity authority
- [ ] Blog com 10+ posts para topical authority
```

### 10.2 AI-Friendly Content Pattern

```markdown
## Pattern: Claim → Evidence → Source

✅ BOM (citavel):
"Up to 70% of nitrogen is lost before crops can use it. (Source: FAO, 2023)"

❌ RUIM (nao citavel):
"Most fertilizers don't work well."

## Pattern: Entity Definition

✅ BOM:
"CropTab™ is a 13g ultra-efficient fertilizer tablet replacing up to 150kg
of bulk inputs. Carbon-encapsulated for zero leaching."

## Pattern: Structured Comparison (use <table>)

| Parameter | CropTab™ | Conventional |
|-----------|----------|-------------|
| N uptake  | ~99%     | ~30-50%     |
| CO₂/acre  | 0        | 500+ lb     |
```

---

## 11. COPY PATTERNS

### 11.1 Voice & Tone

| Aspecto | Diretriz |
|---------|----------|
| **Tom** | Confiante mas nao arrogante. Cientifico mas acessivel. |
| **Voz** | Primeira pessoa do plural ("We") quando fala da empresa. Segunda pessoa ("You/Your") quando fala do beneficio. |
| **Headlines** | Curtas, impactantes, com pontuacao dramatica. Mistura de perguntas e afirmacoes. |
| **Body** | Frases curtas a medias. Paragrafos de 2-3 frases max. Dados concretos > adjetivos vagos. |
| **CTAs** | Acao clara + beneficio implicito: "Check Eligibility", "Request Access", "See If You Qualify" |

### 11.2 Headline Formulas

```
"{Product}, Reinvented."
"For Your {Audience}. For the {Mission}."
"Most {category} never {expected_outcome}"
"How much could you {goal} — if {obstacle} was eliminated?"
"We found a better way"
"{Benefit}. {Benefit}. {Benefit}."  (3-beat rhythm)
"Field-Tested. {Audience}-Approved."
```

---

## 12. CHECKLIST DE LANCAMENTO

```markdown
## Pre-Launch Quality Gate

### Estrutura
- [ ] Todas as paginas do sitemap implementadas
- [ ] Navegacao funcional (desktop + mobile)
- [ ] Links internos todos funcionais (nenhum "#" morto)
- [ ] 404 page customizada
- [ ] Favicon e touch icons

### Design
- [ ] Responsive em mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Hover states em todos os interativos
- [ ] Loading states para formularios
- [ ] Dark/light section alternation consistente

### Conteudo
- [ ] Zero typos (spell-check automatizado)
- [ ] Todas as imagens com alt text
- [ ] Meta descriptions em todas as paginas
- [ ] OG images (1200x630) para todas as paginas

### SEO
- [ ] JSON-LD inline para Organization, Products, FAQ, Articles
- [ ] Canonical URLs corretos
- [ ] sitemap.xml gerado e submetido
- [ ] robots.txt revisado (permite AI crawlers)
- [ ] Google Search Console configurado
- [ ] Hreflang tags se multi-idioma/mercado

### Performance
- [ ] Lighthouse score >= 90 em todas as categorias
- [ ] Core Web Vitals no verde (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1)
- [ ] Imagens AVIF com fallback
- [ ] Critical CSS inline

### Acessibilidade
- [ ] axe-core scan com 0 violations
- [ ] Keyboard navigation completa
- [ ] Screen reader test (NVDA ou VoiceOver)
- [ ] prefers-reduced-motion testado
- [ ] Contraste verificado (WCAG AA)

### Legal
- [ ] Privacy Policy atualizado
- [ ] Terms of Use
- [ ] Cookie consent se necessario (GDPR)
- [ ] Compliance notices (industria-especificos)
```

---

## 13. ADAPTACAO PARA OUTROS PROJETOS

### Como usar este modelo

1. **Clone a estrutura de paginas** (Section 4) para o novo projeto
2. **Substitua os design tokens** (Section 2) pela identidade visual do cliente
3. **Selecione os componentes relevantes** (Section 3) do inventario
4. **Adapte o scroll storytelling** (Section 5) para a narrativa do produto
5. **Implemente os schemas** (Section 7) com os dados do novo produto
6. **Execute o checklist de a11y** (Section 8) durante o desenvolvimento
7. **Valide contra o performance budget** (Section 9) antes do lancamento
8. **Passe pelo launch checklist** (Section 12) completo

### Parametros Substituiveis

| Variavel | Descricao |
|----------|-----------|
| `{{company_name}}` | Nome da empresa |
| `{{product_name}}` | Nome do produto principal |
| `{{product_variants}}` | Variantes de produto |
| `{{hero_headline}}` | Headline principal (formula: "{noun}, Reinvented.") |
| `{{problem_stat}}` | Estatistica do problema (com fonte) |
| `{{solution_features}}` | 3 diferenciais principais |
| `{{proof_stats}}` | 4 numeros de prova social |
| `{{sustainability_claim}}` | Claim ambiental principal |
| `{{color_primary}}` | Cor primaria da marca |
| `{{color_surface}}` | Cor de background principal |
| `{{font_heading}}` | Fonte para headlines |
| `{{font_body}}` | Fonte para body text |

---

*WebCraft Squad Development Model v1.0 — Baseado em farmminerals.com*
*Gerado em 2026-03-17 por WebCraft Chief*
