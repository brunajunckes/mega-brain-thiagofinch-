/**
 * BookMe Health Check Aggregator
 * GET /api/health
 *
 * Checks backend, novel_process, and database connectivity.
 * Returns structured health status for monitoring and dashboards.
 */

const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

const KNOWN_PROVIDERS = ['deepseek', 'openai', 'anthropic', 'ollama', 'template'];

/**
 * Measure a fetch call and return { ok, data, latency_ms, error }.
 */
async function timedFetch(url, options = {}, timeoutMs = 5000) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, { ...options, signal: controller.signal });
    const latency_ms = Date.now() - start;
    let data = null;
    try {
      data = await r.json();
    } catch {
      // non-JSON response is fine for health checks
    }
    return { ok: r.ok, status: r.status, data, latency_ms, error: null };
  } catch (e) {
    const latency_ms = Date.now() - start;
    return { ok: false, status: 0, data: null, latency_ms, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const frontendStart = Date.now();

  // Run all checks in parallel
  const [backendResult, novelResult, dbResult] = await Promise.all([
    // 1. Backend connectivity
    timedFetch(`${BACKEND}/api/status`),
    // 2. Novel process module
    timedFetch(`${BACKEND}/api/novel-process/status`),
    // 3. Database connectivity via projects list (lightweight probe)
    timedFetch(`${BACKEND}/api/projects?limit=1`),
  ]);

  const frontendLatency = Date.now() - frontendStart;

  // Build service statuses
  const services = {
    frontend: {
      status: 'up',
      latency_ms: frontendLatency,
    },
    backend: {
      status: backendResult.ok ? 'up' : 'down',
      latency_ms: backendResult.latency_ms,
      error: backendResult.error,
    },
    novel_process: {
      status: novelResult.ok ? 'up' : 'down',
      latency_ms: novelResult.latency_ms,
      features: extractFeatures(novelResult.data),
      error: novelResult.error,
    },
    database: {
      status: dbResult.ok ? 'up' : 'down',
      latency_ms: dbResult.latency_ms,
      error: dbResult.error,
    },
  };

  // Determine active provider from backend status or novel process data
  const providerInfo = extractProviders(backendResult.data, novelResult.data);

  // Compute overall status
  const allUp = services.backend.status === 'up'
    && services.novel_process.status === 'up'
    && services.database.status === 'up';
  const backendDown = services.backend.status === 'down';

  let status;
  if (allUp) {
    status = 'healthy';
  } else if (backendDown) {
    status = 'unhealthy';
  } else {
    status = 'degraded';
  }

  const body = {
    status,
    timestamp,
    version: '2.0.0',
    services,
    providers: providerInfo,
  };

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503;

  return new Response(JSON.stringify(body), {
    status: httpStatus,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Extract feature list from novel_process status response.
 */
function extractFeatures(data) {
  if (!data) return [];
  if (Array.isArray(data.features)) return data.features;
  if (Array.isArray(data.available_features)) return data.available_features;
  if (data.endpoints && typeof data.endpoints === 'object') return Object.keys(data.endpoints);
  return [];
}

/**
 * Extract provider information from backend responses.
 */
function extractProviders(backendData, novelData) {
  let active = null;
  const available = [];

  // Try to get provider info from backend status
  const source = backendData || novelData || {};
  if (source.provider) active = source.provider;
  if (source.active_provider) active = source.active_provider;
  if (source.model_provider) active = source.model_provider;

  if (Array.isArray(source.available_providers)) {
    available.push(...source.available_providers);
  } else if (Array.isArray(source.providers)) {
    available.push(...source.providers);
  }

  // If no info detected, check env variables for configured providers
  if (!active && available.length === 0) {
    for (const p of KNOWN_PROVIDERS) {
      const envKey = `${p.toUpperCase()}_API_KEY`;
      if (process.env[envKey]) {
        available.push(p);
        if (!active) active = p;
      }
    }
    // Template is always available as fallback
    if (!available.includes('template')) {
      available.push('template');
    }
    if (!active) active = 'template';
  }

  return { active: active || 'template', available: available.length > 0 ? available : ['template'] };
}
