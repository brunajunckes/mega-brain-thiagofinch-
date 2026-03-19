#!/usr/bin/env node
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const SwarmOrchestrator = require('/srv/openclaw/swarm/swarm-orchestrator');

const PORT = process.env.PORT || 3000;
const UI_URL = process.env.UI_URL || 'https://openclaw.hubme.tech';
const UI_CACHE = new Map(); // Simple cache for UI files

// Env setup
process.env.AIOX_OFFLINE_MODE = 'true';
process.env.OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
process.env.OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const orchestrator = new SwarmOrchestrator({ backendType: 'ollama' });

/**
 * Proxy UI request to openclaw.hubme.tech
 */
async function proxyUI(req, res, pathname) {
  const urlPath = pathname === '/' ? '/' : pathname;
  const proxyUrl = new URL(UI_URL + urlPath);

  try {
    const protocol = proxyUrl.protocol === 'https:' ? https : http;

    const proxyReq = protocol.get({
      hostname: proxyUrl.hostname,
      port: proxyUrl.port || (proxyUrl.protocol === 'https:' ? 443 : 80),
      path: proxyUrl.pathname + proxyUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        'host': proxyUrl.hostname,
        'x-forwarded-for': req.socket.remoteAddress,
        'x-forwarded-proto': 'https',
      },
    }, (proxyRes) => {
      // Copy headers (except problematic ones)
      const headers = { ...proxyRes.headers };
      delete headers['transfer-encoding'];
      delete headers['content-encoding'];

      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      res.writeHead(503);
      res.end(JSON.stringify({ error: 'UI unavailable: ' + error.message }));
    });

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
  } catch (error) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: 'Proxy error: ' + error.message }));
  }
}

// Create request handler
const requestHandler = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Swarm execution (handled separately to avoid double header writes)
  if (pathname.match(/^\/api\/(openclaw|aiox)\/swarm\//) && req.method === 'POST') {
    let body = '';
    let responseEnded = false;

    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      if (responseEnded) return;

      try {
        const parts = pathname.split('/');
        const swarmId = parts[parts.length - 1];
        const context = body ? JSON.parse(body).context || {} : {};

        const result = await orchestrator.executeSwarm(swarmId, context);
        const resultObj = result instanceof Map ? Object.fromEntries(result) : result;

        responseEnded = true;
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, swarmId, result: resultObj }));
      } catch (error) {
        if (!responseEnded) {
          responseEnded = true;
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }
    });

    req.on('error', (error) => {
      if (!responseEnded) {
        responseEnded = true;
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });

    return;
  }

  try {
    // API health check
    if (pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // API config - tell UI where to call back
    if (pathname === '/config.json') {
      // Detect protocol from request or forwarding headers
      const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const protocol = isSecure ? 'https' : 'http';
      const apiBase = process.env.API_BASE || `${protocol}://${host}`;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        apiBase: apiBase,
        wsBase: apiBase.replace(/^https?/, 'ws'),
        timeout: 30000,
        environment: 'production',
        ollama: {
          url: process.env.OLLAMA_URL || 'http://localhost:11434',
          model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
          fallbacks: process.env.OLLAMA_FALLBACKS?.split(',') || ['qwen2.5:14b', 'deepseek-coder:6.7b']
        }
      }));
      return;
    }

    // API routes - serve directly
    if (pathname.startsWith('/api/')) {
      // Route API requests to swarm/status endpoints
      // (already handled below in separate if statements)
    } else {
      // All other routes - proxy to UI
      await proxyUI(req, res, pathname);
      return;
    }

    // OpenClaw status
    if (pathname === '/api/openclaw/status') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'online',
        backend: 'ollama',
        model: process.env.OLLAMA_MODEL,
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    // AIOX status
    if (pathname === '/api/aiox/status') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'online',
        system: 'aiox-ollama',
        backend: 'ollama',
        model: process.env.OLLAMA_MODEL,
      }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    if (!res.headersSent) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }
};

// Create HTTP server
const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 OpenClaw API: http://localhost:${PORT}/api/openclaw/`);
  console.log(`⚙️  AIOX API: http://localhost:${PORT}/api/aiox/`);
  console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
});
