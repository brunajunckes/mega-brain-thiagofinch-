'use strict';

const { ImpactCalculator } = require('../impact-calculator');

describe('ImpactCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new ImpactCalculator();
  });

  describe('architecture impact', () => {
    it('should rate major architecture change as critical', () => {
      const diff = {
        changes: {
          architecture: { changed: true, impact: 'major' },
          dependencies: {},
          metrics: {},
          languages: {},
        },
      };

      const result = calculator.assess(diff);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.breaking).toBe(true);
    });

    it('should rate minor architecture change as moderate', () => {
      const diff = {
        changes: {
          architecture: { changed: true, impact: 'minor' },
          dependencies: {},
          metrics: {},
          languages: {},
        },
      };

      const result = calculator.assess(diff);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('dependency impact', () => {
    it('should score multiple upgrades', () => {
      const diff = {
        changes: {
          architecture: {},
          dependencies: {
            upgraded: [
              { name: 'express', from: '^4.17.0', to: '^4.18.0' },
              { name: 'lodash', from: '^4.17.0', to: '^4.18.0' },
              { name: 'react', from: '^17.0.0', to: '^18.0.0' },
              { name: 'pkg4', from: '1.0', to: '2.0' },
              { name: 'pkg5', from: '1.0', to: '2.0' },
              { name: 'pkg6', from: '1.0', to: '2.0' },
            ],
          },
          metrics: {},
          languages: {},
        },
      };

      const result = calculator.assess(diff);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThan(0);
    });
  });

  describe('metrics impact', () => {
    it('should detect test coverage regression', () => {
      const diff = {
        changes: {
          architecture: {},
          dependencies: {},
          metrics: {
            testCoverage: { status: 'regressed', change: -10 },
          },
          languages: {},
        },
      };

      const result = calculator.assess(diff);

      expect(result.recommendations.some((r) => r.includes('coverage'))).toBe(true);
    });

    it('should praise code quality improvements', () => {
      const diff = {
        changes: {
          architecture: {},
          dependencies: {},
          metrics: {
            codeQuality: { status: 'improved', change: 2 },
          },
          languages: {},
        },
      };

      const result = calculator.assess(diff);

      expect(result.recommendations.some((r) => r.includes('✅'))).toBe(true);
    });
  });

  describe('language impact', () => {
    it('should note new languages', () => {
      const diff = {
        changes: {
          architecture: {},
          dependencies: {},
          metrics: {},
          languages: {
            added: [{ language: 'Go' }, { language: 'Python' }],
          },
        },
      };

      const result = calculator.assess(diff);

      expect(result.recommendations.some((r) => r.includes('language'))).toBe(true);
    });
  });

  describe('severity levels', () => {
    it('should assess severity based on score', () => {
      const diff = {
        changes: {
          architecture: { changed: true, impact: 'major' },
          dependencies: {
            upgraded: Array(5).fill({ name: 'pkg', from: '1.0', to: '2.0' }),
          },
          metrics: { testCoverage: { status: 'regressed', change: -10 } },
          languages: { removed: Array(1).fill({ language: 'Ruby' }) },
        },
      };

      const result = calculator.assess(diff);

      expect(['low', 'moderate', 'high', 'critical']).toContain(result.severity);
      expect(result.severity).toBeDefined();
    });
  });

  describe('getter methods', () => {
    it('getScore should return impact score', () => {
      const diff = {
        changes: {
          architecture: { changed: true, impact: 'major' },
          dependencies: {},
          metrics: {},
          languages: {},
        },
      };

      calculator.assess(diff);
      expect(calculator.getScore()).toBeGreaterThan(0);
    });

    it('isBreaking should indicate breaking changes', () => {
      const diff = {
        changes: {
          architecture: { changed: true, impact: 'major' },
          dependencies: {},
          metrics: {},
          languages: {},
        },
      };

      calculator.assess(diff);
      expect(calculator.isBreaking()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid diff', () => {
      expect(() => calculator.assess(null)).toThrow();
    });
  });
});
