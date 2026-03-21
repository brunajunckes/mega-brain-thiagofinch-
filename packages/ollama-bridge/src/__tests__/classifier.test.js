const Classifier = require('../classifier');

describe('Classifier', () => {
  test('Simple tasks score 1-2', () => {
    const simpleTexts = [
      'ler arquivo',
      'list files',
      'summarize this',
      'explain concept',
    ];

    simpleTexts.forEach(text => {
      const score = Classifier.classify(text);
      expect(score).toBeLessThanOrEqual(2.5);
    });
  });

  test('Complex tasks score 4-5', () => {
    const complexTexts = [
      'implementar webhook com retry logic',
      'design scalable database schema',
      'debug circular dependency issue',
      'refactor authentication module',
    ];

    complexTexts.forEach(text => {
      const score = Classifier.classify(text);
      expect(score).toBeGreaterThanOrEqual(3.5);
    });
  });

  test('Category names correct', () => {
    expect(Classifier.getCategory(1)).toBe('TRIVIAL');
    expect(Classifier.getCategory(2)).toBe('SIMPLE');
    expect(Classifier.getCategory(3)).toBe('MEDIUM');
    expect(Classifier.getCategory(4)).toBe('COMPLEX');
    expect(Classifier.getCategory(5)).toBe('CRITICAL');
  });

  test('Recommend model correctly', () => {
    expect(Classifier.recommendModel(1, 3)).toBe('ollama');
    expect(Classifier.recommendModel(3, 3)).toBe('ollama');
    expect(Classifier.recommendModel(4, 3)).toBe('claude');
    expect(Classifier.recommendModel(5, 3)).toBe('claude');
  });
});
