# Europlasma — Development Blueprint

> Healthcare / Plasma Donation Center Model — para clinicas, centros de doacao, servicos de saude com tom amigavel e acessivel

**Fonte:** https://www.europlasma.at/
**Tokens:** `tokens.json`
**Data:** 2026-03-17

---

## Scores (Disseccao WebCraft Squad)

| Dimensao | Score |
|----------|-------|
| Estrutura & Padroes | 7.5/10 |
| Design Visual & Criativo | 7/10 |
| Animacao & Motion | 6/10 |
| Design Tokens | 4/10 |
| Performance | 7/10 |
| Acessibilidade | 8/10 |
| SEO | 7.5/10 |
| GEO / AI Search | 6/10 |
| **Global** | **6.7/10** |

## Pontos Fortes

- Tom visual amigavel e acolhedor — ilustracoes custom, cores quentes, linguagem informal ("du" em vez de "Sie")
- Excelente acessibilidade: skip links, landmarks, aria-labels, prefers-reduced-motion
- Dual typography eficaz: Escuela (display/personality) + DM Sans (body/readability)
- Carousel Splide acessivel com tabs, ARIA roles e keyboard navigation
- Cards com border-radius generoso (40px) criam visual suave e nao-clinico
- FAQ com Schema.org FAQPage — SEO bem implementado
- Multi-idioma (de, en, cs, sk, hu, sl) com hreflang
- Header sticky (96px) com navegacao limpa e language switcher
- CTA vermelho (#F63E3E) com alto contraste e visibilidade
- App nativa (iOS + Android) com links de download no footer

## Pontos a Melhorar (corrigidos no dev-model)

- Sem CSS custom properties — tudo hardcoded, dificulta manutenção
- Sem sistema de tokens formal — cores e spacing repetidos manualmente
- Animacoes minimas — apenas Splide loading, sem scroll-triggered reveals
- Ilustracoes carregadas como PNG — poderiam ser SVG para melhor performance
- Sem Schema.org Organization ou LocalBusiness — apenas FAQPage
- Cards de localizacao sem informacoes de endereco/horario visíveis
- Cookie consent complexo demais (6 toggles individuais) — poderia simplificar

## Ideal Para

- Centros de doacao de sangue/plasma
- Clinicas e servicos de saude acessiveis ao publico
- Organizacoes de saude com multiplas unidades/localizacoes
- Servicos medicos que precisam parecer amigaveis e nao-intimidadores
- Sites multi-idioma para Europa Central
- Qualquer servico de saude com sistema de agendamento online

## Tags

`healthcare` `plasma-donation` `friendly` `accessible` `multi-language` `typo3` `splide` `sticky-header` `pill-buttons` `illustrations` `warm-palette` `faq-schema` `austria`

---

## 1. Sitemap & Routing

```
/                                → Homepage (hero, CTAs, new center, reasons carousel, locations, info, FAQ)
/plasmaspenden/                  → Plasma spenden (informacoes gerais)
/plasmaspenden/ablauf-der-plasmaspende → Ablauf (processo da doacao)
/ueber-plasma/                   → Sobre Plasma
/ueber-plasma/was-ist-plasma     → O que e Plasma
/standorte/                      → Todos os centros (listing)
/standorte/{slug}/               → Centro individual (Wien-9, Wien-21, St-Poelten, etc.)
/ueber-uns/                      → Sobre nos
/faqs/                           → FAQs completas
/kontakt/                        → Contato
/karriere/                       → Carreiras
/presse/                         → Imprensa
/impressum/                      → Impressum (legal)
/datenschutz/                    → Privacidade
/informationspflicht/            → Obrigacao de informacao
/sitemap/                        → Sitemap
```

**Multi-idioma:**
- `/en/` — English
- `/cs/` — Czech
- `/sk/` — Slovak
- `/hu/` — Hungarian
- `/sl/` — Slovenian

## 2. Page Templates

### 2.1 Homepage

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Sticky (96px, z-30)                                    │
│  ├── Logo (esquerda)                                            │
│  ├── Standorte link (centro-direita)                            │
│  ├── Language switcher (dropdown "de")                          │
│  └── Hamburger menu (mobile/desktop collapsed)                  │
├─────────────────────────────────────────────────────────────────┤
│  HERO: Split layout                                             │
│  ├── Left: H1 "Weil du es im Blut hast." + subtitle + CTA red  │
│  └── Right: Character illustration (PNG) + "40€ fur dich" badge │
├─────────────────────────────────────────────────────────────────┤
│  DUAL CTA: 2-col cards (bg blush #F9F3F2, radius 40px)         │
│  ├── Left: "Zum ersten Mal?" — link to ablauf                  │
│  └── Right: "Schon gespendet?" — link to termine (booking)     │
├─────────────────────────────────────────────────────────────────┤
│  NEW CENTER: Card (bg blue #216FCE + photo)                     │
│  ├── "Neueroeffnung: Krems" + date + description               │
│  └── CTA blue pill "Zum neuen Standort"                        │
├─────────────────────────────────────────────────────────────────┤
│  VIDEO + REASONS: Split layout                                  │
│  ├── Left: Illustration + video embed (play button overlay)     │
│  └── Right: Carousel "6 gute Gruende" (Splide, 6 tabs)        │
├─────────────────────────────────────────────────────────────────┤
│  LOCATIONS: Grid (5-col desktop, 2-col mobile)                  │
│  ├── Header: "10x in Oesterreich" + H2 "Unsere Spendezentren" │
│  ├── 10 location cards (pill shape, name + region + arrow)      │
│  └── Map illustration                                           │
├─────────────────────────────────────────────────────────────────┤
│  INFO: "Gut zu wissen" — 3 info cards with icons                │
│  ├── "Was ist Plasma?"                                          │
│  ├── "Information fuer Spender:innen"                           │
│  └── "Plasmaspenden Ablauf"                                     │
├─────────────────────────────────────────────────────────────────┤
│  FAQ: Accordion (3 questions) + "alle FAQs" link                │
│  ├── Schema.org FAQPage markup                                  │
│  └── Illustration decorativa ao lado                            │
├─────────────────────────────────────────────────────────────────┤
│  STICKY CTA: Bottom bar "Weil du es im Blut hast. Jetzt spenden!"│
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: 4-col grid                                             │
│  ├── Logo + "10 Standorte" CTA card                            │
│  ├── App download (iOS + Android badges)                        │
│  ├── Social media (5 icons)                                     │
│  ├── Links (Kontakt, Presse, FAQs)                             │
│  └── Legal bar (Impressum, Datenschutz, etc.)                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Location Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                                │
├─────────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home > Spendezentren > {Location}                 │
├─────────────────────────────────────────────────────────────────┤
│  HERO: Location photo + H1 + address                            │
├─────────────────────────────────────────────────────────────────┤
│  INFO: Opening hours, address, contact, transport               │
├─────────────────────────────────────────────────────────────────┤
│  BOOKING CTA: "Termin buchen" → termine.europlasma.at          │
├─────────────────────────────────────────────────────────────────┤
│  AMENITIES: Feature list (WiFi, modern equipment, etc.)         │
├─────────────────────────────────────────────────────────────────┤
│  TESTIMONIALS: Carousel                                         │
├─────────────────────────────────────────────────────────────────┤
│  FAQ + FOOTER                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Component Library

### 3.1 Navigation — Sticky Header

```html
<header class="site-header" role="banner">
  <nav class="skip-links" aria-label="SkipLinks">
    <ul>
      <li><a href="#mainContent">Springe zum Inhalt</a></li>
      <li><a href="#footerContent">Springe zum Fussbereich</a></li>
    </ul>
  </nav>
  <a href="/" class="logo" aria-label="Zurueck zur Startseite">
    <img src="/logo.svg" alt="Europlasma" width="160" height="40">
  </a>
  <div class="header-actions">
    <a href="/standorte/" class="header-link">
      <span class="header-link-icon"></span>
      <span>Standorte</span>
    </a>
    <button class="lang-switcher" aria-expanded="false" aria-label="Sprache aendern">
      <span>de</span>
      <span class="chevron"></span>
    </button>
    <button class="menu-toggle" aria-expanded="false"
            aria-label="Navigation oeffnen/schliessen">
      <span class="hamburger"></span>
    </button>
  </div>
</header>
```

```css
.site-header {
  position: sticky;
  top: 0;
  height: 96px;
  z-index: 30;
  background: var(--color-surface-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-page);
}

.skip-links a {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 1rem 2rem;
  background: var(--color-interactive-primary);
  color: var(--color-white);
}

.skip-links a:focus {
  left: 1rem;
  top: 1rem;
}
```

### 3.2 Hero — Illustrated Split

```html
<section class="hero" aria-labelledby="hero-title">
  <div class="hero-content">
    <h1 id="hero-title" class="hero-title">Weil du es im Blut hast.</h1>
    <p class="hero-subtitle">Plasmaspenden: Wir verwandeln deine Hilfsbereitschaft in Hoffnung.</p>
    <a href="/standorte/" class="btn btn-primary">Jetzt Spenden!</a>
  </div>
  <div class="hero-visual">
    <img src="/character/hero-image.png" alt="Illustrated character donating plasma"
         width="500" height="600" fetchpriority="high">
    <div class="hero-badge">
      <span class="hero-badge-amount">40 &euro;</span>
      <span class="hero-badge-label">fuer dich</span>
    </div>
    <img src="/icons/plasma-wings.svg" alt="" aria-hidden="true" class="hero-decoration">
  </div>
</section>
```

```css
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-section) var(--spacing-page);
  min-height: 80vh;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 3.94rem); /* 40px → 63px */
  font-weight: 700;
  line-height: 1;
  color: var(--color-text-primary);
}

.hero-subtitle {
  font-family: var(--font-body);
  font-size: 1.625rem; /* 26px */
  font-weight: 400;
  line-height: 1.2;
  color: var(--color-text-primary);
  margin-top: 1.5rem;
}

.hero-badge {
  position: absolute;
  background: var(--color-accent-yellow);
  border-radius: var(--radius-full);
  padding: 1.5rem;
  text-align: center;
}

.hero-badge-amount {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
}

@media (max-width: 47.99rem) {
  .hero { flex-direction: column-reverse; text-align: center; }
  .hero-visual { max-width: 300px; margin: 0 auto; }
}
```

### 3.3 Dual CTA Cards

```html
<div class="dual-cta">
  <div class="cta-card">
    <div class="cta-card-content">
      <h2>Du willst zum ersten Mal Plasma spenden?</h2>
      <p>Dein erster Schritt, um Leben zu retten...</p>
    </div>
    <a href="/plasmaspenden/ablauf-der-plasmaspende" class="btn btn-outline">
      So laeuft die Spende ab
    </a>
  </div>
  <div class="cta-card">
    <div class="cta-card-content">
      <h2>Du hast schon bei uns gespendet?</h2>
      <p>Wir freuen uns, dich wieder bei uns...</p>
    </div>
    <a href="https://termine.europlasma.at" class="btn btn-secondary">
      Naechsten Termin buchen
    </a>
  </div>
</div>
```

```css
.dual-cta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  padding: 0 var(--spacing-page);
}

.cta-card {
  background: var(--color-surface-blush);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

@media (max-width: 47.99rem) {
  .dual-cta { grid-template-columns: 1fr; }
}
```

### 3.4 Location Card — Pill Shape

```html
<ul class="location-grid" role="list">
  <li>
    <a href="/standorte/wien-9" class="location-card">
      <div class="location-card-info">
        <h3 class="location-card-name">Wien 9</h3>
        <p class="location-card-region">9. Bezirk</p>
      </div>
      <span class="location-card-arrow" aria-hidden="true"></span>
    </a>
  </li>
  <!-- repeat for each location -->
</ul>
```

```css
.location-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-page);
  list-style: none;
}

.location-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface-blush);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: background var(--duration-fast) var(--easing-default);
}

.location-card:hover {
  background: var(--color-surface-blush-hover);
}

.location-card-name {
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 600;
}

.location-card-region {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.location-card-arrow {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 63.99rem) {
  .location-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 47.99rem) {
  .location-grid { grid-template-columns: 1fr; }
}
```

### 3.5 Reasons Carousel — Splide

```html
<section class="reasons" aria-label="6 gute Gruende Plasma zu spenden">
  <div class="splide" role="group">
    <div class="splide__arrows">
      <button class="splide__arrow splide__arrow--prev" aria-label="Zurueck">
        <span></span>
      </button>
      <button class="splide__arrow splide__arrow--next" aria-label="Weiter">
        <span></span>
      </button>
    </div>
    <div class="splide__track">
      <ul class="splide__list">
        <li class="splide__slide" role="tabpanel" aria-label="1 von 6">
          <div class="reason-card">
            <span class="reason-badge">6 gute Gruende</span>
            <h3 class="reason-question">Warum solltest du Plasma spenden?</h3>
            <span class="reason-number">1.</span>
            <p class="reason-text">Weil du tausenden von Menschen helfen kannst...</p>
          </div>
        </li>
        <!-- slides 2-6 -->
      </ul>
    </div>
    <ul class="splide__pagination" role="tablist" aria-label="Slide waehlen">
      <li><button role="tab" aria-selected="true" aria-label="Slide 1 anzeigen"></button></li>
      <!-- tabs 2-6 -->
    </ul>
  </div>
</section>
```

```css
.reason-card {
  background: var(--color-surface-blush);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.reason-badge {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.reason-number {
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-interactive-primary);
}

.reason-text {
  font-family: var(--font-body);
  font-size: 1.25rem;
  line-height: 1.5;
}
```

### 3.6 Info Cards — "Gut zu wissen"

```html
<section class="info-section" aria-label="Gut zu wissen">
  <h2>Gut zu wissen</h2>
  <ul class="info-grid" role="list">
    <li>
      <a href="/ueber-plasma/was-ist-plasma" class="info-card">
        <img src="/icons/plasma-drop.svg" alt="" aria-hidden="true" class="info-card-icon">
        <h3 class="info-card-title">Was ist Plasma?</h3>
        <p class="info-card-desc">Blutplasma ist der fluessige Teil des Blutes...</p>
        <span class="info-card-link">
          Alles ueber Plasma
          <span class="arrow" aria-hidden="true"></span>
        </span>
      </a>
    </li>
    <!-- 2 more cards -->
  </ul>
</section>
```

```css
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  list-style: none;
}

.info-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
  transition: transform var(--duration-fast) var(--easing-default);
}

.info-card:hover {
  transform: translateY(-4px);
}

.info-card-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: var(--spacing-md);
}

.info-card-title {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.info-card-link {
  font-weight: 600;
  color: var(--color-interactive-primary);
  margin-top: auto;
}

@media (max-width: 47.99rem) {
  .info-grid { grid-template-columns: 1fr; }
}
```

### 3.7 FAQ Accordion

```html
<section class="faq" aria-label="Haeufig gestellte Fragen">
  <div class="faq-content">
    <h2>FAQ</h2>
    <div class="faq-list" role="list">
      <div class="faq-item" role="listitem">
        <h3>
          <button class="faq-trigger" aria-expanded="false"
                  aria-controls="faq-1">
            Warum sollte ich Plasmaspenden?
            <span class="faq-icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div id="faq-1" class="faq-panel" role="region" hidden>
          <p>Answer content...</p>
        </div>
      </div>
      <!-- more items -->
    </div>
    <a href="/faqs/" class="btn btn-outline">alle FAQs</a>
  </div>
  <div class="faq-illustration" aria-hidden="true">
    <img src="/illustrations/faq.png" alt="" loading="lazy">
  </div>
</section>
```

```css
.faq {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  padding: var(--spacing-section) var(--spacing-page);
}

.faq-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 400;
  text-align: left;
  padding: var(--spacing-md) 0;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-subtle);
}

.faq-trigger[aria-expanded="true"] .faq-icon {
  transform: rotate(45deg);
}

.faq-panel {
  padding: var(--spacing-md) 0;
  font-size: 1.125rem;
  line-height: 1.6;
}

@media (max-width: 47.99rem) {
  .faq { grid-template-columns: 1fr; }
  .faq-illustration { display: none; }
}
```

### 3.8 Buttons

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.375rem; /* 22px */
  font-weight: 700;
  padding: 1.375rem 2.5rem; /* 22px 40px */
  border-radius: var(--radius-full); /* 40px pill */
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--duration-fast) var(--easing-default),
              transform var(--duration-fast) var(--easing-default);
}

.btn:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.btn:active {
  transform: scale(0.97);
}

/* Primary — Red CTA */
.btn-primary {
  background: var(--color-interactive-primary);
  color: var(--color-text-primary);
}

.btn-primary:hover {
  background: var(--color-interactive-primary-hover);
}

/* Secondary — Blue */
.btn-secondary {
  background: var(--color-interactive-secondary);
  color: var(--color-white);
}

.btn-secondary:hover {
  background: var(--color-interactive-secondary-hover);
}

/* Outline */
.btn-outline {
  background: transparent;
  color: var(--color-text-primary);
  border: 2px solid var(--color-border-default);
}
```

### 3.9 Footer — Multi-Section

```html
<footer id="footerContent" class="site-footer" role="contentinfo">
  <div class="footer-grid">
    <a href="/standorte/" class="footer-card footer-locations">
      <img src="/logo-small.png" alt="Europlasma" class="footer-logo">
      <div>
        <h2>10 Standorte</h2>
        <span>Zu den Standorten <span aria-hidden="true">&rarr;</span></span>
      </div>
    </a>
    <div class="footer-card footer-app">
      <img src="/app-icon.png" alt="App fuer Plasmaspender:innen" class="footer-app-icon">
      <div>
        <h2>App fuer Plasmaspender:innen</h2>
        <div class="app-badges">
          <a href="https://apps.apple.com/..." aria-label="Im App Store herunterladen">
            <img src="/badges/app-store.svg" alt="Im App Store herunterladen">
          </a>
          <a href="https://play.google.com/..." aria-label="Auf Google Play herunterladen">
            <img src="/badges/google-play.svg" alt="Auf Google Play herunterladen">
          </a>
        </div>
      </div>
    </div>
    <div class="footer-social">
      <h2>Folge uns</h2>
      <div class="social-links">
        <a href="https://instagram.com/europlasma.at/" aria-label="Instagram"><svg>...</svg></a>
        <a href="https://facebook.com/europlasma.at" aria-label="Facebook"><svg>...</svg></a>
        <a href="https://youtube.com/@Europlasma_at" aria-label="YouTube"><svg>...</svg></a>
        <a href="https://linkedin.com/..." aria-label="LinkedIn"><svg>...</svg></a>
        <a href="https://tiktok.com/@europlasma_at" aria-label="TikTok"><svg>...</svg></a>
      </div>
    </div>
    <nav class="footer-links" aria-label="Footer Links">
      <h2>Links</h2>
      <ul>
        <li><a href="/kontakt/">Kontakt</a></li>
        <li><a href="/presse/">Presse</a></li>
        <li><a href="/faqs/">FAQs</a></li>
      </ul>
    </nav>
  </div>
  <div class="footer-legal">
    <span>&copy; Europlasma GmbH</span>
    <ul>
      <li><a href="/impressum/">Impressum</a></li>
      <li><a href="/datenschutz/">Datenschutz</a></li>
      <li><a href="/informationspflicht/">Informationspflicht</a></li>
      <li><a href="/sitemap/">Sitemap</a></li>
    </ul>
  </div>
</footer>
```

```css
.footer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  padding: var(--spacing-xl) var(--spacing-page);
  background: var(--color-surface-dark);
  color: var(--color-white);
}

.footer-card {
  background: var(--color-surface-dark-elevated);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
}

.footer-legal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-page);
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
}

@media (max-width: 47.99rem) {
  .footer-grid { grid-template-columns: 1fr; }
}
```

## 4. Design Patterns

### 4.1 Section Rhythm

```
Section 1: WHITE   — Hero (clean, open)
Section 2: BLUSH   — Dual CTA cards (#F9F3F2)
Section 3: WHITE   — New center announcement
Section 4: BLUSH   — Video + Reasons carousel
Section 5: WHITE   — Locations grid
Section 6: WHITE   — "Gut zu wissen" info cards
Section 7: WHITE   — FAQ accordion
Section 8: DARK    — Footer
```

### 4.2 Typography Hierarchy

| Elemento | Font | Size | Weight | Line-Height |
|----------|------|------|--------|-------------|
| H1 hero | Escuela | 63px (clamp 40-63) | 700 | 1.0 |
| H2 section | Escuela | 47px | 700 | 1.15 |
| H3 card | DM Sans | 26px | 400-600 | 1.15 |
| Body | DM Sans | 20px | 400 | 1.6 |
| Body large | DM Sans | 26px | 400 | 1.2 |
| Button | Escuela | 22px | 700 | — |
| Label small | DM Sans | 14px | 600 | — |
| Footer | DM Sans | 16px | 400 | 1.6 |

**Regra dual-type:** Escuela (display serif-like) para headings e CTAs — personalidade e warmth. DM Sans (geometric sans) para body e UI — legibilidade e modernidade.

### 4.3 Border Radius System

```css
/* Todo o site usa radius generoso — visual "soft" e "friendly" */
--radius-sm: 12px;     /* inputs, small elements */
--radius-md: 20px;     /* cards medium */
--radius-lg: 28px;     /* info cards, panels */
--radius-xl: 40px;     /* CTA cards, location cards, buttons */
--radius-full: 9999px; /* badges, pills */
```

### 4.4 Illustration System

O site usa ilustracoes custom (character, icons, decorations) em vez de fotos de stock para:
- Hero character (pessoa doando plasma)
- Plasma wings (decorative SVG)
- FAQ illustration
- Map illustration (localizacoes)
- Badge/icon para "40EUR"

**Estilo:** Flat illustration, cores quentes, linhas suaves, estilo "friendly healthcare"

### 4.5 Pill Button Pattern

Todos os CTAs e cards clicaveis usam `border-radius: 40px` (pill shape). Isso cria consistencia visual e reforça o tom amigavel/nao-clinico do site.

## 5. Animation System

### 5.1 Minimal — Funcional

```css
/* Transicoes basicas */
.btn { transition: background 0.2s ease, transform 0.2s ease; }
.btn:active { transform: scale(0.97); }

.card { transition: background 0.2s ease; }
.info-card:hover { transform: translateY(-4px); }

/* Splide carousel */
@keyframes splide-loading {
  0% { transform: rotate(0); }
  to { transform: rotate(360deg); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5.2 Recomendacoes de Melhoria

- Adicionar scroll-triggered fade-in para secoes (IntersectionObserver)
- Stagger animation nos location cards ao entrar na viewport
- Parallax sutil nas ilustracoes decorativas
- Counter animation no "40EUR" badge

## 6. Design Tokens (Camada Semantica Completa)

### 6.1 Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-text-primary` | `#1C1C1C` | Texto principal |
| `--color-text-secondary` | `#6B6B6B` | Texto secundario, labels |
| `--color-text-tertiary` | `#999999` | Footer legal, captions |
| `--color-white` | `#FFFFFF` | Texto sobre dark, backgrounds |
| `--color-surface-primary` | `#FFFFFF` | Background principal |
| `--color-surface-blush` | `#F9F3F2` | Cards, secoes alternadas |
| `--color-surface-blush-hover` | `#F0E8E6` | Hover em cards blush |
| `--color-surface-dark` | `#1C1C1C` | Footer background |
| `--color-surface-dark-elevated` | `#2A2A2A` | Cards sobre dark |
| `--color-interactive-primary` | `#F63E3E` | CTA principal (vermelho) |
| `--color-interactive-primary-hover` | `#E03232` | Hover do CTA vermelho |
| `--color-interactive-secondary` | `#216FCE` | CTA secundario (azul) |
| `--color-interactive-secondary-hover` | `#1A5CAE` | Hover do CTA azul |
| `--color-accent-pink` | `#F9BBBB` | Decoracoes, badges |
| `--color-accent-teal` | `#77CBB9` | Sucesso, confirmacao |
| `--color-border-subtle` | `rgba(28,28,28,0.1)` | Bordas leves |
| `--color-border-default` | `rgba(28,28,28,0.2)` | Bordas normais |
| `--color-focus` | `#216FCE` | Focus ring |

### 6.2 Tipografia

```css
--font-display: "Escuela", sans-serif;
--font-body: "DM Sans", sans-serif;
--font-icons: "Icons";
```

### 6.3 Spacing

```css
--spacing-xs: 0.5rem;   /* 8px */
--spacing-sm: 1rem;     /* 16px */
--spacing-md: 1.5rem;   /* 24px */
--spacing-lg: 2rem;     /* 32px */
--spacing-xl: 3rem;     /* 48px */
--spacing-2xl: 4rem;    /* 64px */
--spacing-section: 6rem; /* 96px */
--spacing-page: 4rem;   /* 64px — margin lateral */
```

### 6.4 Breakpoints

```css
--bp-tablet: 48rem;   /* 768px */
--bp-desktop: 64rem;  /* 1024px */
--bp-wide: 80rem;     /* 1280px */
```

## 7. Responsive Strategy

| Breakpoint | Valor | Changes |
|-----------|-------|---------|
| Mobile | < 768px | Single column, hamburger nav, stacked hero, 1-col grids |
| Tablet | 768px+ | 2-col grids, expanded nav items, side-by-side hero |
| Desktop | 1024px+ | Full layout, 3-5 col grids, all features visible |
| Wide | 1280px+ | Max-width container, larger spacing |

## 8. Acessibilidade (Pontos Fortes do Original)

| Feature | Status | Detalhe |
|---------|--------|---------|
| Skip links | OK | "Springe zum Inhalt" + "Springe zum Fussbereich" |
| Landmarks | OK | banner, main, contentinfo, navigation |
| ARIA labels | OK | Buttons, links, carousel controls |
| Carousel a11y | OK | tablist, tab, tabpanel, aria-selected |
| prefers-reduced-motion | OK | Media query presente |
| Focus management | OK | Botoes e links com cursor pointer |
| Language | OK | `lang="de"` + hreflang alternates |
| Cookie consent | OK | Dialog role, switch controls |

### Melhorias Recomendadas

| Melhoria | Prioridade |
|---------|-----------|
| Adicionar `aria-live="polite"` ao carousel slide ativo | MEDIA |
| Focus trap no menu mobile quando aberto | ALTA |
| Alt text descritivo nas ilustracoes (nao apenas decorativas) | MEDIA |
| Color contrast check nos textos sobre blush background | MEDIA |

## 9. SEO & GEO

### Schema Markup Existente

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Warum sollte ich Plasmaspenden?", "acceptedAnswer": {...} },
    { "@type": "Question", "name": "Was ist der Unterschied...", "acceptedAnswer": {...} },
    { "@type": "Question", "name": "Wie oft im Jahr...", "acceptedAnswer": {...} }
  ]
}
```

### Schema Markup Recomendado (Adicional)

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "name": "Europlasma GmbH",
  "url": "https://www.europlasma.at/",
  "logo": "https://www.europlasma.at/logo.png",
  "description": "Plasmaspendezentren in Oesterreich",
  "address": { "@type": "PostalAddress", "addressCountry": "AT" },
  "numberOfEmployees": { "@type": "QuantitativeValue" },
  "department": [
    { "@type": "MedicalClinic", "name": "Europlasma Wien 9", "address": {...} },
    { "@type": "MedicalClinic", "name": "Europlasma Wien 21", "address": {...} }
  ],
  "sameAs": [
    "https://www.instagram.com/europlasma.at/",
    "https://www.facebook.com/europlasma.at",
    "https://www.linkedin.com/company/europlasma-gmbh/"
  ]
}
```

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "https://www.europlasma.at/" },
    { "position": 2, "name": "Spendezentren", "item": "https://www.europlasma.at/standorte/" },
    { "position": 3, "name": "{Location}", "item": "https://www.europlasma.at/standorte/{slug}/" }
  ]
}
```

### GEO Readiness

- FAQ estruturado com Schema.org — bom para citabilidade
- Conteudo informativo sobre plasma — potencial para AI extraction
- Adicionar blocos "Did you know?" com dados citaveis
- Permitir AI crawlers em robots.txt
- IndexNow para novos centros/atualizacoes

## 10. Performance Budget

| Metrica | Target |
|---------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Total page weight | < 2MB |
| Hero illustration | < 150KB (converter para SVG se possivel) |
| JS bundle | < 100KB (Splide + custom) |
| Fonts | < 200KB (Escuela 4 weights + DM Sans 3 weights, woff2) |

### Checklist

- [ ] `fetchpriority="high"` na hero illustration
- [ ] `loading="lazy"` em todas as imagens below-fold
- [ ] Converter ilustracoes PNG para SVG onde possivel
- [ ] Fonts com `font-display: swap`
- [ ] Critical CSS inline
- [ ] Splide JS lazy-loaded (IntersectionObserver)
- [ ] Video embed como facade (poster + play on click)

## 11. Tech Stack Recomendado

| Componente | Original | Recomendacao | Alternativa |
|-----------|----------|-------------|-------------|
| CMS | TYPO3 | Astro + headless CMS | Next.js + Storyblok |
| Styling | Custom CSS (hardcoded) | CSS custom properties (tokens) | Tailwind CSS |
| Carousel | Splide.js | Splide.js (manter) | Embla Carousel |
| Icons | Icon font (woff2) | Inline SVG sprites | Lucide icons |
| Booking | External (termine.europlasma.at) | Manter externo | — |
| Analytics | GTM + GA + Meta Pixel + Google Ads | Manter | — |
| Fonts | Self-hosted woff2 | Manter (otimo) | — |
| i18n | URL-based (/en/, /cs/, etc.) | Manter | — |
| Images | TYPO3 processed | Storyblok CDN / Cloudinary | Sharp + AVIF/WebP |

## 12. Arquivos do Modelo

| Arquivo | Descricao |
|---------|-----------|
| `dev-model.md` | Este blueprint completo |
| `tokens.json` | Design tokens exportaveis |
| `screenshots/01-homepage-full.png` | Screenshot full-page da homepage |

---

*Modelo extraido pelo WebCraft Squad — Synkra AIOX*
*Fonte: europlasma.at — Analise: 2026-03-17*
