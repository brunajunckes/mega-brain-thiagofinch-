---
task: validateTracking()
responsavel: "@pixel-specialist"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: website
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: platform
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: account_alias
    tipo: string
    origem: User Input
    obrigatorio: false
  - campo: conversion_page
    tipo: string
    origem: User Input
    obrigatorio: false

Saida:
  - campo: validation_report
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Pixel correto na conta de anúncios verificado"
  - "[ ] GTM container publicado com tags e triggers conectados"
  - "[ ] Browser check: GTM carrega, pixel inicializa, dataLayer ativo"
  - "[ ] Network check: requests de eventos chegando às plataformas"
  - "[ ] Evento de conversão (Lead/Purchase) dispara no submit"
  - "[ ] WP Rocket ou cache não está bloqueando scripts"
  - "[ ] Relatório de status emitido com ações corretivas"
---

# Task: Validate Tracking

**Task ID:** TRAFFIC-006
**Version:** 1.0.0
**Command:** `*validate-tracking`
**Agent:** Pixel Specialist (pixel-specialist)
**Purpose:** Validar end-to-end que o rastreamento está funcionando corretamente — pixel, GTM, browser, rede e eventos de conversão.

---

## Inputs

| Campo | Tipo | Origem | Obrigatório | Descrição |
|-------|------|--------|-------------|-----------|
| website | string | User | Sim | URL da página a validar (ex: https://savepartners.com.br/webinar/) |
| platform | string | User | Sim | Plataformas a checar (meta, google, tiktok — pode ser lista) |
| account_alias | string | User | Não | Alias da conta de anúncios (ex: partners, saveco-educacao) |
| conversion_page | string | User | Não | URL da página de conversão / thank you |
| gtm_container | string | User | Não | ID do container GTM (ex: GTM-NJDK6KF2) |

---

## Preconditions

- Acesso ao Meta Ads MCP (`mcp__meta-ads__*`)
- Acesso ao GTM MCP (`tools/gtm-mcp/`) via service account
- Playwright browser disponível para inspeção live
- URL da página acessível publicamente

---

## Execution Phases

### Phase 1 — Pixel Check (Meta)
1. Identificar pixel(s) associados à conta de anúncios via `meta_get_pixel`
2. Verificar `last_fired_time` — pixel disparou nas últimas 24h?
3. Verificar `is_created_by_business` — pixel pertence ao Business correto?
4. Confirmar que o pixel ID no GTM corresponde ao pixel da conta

**Sinais de problema:**
- `last_fired_time` > 24h atrás → pixel não está disparando
- Pixel no GTM diferente do pixel na conta → conversões indo para lugar errado
- `is_created_by_business: false` → pixel compartilhado com permissão limitada

---

### Phase 2 — GTM Container Check
1. Listar containers GTM associados ao domínio via service account
2. Verificar versão publicada (live version)
3. Para cada tag relevante (FB PageView, FB Lead, GA4):
   - Confirmar `firingTriggerId` não está vazio
   - Confirmar triggers existem e têm filtros corretos
   - Verificar se tag está pausada (`paused: true`)
4. Verificar variáveis críticas:
   - `{{0 | FB - Pixel}}` → ID correto?
   - `{{0 | GA4 - ID}}` → ID correto?

**Sinais de problema:**
- `firingTriggerId: []` → tag sem trigger = nunca dispara
- Tag `paused: true` → desativada
- Variável de pixel com ID errado → eventos no lugar errado
- Trigger de formSubmission com `Form ID` que não bate com o formulário real

---

### Phase 3 — Browser Check (Playwright)
1. Navegar para a URL alvo
2. Verificar presença do GTM no HTML:
   ```js
   window.google_tag_manager // deve existir
   window.dataLayer          // deve ser array
   window.fbq                // deve existir (Meta)
   ```
3. Verificar atributos dos scripts:
   - `type="rocketlazyloadscript"` → WP Rocket atrasando GTM (problema)
   - `type="text/javascript"` → correto
4. Inspecionar scripts inline para confirmar GTM ID correto

**Sinais de problema:**
- `hasGTM: false` → GTM não carregou
- `hasDataLayer: false` → inline script não executou (cache ou delay)
- `type="rocketlazyloadscript"` no script GTM → atraso por WP Rocket

---

### Phase 4 — Network Check
1. Capturar todas as network requests após carregamento
2. Verificar se chegam requests para:
   - `connect.facebook.net/en_US/fbevents.js` ou proxy Stape
   - `facebook.com/tr` com evento `PageView`
   - `google-analytics.com/g/collect` com `tid=G-XXXXXXX`
3. Verificar console por warnings:
   - `[Meta pixel] XXXXXX is unavailable` → pixel ID inválido ou sem acesso
   - Erros de CORS ou 401/403

**Sinais de problema:**
- Nenhuma request para `facebook.com/tr` → pixel não inicializou
- Warning `is unavailable` → pixel errado ou sem permissão
- Requests com status 4xx/5xx → endpoints com falha

---

### Phase 5 — Conversion Event Test
1. Interagir com a página (scroll, mousemove) para ativar scripts atrasados
2. Preencher formulário de teste com dados fictícios
3. Capturar network requests após submit:
   - Deve aparecer request para `facebook.com/tr?ev=Lead` ou evento via Stape
   - Verificar se evento `Lead` (ou evento configurado) está na request
4. Verificar `dataLayer` para evento de conversão:
   ```js
   window.dataLayer.filter(e => e.event === 'generate_lead' || e.event === 'lead')
   ```

**Sinais de problema:**
- Nenhum evento `Lead` na rede → trigger de form não disparou
- Evento customizado (`lead_partner`) em vez de `Lead` padrão → Meta não reconhece como conversão
- Form submits mas GTM não captura → trigger com Form ID errado

---

### Phase 6 — Cache & Performance Check
1. Verificar se WP Rocket (ou outro cache) está interferindo:
   - Contar scripts com `type="rocketlazyloadscript"`
   - Verificar se script GTM está na lista de exclusões do Delay JS
2. Verificar se versão cacheada tem tracking atualizado (limpar cache se necessário)
3. Confirmar Stape proxy carrega (`api.dominio.com.br/XXXXXXX.js` retorna 200)

---

## Output Format

```markdown
## Relatório de Validação de Tracking
**Site:** {URL}
**Plataformas:** {lista}
**Data:** {data}
**Status Geral:** ✅ OK | ⚠️ Parcial | ❌ Crítico

---

### Checklist de Validação

| Check | Status | Detalhe |
|-------|--------|---------|
| Pixel correto na conta | ✅/❌ | ID: XXXXXXXXX |
| GTM publicado com triggers | ✅/❌ | Versão: vXX |
| GTM carrega no browser | ✅/❌ | hasGTM: true/false |
| FB Pixel inicializa | ✅/❌ | hasFBQ: true/false |
| PageView dispara | ✅/❌ | Visto na rede |
| Lead event dispara | ✅/❌ | Trigger: form_id |
| WP Rocket não bloqueia | ✅/❌ | Scripts normais |

---

### Problemas Encontrados

#### 🔴 CRÍTICO: {título}
- **Diagnóstico:** {o que está errado}
- **Impacto:** {o que isso causa}
- **Correção:** {como corrigir — inclui caminho no GTM ou WP se aplicável}

#### 🟡 ATENÇÃO: {título}
...

---

### Ações Executadas
- {lista de correções já aplicadas automaticamente}

### Ações Pendentes (manuais)
- {lista de itens que precisam de acesso admin}
```

---

## Veto Conditions

- NUNCA marcar tracking como OK sem checar browser E network — HTML correto não garante eventos disparando
- NUNCA ignorar warning `is unavailable` — indica pixel errado na conta
- NUNCA assumir que o evento correto está sendo enviado sem verificar o nome do evento na network request
- NUNCA concluir sem verificar a versão publicada do GTM — mudanças no workspace não publicado não têm efeito

---

## Completion Criteria

- [ ] Pixel ID na conta de anúncios confirmado
- [ ] GTM container auditado (tags + triggers + variáveis)
- [ ] Browser check executado com Playwright
- [ ] Network check com eventos capturados
- [ ] Evento de conversão testado via form submit
- [ ] Interferência de cache verificada
- [ ] Relatório emitido com status por check
- [ ] Ações corretivas listadas (executadas ou pendentes)
