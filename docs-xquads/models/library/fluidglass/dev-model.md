# Fluid Glass — Development Blueprint

> Architectural Glazing Showcase Model — para marcas premium de arquitetura/engenharia com forte presenca visual e estetica glassmorphism

**Fonte:** https://fluid.glass/
**Tokens:** `tokens.json`
**Data:** 2026-03-17

---

## Scores (Disseccao WebCraft Squad)

| Dimensao | Score |
|----------|-------|
| Estrutura & Padroes | 9/10 |
| Design Visual & Criativo | 9.5/10 |
| Animacao & Motion | 8.5/10 |
| Design Tokens | 5/10 |
| Performance | 8/10 |
| Acessibilidade | 6/10 |
| SEO | 6/10 |
| GEO / AI Search | 4/10 |
| **Global** | **7.0/10** |

## Pontos Fortes

- Metafora material→digital: vidro real inspira glassmorphism, transparencia, blur
- Grid 24 colunas com flexibilidade extrema para layouts assimetricos
- Fluid typography via `calc((100vw/var(--size))*10)` — escala sem breakpoints
- Navegacao bottom-center — diferenciador forte, quebra padrao header-top
- Dual typography: Mono (tecnico/labels) + Proporcional (editorial/body)
- Paleta ultra-restrita (5 cores) — disciplina que gera identidade
- `color-mix()` para variantes de opacidade sem duplicacao
- CSS 3D puro (sem WebGL) — efeito premium com performance leve
- Custom cursor glassmorphism — micro-delight alinhado ao produto
- App-like scroll model — controle total sobre layers e overlays

## Pontos a Melhorar (corrigidos no dev-model)

- Sem `prefers-reduced-motion` — corrigido com media query em todas as animacoes
- `outline: 0` sem alternativa — corrigido com focus-visible customizado
- Sem Schema.org (JSON-LD) — adicionado Organization, Product, BreadcrumbList
- Tokens apenas primitivos — adicionada camada semantica completa
- Conteudo pouco citavel para AI — adicionadas recomendacoes GEO
- Formulario sem `aria-required` — corrigido com atributos de acessibilidade

## Ideal Para

- Marcas de arquitetura, engenharia e construcao premium
- Empresas de materiais de construcao de alto padrao
- Showrooms digitais de produtos fisicos sofisticados
- Sites institucionais com forte apelo visual e pouca densidade de texto
- Qualquer marca que queira estetica glassmorphism autentica

## Tags

`glassmorphism` `architectural` `premium` `minimal` `nuxt` `vue` `24-col-grid` `fluid-typography` `dark-mode` `css-3d` `bottom-nav` `app-like` `storyblok`

---

## 1. Sitemap & Routing

```
/                          → Homepage (intro 3D, hero video, projects, about, quote CTA, footer)
/projects/                 → Project listing (filterable grid)
/projects/{slug}/          → Project detail (hero, description, gallery, specs, related)
/about/                    → About page (team, history, capabilities)
/contact/                  → Contact / Quote request
/privacy-policy/           → Legal
```

## 2. Page Templates

### 2.1 Homepage

```
┌─────────────────────────────────────────────────────────────────┐
│  INTRO: Full-screen overlay (z-99)                              │
│  ├── Cubo 3D CSS rotativo (1.5s, ease-in-out-quad)             │
│  ├── Brand wordmark (SVG mask)                                  │
│  └── Fade-out ao completar → revela main                        │
├─────────────────────────────────────────────────────────────────┤
│  HERO: Full-viewport video (Vimeo embed)                        │
│  ├── Background overlay (color-mix black 40%)                   │
│  ├── Custom video controls (timeline, play/pause)               │
│  └── Scroll indicator                                           │
├─────────────────────────────────────────────────────────────────┤
│  PROJECTS: Grid de projetos (24-col layout)                     │
│  ├── Filter bar (categorias, materiais)                         │
│  ├── Project cards (image + title + specs)                      │
│  └── Load more / infinite scroll                                │
├─────────────────────────────────────────────────────────────────┤
│  ABOUT: Brand statement + capabilities                          │
│  ├── Typography display (Aeonik Pro, 6.4rem)                    │
│  └── Split layout (text left, image right)                      │
├─────────────────────────────────────────────────────────────────┤
│  QUOTE CTA: Call-to-action para orcamento                       │
│  ├── Headline + subtext                                         │
│  └── Button abre Quote Panel (side drawer 121.6rem)             │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Minimal (links, legal, credits)                        │
│  └── Nav legal + privacy policy                                 │
├─────────────────────────────────────────────────────────────────┤
│  HEADER: Fixed bottom-center floating pill (27.6rem x 5rem)     │
│  ├── Logo (5rem x 5rem, esquerda)                               │
│  ├── Title wordmark (17rem, centro)                             │
│  └── Menu toggle (direita) → abre overlay menu                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Project Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│  HERO: Full-bleed project photo                                 │
│  ├── H1 display (project name)                                  │
│  └── Location + year (label font, mono)                         │
├─────────────────────────────────────────────────────────────────┤
│  CONTENT: 24-col grid layout                                    │
│  ├── Left (cols 1-14): Long-form description                    │
│  └── Right (cols 16-24): Spec table (material, dimensions, etc) │
├─────────────────────────────────────────────────────────────────┤
│  GALLERY: Image grid (masonry ou uniform)                       │
│  ├── Lightbox on click                                          │
│  └── Lazy loading com Storyblok CDN                             │
├─────────────────────────────────────────────────────────────────┤
│  RELATED: "More projects" + card carousel                       │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Component Library

### 3.1 Navigation — Bottom-Center Floating Pill

```html
<header class="header" role="banner">
  <a href="/" class="logo" aria-label="Home">
    <svg class="logo-icon" width="50" height="50" aria-hidden="true">
      <!-- Logo SVG mask -->
    </svg>
  </a>
  <span class="title" aria-hidden="true">FLUID GLASS</span>
  <button class="menu-toggle" aria-expanded="false" aria-controls="main-menu"
          aria-label="Open menu">
    <span class="menu-icon"></span>
  </button>
</header>
```

```css
.header {
  position: fixed;
  bottom: 4rem;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  z-index: 5;
  width: 27.6rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  width: 5rem;
  height: 5rem;
}

.title {
  width: 17rem;
  font-family: var(--font-label);
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-primary);
}

@media (max-width: 600px) {
  .header { bottom: 3rem; }
}
```

**Comportamento:**
- Fixed bottom-center (NAO top) — statement de design
- Pill shape com backdrop-filter blur
- Logo esquerda, wordmark centro, menu toggle direita
- Z-index 5 (abaixo de modais/overlays)

### 3.2 Menu Overlay — Glassmorphism

```html
<nav id="main-menu" class="menu" role="navigation" aria-label="Main"
     aria-hidden="true">
  <ul class="menu-list">
    <li><a href="/" class="menu-link">Home</a></li>
    <li><a href="/projects/" class="menu-link">Projects</a></li>
    <li><a href="/about/" class="menu-link">About</a></li>
    <li><a href="/contact/" class="menu-link">Contact</a></li>
  </ul>
</nav>
```

```css
.menu {
  position: absolute;
  bottom: 10rem;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  padding: 6rem;
  background: color-mix(in srgb, var(--color-black) 80%, transparent);
  backdrop-filter: blur(2rem);
  -webkit-backdrop-filter: blur(2rem);
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-normal) var(--easing-productive),
              visibility var(--duration-normal) var(--easing-productive);
}

.menu.is-open {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}
```

### 3.3 Intro — 3D Cube Animation

```html
<div class="intro" role="status" aria-label="Loading">
  <div class="cube-scene">
    <div class="cube">
      <div class="face face-front"></div>
      <div class="face face-back"></div>
      <div class="face face-right"></div>
      <div class="face face-left"></div>
      <div class="face face-top"></div>
      <div class="face face-bottom"></div>
    </div>
  </div>
</div>
```

```css
.intro {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: var(--color-surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cube-scene {
  perspective: 600px;
}

.cube {
  width: 3rem;
  height: 3rem;
  transform-style: preserve-3d;
}

.cube.rotate {
  animation: cube-rotate 1.5s var(--easing-expressive) forwards;
}

@keyframes cube-rotate {
  0%   { transform: rotateX(-30deg) rotateY(0) scaleY(0.78); }
  100% { transform: rotateX(-30deg) rotateY(-315deg) scaleY(0.78); }
}

.face {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-border-subtle);
}

.face-front  { transform: translateZ(1.5rem); }
.face-back   { transform: rotateY(180deg) translateZ(1.5rem); }
.face-right  { transform: rotateY(90deg) translateZ(1.5rem); }
.face-left   { transform: rotateY(-90deg) translateZ(1.5rem); }
.face-top    { transform: rotateX(90deg) translateZ(1.5rem); }
.face-bottom { transform: rotateX(-90deg) translateZ(1.5rem); }

@media (prefers-reduced-motion: reduce) {
  .cube.rotate { animation: none; transform: rotateX(-30deg) rotateY(-315deg) scaleY(0.78); }
  .intro { transition: opacity 0.01ms; }
}
```

### 3.4 Custom Cursor — Glassmorphism

```html
<div class="cursor" aria-hidden="true"></div>
```

```css
.cursor {
  position: fixed;
  height: 4.4rem;
  width: 10rem;
  border-radius: var(--radius-full);
  backdrop-filter: blur(2rem);
  -webkit-backdrop-filter: blur(2rem);
  background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.2));
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s linear;
  will-change: transform;
}

.cursor.is-visible { opacity: 1; }

@media (max-width: 600px) {
  .cursor { display: none; }
}

@media (hover: none) {
  .cursor { display: none; }
}
```

**JS behavior:** Segue o mouse com `transform: translate3d(x, y, 0)` via requestAnimationFrame.

### 3.5 Filter Panel — Side Drawer

```html
<aside class="filter-panel" role="dialog" aria-label="Filter projects"
       aria-hidden="true">
  <div class="filter-header">
    <h2 class="filter-title">Filters</h2>
    <button class="filter-close" aria-label="Close filters">
      <svg aria-hidden="true"><!-- X icon --></svg>
    </button>
  </div>
  <div class="filter-body">
    <fieldset class="filter-group">
      <legend class="filter-legend">Category</legend>
      <label class="filter-option">
        <input type="checkbox" class="checkbox" name="category" value="residential">
        <span class="filter-label">Residential</span>
      </label>
      <!-- more options -->
    </fieldset>
  </div>
  <div class="filter-footer">
    <button class="btn btn-black">Apply Filters</button>
    <button class="btn btn-ghost">Clear All</button>
  </div>
</aside>
```

```css
.filter-panel {
  position: fixed;
  inset: 4rem 4rem 4rem auto;
  width: 43rem;
  background: var(--color-surface-secondary);
  padding: 3rem;
  overflow-y: auto;
  z-index: 5;
  transform: translate3d(100%, 0, 0);
  transition: transform var(--duration-slow) var(--easing-expressive);
}

.filter-panel.is-open {
  transform: translate3d(0, 0, 0);
}

@media (max-width: 600px) {
  .filter-panel { inset: 0; width: 100%; }
}

.checkbox {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid color-mix(in srgb, var(--color-grey) 20%, transparent);
  width: 1.2rem;
  height: 1.2rem;
  position: relative;
  cursor: pointer;
}

.checkbox:checked::after {
  content: "";
  position: absolute;
  inset: 0.15rem;
  background: var(--color-grey);
}

.checkbox:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### 3.6 Quote Panel — Wide Side Drawer

```html
<aside class="quote-panel" role="dialog" aria-label="Request a quote"
       aria-modal="true" aria-hidden="true">
  <div class="quote-header">
    <h2>Request a Quote</h2>
    <button class="quote-close" aria-label="Close quote form">
      <svg aria-hidden="true"><!-- X icon --></svg>
    </button>
  </div>
  <form class="quote-form" novalidate>
    <div class="form-group">
      <label for="quote-name" class="form-label">Full Name</label>
      <input type="text" id="quote-name" class="input" required aria-required="true">
    </div>
    <div class="form-group">
      <label for="quote-email" class="form-label">Email</label>
      <input type="email" id="quote-email" class="input" required aria-required="true">
    </div>
    <div class="form-group">
      <label for="quote-message" class="form-label">Project Details</label>
      <textarea id="quote-message" class="input textarea" required aria-required="true"></textarea>
    </div>
    <button type="submit" class="btn btn-black">Submit</button>
  </form>
</aside>
```

```css
.quote-panel {
  position: fixed;
  inset: 0 0 0 auto;
  width: 121.6rem;
  max-width: 100vw;
  padding: 4rem;
  background: var(--color-surface-secondary);
  overflow-y: auto;
  z-index: 5;
  transform: translate3d(100%, 0, 0);
  transition: transform var(--duration-slow) var(--easing-expressive);
}

.quote-panel.is-open {
  transform: translate3d(0, 0, 0);
}

.input {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--color-grey) 20%, transparent);
  font-family: var(--font-body);
  font-size: 1.8rem;
  height: 8rem;
  padding: 4rem 2rem 1.5rem;
  background: transparent;
  transition: border-color var(--duration-fast) var(--easing-productive);
}

.input:focus-visible {
  outline: none;
  border-color: var(--color-grey);
  box-shadow: 0 0 0 2px var(--color-focus);
}

.textarea {
  resize: none;
  height: 14.8rem;
}

.form-label {
  position: absolute;
  top: 1.5rem;
  left: 2rem;
  font-family: var(--font-label);
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  pointer-events: none;
  transition: transform var(--duration-fast) var(--easing-productive);
}
```

### 3.7 Video Player — Custom Controls

```html
<section class="hero-video" aria-label="Showreel">
  <video class="video" playsinline muted>
    <source src="[vimeo-url]" type="video/mp4">
  </video>
  <div class="video-controls">
    <button class="video-play" aria-label="Play video">
      <svg aria-hidden="true"><!-- Play icon --></svg>
    </button>
    <div class="timeline" role="slider" aria-label="Video progress"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="progress"></div>
      <input type="range" class="range" min="0" max="100" value="0">
    </div>
    <button class="video-mute" aria-label="Unmute video">
      <svg aria-hidden="true"><!-- Mute icon --></svg>
    </button>
  </div>
</section>
```

```css
.timeline {
  position: absolute;
  inset: auto 4rem 7rem;
  height: 2rem;
}

.progress {
  position: absolute;
  width: 100%;
  top: 50%;
  height: 1px;
  background: color-mix(in srgb, var(--color-white) 40%, transparent);
}

.range {
  position: absolute;
  width: 100%;
  top: 50%;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 1px solid var(--color-white);
  border-radius: 50%;
}

.range:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### 3.8 Buttons

```css
/* Base */
.btn {
  font-family: var(--font-label);
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-productive),
              color var(--duration-fast) var(--easing-productive);
}

.btn:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Variants */
.btn-black {
  background: var(--color-black);
  color: var(--color-white);
  padding: 1.5rem 2.4rem;
}

.btn-black:hover {
  background: var(--color-grey);
}

.btn-white {
  background: color-mix(in srgb, var(--color-white) 20%, transparent);
  color: var(--color-white);
  padding: 1.5rem 2.4rem;
  backdrop-filter: blur(1rem);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 1.5rem 2.4rem;
  border: 1px solid color-mix(in srgb, var(--color-grey) 20%, transparent);
}
```

### 3.9 Overlay System

```css
/* Dark overlay (ativado quando painel/menu abre) */
main::before {
  content: "";
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--color-black) 40%, transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 1s ease-in-out;
  z-index: 2;
}

.is-overlay main::before {
  opacity: 1;
  pointer-events: auto;
}

/* Section overlay (gradient escuro sobre video/imagem) */
.background::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%);
  z-index: 1;
}
```

## 4. Design Patterns

### 4.1 Layout Model — Fixed + Scroll Container

```css
html, body {
  inset: 0;
  overflow: hidden;
  position: fixed;
  margin: 0;
  padding: 0;
}

main {
  background: var(--color-surface-primary);
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.scroll {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  z-index: 1;
  -webkit-overflow-scrolling: touch;
}
```

**Por que este padrao:**
- Controle total sobre stacking (modais, overlays, cursor nao scrollam)
- Permite efeitos parallax sem hacks
- Video backgrounds ficam fixos naturalmente
- Overlays cobrem tudo sem conflito de scroll

### 4.2 Grid System — 24 Colunas

```css
.grid {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-column-gap: 2rem;
  margin: 0 4rem;
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: repeat(6, 1fr);
    grid-column-gap: 1.5rem;
    margin: 0 2rem;
  }
}
```

**Subdivisoes possiveis:**
- 24/2 = 12 cols cada (50/50)
- 24/3 = 8 cols cada (33/33/33)
- 24/4 = 6 cols cada (25/25/25/25)
- 14 + 10 (58/42 — content + sidebar)
- 16 + 8 (67/33 — wide content + narrow specs)

### 4.3 Fluid Typography

```css
:root {
  --size: 1600; /* desktop reference width */
  --font-s: calc((100vw / var(--size)) * 10);
}

@media (max-width: 600px) {
  :root { --size: 375; } /* mobile reference width */
}
```

**Como funciona:** 1rem = `(100vw/1600)*10`. Em viewport 1600px, 1rem = 10px. Em 1920px, 1rem = 12px. Em mobile 375px, 1rem = 10px novamente (reset via --size: 375). Toda a tipografia escala proporcionalmente sem media queries adicionais.

### 4.4 Glassmorphism Pattern

```css
/* Aplicado em: menu, cursor, botoes ghost */
.glass {
  background: color-mix(in srgb, var(--color-black) 80%, transparent);
  backdrop-filter: blur(2rem);
  -webkit-backdrop-filter: blur(2rem);
  border: 1px solid color-mix(in srgb, var(--color-white) 10%, transparent);
}

.glass-light {
  background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.2));
  backdrop-filter: blur(2rem);
  -webkit-backdrop-filter: blur(2rem);
}
```

### 4.5 Tipografia Hierarchy

| Elemento | Font | Size | Weight | Transform | Spacing |
|----------|------|------|--------|-----------|---------|
| H1 display | Aeonik Pro | 6.4rem | 700 | none | -0.03em |
| H2 section | Aeonik Pro | 3.2rem | 700 | none | -0.02em |
| Body | Aeonik Pro | 1.6-1.8rem | 400 | none | normal |
| Label/UI | Aeonik Mono | 1.2rem | 500 | uppercase | +0.08em |
| Nav item | Aeonik Mono | 1.2rem | 500 | uppercase | +0.08em |
| Button | Aeonik Mono | 1.2rem | 500 | uppercase | +0.08em |

**Regra dual-type:** Aeonik Pro para conteudo editorial/heading. Aeonik Mono para tudo tecnico/funcional (labels, nav, buttons, specs, metadata).

### 4.6 Color-Mix Opacity System

```css
/* Em vez de definir cores com alpha separadas, usa color-mix() */

/* Bordas sutis */
border: 1px solid color-mix(in srgb, var(--color-grey) 20%, transparent);

/* Overlay escuro */
background: color-mix(in srgb, var(--color-black) 40%, transparent);

/* Botao ghost */
background: color-mix(in srgb, var(--color-white) 20%, transparent);

/* Hover state */
background: color-mix(in srgb, var(--color-black) 80%, transparent);
```

**Vantagem:** Uma unica cor primitiva gera todas as variantes de opacidade. Sem duplicacao de tokens. Muda a cor base, todas as variantes mudam automaticamente.

### 4.7 Secao Alternancia (Dark/Light)

```
Section 1: INTRO   — bg.secondary (#F3F0EC) cream — intro overlay
Section 2: HERO    — bg.primary (#212325) grey — video background
Section 3: CONTENT — bg.secondary (#F3F0EC) cream — text/projects
Section 4: CTA     — bg.primary (#212325) grey — quote call-to-action
Section 5: FOOTER  — bg.primary (#212325) grey — footer
```

## 5. Animation System

### 5.1 Easing Tokens

```css
:root {
  /* Productive — UI transitions, menus, panels */
  --easing-productive: cubic-bezier(0.645, 0.045, 0.355, 1);  /* in-out-cubic */

  /* Expressive — featured animations, hero, intro */
  --easing-expressive: cubic-bezier(0.77, 0, 0.175, 1);       /* in-out-quart */

  /* Exit — elements leaving the screen */
  --easing-exit: cubic-bezier(0.165, 0.84, 0.44, 1);          /* out-quart */
}
```

### 5.2 Duration Tokens

```css
:root {
  --duration-instant: 0.1s;   /* cursor feedback */
  --duration-fast: 0.2s;      /* hover, focus, micro-interactions */
  --duration-normal: 0.5s;    /* panel transitions, color changes */
  --duration-slow: 1.0s;      /* overlay fades, page transitions */
  --duration-intro: 1.5s;     /* intro cube animation */
}
```

### 5.3 Reduced Motion (CORRECAO)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .cursor { display: none; }
  .intro { display: none; } /* Skip intro entirely */
}
```

## 6. Design Tokens (Camada Semantica Completa)

### 6.1 Primitivos

```json
{
  "color": {
    "black": { "value": "#0b1012" },
    "white": { "value": "#ffffff" },
    "cream": { "value": "#f3f0ec" },
    "taupe": { "value": "#d4cec6" },
    "grey":  { "value": "#212325" }
  },
  "font": {
    "mono": { "value": "Aeonik Mono" },
    "pro":  { "value": "Aeonik Pro" }
  },
  "size": {
    "desktop": { "value": 1600 },
    "mobile":  { "value": 375 }
  }
}
```

### 6.2 Semanticos

```json
{
  "color": {
    "surface": {
      "primary":   { "value": "{color.grey}" },
      "secondary": { "value": "{color.cream}" }
    },
    "text": {
      "primary":   { "value": "{color.white}" },
      "secondary": { "value": "{color.taupe}" },
      "inverse":   { "value": "{color.grey}" }
    },
    "interactive": {
      "default": { "value": "{color.black}" },
      "hover":   { "value": "{color.grey}" }
    },
    "border": {
      "subtle":  { "value": "color-mix(in srgb, {color.grey} 20%, transparent)" },
      "default": { "value": "{color.grey}" }
    },
    "focus": { "value": "#4A90D9" }
  },
  "font": {
    "heading": { "value": "{font.pro}" },
    "body":    { "value": "{font.pro}" },
    "label":   { "value": "{font.mono}" }
  },
  "spacing": {
    "page": {
      "desktop": { "value": "4rem" },
      "mobile":  { "value": "2rem" }
    },
    "grid-gap": {
      "desktop": { "value": "2rem" },
      "mobile":  { "value": "1.5rem" }
    },
    "section": { "value": "8rem" },
    "component": { "value": "3rem" }
  },
  "radius": {
    "none": { "value": "0" },
    "sm":   { "value": "0.4rem" },
    "full": { "value": "9999px" }
  },
  "shadow": {
    "glass": { "value": "0 0 0 1px color-mix(in srgb, {color.white} 10%, transparent)" }
  },
  "z-index": {
    "base":    { "value": "1" },
    "header":  { "value": "5" },
    "panel":   { "value": "5" },
    "cursor":  { "value": "10" },
    "overlay": { "value": "50" },
    "intro":   { "value": "99" }
  },
  "duration": {
    "instant": { "value": "0.1s" },
    "fast":    { "value": "0.2s" },
    "normal":  { "value": "0.5s" },
    "slow":    { "value": "1.0s" },
    "intro":   { "value": "1.5s" }
  },
  "easing": {
    "productive": { "value": "cubic-bezier(0.645, 0.045, 0.355, 1)" },
    "expressive": { "value": "cubic-bezier(0.77, 0, 0.175, 1)" },
    "exit":       { "value": "cubic-bezier(0.165, 0.84, 0.44, 1)" }
  }
}
```

## 7. Responsive Strategy

| Breakpoint | Valor | Grid | Margin | Gap |
|-----------|-------|------|--------|-----|
| Mobile | max-width: 600px | 6 cols | 2rem | 1.5rem |
| Desktop | min-width: 601px | 24 cols | 4rem | 2rem |

**Fluid scaling:** Tipografia escala automaticamente via `--size` variable. Nenhum breakpoint adicional necessario para font sizes.

**Hover detection:**
```css
@media (hover: hover) { /* Mouse/trackpad — show hover effects */ }
@media (hover: none) { /* Touch — hide cursor, simplify interactions */ }
```

## 8. Acessibilidade (Correcoes sobre o Original)

| Original | Correcao no Modelo |
|----------|-------------------|
| `outline: 0` sem alternativa | `:focus-visible` com outline customizado + box-shadow |
| Sem `prefers-reduced-motion` | Media query global + skip intro |
| Custom cursor pode confundir | `aria-hidden="true"` + hidden em touch/mobile |
| Checkbox sem label visivel | Labels explicitos com `<label>` + `for` |
| Formulario sem `aria-required` | `required` + `aria-required="true"` em campos obrigatorios |
| Menu sem `aria-expanded` | Toggle button com `aria-expanded` + `aria-controls` |
| Panels sem `aria-modal` | `role="dialog"` + `aria-modal="true"` + focus trap |
| H1 visually hidden | Manter — tecnica valida para SR |
| Landmarks presentes | Manter — `role="banner"`, `role="main"`, `role="contentinfo"` |

## 9. SEO & GEO (Melhorias sobre o Original)

### Schema Markup Recomendado

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Fluid Glass",
  "url": "https://fluid.glass/",
  "logo": "https://fluid.glass/logo.png",
  "description": "Structural & Architectural Glazing Specialists",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "[Country]"
  },
  "sameAs": ["[social-urls]"]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Architectural Glazing",
  "provider": { "@type": "Organization", "name": "Fluid Glass" },
  "description": "Structural and architectural glazing solutions for commercial and residential projects",
  "areaServed": "[Region]"
}
```

### Breadcrumb

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "https://fluid.glass/" },
    { "position": 2, "name": "Projects", "item": "https://fluid.glass/projects/" },
    { "position": 3, "name": "[Project Name]", "item": "https://fluid.glass/projects/[slug]/" }
  ]
}
```

### GEO Readiness

- Blocos de conteudo com headings claros (H2/H3) para RAG extraction
- Specs em formato `<dl>` (definition list) — maquinas parseiam melhor
- FAQ section para citabilidade (perguntas comuns sobre glazing)
- IndexNow para notificar updates de projetos
- Allow GPTBot, ChatGPT-User, Google-Extended em robots.txt

## 10. Performance Budget

| Metrica | Target |
|---------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Total page weight | < 3MB (video excluded) |
| Hero video | Facade pattern (poster + play on click) |
| JS bundle | < 150KB (Nuxt SSG) |
| Fonts | < 120KB (2 families, woff2, display:swap) |
| Images | AVIF > WebP > JPG via CDN |

### Checklist de Performance

- [ ] Video hero com facade pattern (poster image, load on interaction)
- [ ] `loading="lazy"` em todas as imagens below-fold
- [ ] Responsive images com Storyblok CDN transforms
- [ ] Fonts self-hosted em woff2 com `font-display: swap`
- [ ] CSS critical inline no `<head>`
- [ ] `will-change: transform` apenas em elementos animados
- [ ] `backdrop-filter` limitado a max 3 elementos simultaneos
- [ ] Pre-render (SSG) para todas as paginas

## 11. Tech Stack Recomendado

| Componente | Recomendacao | Alternativa |
|-----------|-------------|-------------|
| Framework | Nuxt 3 (SSG) | Astro |
| Styling | CSS custom properties (tokens) | Tailwind CSS |
| State | Pinia | Vuex 4 |
| CMS | Storyblok | Sanity, Strapi |
| Animation | CSS Animations + WAAPI | GSAP |
| Video | Vimeo (facade) | Cloudflare Stream |
| Images | Storyblok CDN (AVIF/WebP) | Cloudinary, Imgix |
| Fonts | Self-hosted woff2 | — |
| Deploy | Vercel / Netlify (static) | Cloudflare Pages |

## 12. Arquivos do Modelo

| Arquivo | Descricao |
|---------|-----------|
| `dev-model.md` | Este blueprint completo |
| `tokens.json` | Design tokens exportaveis (criar separadamente) |
| `screenshots/` | Screenshots de referencia (a capturar) |

---

*Modelo extraido pelo WebCraft Squad — Synkra AIOX*
*Fonte: fluid.glass — Analise: 2026-03-17*
