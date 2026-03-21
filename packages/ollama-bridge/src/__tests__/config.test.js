const ConfigManager = require('../config');
const fs = require('fs');

describe('ConfigManager', () => {
  test('Load default config', () => {
    ConfigManager.reset();
    const config = ConfigManager.load();

    expect(config.ollama).toBeDefined();
    expect(config.ollama.host).toBe('http://localhost:11434');
    expect(config.ollama.model).toBe('llama3.2');
    expect(config.ollama.complexityThreshold).toBe(3);
  });

  test('Get nested values', () => {
    ConfigManager.reset();

    expect(ConfigManager.get('ollama.host')).toBe('http://localhost:11434');
    expect(ConfigManager.get('ollama.complexityThreshold')).toBe(3);
  });

  test('Set nested values', () => {
    ConfigManager.reset();
    ConfigManager.set('ollama.model', 'mistral');

    expect(ConfigManager.get('ollama.model')).toBe('mistral');
  });

  test('Display config', () => {
    ConfigManager.reset();
    const display = ConfigManager.display();

    expect(display).toContain('ollama');
    expect(display).toContain('llama3.2');
  });

  test('Get path', () => {
    const path = ConfigManager.getPath();
    expect(path).toContain('.aiox');
    expect(path).toContain('ollama-bridge.json');
  });
});
