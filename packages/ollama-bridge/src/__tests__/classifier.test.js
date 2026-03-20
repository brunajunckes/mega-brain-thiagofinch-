const test = require('node:test');
const assert = require('node:assert');
const Classifier = require('../classifier');

test('Classifier - Simple tasks score 1-2', () => {
  const simpleTexts = [
    'ler arquivo',
    'list files',
    'summarize this',
    'explain concept',
  ];
  
  simpleTexts.forEach(text => {
    const score = Classifier.classify(text);
    assert.ok(score <= 2.5, `Expected score <= 2.5 for "${text}", got ${score}`);
  });
});

test('Classifier - Complex tasks score 4-5', () => {
  const complexTexts = [
    'implementar webhook com retry logic',
    'design scalable database schema',
    'debug circular dependency issue',
    'refactor authentication module',
  ];
  
  complexTexts.forEach(text => {
    const score = Classifier.classify(text);
    assert.ok(score >= 3.5, `Expected score >= 3.5 for "${text}", got ${score}`);
  });
});

test('Classifier - Category names correct', () => {
  assert.equal(Classifier.getCategory(1), 'TRIVIAL');
  assert.equal(Classifier.getCategory(2), 'SIMPLE');
  assert.equal(Classifier.getCategory(3), 'MEDIUM');
  assert.equal(Classifier.getCategory(4), 'COMPLEX');
  assert.equal(Classifier.getCategory(5), 'CRITICAL');
});

test('Classifier - Recommend model correctly', () => {
  assert.equal(Classifier.recommendModel(1, 3), 'ollama');
  assert.equal(Classifier.recommendModel(3, 3), 'ollama');
  assert.equal(Classifier.recommendModel(4, 3), 'claude');
  assert.equal(Classifier.recommendModel(5, 3), 'claude');
});
