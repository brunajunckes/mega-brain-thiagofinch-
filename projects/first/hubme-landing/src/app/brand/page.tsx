export const metadata = {
  title: 'Brand Hub — Hubme.Ai',
  robots: 'noindex, nofollow',
};

const brands = [
  {
    slug: 'hubme-ai',
    name: 'Hubme.Ai',
    accent: '#22D3EE',
    description: 'Plataforma central para empresas AI-first',
    status: 'v1.0 · 2026-03-22',
    pages: [
      { label: 'Index',     href: '/brand/hubme-ai/index.html',        icon: '🏠' },
      { label: 'Brandbook', href: '/brand/hubme-ai/brandbook.html',    icon: '🎨' },
      { label: 'Movimento', href: '/brand/hubme-ai/movimento.html',    icon: '⚡' },
      { label: 'Pitch',     href: '/brand/hubme-ai/pitch.html',        icon: '🚀' },
      { label: 'Guidelines',href: '/brand/hubme-ai/guidelines.html',   icon: '📖' },
      { label: 'Tokens',    href: '/brand/hubme-ai/brand-tokens.json', icon: '🔧' },
      { label: 'Logo SVG',  href: '/brand/hubme-ai/logo.svg',          icon: '✦'  },
    ],
  },
];

export default function BrandHub() {
  return (
    <>
      <style>{`
        body { margin: 0; }
        .brand-item:hover { border-color: rgba(34,211,238,0.4) !important; background: #1D1D20 !important; }
        .page-link:hover { border-color: rgba(34,211,238,0.5) !important; color: #22D3EE !important; }
      `}</style>
      <div style={{
        background: '#09090A', minHeight: '100vh', color: '#F4F4F4',
        fontFamily: "'Inter', system-ui, sans-serif", padding: '64px 32px',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 56 }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#22D3EE',
              fontFamily: 'monospace', marginBottom: 12,
            }}>
              Brand Hub · Acesso interno
            </p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>
              Brands
            </h1>
            <p style={{ color: 'rgba(244,244,244,0.5)', fontSize: '1rem' }}>
              Brand packages gerados pelo Brand Machine. Página oculta — não indexada.
            </p>
          </div>

          {/* Brand cards */}
          {brands.map((brand) => (
            <div key={brand.slug} className="brand-item" style={{
              background: '#111113',
              border: '1px solid rgba(156,156,156,0.12)',
              borderRadius: 16, padding: 32, marginBottom: 24,
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              {/* Brand header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: brand.accent, flexShrink: 0,
                  boxShadow: `0 0 20px ${brand.accent}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 98 98" fill="none">
                    <circle cx="49" cy="49" r="10" fill="#0C0C0D"/>
                    <circle cx="49" cy="49" r="4" fill="#F0FDFF"/>
                    <line x1="49" y1="49" x2="16" y2="20" stroke="#0C0C0D" strokeWidth="2.5" strokeOpacity="0.7"/>
                    <line x1="49" y1="49" x2="82" y2="20" stroke="#0C0C0D" strokeWidth="2.5" strokeOpacity="0.7"/>
                    <line x1="49" y1="49" x2="90" y2="49" stroke="#0C0C0D" strokeWidth="2.5" strokeOpacity="0.7"/>
                    <line x1="49" y1="49" x2="82" y2="78" stroke="#0C0C0D" strokeWidth="2.5" strokeOpacity="0.7"/>
                    <line x1="49" y1="49" x2="16" y2="78" stroke="#0C0C0D" strokeWidth="2.5" strokeOpacity="0.7"/>
                    <line x1="49" y1="49" x2="8"  y2="49" stroke="#0C0C0D" strokeWidth="2.5" strokeOpacity="0.7"/>
                    <circle cx="16" cy="20" r="5" fill="#0C0C0D" opacity="0.8"/>
                    <circle cx="82" cy="20" r="5" fill="#0C0C0D" opacity="0.8"/>
                    <circle cx="90" cy="49" r="5" fill="#0C0C0D" opacity="0.8"/>
                    <circle cx="82" cy="78" r="5" fill="#0C0C0D" opacity="0.8"/>
                    <circle cx="16" cy="78" r="5" fill="#0C0C0D" opacity="0.8"/>
                    <circle cx="8"  cy="49" r="5" fill="#0C0C0D" opacity="0.8"/>
                  </svg>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{brand.name}</h2>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600,
                      background: `${brand.accent}18`, color: brand.accent,
                      border: `1px solid ${brand.accent}40`, fontFamily: 'monospace',
                    }}>
                      {brand.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(244,244,244,0.5)' }}>
                    {brand.description}
                  </p>
                </div>
              </div>

              {/* Pages grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}>
                {brand.pages.map((page) => (
                  <a key={page.href} href={page.href} target="_blank" rel="noopener noreferrer"
                    className="page-link"
                    style={{
                      background: '#18181B',
                      border: '1px solid rgba(156,156,156,0.1)',
                      borderRadius: 8, padding: '12px 14px',
                      textDecoration: 'none', color: '#F4F4F4',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: '0.8rem', fontWeight: 500,
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '0.95rem' }}>{page.icon}</span>
                    {page.label}
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Empty state — próximo brand */}
          <div style={{
            background: 'rgba(34,211,238,0.03)',
            border: '1px dashed rgba(34,211,238,0.18)',
            borderRadius: 16, padding: '40px 32px',
            textAlign: 'center', color: 'rgba(244,244,244,0.25)',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>＋</div>
            <p style={{ fontSize: '0.875rem' }}>Próximo brand package aparecerá aqui</p>
            <p style={{
              fontSize: '0.7rem', marginTop: 6,
              fontFamily: 'monospace', color: 'rgba(34,211,238,0.35)',
            }}>
              @brand-reverse-mapper *generate-brandbook
            </p>
          </div>

          <div style={{
            marginTop: 48, textAlign: 'center',
            fontSize: '0.7rem', fontFamily: 'monospace', color: '#4B5563',
          }}>
            Brand Machine v1 · AIOX · Acesso restrito · noindex
          </div>
        </div>
      </div>
    </>
  );
}
