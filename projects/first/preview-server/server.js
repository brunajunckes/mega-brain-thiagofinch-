/**
 * HubMe AI - Preview Server
 * Serves business website previews at preview.hubme.tech/{slug}
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3012;
const PREVIEWS_DIR = process.env.PREVIEWS_DIR || path.join(__dirname, '../previews');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getAvailablePreviews() {
  try {
    return fs.readdirSync(PREVIEWS_DIR).filter(d =>
      fs.statSync(path.join(PREVIEWS_DIR, d)).isDirectory()
    );
  } catch { return []; }
}

function serveIndex(res) {
  const previews = getAvailablePreviews();
  const cards = previews.map(slug => {
    const name = slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    return `
    <div class="card">
      <div class="card-name">${name}</div>
      <a href="/${slug}" class="btn" target="_blank">Ver Preview</a>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HubMe AI - Previews de Sites</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090A; color: #fff; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 60px 20px; text-align: center; border-bottom: 1px solid #333; }
    .header h1 { font-size: 2.5rem; margin-bottom: 12px; }
    .header h1 span { color: #6366f1; }
    .header p { color: #aaa; font-size: 1.1rem; max-width: 600px; margin: 0 auto; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; max-width: 1100px; margin: 60px auto; padding: 0 24px; }
    .card { background: #111; border: 1px solid #222; border-radius: 16px; padding: 32px; text-align: center; transition: border-color 0.2s; }
    .card:hover { border-color: #6366f1; }
    .card-name { font-size: 1.3rem; font-weight: 600; margin-bottom: 20px; }
    .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; transition: background 0.2s; }
    .btn:hover { background: #5558e8; }
    .footer { text-align: center; padding: 40px; color: #555; font-size: 0.9rem; }
    .badge { display: inline-block; background: #6366f120; border: 1px solid #6366f140; color: #818cf8; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HubMe <span>AI</span></h1>
    <p>Previews de sites criados gratuitamente. Gostou? Podemos lançar o seu em 24 horas.</p>
    <div class="badge">✨ Sites profissionais com IA</div>
  </div>
  <div class="grid">${cards}</div>
  <div class="footer">
    <p>© 2026 HubMe AI · <a href="https://go.hubme.tech" style="color:#6366f1">go.hubme.tech</a></p>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  const urlPath = req.url.split('?')[0];

  // Root: show gallery
  if (urlPath === '/' || urlPath === '') {
    return serveIndex(res);
  }

  // Health check
  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', previews: getAvailablePreviews() }));
  }

  // Serve preview: /slug or /slug/file
  const parts = urlPath.split('/').filter(Boolean);
  const slug = parts[0];
  const file = parts.slice(1).join('/') || 'index.html';

  const slugDir = path.join(PREVIEWS_DIR, slug);

  // Validate slug (no path traversal)
  if (!fs.existsSync(slugDir) || !fs.statSync(slugDir).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<h1>Preview não encontrado</h1><p>Slug: ${slug}</p><p><a href="/">← Voltar</a></p>`);
  }

  const filePath = path.join(slugDir, file);

  // Security: prevent path traversal
  if (!filePath.startsWith(PREVIEWS_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // If directory, serve index.html
  const finalPath = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()
    ? path.join(filePath, 'index.html')
    : filePath;

  if (!fs.existsSync(finalPath)) {
    res.writeHead(404);
    return res.end('File not found');
  }

  const ext = path.extname(finalPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(finalPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (e) {
    res.writeHead(500);
    res.end('Internal error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HubMe Preview Server running on port ${PORT}`);
  console.log(`Previews available: ${getAvailablePreviews().join(', ')}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => { server.close(); process.exit(0); });
