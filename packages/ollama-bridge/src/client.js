const http = require('http');
const https = require('https');

class OllamaClient {
  constructor(host = 'http://localhost:11434') {
    this.host = host;
    this.timeout = 30000;
  }

  async request(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint.startsWith('/') ? this.host + endpoint : endpoint);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: this.timeout,
      };

      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Ollama API error (${res.statusCode}): ${data}`));
          } else {
            try {
              resolve(data ? JSON.parse(data) : {});
            } catch (e) {
              reject(new Error(`Failed to parse response: ${e.message}`));
            }
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });

      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async healthCheck() {
    try {
      const response = await this.request('GET', '/api/tags');
      const models = Array.isArray(response) ? response : (response.models || []);
      return { available: true, message: 'Ollama is running', models: models.map(m => m.name || m) };
    } catch (error) {
      return { available: false, message: `Not available: ${error.message}`, models: [] };
    }
  }

  async listModels() {
    const response = await this.request('GET', '/api/tags');
    const models = Array.isArray(response) ? response : (response.models || []);
    return models.map(m => m.name || m);
  }

  async chat(model, messages, onChunk = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.host + (this.host.endsWith('/') ? 'api/chat' : '/api/chat'));
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const body = { model, messages, stream: true };
      const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: this.timeout };

      const req = client.request(url, options, (res) => {
        let buffer = '';
        let fullResponse = '';

        res.on('data', chunk => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();

          lines.forEach(line => {
            try {
              const data = JSON.parse(line);
              fullResponse += data.message?.content || '';
              if (onChunk) onChunk(data);
            } catch (e) {}
          });
        });

        res.on('end', () => {
          if (buffer) {
            try {
              const data = JSON.parse(buffer);
              fullResponse += data.message?.content || '';
              if (onChunk) onChunk(data);
            } catch (e) {}
          }
          resolve({ response: fullResponse.trim() });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Chat timeout')); });

      req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = OllamaClient;
