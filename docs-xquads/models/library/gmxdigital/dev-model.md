# GMX Digital — Development Blueprint

> Hyperreal Agency Landing Model — para agencias digitais premium e servicos high-ticket

**Fonte:** https://gmxdigital.com/
**Tokens:** `tokens.json`
**Data:** 2026-03-17

---

## 1. Arquitetura — One-Page Sections

```
#inicio      → Hero (3D WebGL + gradient title + subtitle + scroll indicator)
             → Loading Screen (progress bar 0-100%)
             → Showreel (video embed com glass frame)
             → Marquee 1 (services keywords)
#sobre       → About (2-col: tunnel 3D visual + text + skill tags)
#servicos    → Services (section title + accordion/grid cards)
#metodo      → Method (4-step numbered timeline)
             → Marquee 2 (lifestyle keywords)
#portfolio   → Portfolio (drag carousel com video cards)
             → Segments Marquee (industries served)
#impacto     → Impact (stats + case studies cards)
             → Testimonials (blockquote carousel)
#criterios   → Criteria (segment tags + info cards + checkmarks)
#faq         → FAQ (accordion)
             → CTA Section (headline + CTA button)
             → Marquee 3 (motivation phrases)
#aplicacao   → Application Form (8-field + gradient CTA)
             → Footer (3-col: brand, nav, contact)
```

## 2. Section-by-Section Blueprint

### 2.1 Loading Screen

```html
<div class="loading-screen" role="status" aria-label="Carregando">
  <p class="loading-text">ENGENHARIA DA REALIDADE</p>
  <div class="loading-bar">
    <div class="loading-bar__fill" style="width: 0%"></div>
  </div>
  <p class="loading-percent">0%</p>
</div>
```

- Fullscreen overlay, dark bg
- Texto uppercase mono
- Barra de progresso com gradiente cyan→magenta
- Contagem 0-100%, dismiss ao completar
- Triggered: carregamento de assets 3D

### 2.2 Hero — 3D + Gradient Typography

```html
<section id="inicio" class="hero" aria-labelledby="hero-title">
  <canvas class="hero-3d" aria-hidden="true"></canvas>
  <div class="hero-content">
    <h1 id="hero-title" class="hero-title">
      <span>NOS ENGENHAMOS</span>
      <span class="gradient-text">A REALIDADE.</span>
    </h1>
    <p class="hero-subtitle">Engenharia Visual. Inteligencia Artificial. Conversao Absoluta.</p>
  </div>
  <div class="hero-scroll" aria-hidden="true">SCROLL</div>
</section>
```

```css
.gradient-text {
  background: var(--gradient-hero-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

- Canvas THREE.js com estrelas/particulas (ou tunnel GLB)
- Titulo em display font, primeira linha branca, segunda com gradient clip
- Subtitle em body font, cor secundaria
- "SCROLL" indicator no bottom center

### 2.3 Showreel Embed

```html
<button class="showreel" aria-label="Assistir showreel" onclick="openShowreel()">
  <div class="showreel__frame">
    <video poster="/showreel-poster.jpg" preload="none">
      <source src="/showreel.mp4" type="video/mp4">
    </video>
    <div class="showreel__meta">
      <span>SHOWREEL 2026</span>
      <span>00:45</span>
    </div>
    <div class="showreel__play">
      <span>PLAY</span>
      <svg><!-- play icon --></svg>
      <span>REEL</span>
    </div>
  </div>
</button>
```

- Frame com glassmorphism (blur + border translucida)
- Metadata em label font nos cantos (titulo + duracao)
- Botao PLAY centralizado com layout criativo

### 2.4 Marquee Ticker

```html
<div class="marquee marquee--dark" role="marquee" aria-label="Servicos">
  <div class="marquee__track">
    <span>ENGENHARIA VISUAL</span>
    <span class="marquee__dot" aria-hidden="true"></span>
    <span>INTELIGENCIA ARTIFICIAL</span>
    <span class="marquee__dot"></span>
    <!-- repeat x6 for seamless loop -->
  </div>
</div>
```

```css
.marquee__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-cyan-400);
  display: inline-block;
  margin: 0 24px;
}
@media (prefers-reduced-motion: reduce) {
  .marquee__track { animation: none; }
}
```

**3 marquees no site com conteudos diferentes:**
1. Services: ENGENHARIA VISUAL • IA • WEB DESIGN PREMIUM • BRANDING DE ELITE • CONVERSAO ABSOLUTA • CINEMATOGRAFIA HYPERREAL
2. Lifestyle: HYPER REALITY • IA GENERATIVA • CINEMATOGRAFIA • DESIGN DE ELITE • VISUAIS IMPOSSIVEIS
3. Motivation: SUA MARCA MERECE SER LENDARIA • O PROXIMO NIVEL COMECA AGORA • RESULTADOS QUE FALAM SOZINHOS

### 2.5 About Section — 2-col com 3D Visual

```html
<section id="sobre" class="about">
  <span class="section-number">01</span>
  <div class="about__layout">
    <div class="about__visual">
      <canvas class="about__3d" aria-hidden="true"></canvas>
      <!-- ou imagem/video do tunnel 3D -->
    </div>
    <div class="about__content">
      <span class="section-label">SOBRE NOS</span>
      <h2>O Universo<br>[Brand Name]</h2>
      <p class="about__lead">[Lead text — quem somos]</p>
      <p class="about__body">[Texto complementar]</p>
      <div class="about__tags">
        <span class="tag">Branding</span>
        <span class="tag">Web Design</span>
        <span class="tag">WebGL / 3D</span>
        <span class="tag">IA Generativa</span>
        <span class="tag">Cinematografia</span>
        <span class="tag">Conversao</span>
      </div>
    </div>
  </div>
</section>
```

### 2.6 Services — Glass Accordion Cards

```html
<section id="servicos" class="services">
  <div class="services__header">
    <span class="section-label">SERVICOS</span>
    <h2>Engenharia de<br>Conversao</h2>
    <p>[Subtitulo]</p>
  </div>
  <div class="services__grid">
    <button class="service-card" aria-expanded="false">
      <div class="service-card__header">
        <span class="service-card__tag">EXPERIENCIA IMERSIVA • WEB DESIGN</span>
        <span class="service-card__toggle">+</span>
      </div>
      <h3 class="service-card__title">Desenvolvimento Web & WebGL</h3>
      <p class="service-card__desc">[Descricao do servico]</p>
    </button>
    <!-- More service cards... -->
  </div>
</section>
```

**Layout:**
- 1 card full-width no topo
- 2 cards lado a lado (2-col)
- 1 card full-width + 1 card full-width
- Glassmorphism: bg rgba(255,255,255,0.06), border rgba(255,255,255,0.1), backdrop-blur 20px
- Expand/collapse com "+"/"-"

### 2.7 Method — 4-Step Timeline

```html
<section id="metodo" class="method">
  <div class="method__header">
    <span class="section-label">PROCESSO</span>
    <h2>Metodo [Brand]</h2>
    <p>[Subtitulo]</p>
  </div>
  <div class="method__steps">
    <div class="method-step">
      <span class="method-step__number">01</span>
      <h4 class="method-step__title">Diagnostico & Direcao</h4>
      <p class="method-step__desc">[Descricao]</p>
    </div>
    <!-- Steps 02, 03, 04 -->
  </div>
</section>
```

- Grid 4-col desktop, 2-col tablet, 1-col mobile
- Numeros em cyan, label font
- Cards com borda glass sutil

### 2.8 Portfolio — Drag Carousel

```html
<section id="portfolio" class="portfolio">
  <div class="portfolio__header">
    <span class="section-label">PORTFOLIO</span>
    <h2>[Headline do portfolio]</h2>
    <p class="portfolio__hint">arraste para explorar &rarr;</p>
  </div>
  <div class="portfolio__carousel" role="region" aria-label="Portfolio">
    <div class="portfolio__track">
      <button class="portfolio-card" aria-label="[Project name]">
        <img src="/project.jpg" alt="[Project description]" loading="lazy">
        <div class="portfolio-card__overlay">
          <h3>[Project Name]</h3>
          <p>[One-line description]</p>
          <span class="portfolio-card__cta">ASSISTIR VIDEO</span>
        </div>
      </button>
      <!-- More cards + clones for infinite loop -->
    </div>
  </div>
</section>
```

- Drag horizontal (mouse/touch)
- Auto-scroll com loop infinito (clones)
- Cards com imagem + gradient overlay bottom→top
- Click abre modal/lightbox de video

### 2.9 Impact — Stats + Case Studies

```html
<section id="impacto" class="impact">
  <div class="impact__header">
    <span class="section-label">IMPACTO</span>
    <h2>[Headline]</h2>
    <p>[Subtitulo]</p>
  </div>
  <div class="impact__stats">
    <div class="stat">
      <h3 class="stat__number">+280%</h3>
      <p class="stat__desc">[O que significa]</p>
    </div>
    <!-- More stats -->
  </div>
  <p class="impact__disclaimer">[Disclaimer das metricas]</p>
  <div class="impact__cases">
    <article class="case-card">
      <span class="case-card__tag">CASE 01</span>
      <h3 class="case-card__title">[Segmento]</h3>
      <p><strong>Cliente:</strong> [descricao]</p>
      <p><strong>Objetivo:</strong> [descricao]</p>
      <p><strong>Intervencao:</strong> [descricao]</p>
      <p><strong>Resultado:</strong> [metrica]</p>
    </article>
    <!-- More cases -->
  </div>
</section>
```

- Stats em tipografia monumental (6xl, black weight)
- 3 case studies em grid 3-col com glassmorphism cards
- Formato: Cliente → Objetivo → Intervencao → Resultado

### 2.10 Application Form

```html
<section id="aplicacao" class="application">
  <div class="application__info">
    <span class="section-label">APLICACAO</span>
    <h2>[Headline]</h2>
    <p>[Subtitulo]</p>
    <ul class="application__checklist">
      <li>&#10003; [Beneficio 1]</li>
      <li>&#10003; [Beneficio 2]</li>
      <li>&#10003; [Beneficio 3]</li>
    </ul>
  </div>
  <form class="application__form">
    <div class="form-row">
      <div class="form-field">
        <input type="text" id="name" required>
        <label for="name">Seu Nome</label>
      </div>
      <div class="form-field">
        <input type="email" id="email" required>
        <label for="email">Seu E-mail</label>
      </div>
    </div>
    <!-- More rows: WhatsApp + Empresa, Site + Objetivo, Servico + Prazo, Mensagem -->
    <button type="submit" class="btn btn-gradient">INICIAR PROJETO</button>
    <p class="form-disclaimer">[LGPD disclaimer]</p>
    <div class="form-alternative">
      <p>Prefere falar direto?</p>
      <a href="https://wa.me/[number]" class="btn btn-outline">CHAMAR NO WHATSAPP</a>
    </div>
  </form>
</section>
```

- 2-col layout: info esquerda, form direita
- Floating labels (label sobe ao focus/fill)
- Selects customizados para servico e prazo
- CTA com gradiente cyan→magenta, full-width, pill radius
- WhatsApp como fallback

## 3. Design Patterns

### 3.1 Section Label Pattern

Cada secao inicia com:
```html
<span class="section-label">[LABEL EM CYAN]</span>
<h2>[Titulo Principal]</h2>
<p>[Subtitulo opcional]</p>
```

- Label: mono font, uppercase, wide letter-spacing, cor cyan
- H2: display font, black weight, tight line-height
- Subtitulo: body font, cor secundaria

### 3.2 Dark/Light Alternation

```
DARK   — Hero, Marquees, Portfolio, Form, Footer (#0A0A14, #141420)
LIGHT  — About, Services, Method, Criteria, FAQ (#F5F5F5)
```

### 3.3 Glassmorphism Card Pattern

```css
.glass-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: var(--spacing-8);
}
/* Light variant */
.glass-card--light {
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.06);
}
```

### 3.4 Gradient CTA Pattern

```css
.btn-gradient {
  background: linear-gradient(135deg, var(--color-cyan-400) 0%, var(--color-magenta-400) 100%);
  color: white;
  font-family: var(--font-label);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
  padding: 18px 48px;
  border-radius: var(--radius-full);
  border: none;
  font-weight: 700;
}
.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: white;
}
```

### 3.5 Section Number Pattern

```html
<span class="section-number">01</span>
```
- Numeracao sequencial das secoes (01, 02, ...)
- Label font, cor muted, posicao: top-left da secao

### 3.6 Floating Elements

| Elemento | Posicao | Comportamento |
|----------|---------|---------------|
| CTA "INICIAR PROJETO" | Bottom center | Sticky, dark pill com dot cyan pulsante |
| WhatsApp icon | Bottom right | Fixed, abre wa.me |
| Awwwards badge | Right center | Fixed, link externo |
| Section nav dots | Right center | Fixed, scroll-to-section |
| Scroll progress | Bottom left | Counter numerico (0-100) com barra cyan |
| Back to top | Bottom right | Aparece apos scroll |

## 4. Motion Design

| Elemento | Tipo | Duracao | Easing |
|----------|------|---------|--------|
| Loading bar | Width 0→100% | ~3s | linear |
| Hero 3D | THREE.js animation loop | Continuous | n/a |
| Hero title | Fade-in + scale | 600ms | expressive |
| Marquee | Translate-X loop | 25s | linear |
| Section reveals | Fade-up on scroll | 600ms | expressive |
| Service card expand | Height + opacity | 300ms | productive |
| Portfolio drag | Transform translate | realtime | spring |
| Stats count-up | Number increment | 1500ms | productive |
| FAQ expand | Height + rotate icon | 300ms | productive |
| Hover sound | Audio playback | instant | n/a |
| Floating CTA dot | Pulse scale | 2s loop | ease-in-out |
| Nav dots | Scale on active | 200ms | productive |

**prefers-reduced-motion:**
- Desabilitar marquee, 3D animation, hover sounds
- Manter scroll reveals mas sem translate (apenas opacity)

## 5. Responsive Strategy

| Breakpoint | Layout Changes |
|-----------|---------------|
| Mobile (<640px) | Single column, hero title 3xl, services stack, method 1-col, portfolio 1 card, form stack, section nav hidden |
| Tablet (640-1024px) | Services 1+2 layout, method 2-col, portfolio 2 cards visible, form 1-col |
| Desktop (1024px+) | Full layout, services mixed grid, method 4-col, portfolio 3+ cards, form 2-col, all floating elements visible |

## 6. Acessibilidade (Correcoes)

| Original | Correcao |
|----------|----------|
| Inputs sem label semantico | Floating labels com `<label for="">` real |
| Marquee sem reduced-motion | `prefers-reduced-motion: reduce` |
| Canvas 3D sem fallback | `aria-hidden="true"` no canvas + conteudo alternativo |
| Portfolio cards como buttons | `aria-label` descritivo em cada card |
| FAQ sem aria-expanded | Accordion com `aria-expanded` e `aria-controls` |
| Contraste cyan/preto | Verificar AA em corpo de texto, usar cyan-500 se necessario |
| Loading screen | `role="status"` + `aria-label` |
| Section nav dots | `aria-label` em cada botao |

## 7. SEO & GEO (Melhorias)

### Schema Markup

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "[Brand]",
  "description": "[Descricao]",
  "url": "https://[domain]/",
  "telephone": "+55[phone]",
  "areaServed": ["BR", "Global"],
  "serviceType": ["Web Design", "Branding", "AI Cinematography"]
}
```

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Pergunta]",
      "acceptedAnswer": { "@type": "Answer", "text": "[Resposta]" }
    }
  ]
}
```

### One-Page SEO Strategy
- Title tag com keywords primarios
- Meta description com proposta de valor
- Structured data FAQPage para featured snippets
- OG/Twitter cards com hero image
- Canonical URL
- Hreflang para versao EN

## 8. Performance Budget

| Metrica | Target | Desafio |
|---------|--------|---------|
| LCP | < 2.5s | 3D WebGL precisa lazy-load |
| INP | < 200ms | Portfolio drag deve ser performante |
| CLS | < 0.1 | Loading screen previne shift |
| Total page weight | < 3MB | 3D + video exigem gestao cuidadosa |
| 3D assets | < 500KB | GLB comprimido + draco |
| Video poster | < 100KB | WebP/AVIF |
| JS bundle | < 200KB | THREE.js tree-shaken |
| Fonts | < 100KB | Subset woff2 |

### Performance Strategy
- [ ] Loading screen enquanto 3D carrega (percepcionalmente rapido)
- [ ] THREE.js importado via dynamic import
- [ ] Video facade: poster image + play on click (nao autoplay)
- [ ] Portfolio images lazy-loaded
- [ ] Fonts subsetted + preloaded
- [ ] CSS critical inline
- [ ] IntersectionObserver para section reveals
- [ ] Canvas pausado quando fora do viewport

## 9. Tech Stack Recomendado

| Componente | Recomendacao | Alternativa |
|-----------|-------------|-------------|
| Framework | Astro (SSG) | Vite vanilla |
| 3D | THREE.js (tree-shaken) | React Three Fiber |
| Scroll | Native IntersectionObserver | GSAP ScrollTrigger |
| Carousel | Custom drag logic | Embla Carousel |
| Forms | Native + fetch API | Formspree, Netlify Forms |
| Animation | CSS + WAAPI | Framer Motion |
| Hosting | Vercel / Netlify | Cloudflare Pages |

---

*Modelo extraido pelo WebCraft Squad — Synkra AIOX*
*Fonte: gmxdigital.com — Analise: 2026-03-17*
