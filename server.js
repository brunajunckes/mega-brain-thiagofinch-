#!/usr/bin/env node
const http = require('http');
const url = require('url');
const SwarmOrchestrator = require('/srv/openclaw/swarm/swarm-orchestrator');

const PORT = process.env.PORT || 3000;

// Env setup
process.env.AIOX_OFFLINE_MODE = 'true';
process.env.OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
process.env.OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const orchestrator = new SwarmOrchestrator({ backendType: 'ollama' });

const server = http.createServer(async (req, res) => {
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
    // Health
    if (pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
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
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 OpenClaw API: http://localhost:${PORT}/api/openclaw/`);
  console.log(`⚙️  AIOX API: http://localhost:${PORT}/api/aiox/`);
  console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
});
