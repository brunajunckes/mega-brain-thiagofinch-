# Divided by 13 — Development Blueprint

> Craft Luxury Brand Model — para marcas artesanais premium com forte identidade visual

**Fonte:** https://dividedby13.com/
**Tokens:** `tokens.json`
**Data:** 2026-03-17

---

## 1. Sitemap & Routing

```
/                          → Homepage (hero, about, product carousel, instagram, footer)
/amps/                     → Product listing (all amplifiers)
/amps/{slug}/              → Product detail (hero, description, specs, media, dealer CTA, related)
/cabs/                     → Cabinet listing
/cabs/{slug}/              → Cabinet detail
/artists/                  → Artist grid (name, credit, website)
/dealers/                  → Dealer locator
/merch/                    → Merchandise (apparel, gifts, hats, accessories)
/merch/#{category}         → Anchor scroll to category
/support/                  → Support/contact
```

## 2. Page Templates

### 2.1 Homepage

```
┌─────────────────────────────────────────────┐
│  NAV: [Amps] [Cabs] [Artists] [÷13] [Dealers] [Merch] [Support]  │
├─────────────────────────────────────────────┤
│  HERO: Full-bleed photo (artista esquerda + produto direita)      │
│  ├── Subtitle (gold, uppercase, label font)                      │
│  ├── Title (display font, 5xl, cream)                            │
│  └── CTA button (gold pill)                                      │
├─────────────────────────────────────────────┤
│  MARQUEE: "Hand built ... from California, USA •" (loop infinito)│
├─────────────────────────────────────────────┤
│  ABOUT: Brand statement (serif, centered) + Logo badge (warm bg) │
├─────────────────────────────────────────────┤
│  PRODUCTS: "Amplifiers" heading + carousel 3-col                 │
│  ├── Product Card (image + title + 6 spec rows + arrow)          │
│  └── Scroll buttons (left/right, circle outline)                 │
├─────────────────────────────────────────────┤
│  INSTAGRAM: Header (logo + "Follow @handle") + grid 4-col       │
│  └── Post card (image + excerpt + likes + comments + "Open")     │
├─────────────────────────────────────────────┤
│  FOOTER: Logo + Newsletter + Nav 4-col + Monumental brand text   │
└─────────────────────────────────────────────┘
```

### 2.2 Product Detail Page

```
┌─────────────────────────────────────────────┐
│  NAV (transparent overlay on hero)                               │
├─────────────────────────────────────────────┤
│  HERO: Dark bg + product photo centered + H1 display             │
├─────────────────────────────────────────────┤
│  CONTENT: 2-col layout                                           │
│  ├── Left: H2 (brand + model) + long-form description (multi-p) │
│  └── Right: Spec table (key-value) + Additional specs (list)     │
│            + Standard finishes (list)                            │
├─────────────────────────────────────────────┤
│  MEDIA: "Media" heading + thumbnail list + YouTube embed         │
├─────────────────────────────────────────────┤
│  DEALER CTA: Split (image left + text right + "Find a Dealer")   │
├─────────────────────────────────────────────┤
│  RELATED: "Explore more" + product carousel (reuse homepage)     │
├─────────────────────────────────────────────┤
│  FOOTER                                                          │
└─────────────────────────────────────────────┘
```

### 2.3 Artists Page

```
┌─────────────────────────────────────────────┐
│  NAV                                                             │
├─────────────────────────────────────────────┤
│  HERO: Warm bg (terracotta) + "Artists" H1 display               │
├─────────────────────────────────────────────┤
│  GRID: 2-col cards                                               │
│  └── Artist card: Name (heading) + Credit + Website link (icon)  │
├─────────────────────────────────────────────┤
│  FOOTER                                                          │
└─────────────────────────────────────────────┘
```

## 3. Component Library

### 3.1 Navigation — Split Nav

```html
<header class="site-header" role="banner">
  <nav class="main-nav" aria-label="Main">
    <ul class="nav-list">
      <li><a href="/amps/">Amps</a></li>
      <li><a href="/cabs/">Cabs</a></li>
      <li><a href="/artists/">Artists</a></li>
      <li class="nav-logo">
        <a href="/" aria-label="Home">
          <img src="/logo.svg" alt="Divided by 13" width="56" height="56">
        </a>
      </li>
      <li><a href="/dealers/">Dealers</a></li>
      <li><a href="/merch/">Merch</a></li>
      <li><a href="/support/">Support</a></li>
    </ul>
  </nav>
</header>
```

**Comportamento:**
- Transparente sobre hero (position: fixed)
- Solid dark background apos scroll (IntersectionObserver)
- Logo circular centralizado divide os itens em 2 grupos
- Font: label (mono, uppercase, wide letter-spacing)

### 3.2 Hero — Artist + Product Composition

```html
<section class="hero" aria-labelledby="hero-title">
  <img src="/hero-bg.jpg" alt="[Artista] com [Produto]" class="hero-bg">
  <div class="hero-content">
    <span class="hero-subtitle">[Subtitle em gold]</span>
    <h1 id="hero-title" class="hero-title">[Product Name]</h1>
    <a href="/amps/[slug]/" class="btn btn-gold">Explore</a>
  </div>
</section>
```

**Visual:**
- Full viewport height (100vh)
- Fotografia contextual (artista + produto)
- Composicao diagonal: foto dark esquerda, produto em fundo claro direita
- Titulo em display font condensada, tamanho monumental (5xl+)
- CTA pill button em dourado

### 3.3 Marquee Ticker

```html
<div class="marquee" role="marquee" aria-label="Hand built amplifiers from California, USA">
  <div class="marquee-track">
    <span>Hand built amplifiers from California, USA &bull; </span>
    <!-- Repetir 10x para loop seamless -->
  </div>
</div>
```

```css
.marquee-track {
  display: flex;
  animation: marquee var(--duration-marquee) linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
```

### 3.4 Product Card — Spec Card

```html
<a href="/amps/[slug]/" class="product-card">
  <div class="product-card__image">
    <img src="/amp.jpg" alt="[Model Name] amplifier" loading="lazy">
  </div>
  <div class="product-card__info">
    <h3 class="product-card__title">[Model Name]</h3>
    <dl class="product-card__specs">
      <div class="spec-row">
        <dt class="spec-label">Wattage</dt>
        <dd class="spec-value">16W / 39W / 55W</dd>
      </div>
      <div class="spec-row">
        <dt class="spec-label">Class</dt>
        <dd class="spec-value">A/AB</dd>
      </div>
      <!-- ... more spec rows ... -->
    </dl>
    <span class="product-card__arrow" aria-hidden="true">&rarr;</span>
  </div>
</a>
```

**Layout do spec grid:**
- 2 colunas (label | value) em grid
- Labels em gold, uppercase, label font, xs size
- Values em body font, sm size
- Separadores pontilhados entre rows
- Arrow indicator no canto inferior direito

### 3.5 Instagram Feed Section

```html
<section class="instagram-section" aria-label="Instagram feed">
  <div class="instagram-header">
    <img src="/logo.svg" alt="" aria-hidden="true">
    <a href="https://instagram.com/[handle]" class="instagram-follow">
      Follow @[handle] on Instagram
    </a>
  </div>
  <div class="instagram-grid">
    <article class="instagram-post">
      <img src="[post-image]" alt="[Post description]" loading="lazy">
      <div class="instagram-post__overlay">
        <p class="instagram-post__caption">[Caption excerpt...]</p>
        <div class="instagram-post__stats">
          <span><svg>heart</svg> 187</span>
          <span><svg>comment</svg> 7</span>
        </div>
      </div>
    </article>
  </div>
</section>
```

### 3.6 Footer — Monumental

```html
<footer class="site-footer" role="contentinfo">
  <div class="footer-top">
    <img src="/logo.svg" alt="Divided by 13" class="footer-logo">
    <div class="footer-content">
      <div class="footer-newsletter">
        <p>Subscribe to the newsletter</p>
        <form>
          <label for="footer-email" class="sr-only">Email address</label>
          <input type="email" id="footer-email" placeholder="Email address" required>
          <button type="submit" aria-label="Subscribe">
            <svg>arrow</svg>
          </button>
        </form>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        <div class="footer-col">
          <h4>Amps</h4>
          <ul><!-- links --></ul>
        </div>
        <!-- 3 more columns -->
      </nav>
    </div>
  </div>
  <div class="footer-monumental">
    <!-- Tipografia gigante do brand name como background visual -->
    <div class="footer-brand-text" aria-hidden="true">DIVIDED BY 13</div>
    <img src="/footer-hero.jpg" alt="" class="footer-hero-image">
  </div>
  <p class="footer-copyright">&copy; 2026 [Brand] | All Rights Reserved</p>
</footer>
```

**Visual:**
- Background warm/amber
- Logo no canto superior esquerdo
- Newsletter inline (input + arrow button)
- Nav em 4 colunas com heading uppercase
- Tipografia monumental (6xl) como statement final
- Imagem de artista ao vivo overlaying o texto gigante

## 4. Design Patterns

### 4.1 Alternancia de Secoes (Dark/Light Rhythm)

```
Section 1: DARK  (hero)         — bg.primary (#1A1A1A)
Section 2: DARK  (marquee)      — bg.primary (#1A1A1A)
Section 3: LIGHT (about)        — bg.secondary (#F5F0E8)
Section 4: DARK  (products)     — bg.primary (#1A1A1A)
Section 5: LIGHT (instagram)    — bg.secondary (#F5F0E8)
Section 6: WARM  (footer)       — bg.accent (#B8804A)
```

Esta alternancia cria **ritmo visual** — como compassos musicais.

### 4.2 Tipografia Hierarchy

| Elemento | Font | Size | Weight | Transform | Spacing |
|----------|------|------|--------|-----------|---------|
| Hero title | display | 5xl (112px) | black (900) | uppercase | tight (-0.02em) |
| Section H2 | display | 2xl (32px) | black (900) | uppercase | tight |
| Card H3 | display | xl (24px) | bold (700) | uppercase | tight |
| Body | body | base (16px) | regular (400) | none | normal |
| Spec label | label | xs (12px) | medium (500) | uppercase | wide (0.1em) |
| Nav item | label | sm (14px) | medium (500) | uppercase | wider (0.15em) |
| Footer brand | display | 6xl (192px) | black (900) | uppercase | tight |

### 4.3 Separator Pattern

Linhas pontilhadas (dotted) como separadores — reforça a estetica "technical sheet":
```css
.separator {
  border-top: 1px dotted var(--color-interactive-border);
}
```

### 4.4 CTA Button Pattern

```css
.btn-gold {
  background: var(--color-interactive-default);
  color: var(--color-bg-primary);
  font-family: var(--font-label);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  padding: 12px 32px;
  border-radius: var(--radius-full);
  transition: background var(--duration-normal) var(--easing-productive);
}
.btn-gold:hover {
  background: var(--color-interactive-hover);
}
```

## 5. Responsive Strategy

| Breakpoint | Layout Changes |
|-----------|---------------|
| Mobile (<640px) | Single column, hero title 3xl, nav hamburger, carousel 1-col, instagram 2-col, footer 1-col stacked |
| Tablet (640-1024px) | Product carousel 2-col, instagram 3-col, footer 2-col |
| Desktop (1024px+) | Full layout, carousel 3-col, instagram 4-col, footer 4-col, split hero composition |

## 6. Acessibilidade (Correcoes sobre o Original)

| Original | Correcao no Modelo |
|----------|-------------------|
| Imagens sem alt | Alt text obrigatorio em todas as imagens |
| Marquee sem reduced-motion | `prefers-reduced-motion: reduce` para o marquee |
| Contraste dourado insuficiente | `color.text.accent-safe` (#A8893E) para textos pequenos em bg escuro |
| Carousel sem keyboard | Arrow keys + focus trap + aria-live |
| Instagram links vagos ("Open") | Links descritivos: "Ver post no Instagram: [caption excerpt]" |
| Skip link presente | Manter — "Skip to main content" |
| Landmarks corretos | Manter — banner, main, contentinfo, navigation |

## 7. SEO & GEO (Melhorias sobre o Original)

### Schema Markup Recomendado

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Brand Name]",
  "url": "https://[domain]/",
  "logo": "https://[domain]/logo.png",
  "description": "[Brand description]",
  "address": { "@type": "PostalAddress", "addressRegion": "CA", "addressCountry": "US" }
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Model Name]",
  "brand": { "@type": "Brand", "name": "[Brand]" },
  "description": "[Product description]",
  "category": "Guitar Amplifiers",
  "image": "[product-image-url]",
  "manufacturer": { "@type": "Organization", "name": "[Brand]" }
}
```

### Breadcrumb

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "/" },
    { "position": 2, "name": "Amps", "item": "/amps/" },
    { "position": 3, "name": "[Model]", "item": "/amps/[slug]/" }
  ]
}
```

### GEO Readiness
- Blocos de conteudo com headings claros (H2/H3) para RAG extraction
- Specs em formato `<dl>` (definition list) — maquinas parseiam melhor
- FAQ section nas product pages para citabilidade
- IndexNow para notificar updates

## 8. Performance Budget

| Metrica | Target |
|---------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Total page weight | < 2MB |
| Hero image | < 200KB (WebP/AVIF, priority) |
| JS bundle | < 100KB (zero jQuery) |
| Fonts | < 150KB (subset, woff2, display:swap) |

### Checklist de Performance
- [ ] `fetchpriority="high"` no hero LCP image
- [ ] `loading="lazy"` em todas as imagens below-fold
- [ ] Responsive images com `srcset` + `sizes`
- [ ] Fonts self-hosted em woff2 com `font-display: swap`
- [ ] CSS critical inline no `<head>`
- [ ] Instagram feed lazy-loaded (IntersectionObserver trigger)
- [ ] YouTube embed como facade (thumbnail + play button, load on click)
- [ ] Zero jQuery — vanilla JS ou framework leve

## 9. Tech Stack Recomendado

| Componente | Recomendacao | Alternativa |
|-----------|-------------|-------------|
| Framework | Astro (SSG) | Next.js (SSG/ISR) |
| Styling | CSS custom properties (tokens) | Tailwind CSS |
| Animation | CSS animations + IntersectionObserver | Framer Motion |
| Carousel | Embla Carousel | Swiper |
| Instagram | Server-side fetch + static render | Instagram Basic Display API |
| CMS | WordPress headless (REST/GraphQL) | Sanity, Strapi |
| Fonts | Self-hosted woff2 | Google Fonts (preconnect) |
| Images | Sharp + AVIF/WebP | Cloudinary, Imgix |

---

*Modelo extraido pelo WebCraft Squad — Synkra AIOX*
*Fonte: dividedby13.com — Analise: 2026-03-17*
