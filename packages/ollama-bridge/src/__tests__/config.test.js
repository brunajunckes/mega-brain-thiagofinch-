const test = require('node:test');
const assert = require('node:assert');
const ConfigManager = require('../config');
const fs = require('fs');

test('ConfigManager - Load default config', () => {
  ConfigManager.reset();
  const config = ConfigManager.load();
  
  assert.ok(config.ollama);
  assert.equal(config.ollama.host, 'http://localhost:11434');
  assert.equal(config.ollama.model, 'llama3.2');
  assert.equal(config.ollama.complexityThreshold, 3);
});

test('ConfigManager - Get nested values', () => {
  ConfigManager.reset();
  
  assert.equal(ConfigManager.get('ollama.host'), 'http://localhost:11434');
  assert.equal(ConfigManager.get('ollama.complexityThreshold'), 3);
});

test('ConfigManager - Set nested values', () => {
  ConfigManager.reset();
  ConfigManager.set('ollama.model', 'mistral');
  
  assert.equal(ConfigManager.get('ollama.model'), 'mistral');
});

test('ConfigManager - Display config', () => {
  ConfigManager.reset();
  const display = ConfigManager.display();
  
  assert.ok(display.includes('ollama'));
  assert.ok(display.includes('llama3.2'));
});

test('ConfigManager - Get path', () => {
  const path = ConfigManager.getPath();
  assert.ok(path.includes('.aiox'));
  assert.ok(path.includes('ollama-bridge.json'));
});
