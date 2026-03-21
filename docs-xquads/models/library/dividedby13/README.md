# Divided by 13 — Development Model Card

> Craft Luxury Brand / Boutique Manufacturer | Music / Guitar Amplifiers

**URL:** https://dividedby13.com/
**Plataforma:** WordPress (custom theme)
**Data de Analise:** 2026-03-17

---

## Preview

### Desktop — Hero (Artist + Product Split)
![Hero](screenshots/01-hero.png)

### Desktop — About Section (Brand Statement + Logo)
![About](screenshots/02-about-section.png)

### Desktop — Product Carousel (Spec Cards)
![Products](screenshots/03-product-carousel.png)

### Desktop — Footer (Newsletter + Monumental Logo)
![Footer](screenshots/04-footer.png)

### Full Page — Homepage
![Homepage Full](screenshots/homepage-full.png)

### Full Page — Product Page (BW 1969)
![Product Page](screenshots/product-page-full.png)

### Full Page — Artists Page
![Artists Page](screenshots/artists-page-full.png)

---

## Scores (Disseccao WebCraft Squad)

| Dimensao | Score |
|----------|-------|
| Estrutura & Padroes | 8.0/10 |
| Design Visual & Criativo | 8.3/10 |
| Animacao & Motion | 6.5/10 |
| Design Tokens | 7.0/10 |
| Performance | 5.0/10 |
| Acessibilidade | 5.5/10 |
| SEO | 7.0/10 |
| GEO / AI Search | 5.0/10 |
| **Global** | **6.5/10** |

## Tech Stack

| Componente | Tecnologia |
|-----------|-----------|
| CMS | WordPress |
| Theme | Custom (dividedby13 theme) |
| JS | jQuery + jQuery Migrate (legacy) |
| Fonts | Custom display condensed serif (self-hosted) |
| Instagram | Feed embed com likes/comments overlay |
| Video | YouTube embeds na pagina de produto |
| Newsletter | Inline form no footer |
| reCAPTCHA | Google reCAPTCHA (third-party) |

## Pontos Fortes

- **Identidade visual iconica** — tipografia condensada bold + paleta dourado/preto/creme = "craft luxury" inconfundivel
- **Split Navigation** — logo centrado divide nav em 2 metades, padrao elegante e memoravel
- **Marquee ticker** — "Hand built amplifiers from California, USA" em loop infinito reforca tagline
- **Product cards com ficha tecnica** — specs (Wattage, Class, Power, Preamp, Config, Voice) em formato key-value, excelente UX tecnica
- **Alternancia dark/light sections** — cria ritmo visual que guia o scroll
- **Fotografia 100% autentica** — artistas reais, produtos reais, contexto real — zero stock
- **Footer monumental** — tipografia gigante "DIVIDED BY 13" como statement visual com foto de artista ao vivo
- **Artists page como prova social** — lista impressionante (Sting, McCartney, etc.) valida a marca
- **Conteudo de produto excepcional** — descricoes longas, tecnicas, originais — alto E-E-A-T
- **URL structure limpa** — `/amps/bw-1969/`, `/cabs/1x12f/` — semantica e hierarquica

## Pontos a Melhorar (corrigidos no dev-model)

- **jQuery legacy** — substituir por vanilla JS ou framework moderno
- **Imagens sem alt text** — hero images e product photos sem descricao
- **Marquee sem prefers-reduced-motion** — nao respeita preferencias de acessibilidade
- **Contraste dourado** — pode falhar WCAG AA em alguns backgrounds
- **Carousel sem keyboard nav** — botoes de scroll mas sem suporte a teclado
- **Instagram feed pesado** — carrega todas as imagens sem lazy loading
- **Sem Schema markup** — Product, Organization, BreadcrumbList ausentes
- **Sem content blocks para RAG** — texto longo sem headers intermediarios
- **Hero image sem priority hints** — LCP provavelmente impactado
- **JS error na Artists page** — TypeError no theme.js

## Arquivos do Modelo

| Arquivo | Descricao |
|---------|-----------|
| `README.md` | Este card de referencia |
| `dev-model.md` | Blueprint completo de desenvolvimento |
| `tokens.json` | Design tokens exportaveis (primitivos + semanticos + componentes) |
| `screenshots/` | 7 screenshots de referencia |

## DNA do Design — "Craft Luxury Brand"

Este modelo captura a essencia de uma **marca artesanal premium**:

1. **Split Navigation** com logo centrado
2. **Hero cinematografico** com artista + produto em composicao diagonal
3. **Marquee ticker** com tagline em loop infinito
4. **Sections alternadas** dark/light criando cadencia
5. **Product cards** com ficha tecnica (key-value specs)
6. **Tipografia condensada bold** como identidade
7. **Paleta dourado + preto + creme** = luxo artesanal
8. **Instagram feed** integrado como prova social
9. **Footer monumental** com tipografia gigante
10. **Fotografia autentica** — nada generico

## Ideal Para

- Marcas de produtos artesanais/boutique premium (luthieria, relojoaria, destilarias, etc.)
- Fabricantes com lista de artistas/embaixadores/clientes notaveis
- Produtos com especificacoes tecnicas detalhadas
- Marcas que valorizam craft, autenticidade e heranca
- Sites institucionais de fabricantes (nao e-commerce direto)
- Marcas com forte presenca no Instagram

## Tags

`craft-luxury` `boutique` `manufacturer` `wordpress` `dark-theme` `split-nav` `marquee` `product-specs` `instagram-feed` `monumental-footer` `authentic-photography` `music` `amplifiers` `handbuilt` `premium`
