const test = require('node:test');
const assert = require('node:assert');
const Router = require('../router');

test('Router - Decide based on threshold', () => {
  const config = { ollama: { complexityThreshold: 3 }, routing: {} };
  
  assert.equal(Router.decide(2, config), 'ollama');
  assert.equal(Router.decide(3, config), 'ollama');
  assert.equal(Router.decide(4, config), 'claude');
  assert.equal(Router.decide(5, config), 'claude');
});

test('Router - Force Ollama overrides threshold', () => {
  const config = { ollama: { complexityThreshold: 1 }, routing: { forceOllama: true } };
  assert.equal(Router.decide(5, config), 'ollama');
});

test('Router - Force Claude overrides threshold', () => {
  const config = { ollama: { complexityThreshold: 5 }, routing: { forceClaude: true } };
  assert.equal(Router.decide(1, config), 'claude');
});

test('Router - Get model names', () => {
  assert.equal(Router.getModel('llama3.2', true), 'llama3.2');
  assert.equal(Router.getModel(null, true), 'llama3.2');
  assert.equal(Router.getModel(null, false), 'claude-opus-4-6');
});

test('Router - Validate decision', () => {
  assert.ok(Router.validate('ollama', 2));
  assert.ok(Router.validate('claude', 4));
  assert.ok(!Router.validate('invalid', 3));
  assert.ok(!Router.validate('ollama', 0));
  assert.ok(!Router.validate('ollama', 6));
});
