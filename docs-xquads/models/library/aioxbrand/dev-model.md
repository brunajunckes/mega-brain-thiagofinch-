# AIOX Brand — Development Model (Design System & Brandbook)

> **URL:** https://brand.aioxsquad.ai/
> **Tipo:** Design System / Brandbook / Brand Identity Portal
> **Industria:** AI/Tech — Framework de Orquestracao de Agentes
> **Plataforma:** Next.js (App Router) + Tailwind CSS + Radix UI + shadcn/ui
> **Edicoes:** 2 temas — Lime (Dark Cockpit) + Gold (Golden Guideline)
> **Data de Analise:** 2026-03-17
> **Versao do Site:** V2.0

---

## [01] ARQUITETURA DE INFORMACAO

### Sitemap Model

```
brand.aioxsquad.ai/
├── / ........................... Homepage (Index / Landing)
│
├── /brandbook/ ................. Brandbook Hub (index)
│   ├── /guidelines ............. Brand Identity & Voice
│   ├── /movimento .............. Estrategia de Marca / Movimento
│   ├── /logo ................... Logo System
│   ├── /icons .................. Iconografia
│   ├── /moodboard .............. Visual Moodboard
│   └── /editorial .............. Editorial Showcase
│
├── /brandbook/ ................. Design Foundations
│   ├── /foundations ............ Foundations Index (hub)
│   ├── /typography ............. Font Families & Type Scale
│   ├── /color-tokens .......... Core Palette (Lime + Gold)
│   ├── /spacing-layout ........ Spacing, Z-Index, Breakpoints
│   ├── /surfaces .............. Elevation, Borders, Radius, Glass
│   ├── /semantic-tokens ....... Aliases, Glow, States, shadcn
│   └── /token-export .......... Token Export Reference
│
├── /brandbook/ ................. Design System (UI Components)
│   ├── /components ............ Component Catalog Index
│   ├── /buttons ............... Buttons (4 variantes)
│   ├── /cards ................. Cards (3 variantes)
│   ├── /forms ................. Forms (inputs, selects, textareas)
│   ├── /feedback .............. Alerts, Toasts, Modal, Empty States (7 secoes)
│   ├── /states ................ Interactive States
│   ├── /tables ................ Data Tables
│   ├── /lists ................. Lists & List Items
│   ├── /charts ................ Charts (bar + donut)
│   ├── /sections .............. Page Sections
│   ├── /advanced .............. Advanced Components
│   ├── /effects ............... Visual Effects
│   ├── /patterns .............. Grids, Frames & Textures
│   ├── /templates ............. Page Templates
│   ├── /motion ................ Motion & Animation System
│   ├── /navigation ............ Navigation Components
│   ├── /lp-sections ........... Landing Page Sections
│   ├── /seo ................... SEO Structured Data
│   └── /vfx ................... Visual Effects (Advanced)
│
├── /brandbook/showcase/ ........ Brand Showcase Gallery
│   ├── /apparel ............... Apparel Mockups
│   ├── /avatars ............... Avatar System
│   ├── /calc-squad ............ Calculator Squad
│   ├── /jackets ............... Jacket Designs
│   ├── /mockups ............... Device Mockups
│   ├── /outfits ............... Outfit Presentations
│   ├── /slides ................ Slide Deck Previews
│   └── /sneakers .............. Sneaker Designs
│
├── /pitch-deck/
│   └── /pitch-overview ........ Pitch Deck Overview
│
└── /workspace .................. Workspace / Dashboard
```

**Total: 44+ paginas** organizadas em 6 grupos tematicos.

### Taxonomia de Paginas

| Tipo de Pagina | Template | Exemplos |
|----------------|----------|----------|
| **Landing/Index** | Hero monumental + pilares + stats + FAQ + mega-footer | `/` |
| **Hub Index** | Banner header + card grid linkado | `/brandbook/foundations`, `/brandbook/components` |
| **Token Documentation** | Banner + section grid com swatches + valores | `/brandbook/color-tokens`, `/brandbook/typography` |
| **Component Library** | Banner + component demos + variant labels + status badges | `/brandbook/buttons`, `/brandbook/feedback` |
| **Showcase Gallery** | Banner + visual grid/masonry | `/brandbook/showcase/*` |
| **Brand Strategy** | Long-form editorial + manifesto | `/brandbook/guidelines`, `/brandbook/movimento` |
| **Utility** | Workspace/tools interface | `/workspace` |

### Navegacao

**Header (Global Navbar):**
```
[AIOX Logo] | Guidelines | Movimento | Pitch | Workspace | [Brandbook ▾] [Design System ▾] [Showcase ▾] | Theme: [Lime] [Gold]
```

- Logo → `/brandbook`
- 4 links diretos: Guidelines, Movimento, Pitch, Workspace
- 3 dropdown menus: Brandbook, Design System, Showcase
- Theme toggle: Lime (pressed) | Gold

**Footer (Simple):**
```
[AIOX Logo] Brand Identity System // v2.0 // Confidential
```

**Homepage Mega-Footer:**
```
[06] Footer
├── [AIOX Logo] + Stats (60+ Components, 27 Pages, 4 Pilares, 100% Tokens)
├── [brandbook] — 7 links numerados (0.0-6.0)
├── [design system] — 17 links numerados (0.0-16.0)
├── [showcase] — 2 links
├── [socials] — 6 links (X, TikTok, Instagram, YouTube, LinkedIn, GitHub)
└── [AIOX Monumental Logo] + Copyright
```

---

## [02] DESIGN SYSTEM

### Filosofia: Dark Cockpit

"Dark Cockpit e a filosofia visual do AIOX: um sistema 100% dark-first onde cada token de cor, componente e animacao foi desenhado para ambientes de alta performance. O nome referencia cockpits de aviacao — zero distracao, foco total na informacao."

### Paleta de Cores — Lime Theme (Primary)

**Accent & Signals:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bb-lime` | `oklch(0.934 0.2264 121.95)` | Primary accent. CTA, active states, emphasis |
| `--bb-blue` | `oklch(0.669 0.1837 248.81)` | Info accent. Secondary feedback |
| `--bb-flare` | `oklch(0.631 0.2116 36.21)` | Warm counter-accent. Editorial heat |
| `--bb-error` | `oklch(0.6368 0.2078 25.33)` | Destructive/error state |

**Surface Stack (7 niveis):**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bb-canvas` | `var(--bb-dark)` | Document canvas. Main route bg |
| `--bb-dark` | `oklch(0.1149 0 0)` | Dark shell. Hero panels |
| `--bb-surface` | `oklch(0.1693 0.0041 285.95)` | Primary raised surface. Cards, bars |
| `--bb-surface-alt` | `oklch(0.231 0.0099 124.97)` | Secondary surface. Nested blocks |
| `--bb-surface-panel` | `oklch(0.1785 0.0041 285.98)` | Panel shell. Sidebars, drawers |
| `--bb-surface-console` | `oklch(0.184 0.0081 118.61)` | Console/terminal zone |
| `--bb-surface-hover-strong` | `oklch(0.1971 0.006 285.84)` | Heavy hover state |

**Text & Reading Layer (6 niveis):**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bb-cream` | `oklch(0.9639 0.0158 106.69)` | Primary reading. Headlines and body |
| `--bb-cream-alt` | `oklch(0.9644 0.0172 103.15)` | Soft alternate off-white |
| `--bb-warm-white` | `oklch(0.9952 0.0235 106.82)` | Purest light. Logo, max contrast |
| `--bb-dim` | `rgba(245, 244, 231, 0.4)` | Muted copy. Labels, captions |
| `--bb-muted` | `oklch(0.7952 0 0)` | Neutral support. Tertiary text |
| `--bb-meta` | `oklch(0.6927 0 0)` | Metadata. Counters, technical labels |

**Neutral Scale (5 niveis):**
| Token | Valor |
|-------|-------|
| `--bb-gray-charcoal` | `oklch(0.36 0 0)` |
| `--bb-gray-dim` | `oklch(0.5208 0 0)` |
| `--bb-gray-muted` | `oklch(0.683 0 0)` |
| `--bb-gray-silver` | `oklch(0.7984 0 0)` |
| `--bb-muted-legacy` | `oklch(0.5173 0 0)` |

**Border System (5 tokens):**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bb-border` | `rgba(156, 156, 156, 0.15)` | Default. Grid, rules |
| `--bb-border-soft` | `rgba(156, 156, 156, 0.10)` | Hairline dividers |
| `--bb-border-strong` | `rgba(156, 156, 156, 0.25)` | Active shell framing |
| `--bb-border-hover` | `rgba(156, 156, 156, 0.24)` | Interactive feedback |
| `--bb-border-input` | `rgba(156, 156, 156, 0.20)` | Form border |

**Accent Opacity Ladder (14 steps):**
`--bb-accent-{02|04|05|06|08|10|12|15|20|25|40|50|75|90}`
Lime: `rgba(209, 255, 0, {opacity})`
Gold: `rgba(221, 209, 187, {opacity})`

**Contrast Pairs (Aprovados):**
- Lime / Dark: `--bb-lime on --bb-dark`
- Cream / Canvas: `--bb-cream on --bb-canvas`
- Dark / Lime: `--bb-dark on --bb-lime`
- Blue / Dark: `--bb-blue on --bb-dark`

### Paleta de Cores — Gold Theme (Secondary)

Mesma arquitetura de surface stack, text layer, borders — mas com accent champagne (`#DDD1BB`) ao inves de neon lime. Superficies levemente mais quentes (hex puro vs OKLCH).

### shadcn/ui Token Mapping

| shadcn Token | Maps To | Uso |
|-------------|---------|-----|
| `--background` | `--bb-canvas` | Page background |
| `--foreground` | `--bb-cream` | Default text |
| `--primary` | `--bb-lime` | Primary actions |
| `--primary-foreground` | `--bb-dark` | Text on primary |
| `--secondary` | `--bb-surface-alt` | Secondary bg |
| `--muted` | `--bb-surface-panel` | Muted backgrounds |
| `--muted-foreground` | `--bb-dim` | Muted text |
| `--accent` | `--bb-accent-10` | Accent backgrounds |
| `--accent-foreground` | `--bb-lime` | Accent text |
| `--destructive` | `--bb-error` | Error/destructive |
| `--border` | `--bb-border` | Default borders |
| `--input` | `--bb-border-input` | Input borders |
| `--ring` | `--bb-accent-40` | Focus ring |
| `--card` | `--bb-surface` | Card bg |
| `--card-foreground` | `--bb-cream` | Card text |
| `--popover` | `--bb-surface` | Popover bg |
| `--popover-foreground` | `--bb-cream` | Popover text |

### Tipografia

**Font Families:**
| Papel | Familia | Token | Weight | Uso |
|-------|---------|-------|--------|-----|
| Display | TASAOrbiterDisplay | `--font-bb-display` | 800 (Black) | H1-H4, Titles, Impact, Uppercase |
| Sans | Geist | `--font-bb-sans` | 400-700 | Body, UI, Labels |
| Mono | RobotoMono / GeistMono | `--font-bb-mono` | 400-500 | Code, Nav Labels, HUD, Status |

**Type Scale:**
| Nivel | Tamanho | Uso | Font |
|-------|---------|-----|------|
| Display | `4rem` (64px) | Brand mark, hero statements | Display |
| H1 | `2.5rem` (40px) | Page titles | Display, uppercase |
| H2 | `1.5rem` (24px) | Section titles | Display |
| Body | `1rem` (16px) | Base reading size | Sans |
| Small | `0.8rem` (12.8px) | Secondary text, descriptions | Sans |
| Label | `0.65rem` (10.4px) | HUD labels, nav, status | Mono, uppercase |
| Micro | `0.6rem` (9.6px) | Footer meta, class names, refs | Mono |

**Letter Spacing:**
| Nivel | Valor | Contexto |
|-------|-------|----------|
| Tight | `-1.2px` | Display headings (TASAOrbiter) |
| Normal | `0` | Body text (Geist) |
| Wide | `0.24px` | Nav links |
| Wider | `~1.3px` | HUD labels, uppercase mono |

### Espacamento

**Radius Scale:**
| Token | Valor |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius` | 0.5rem (8px) |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-2xl` | 24px |
| `--radius-full` | 9999px |

**Glass Effects:**
| Token | Valor |
|-------|-------|
| `--glass-blur` | 10px |
| `--glass-blur-soft` | 5px |

**Z-Index Stack:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--layer-base` | 0 | Default |
| `--layer-elevated` | 1 | Slightly raised |
| `--layer-sticky` | 10 | Sticky elements |
| `--layer-nav` | 100 | Navigation |
| `--layer-dropdown` | 200 | Dropdown menus |
| `--layer-overlay` | 300 | Overlays |
| `--layer-modal` | 400 | Modals |
| `--layer-toast` | 500 | Toast notifications |

### Spacing Scale (14 Steps)

| Token | Valor | Banda |
|-------|-------|-------|
| `--space-0` | 0px | Micro UI |
| `--space-1` | 4px | Micro UI |
| `--space-2` | 8px | Micro UI |
| `--space-3` | 12px | Micro UI |
| `--space-4` | 15px | Components |
| `--space-5` | 20px | Components |
| `--space-6` | 30px | Components |
| `--space-7` | 40px | Section/Layout |
| `--space-8` | 60px | Section/Layout |
| `--space-9` | 80px | Section/Layout |
| `--space-10` | 90px | Section/Layout |
| `--space-11` | 120px | Section/Layout |
| `--space-12` | 150px | Editorial |
| `--space-13` | 180px | Editorial |

**Named Spacing (Semantic):**
- `--spacing-xs`: 0.5rem (8px)
- `--spacing-sm`: 1rem (16px)
- `--spacing-md`: 2rem (32px)
- `--spacing-lg`: 3rem (48px)
- `--spacing-xl`: 4rem (64px)

### Motion Tokens

**CSS Keyframes (8):**
| Nome | Descricao |
|------|-----------|
| `bb-ticker` | Ticker/marquee horizontal scroll |
| `spin` | 360deg rotation for spinners |
| `ping` | Scale + opacity pulse (notifications) |
| `pulse` | Opacity breathing (loading) |
| `enter` | Element enter (opacity + transform) |
| `exit` | Element exit (opacity + transform) |
| `accordion-down` | Expand (height: 0 → auto) |
| `accordion-up` | Collapse (height: auto → 0) |

**Easing Curves:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bounce/spring animations |
| `--ease-smooth` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | General smooth transitions |
| `--ease-decel` | `cubic-bezier(0, 0, 0.2, 1)` | Deceleration (enter) |

**8 Logo Animations (GPU-Accelerated, Framer Motion):**
| Nome | Duracao | Uso |
|------|---------|-----|
| Orchestration Pulse | 3.5s | Hero/splash. Seed dot + stagger per letter + glow ring |
| Speed Lines | 2s | Emphasis. Logo slides with neon speed lines |
| Particle Orbit | loop | Agents theme. X central + 4 orbital particles |
| Logo Dissolve | 3s | Exit/fade. Letters flicker and dissolve |
| Morphing Square | 3.5s loop | Shape shift. Square → rounded → circle |
| Glitch Reveal | 2s | Tech/hacker. Scanlines + noise + skew + hue-rotate |
| Stagger Letters | 1.5s | Navbar/footer. Letters rise with spring + rotateX 3D |
| Brand Reveal | 3s | Landing hero. Black blinds slide open + scale + glow |

### Breakpoints

| Token | Valor | Tipo |
|-------|-------|------|
| `--bp-mobile` | 767px | max-width |
| `--bp-tablet` | 768px | min-width |
| `--bp-desktop` | 1200px | min-width |

Tailwind defaults tambem usados: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px

### Token Export (Production-Ready CSS)

Pagina `/brandbook/token-export` fornece blocos CSS copy-paste para ambos os temas:

**Lime Theme (hex/rgba, sem dependencia OKLCH):**
```css
@layer base {
  :root {
    --background: #050505;
    --foreground: #F4F4E8;
    --primary: #D1FF00;
    --primary-foreground: #050505;
    --card: #0F0F11;
    --card-foreground: #F4F4E8;
    --secondary: #1C1E19;
    --muted: #111113;
    --muted-foreground: rgba(245, 244, 231, 0.4);
    --accent: rgba(209, 255, 0, 0.1);
    --accent-foreground: #D1FF00;
    --destructive: #EF4444;
    --border: rgba(156, 156, 156, 0.15);
    --input: rgba(156, 156, 156, 0.2);
    --ring: rgba(209, 255, 0, 0.4);
    --radius: 0.5rem;
    --surface: #0F0F11;
    --surface-alt: #1C1E19;
    --blue: #0099FF;
    --flare: #ED4609;
    --font-sans: "Geist", "Inter", system-ui, sans-serif;
    --font-mono: "Geist Mono", "Roboto Mono", monospace;
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
    --ease-decel: cubic-bezier(0, 0, 0.2, 1);
  }
}
```

---

## [03] COMPONENT INVENTORY

### Component Index (60+ componentes documentados)

#### Acoes & Inputs
| Componente | Variantes | Status | Pagina |
|-----------|-----------|--------|--------|
| **Buttons** | 4 variantes (primary, secondary, ghost, destructive) | stable | `/buttons` |
| **Inputs** | 3 variantes (text, password, search) | stable | `/forms` |
| **Badges** | 5 variantes (default, secondary, destructive, outline, status) | stable | `/components` |
| **Switches** | 1 | stable | `/components` |
| **Checkboxes** | 1 (com label) | stable | `/components` |
| **Sliders** | 1 (range input) | stable | `/components` |

#### Feedback & Status
| Componente | Variantes | Status | Pagina |
|-----------|-----------|--------|--------|
| **Alerts** | 4 (info, success, warning, error) | stable | `/feedback` |
| **Toasts** | 4 (success, error, warning, info) — dismissable | stable | `/feedback` |
| **Modal** | 1 (dialog modal) | stable | `/feedback` |
| **Notification Center** | 1 (bell icon + unread count) | stable | `/feedback` |
| **Empty States** | 4 (default, search, error, permissions) | stable | `/feedback` |
| **Loading Overlay** | 1 (container overlay) | stable | `/feedback` |
| **Spinners** | 3 (SM, MD, LG) | stable | `/feedback` |
| **Progress** | 3 variantes | stable | `/components` |
| **Confirm Sheet** | 3 (default, destructive, loading) | stable | `/feedback` |

#### Forms (15 secoes documentadas)
| Componente | Variantes | Status | Pagina |
|-----------|-----------|--------|--------|
| **Text Inputs** | 4 (full name, email, password, disabled) | stable | `/forms` |
| **Textarea** | 1 (com helper text, max chars) | stable | `/forms` |
| **Select** | 1 (dropdown com opcoes) | stable | `/forms` |
| **Toggles** | 3 (checkbox, radio group, switch) | stable | `/forms` |
| **SegmentedControl** | 1 (pill selector) | stable | `/forms` |
| **BbDateRangePicker** | 1 (calendar date range) | stable | `/forms` |
| **BbPhoneInput** | 1 (international +55) | stable | `/forms` |
| **BbFileInput** | 1 (drag & drop upload) | stable | `/forms` |
| **BbInlineEdit** | 1 (click-to-edit) | stable | `/forms` |
| **BbMultiLanguageInput** | 1 (PT/EN tabs) | stable | `/forms` |
| **BbArrayInput** | 1 (tag/chip input) | stable | `/forms` |
| **Rich Text Editor** | 3 (minimal, full toolbar, read-only) | stable | `/forms` |
| **Composed Form** | 1 (multi-field form completo) | stable | `/forms` |

#### Layout & Data
| Componente | Variantes | Status | Pagina |
|-----------|-----------|--------|--------|
| **Cards** | 3 (default, elevated, outlined) + 2 com acoes | stable | `/cards` |
| **Tables** | 5 (standard, export, filters, pagination, empty) | stable | `/tables` |
| **Dashboard Shell** | 3 (user dropdown, language switcher, export) | stable | `/tables` |
| **Lists** | 2 (list items com status + KPI cards) | stable | `/lists` |
| **Charts** | 12 secoes (bar, donut, line, area, pie, radar, rings, animated number, radial, composed, world map, KPI grid) | stable | `/charts` |

#### Navigation (6 patterns)
| Componente | Variantes | Status | Pagina |
|-----------|-----------|--------|--------|
| **Global Navbar** | Dropdown menus + theme toggle | stable | `/navigation` |
| **Sidebar** | 2 (expanded 240px + collapsed icon-only) | stable | `/navigation` |
| **Bottom Bar** | 1 (mobile tab bar, 5 items) | stable | `/navigation` |
| **Search Modal** | 1 (Cmd+K trigger) | stable | `/navigation` |
| **Pagination** | 3 (few, many, first page) | stable | `/navigation` |
| **Breadcrumb** | 3 (default, deep, truncated) | stable | `/navigation` |
| **Tabs** | 2 (default + smooth animated) | stable | `/navigation` |
| **Footer** | 2 (simple inner + mega homepage) | stable | — |

#### Visual Effects & Patterns
| Componente | Contagem | Pagina |
|-----------|----------|--------|
| **Ticker Strip** | 1 (scrolling tech names) | `/effects` |
| **Badge Variants** | 5 cores (lime, blue, error, surface, solid) | `/effects` |
| **Glow & Pulse** | 3 (neon glow, spin, pulse) | `/effects` |
| **Hover Effects** | 4 (automation, intelligence, orchestration, integration) | `/effects` |
| **CSS Grid Patterns** | 8 (dot grid, crosshair, wireframe, symbol, plus) | `/patterns` |
| **HUD Frames** | 8 (bracket, tech, notch variants) | `/patterns` |
| **Hazard Patterns** | 4 (stripes, thin, subtle, warning bar) | `/patterns` |
| **Circuit Traces** | 2 (horizontal, board) | `/patterns` |
| **Textures** | 5 (scanlines, noise, data rain, industrial) | `/patterns` |
| **Dividers** | 4 (tech, arrow, dashed, double) | `/patterns` |
| **Film Grain** | 4 intensidades (5%, 10%, 15%, 25%) | `/vfx` |
| **Blend Modes** | 6 (multiply, screen, overlay, soft-light, color-dodge, difference) | `/vfx` |
| **Blur Effects** | 4 niveis (0, 4px, 8px, 16px) | `/vfx` |
| **Glow Effects** | 3 (neon, soft, ring) | `/vfx` |
| **Overlay Composites** | 2 (scanlines CRT, vignette) | `/vfx` |

#### Flow Diagrams (6 componentes interativos SVG)
| Componente | Exemplo | Pagina |
|-----------|---------|--------|
| **FlowDiagram** | SaaS onboarding, agent orchestration, e-commerce, sitemap, org chart | `/flow-diagram` |
| **FlowMap** | Grouped mindmap canvas | `/flow-diagram` |
| **IconFlowDiagram** | Architecture with icons | `/flow-diagram` |
| **FlowPlaybook** | Orchestration playbook | `/flow-diagram` |
| **PipelineDiagram** | Service pipeline canvas | `/flow-diagram` |
| **ProcessFlowDiagram** | Development process | `/flow-diagram` |

#### Marketing Sections (19 templates em `/sections`)
| Secao | Status | Tipo |
|-------|--------|------|
| HeroSection | REBUILD | Hero 2-col com dashboard preview |
| LogoTicker | ENHANCE | Auto-scrolling tech logos |
| StatsSection | REBUILD | Founder quote + 4 stat cards |
| ProblemSolutionGallery | REBUILD | 8 pain points numerados |
| Services | REBUILD | 6 service cards com testimonials |
| HowItWorks | REBUILD | 4-step timeline + 3 support cards |
| FeaturedCaseStudy | REBUILD | Case study com 3 metricas |
| QuoteSection | ENHANCE | Blockquote + 5 star rating |
| Testimonials | REBUILD | 3 testimonial cards |
| PricingTable | REBUILD | 3-tier pricing (Quick Win, Scale, Full Stack) |
| FAQSection | REBUILD | 6 perguntas accordion |
| BookCallSection | REBUILD | Form completo + founder quote |
| ContactForm | CREATE | Form simples (name, email, budget) |
| ROICalculator | CREATE | 3 sliders interativos + savings output |
| NewsletterSignup | CREATE | Email input + subscribe |
| DeviceMockupFrame | CREATE | Phone, Laptop, Tablet frames |
| JobListingCard | CREATE | Job cards + office locations |
| GrainOverlay | CREATE | Film texture overlay |
| Footer | ENHANCE | Newsletter + nav + socials + legal |

#### Showcase Galleries (8 colecoes)
| Galeria | Items | Destaque |
|---------|-------|----------|
| Apparel | 8 | T-shirts, hoodies, bombers (black + lime) |
| Avatars | 7 | Round Six-inspired agent avatars |
| Calc Squad | 135 agentes | Calculadora de custo (R$ 4.5M/mes) |
| Jackets | 20 | Maior colecao. Tactical, softshell, puffer, cyberpunk |
| Mockups | 10 | Device mockups, bags, bottles, caps, cards |
| Outfits | 12 | Feminino, masculino, infantil (Kael line) |
| Slides | 68 | Slide deck template library completa |
| Sneakers | 13 | Chuck, Air Force, Blazer, Samba, 550 (todos com video MP4) |

---

## [04] PAGE BLUEPRINTS

### Homepage Blueprint

```
┌─────────────────────────────────────────────────┐
│ HEADER: [AIOX] Design System & Brandbook V1.0   │
│                               [BRANDBOOK button] │
├─────────────────────────────────────────────────┤
│ [00] HERO                                        │
│ ┌───────────────────────────────────────────┐   │
│ │ [00] DESIGN SYSTEM & BRAND IDENTITY _     │   │
│ │                                           │   │
│ │ THE [AIOX] BRAND          (bg: giant      │   │
│ │ DESIGN SYSTEM.             "AIOX" text    │   │
│ │                            watermark)     │   │
│ │ **Single source of truth** para...        │   │
│ │                                           │   │
│ │ [Abrir Guidelines :]                      │   │
│ └───────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ [01] 4 PILARES — Card Grid (4 cols)             │
│ ┌──────────┬──────────┬──────────┬──────────┐  │
│ │Guidelines│Foundation│Components│ Patterns  │  │
│ │Brand id  │Tokens,co │UI catalog│Grids,fra │  │
│ │& voice   │tipografia│          │& textures │  │
│ │[Explorar]│[Explorar]│[Explorar]│[Explorar] │  │
│ └──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────┤
│ [02] SYSTEM OVERVIEW                             │
│ ┌────────────┬────────────┬─────────────────┐   │
│ │ 60+        │ 27         │ 100%            │   │
│ │ componentes│ paginas no │ Token Coverage  │   │
│ │ UI         │ brandbook  │ Dark Cockpit    │   │
│ │ [bars]     │ [bars]     │ CSS custom      │   │
│ │            │            │ properties      │   │
│ └────────────┴────────────┴─────────────────┘   │
├─────────────────────────────────────────────────┤
│ [03] EXPLORE THE SYSTEM — Accordion + Link List  │
│ ┌─────────────────────┬─────────────────────┐   │
│ │ 01 Brand Identity ▼ │ Brand Identity—4pg  │   │
│ │    Guidelines, Logo  │ 01 Guidelines →     │   │
│ │    Moodboard, Brand  │ 02 Logo System →    │   │
│ │    Strategy          │ 03 Moodboard →      │   │
│ │                      │ 04 Estrategia →     │   │
│ │ 02 Design Found. ▶  │                     │   │
│ │ 03 UI Component  ▶  │                     │   │
│ │ 04 Showcase      ▶  │                     │   │
│ └─────────────────────┴─────────────────────┘   │
├─────────────────────────────────────────────────┤
│ [05] FAQ — Accordion List                        │
│ ┌───────────────────────────────────────────┐   │
│ │ FREQUENTLY    │ O que e o AIOX DS?    ▶  │   │
│ │ ASKED         │ O que e Dark Cockpit? ▼  │   │
│ │ QUESTIONS     │   (answer expanded)      │   │
│ │               │ Como usar componentes?▶  │   │
│ │               │ Quais sao os pilares? ▶  │   │
│ │               │ Posso contribuir?     ▶  │   │
│ └───────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ [06] MEGA FOOTER                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ [AIOX Logo] DS & Brandbook                │   │
│ │ 60+ Comp | 27 Pages | 4 Pilares | 100%   │   │
│ │ [Abrir Brandbook]                         │   │
│ ├───────────┬───────────┬──────────────────┤   │
│ │ [brandbook]│ [design   │ [showcase]       │   │
│ │ 7 links   │  system]  │ [socials]        │   │
│ │           │ 17 links  │ X, TikTok, IG,   │   │
│ │           │           │ YT, LinkedIn, GH  │   │
│ ├───────────┴───────────┴──────────────────┤   │
│ │ [AIOX MONUMENTAL LOGO — full width]       │   │
│ │ © 2026 AIOX Squad. Built with AIOX PRO    │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Inner Page Blueprint (Component/Token Pages)

```
┌─────────────────────────────────────────────────┐
│ NAVBAR: [AIOX] | links | dropdowns | [Lime][Gold]│
├─────────────────────────────────────────────────┤
│ BANNER HEADER                                    │
│ ┌───────────────────────────────────────────┐   │
│ │ AIOX SQUAD · {PAGE_NAME} · V2.0          │   │
│ │                                           │   │
│ │ {Page Title}              [Category]      │   │
│ │ {Subtitle}                [N Sections]    │   │
│ │                           [2026]          │   │
│ └───────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ MAIN — Numbered Sections                         │
│                                                  │
│ [01] Section Name                                │
│      Subtitle                                    │
│ ┌───────────────────────────────────────────┐   │
│ │ Component Demo / Token Swatch Grid        │   │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│ │ │ Variant │ │ Variant │ │ Variant │     │   │
│ │ │  Demo   │ │  Demo   │ │  Demo   │     │   │
│ │ ├─────────┤ ├─────────┤ ├─────────┤     │   │
│ │ │ Label   │ │ Label   │ │ Label   │     │   │
│ │ │ [status]│ │ [status]│ │ [status]│     │   │
│ │ └─────────┘ └─────────┘ └─────────┘     │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ [02] Section Name ...                            │
│ ...                                              │
├─────────────────────────────────────────────────┤
│ FOOTER: [AIOX] Brand Identity System v2.0        │
└─────────────────────────────────────────────────┘
```

### Hub Index Blueprint (Foundations, Components)

```
┌─────────────────────────────────────────────────┐
│ NAVBAR                                           │
├─────────────────────────────────────────────────┤
│ BANNER HEADER                                    │
├─────────────────────────────────────────────────┤
│ MAIN — Card Link Grid                            │
│ ┌──────────────────────┐ ┌──────────────────┐   │
│ │ [01] Typography      │ │ [02] Color Tokens│   │
│ │ Font Families & Scale│ │ Core Palette     │   │
│ │ Display, Sans, Mono  │ │ Lime + Gold      │   │
│ │           [Ver →]    │ │         [Ver →]  │   │
│ ├──────────────────────┤ ├──────────────────┤   │
│ │ [03] Spacing & Layout│ │ [04] Surfaces    │   │
│ │ Named Tokens, Scale  │ │ Elevation, Glass │   │
│ │           [Ver →]    │ │         [Ver →]  │   │
│ ├──────────────────────┤ ├──────────────────┤   │
│ │ [05] Motion & Easing │ │ [06] Semantic    │   │
│ │ Curves & Durations   │ │ Aliases, shadcn  │   │
│ │           [Ver →]    │ │         [Ver →]  │   │
│ └──────────────────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────┤
│ FOOTER                                           │
└─────────────────────────────────────────────────┘
```

### Brand Identity Pages (Guidelines + Movimento)

**Guidelines (14 secoes):**
1. Identity System — Logo, "THE MASTER DOCUMENT"
2. Typography — Geist (Thin/Reg/Bold/Black) + TASA Orbiter + Roboto Mono
3. Color Palette — Kinetic Limon (#D1FF00), Void Dark, Surface, Warm White
4. Logo Construction — Safe space = 1x height of "X", construction grid
5. Manifesto — "EU NAO PRECISO SER PROGRAMADOR PARA CRIAR. A IA E A SETA. O X E MEU."
6. Symbols — Triangle/Delta (transformation), Joystick (user control)
7. Naming — A→I→O→X = Seta, Input, Orquestracao, Destino
8. Positioning — Enemy=Complexity, Target=Creators, Category=AI Orchestration
9. Archetypes — Magician (60%), Sage (25%), Explorer (15%)
10. Evidence — R$500K/year value, 6-day MVP, R$8K/client
11. Narrative — Hero's Journey: O Sono → O Chamado → A Toca do Coelho → O Despertar
12. Voices — 5 real testimonials
13. Personality — Morpheus archetype: Revelador, Empoderador, Profundo
14. Dual Voice — AIOX (Morpheus Digital, cold/minimal) vs ALAN (Morpheus Humano, warm/provocateur)

**Movimento (14 secoes com sidebar TOC):**
Fundamentos (01-04) → Estrategia (05-09) → Narrativa (10-12) → Visual (13-14)

### LP Section Architecture (Atoms & Patterns)

De `/brandbook/lp-sections` — arquitetura completa das landing pages:

**Atoms Reutilizaveis:**
| Atom | Props | Detalhes |
|------|-------|----------|
| SectionShell | variant (dark/light), fullBleed | py-24 md:py-32, max-w-[1400px] |
| SectionHeader | number, label | Mono 11px, tracking 0.2em, number lime |
| AccentButton | 3 variants (lime/dark/ghost) | 11px bold uppercase, min-w 200px, arrow "->" |
| StatCard | 3 sizes, 3 colors | sm/md/lg × light/dark/lime |
| QuoteBlock | avatar, author, role | Oversized quote mark |
| AvatarStack | max 5, +N count | w-8 h-8 overlapping |

**5 Design Patterns Recorrentes:**
1. **Hairline Grid (gap-px):** Parent colored bg + gap-px + opaque children = 1px grid lines
2. **Ticker & Marquee:** CSS keyframes ticker (30s), ticker-reverse (35s), marquee (20s)
3. **Mono Label System:** Roboto Mono, 10-11px, uppercase, tracking 0.15-0.2em
4. **Staircase Pattern:** Progressive offset via marginTop/paddingLeft by index
5. **Dark/Light Alternation:** 15 sections alternando entre dark (#050505) e light (#F5F4E7)

**Hero Specifications:**
- min-h-screen, headline clamp(2.2rem, 7vw, 6.5rem), font-black 900, leading 0.92
- AI Watermark: font-size 45vw, white/4% opacity behind content
- Video Preview: 16/10 aspect, 30px grid overlay, lime play button

---

## [05] SCROLL STORYTELLING PATTERN

### Homepage Narrativa

A homepage segue uma narrativa progressiva de discovery:

1. **HERO** — Statement monumental: "THE [AIOX] BRAND DESIGN SYSTEM."
   - Typography massiva (TASAOrbiter Black, uppercase)
   - Watermark "AIOX" em fundo (escala gigante, opacidade baixa)
   - CTA unico: "Abrir Guidelines"

2. **PILARES** — Orientacao: 4 caminhos claros para explorar
   - Card grid com hover effects (reveal de titulo + CTA)
   - Cada card = 1 pilar do DS

3. **OVERVIEW** — Credibilidade: numeros concretos
   - 60+ componentes, 27 paginas, 100% token coverage
   - Barras de progresso animadas
   - "Dark Cockpit. Design tokens, motion system..."

4. **EXPLORE** — Deep dive: accordion interativo
   - 4 categorias expansiveis (Brand Identity, Foundations, UI, Showcase)
   - Cada categoria revela lista de links numerados

5. **FAQ** — Objecoes: respondidas antes de perguntar
   - 5 perguntas em accordion

6. **MEGA-FOOTER** — Mapa completo: todos os links organizados
   - 3 colunas categoricas + socials + CTA

### Padrao de Numeracao "[NN]"

Todo o site usa um sistema de numeracao tipo HUD:
- `[00]` hero, `[01]` pilares, `[02]` overview...
- Dentro de cada pagina: `01` section, `02` section...
- Font: Mono, color: dim/meta

---

## [06] TECH STACK RECOMENDADO

### Stack Original (Como Construido)

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| **Framework** | Next.js (App Router) | 14/15 |
| **Styling** | Tailwind CSS | v4+ |
| **UI Primitives** | Radix UI | Latest |
| **Component Library** | shadcn/ui | Latest |
| **Color Space** | OKLCH | — |
| **Fonts** | TASAOrbiterDisplay + Geist + RobotoMono | Variable |
| **Theme System** | CSS Custom Properties + class toggle | — |
| **Animations** | CSS Keyframes (native) | — |
| **Deployment** | Vercel (inferido) | — |

### Stack Alternativo (Code-Based Replica)

| Camada | Opcao |
|--------|-------|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (com dark cockpit theme) |
| Color System | OKLCH tokens em globals.css |
| Typography | Google Fonts (Geist) + self-hosted (TASAOrbiter) |
| Motion | CSS Keyframes + Tailwind animate |
| State | React Context (theme toggle) |

---

## [07] SEO & STRUCTURED DATA

### Meta Tags Observadas

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{page-specific description}">
<link rel="icon" href="/icon.svg">
```

**Observacao:** Structured data (JSON-LD) nao foi detectado na homepage. Pagina `/brandbook/seo` documenta padroes recomendados.

### Schema.org Recomendado

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AIOX Design System & Brandbook",
  "url": "https://brand.aioxsquad.ai/",
  "description": "Single source of truth para identidade visual, componentes UI, padroes de design, motion e a voz do movimento AIOX.",
  "publisher": {
    "@type": "Organization",
    "name": "AIOX Squad",
    "url": "https://aioxsquad.ai"
  }
}
```

### Meta Tags Template

```html
<title>{Page Title} — AIOX Brandbook</title>
<meta name="description" content="{page subtitle} // AIOX Design System">
<meta property="og:title" content="{Page Title} — AIOX Brandbook">
<meta property="og:description" content="{page subtitle}">
<meta property="og:image" content="/og-image.png">
<meta property="og:url" content="https://brand.aioxsquad.ai/{path}">
<meta name="twitter:card" content="summary_large_image">
```

---

## [08] ACESSIBILIDADE (WCAG 2.2 AA)

### Observacoes Positivas

- Radix UI primitives = boa base a11y (data-state, aria attributes)
- Accordion usa `<button>` + `aria-expanded`
- Alerts usam `role="alert"`
- Toasts usam `role="status"`
- Theme toggle com `aria-pressed`
- Links com texto descritivo
- Favicon SVG

### Checklist Obrigatorio

| Check | Status |
|-------|--------|
| Contrast ratio AA (4.5:1 text, 3:1 large) | ✅ Lime/Dark passa |
| Keyboard navigation | ✅ Radix UI |
| Focus indicators | ✅ `--ring` token |
| Semantic HTML | ✅ `<nav>`, `<main>`, `<banner>`, `<contentinfo>` |
| Alt text em imagens | ✅ Logo com alt="AIOX" |
| Skip to content | ⚠️ Nao observado |
| Reduced motion | ⚠️ Verificar `prefers-reduced-motion` |

---

## [09] PERFORMANCE BUDGET

### Targets

| Metrica | Target | Observacao |
|---------|--------|------------|
| LCP | < 2.5s | Next.js SSR |
| INP | < 200ms | Radix UI leve |
| CLS | < 0.1 | Font loading strategy |
| JS Bundle | Monitorar | 14 _next chunks detectados |
| CSS | Minimal | Tailwind purge |
| Font Loading | `font-display: swap` | 3 font families |

### Otimizacoes Observadas

- Next.js static generation (inferido pelo App Router)
- Tailwind CSS purge (utility-only)
- WOFF2 fonts (compressao maxima)
- SVG favicon (leve)

---

## [10] GEO (AI SEARCH VISIBILITY)

### Citabilidade

O site e altamente citavel por AI:
- Nomenclatura tecnica clara (tokens com nomes semanticos)
- Hierarquia de informacao bem definida (numeracao `[NN]`)
- FAQ com perguntas claras e respostas densas
- Conteudo bilingual (PT-BR + termos tecnicos em EN)

### AI-Friendly Content Pattern

```
[Section Number] → Topic Label → Detailed Description
Token Name → Value → Usage Description
```

Padrao "Claim → Evidence → Source" presente no FAQ e nas descricoes de tokens.

---

## [11] COPY PATTERNS

### Voice & Tone

- **Tom:** Tecnico-premium. Cockpit de aviacao — preciso, funcional, sem floreios
- **Persona:** Sistema falando sobre si mesmo. Meta-referencial
- **Linguagem:** Bilingual PT-BR/EN. Termos tecnicos em ingles, explicacoes em portugues
- **Numeros:** Sempre concretos: "60+ componentes", "27 paginas", "100% token coverage"

### Headline Formulas

1. **Statement monumental:** "THE [AIOX] BRAND DESIGN SYSTEM." (maiuscula, ponto final)
2. **Descricao tecnica:** "Single source of truth para identidade visual..." (bold keyword + contexto)
3. **Numeracao HUD:** "[00] DESIGN SYSTEM & BRAND IDENTITY" (mono, dim color)
4. **Status tag:** "V2.0 // DARK COCKPIT EDITION" (double slash separator)

### Padroes Recorrentes

- `{TOKEN_NAME}: {VALUE} — {USAGE}` para documentacao de tokens
- `{NUMBER}+ {METRIC}` para stats (60+, 27, 100%)
- `{LABEL} // {CONTEXT} // {YEAR}` para banners de secao
- `Ver secao →` para CTAs internos

---

## [12] CHECKLIST DE LANCAMENTO

### Pre-Launch Quality Gate

**Estrutura:**
- [x] Sitemap completo com 44+ paginas
- [x] Navegacao global com dropdowns + theme toggle
- [x] Footer com links organizados por categoria
- [x] Numeracao HUD consistente em todas as paginas

**Design:**
- [x] 2 temas funcionais (Lime + Gold) com toggle instantaneo
- [x] 70+ design tokens documentados
- [x] Type scale de 7 niveis com 3 font families
- [x] 14-step opacity ladder para accent glow
- [x] Surface stack de 7 niveis
- [x] Border system de 5 tokens
- [x] Radius scale de 7 niveis

**Componentes:**
- [x] 60+ componentes UI documentados
- [x] 12 categorias de componentes
- [x] Status badges ("stable") em cada componente
- [x] Demos interativos (sliders, checkboxes, modals)

**SEO:**
- [ ] Structured data JSON-LD
- [ ] Open Graph meta tags
- [ ] Canonical URLs
- [x] Semantic HTML

**Performance:**
- [x] Next.js SSR/SSG
- [x] Tailwind CSS purge
- [x] WOFF2 fonts
- [ ] Image optimization (verificar)

**Acessibilidade:**
- [x] Radix UI primitives
- [x] ARIA attributes em interactive components
- [x] Semantic landmarks
- [ ] Skip to content link
- [ ] prefers-reduced-motion

---

## [13] ADAPTACAO PARA OUTROS PROJETOS

### Como Reutilizar Este Modelo

Este modelo e ideal para:
- **Design Systems:** Qualquer produto que precisa documentar tokens, componentes e patterns
- **Brandbooks digitais:** Identidade visual interativa com temas
- **SaaS dashboards:** O padrao "Dark Cockpit" funciona para interfaces densas
- **Developer portals:** Documentacao tecnica com numeracao HUD

### Parametros Substituiveis

| Parametro | Original | Substituir Por |
|-----------|----------|----------------|
| `--bb-lime` | `oklch(0.934 0.2264 121.95)` | Accent primario do projeto |
| `--bb-dark` | `oklch(0.1149 0 0)` | Background base |
| `--bb-cream` | `oklch(0.9639 0.0158 106.69)` | Cor de texto primaria |
| TASAOrbiterDisplay | Display font | Font display do projeto |
| Geist | Sans font | Font sans do projeto |
| RobotoMono | Mono font | Font mono do projeto |
| "AIOX" | Brand name | Nome do produto |
| "Dark Cockpit" | Theme name | Nome do tema |
| Lime / Gold | Theme pair | Par de temas do projeto |

### Licoes-Chave Deste Modelo

1. **OKLCH > HEX para dark UIs** — perceptual uniformity faz as superficies parecerem consistentes
2. **Opacity ladder > color variants** — 14 steps de opacidade do accent resolve glow, hover, e borders
3. **Surface stack com 7 niveis** — nao basta "dark" e "less dark", precisa de canvas → dark → surface → alt → panel → console → hover
4. **Text hierarchy com 6 niveis** — cream → cream-alt → warm-white → dim → muted → meta
5. **Numeracao HUD [NN]** — da personalidade tecnica e ajuda wayfinding
6. **shadcn/ui mapping table** — documenta como tokens custom se conectam ao ecosystem
7. **Theme como variacao de accent, nao de surface** — Gold e Lime compartilham a mesma surface stack (com ajustes sutis), so mudam o accent
8. **Mono font para UI chrome** — labels, nav, status em mono uppercase cria o "cockpit feel"
