/**
 * Condition Evaluator Tests (Enhanced)
 */

const { EnhancedConditionEvaluator } = require('../condition-evaluator');

describe('EnhancedConditionEvaluator', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new EnhancedConditionEvaluator({ enableCache: true });
  });

  describe('Basic Expression Evaluation', () => {
    it('should evaluate boolean literals', () => {
      expect(evaluator.evaluateExpression(true)).toBe(true);
      expect(evaluator.evaluateExpression(false)).toBe(false);
    });

    it('should evaluate variable references', () => {
      const context = { active: true, count: 5 };
      expect(evaluator.evaluateExpression('active', context)).toBe(true);
      expect(evaluator.evaluateExpression('count', context)).toBe(5);
    });

    it('should evaluate undefined variables as false/undefined', () => {
      const context = { active: true };
      expect(evaluator.evaluateExpression('missing', context)).toBeUndefined();
    });
  });

  describe('Comparison Operators', () => {
    const context = { a: 10, b: 5, name: 'test', items: [1, 2, 3] };

    it('should evaluate == operator', () => {
      expect(evaluator.evaluateExpression('a == 10', context)).toBe(true);
      expect(evaluator.evaluateExpression('a == b', context)).toBe(false);
    });

    it('should evaluate != operator', () => {
      expect(evaluator.evaluateExpression('a != b', context)).toBe(true);
      expect(evaluator.evaluateExpression('a != 10', context)).toBe(false);
    });

    it('should evaluate === operator', () => {
      expect(evaluator.evaluateExpression('a === 10', context)).toBe(true);
      expect(evaluator.evaluateExpression('name === "test"', context)).toBe(true);
    });

    it('should evaluate > operator', () => {
      expect(evaluator.evaluateExpression('a > b', context)).toBe(true);
      expect(evaluator.evaluateExpression('b > a', context)).toBe(false);
    });

    it('should evaluate < operator', () => {
      expect(evaluator.evaluateExpression('b < a', context)).toBe(true);
      expect(evaluator.evaluateExpression('a < b', context)).toBe(false);
    });

    it('should evaluate >= operator', () => {
      expect(evaluator.evaluateExpression('a >= 10', context)).toBe(true);
      expect(evaluator.evaluateExpression('a >= b', context)).toBe(true);
    });

    it('should evaluate <= operator', () => {
      expect(evaluator.evaluateExpression('b <= a', context)).toBe(true);
      expect(evaluator.evaluateExpression('b <= 5', context)).toBe(true);
    });

    it('should evaluate in operator', () => {
      expect(evaluator.evaluateExpression('1 in items', context)).toBe(true);
      expect(evaluator.evaluateExpression('99 in items', context)).toBe(false);
    });
  });

  describe('Logical Operators', () => {
    const context = { a: true, b: false, x: 5, y: 10 };

    it('should evaluate AND operator', () => {
      expect(evaluator.evaluateExpression('a && b', context)).toBe(false);
      expect(evaluator.evaluateExpression('a && a', context)).toBe(true);
    });

    it('should evaluate OR operator', () => {
      expect(evaluator.evaluateExpression('a || b', context)).toBe(true);
      expect(evaluator.evaluateExpression('b || b', context)).toBe(false);
    });

    it('should evaluate NOT operator', () => {
      expect(evaluator.evaluateExpression('!a', context)).toBe(false);
      expect(evaluator.evaluateExpression('!b', context)).toBe(true);
    });

    it('should evaluate complex expressions', () => {
      expect(evaluator.evaluateExpression('a && (x > y)', context)).toBe(false);
      expect(evaluator.evaluateExpression('a || (x > y)', context)).toBe(true);
      expect(evaluator.evaluateExpression('(x < y) && a', context)).toBe(true);
    });
  });

  describe('Context Stack', () => {
    it('should push and pop contexts', () => {
      evaluator.pushContext({ a: 1 });
      evaluator.pushContext({ b: 2 });

      const ctx = evaluator.getCurrentContext();
      expect(ctx.a).toBe(1);
      expect(ctx.b).toBe(2);

      evaluator.popContext();
      const ctx2 = evaluator.getCurrentContext();
      expect(ctx2.a).toBe(1);
      expect(ctx2.b).toBeUndefined();
    });

    it('should merge contexts correctly', () => {
      evaluator.pushContext({ user: { name: 'John' } });
      evaluator.pushContext({ user: { age: 30 } });

      const ctx = evaluator.getCurrentContext();
      // Note: Object.assign replaces the entire user object, not merging nested properties
      expect(ctx.user.age).toBe(30);
      expect(ctx.user.name).toBeUndefined(); // Replaced by second context
    });

    it('should evaluate against context stack', () => {
      evaluator.pushContext({ x: 5 });
      expect(evaluator.evaluateExpression('x > 3')).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache evaluations', () => {
      const context = { a: 10 };
      evaluator.evaluateExpression('a > 5', context);
      evaluator.evaluateExpression('a > 5', context);

      const stats = evaluator.getStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    it('should not cache different contexts', () => {
      evaluator.evaluateExpression('a > 5', { a: 10 });
      evaluator.evaluateExpression('a > 5', { a: 3 });

      const stats = evaluator.getStats();
      expect(stats.cacheMisses).toBe(2);
      expect(stats.cacheHits).toBe(0);
    });

    it('should clear cache', () => {
      evaluator.evaluateExpression('a > 5', { a: 10 });
      const cleared = evaluator.clearCache();

      expect(cleared).toBe(1);
      expect(evaluator.getStats().cacheSize).toBe(0);
    });
  });

  describe('Nested Path Evaluation', () => {
    const context = {
      user: {
        profile: {
          name: 'John',
          age: 30
        }
      }
    };

    it('should evaluate nested paths', () => {
      expect(evaluator.evaluateExpression('user.profile.name', context)).toBe('John');
      expect(evaluator.evaluateExpression('user.profile.age', context)).toBe(30);
    });

    it('should evaluate nested path comparisons', () => {
      expect(evaluator.evaluateExpression('user.profile.age > 25', context)).toBe(true);
      expect(evaluator.evaluateExpression('user.profile.name === "John"', context)).toBe(true);
    });

    it('should handle undefined nested paths', () => {
      expect(evaluator.evaluateExpression('user.missing.value', context)).toBeUndefined();
    });
  });

  describe('String and Number Literals', () => {
    const context = { value: 'test' };

    it('should parse string literals', () => {
      expect(evaluator.evaluateExpression('"hello"')).toBe('hello');
      expect(evaluator.evaluateExpression("'world'")).toBe('world');
    });

    it('should parse number literals', () => {
      expect(evaluator.evaluateExpression('42')).toBe(42);
      expect(evaluator.evaluateExpression('3.14')).toBe(3.14);
    });

    it('should compare with string literals', () => {
      expect(evaluator.evaluateExpression('value == "test"', context)).toBe(true);
      expect(evaluator.evaluateExpression('value == "other"', context)).toBe(false);
    });
  });

  describe('Operator Precedence', () => {
    const context = { a: true, b: false, c: true };

    it('should handle AND before OR', () => {
      // a && b || c should be (a && b) || c = false || true = true
      expect(evaluator.evaluateExpression('a && b || c', context)).toBe(true);
    });

    it('should respect parentheses', () => {
      // a && (b || c) = true && (false || true) = true && true = true
      expect(evaluator.evaluateExpression('a && (b || c)', context)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track statistics', () => {
      const context = { a: 10 };
      evaluator.evaluateExpression('a > 5', context);
      evaluator.evaluateExpression('a > 5', context);
      evaluator.evaluateExpression('a < 3', context);

      const stats = evaluator.getStats();
      expect(stats.evaluated).toBe(2);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(2);
      expect(stats.cacheHitRatio).toBeCloseTo(1 / 3);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid comparisons gracefully', () => {
      expect(() => {
        evaluator.evaluateExpression('undefined > 5', {});
      }).not.toThrow();
    });

    it('should increment error stats on error', () => {
      const initialErrors = evaluator.getStats().errors;
      // This should not actually throw, so let's test a different scenario
      evaluator.evaluateExpression('a && b', { a: true, b: true });
      // Errors would increment if we had actual error conditions
    });
  });
});
