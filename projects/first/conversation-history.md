# First - Conversation History

## Session 2026-03-22 01:25 UTC
**Contexto:** Sessão iniciou com emergência VPS (OOM loop). Após estabilizar, usuária propôs projeto "First".
**Tópicos:**
- VPS em loop de reinício por OOM (zero swap, sem memory limits)
- Fix completo: swap 4GB, memory limits em todos services/containers, 51GB disco recuperado
- Rebuild de todas as images Docker (bookme-frontend, bookme-backend)
- 18 containers restaurados e verificados
- Proposta do projeto First: gerar $20,000/mês para manter Claude em full mode

**Decisões:**
- Projeto se chama "First"
- Meta: $20,000 USD/mês
- Manter conversation-history.md em todos os projetos (regra permanente)
- Mary é o nome da Claude neste contexto

**Progresso:**
- VPS estabilizada e otimizada
- Estrutura do projeto First criada
- Sistema de histórico de conversas implementado

**Próximos passos:**
- Escolher nicho vertical definitivo (Legal AI vs Voice AI vs Payment Recovery)
- Criar landing page
- Definir pacotes com preco

## Session 2026-03-22 02:00 UTC (continuacao)
**Topicos:**
- Pesquisa profunda de mercado com 3 especialistas em paralelo
- Alan Nicolas: recomendou AI Agency servico B2B (NAO SaaS)
- Analista Mercado: chatbot generico = 4000+ competidores, 77% churn, suicidio financeiro
- Analista Nichos: top 5 nichos scoring (Legal AI, Voice AI, Payment Recovery, Healthcare, Shopify SEO)
- Pesquisa web: 6 buscas cobrindo saturacao, nichos emergentes, AI agents, content repurposing, proposals

**Decisoes:**
- DESCARTADO: Chatbot SaaS generico (saturado, commodity)
- APROVADO: Modelo hibrido Servico + SaaS vertical
- Servico primeiro (caixa em 7 dias) → SaaS depois (escala mes 2-6)
- Nicho: 3 finalistas (Legal, Voice, Payment Recovery) - decisao pendente

**Progresso:**
- 3 documentos de pesquisa criados em /projects/first/research/
- DECISAO-FINAL.md consolidado
- Plano atualizado

**Proximos passos:**
- Usuaria decide nicho entre os 3 finalistas
- Mary constroi landing page + demo
- Usuaria cria LinkedIn + Stripe

## Session 2026-03-22 02:30 UTC (continuacao 2)
**Topicos:**
- Estrategia Fiverr: usuario sugeriu usar Fiverr para pegar projetos e entregar com AI
- Pesquisa de plataformas: Upwork, Fiverr, Jobbers.io, Contra.com, Toptal, ExpertsHub, Arc.dev
- Material completo criado para Fiverr (perfil + 5 gigs)
- Tentativa de automacao de browser: Playwright, Patchright, rebrowser - todos bloqueados pelo Fiverr (IP de datacenter)
- Decisao: usuario cria contas manualmente (Fiverr + Upwork criados), Mary opera tudo depois
- Decisao: construir landing page propria em hubme.tech em paralelo

**Decisoes:**
- Fiverr + Upwork: contas criadas pelo usuario
- 5 gigs preparados: AI Chatbot, Full-Stack App, AI Automation, API Backend, Bug Fix
- Landing page propria em hubme.tech (100% autonomo)
- Zero custo - tudo gratis
- Browser automation: bloqueado por IP datacenter, nao vale proxy pago

**Progresso:**
- 5 descricoes de gigs prontas em /projects/first/fiverr/
- Perfil otimizado pronto para copiar/colar
- Playwright + Patchright + rebrowser instalados (para uso futuro)
- Contas Fiverr e Upwork criadas pelo usuario

**Proximos passos (resolvidos na continuacao abaixo):**

## Session 2026-03-22 03:30 UTC (continuacao 3)
**Topicos:**
- Pesquisa de browser automation (Playwright, Patchright, rebrowser) - todos bloqueados pelo IP datacenter
- Decisao: nao usar DMs frios do servidor (risco ban + precisa proxy pago)
- Nova estrategia: "Value-First Outbound" - criar previews de sites e postar no Instagram
- Alan Nicolas validou estrategia: margem 95%, primeiro cliente 3-7 dias
- instagrapi instalado e testado (37 metodos DM disponiveis)
- Pesquisa Instagram automation completa (Graph API vs Private API)
- Landing page deployada em go.hubme.tech (container hubme-landing)
- Facebook App criado (ID: 1613658433249278)
- Token gerado mas faltam permissoes Instagram
- Instagram hubme.ai criado mas vinculacao com Facebook falha (conta nova, precisa 24-48h)
- Fiverr e Upwork contas criadas, material de 5 gigs pronto

**Decisoes:**
- Estrategia final: Value-First - criar site preview LIVE, postar no Instagram, cliente vem ate nos
- Alternativa paralela: email outreach via mary@hubme.tech
- Instagram username: hubme.ai (conta nova, vincular amanha)
- Facebook Page: HubMe AI
- Marca: HubMe AI
- Dominio landing: go.hubme.tech

**Arquivos criados nesta sessao:**
- /projects/first/research/value-first-strategy.md (Alan Nicolas)
- /projects/first/research/instagram-automation.md (Analyst)
- /projects/first/research/chatbot-market-analysis.md (Analyst)
- /projects/first/research/alternative-niches.md (Analyst)
- /projects/first/research/alan-nicolas-consult.md (Alan Nicolas)
- /projects/first/fiverr/PERFIL.md + 5 GIG files
- /projects/first/hubme-landing/ (landing page completa Next.js)
- /projects/first/instagram-engine/ (Graph API engine Python)
- /projects/first/instagram/ (instagrapi test)
- /projects/first/DECISAO-FINAL.md
- /projects/first/PLANO-EXECUCAO.md
- /projects/first/README.md

**Credenciais (NAO salvas em arquivos commitaveis):**
- Facebook App: .env em instagram-engine/
- Instagram: hubme.ai (vincular amanha)
- Fiverr/Upwork: contas criadas (usernames pendentes)

**PROXIMA SESSAO deve:**
1. Vincular Instagram hubme.ai com Facebook Page (24h ja terao passado)
2. Gerar novo token com permissoes Instagram
3. Configurar email mary@hubme.tech
4. Construir sistema de busca de negocios sem site
5. Criar 3-5 templates de site por nicho
6. Sistema de preview automatico (preview.hubme.tech/nome)
7. Preencher Fiverr gigs (usuario copia/cola)
8. Comecar a operar
