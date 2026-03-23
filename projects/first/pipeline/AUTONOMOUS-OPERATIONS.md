# HubMe AI - Full Autonomous Operations Manual

## Como Mary opera 100% sozinha

### CICLO DIARIO (roda automaticamente)

```
06:00 UTC - DISCOVERY
  |  Buscar 20 negocios sem site no Google Maps
  |  Filtrar: tem Instagram/telefone/email, sem website
  |  Salvar em leads/
  |
08:00 UTC - GENERATE
  |  Criar preview personalizado para os 10 melhores leads
  |  Deploy em go.hubme.tech/preview/{slug}
  |  Screenshot para portfolio Instagram
  |
10:00 UTC - OUTREACH
  |  Enviar email com preview para cada lead
  |  Max 10 emails/dia (evitar spam)
  |  Template personalizado por nicho
  |
14:00 UTC - FOLLOW-UP
  |  Verificar emails anteriores
  |  Enviar follow-up 1 (24h depois)
  |  Enviar follow-up 2 (72h depois)
  |  Enviar follow-up 3 final (7 dias)
  |
16:00 UTC - INSTAGRAM
  |  Postar 1 preview como portfolio
  |  Caption: "Created this free preview for [business]..."
  |  Hashtags relevantes por nicho
  |  Responder DMs/comentarios
  |
20:00 UTC - REPORT
  |  Gerar relatorio diario
  |  Emails enviados, respostas, conversoes
  |  Atualizar outreach-log.json
  |  Notificar socia se houver lead quente
```

### CICLO DE CONVERSAO (quando lead responde)

```
LEAD RESPONDE "Sim, quero!"
  |
  ├─ Mary envia proposta por email (PDF automatico)
  |  - 3 pacotes (Basic $500, Standard $1,000, Premium $2,000)
  |  - Link de pagamento Stripe
  |  - Prazo de entrega: 24h
  |
  ├─ CLIENTE PAGA via Stripe
  |  - Webhook notifica Mary
  |  - Mary comeca a construir site real
  |  - Baseado no preview + customizacoes
  |
  ├─ MARY ENTREGA em 24h
  |  - Site completo deployado
  |  - Email com link + instrucoes
  |  - Pede review/depoimento
  |
  └─ POS-VENDA
     - Follow-up 7 dias (tudo ok?)
     - Oferta manutencao mensal ($50-150)
     - Pede referral (10% comissao)
```

### ESTRATEGIA INSTAGRAM (quando vinculado)

```
POSTING SCHEDULE (3x por semana):
  Segunda: Preview de restaurante/cafe
  Quarta:  Preview de clinica/salao
  Sexta:   "Before vs After" ou case study

FORMATO DO POST:
  - Carousel: 3-5 screenshots do preview
  - Caption com CTA: "Want this for your business? DM us!"
  - Hashtags: #webdesign #smallbusiness #ai #[niche]
  - Location tag: cidade do negocio

ENGAGEMENT (diario):
  - Curtir 20 posts de negocios locais
  - Comentar em 10 posts (genuino, nao spam)
  - Responder todos DMs em < 1h
  - Stories: behind-the-scenes do processo
```

### METRICAS DE SUCESSO

| Metrica | Meta Diaria | Meta Semanal | Meta Mensal |
|---------|-------------|--------------|-------------|
| Leads encontrados | 20 | 100 | 400 |
| Previews criados | 10 | 50 | 200 |
| Emails enviados | 10 | 50 | 200 |
| Respostas | 2-3 | 10-15 | 40-60 |
| Conversoes | 0.5-1 | 2-4 | 8-16 |
| Receita | $500-1,000 | $2-4K | $8-16K |

### ESCALACAO

Mes 1: $2-4K (validacao)
Mes 2: $5-8K (otimizacao de templates)
Mes 3: $10-20K (Instagram + referrals + SEO)

### NICHOS POR PRIORIDADE

1. **Restaurantes** - Volume alto, decisao rapida, ticket $800-1,500
2. **Saloes/barbearias** - Visual importa, Instagram ativo, ticket $500-1,000
3. **Clinicas/dentistas** - Ticket alto $2-4K, decisao mais lenta
4. **Personal trainers** - Instagram ativo, ticket $500-1,000
5. **Lojas locais** - E-commerce potencial, ticket $1-2,5K

### FERRAMENTAS USADAS

| Ferramenta | Funcao | Custo |
|---|---|---|
| Google Maps/Search | Encontrar leads | $0 |
| VPS (Hostinger) | Hosting tudo | Ja pago |
| Postfix (email) | Enviar/receber | $0 |
| Next.js | Landing page | $0 |
| HTML/CSS templates | Previews | $0 |
| Stripe | Pagamentos | Taxa por transacao |
| Instagram Graph API | Posts/DMs | $0 |
| Playwright | Screenshots | $0 |
| Python scripts | Automacao | $0 |
| **TOTAL** | | **$0/mes** |
