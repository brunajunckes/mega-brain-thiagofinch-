'use strict';

const { parseFilters, applyFilters } = require('../../.aiox-core/cli/commands/report');

describe('Report CLI', () => {
  describe('parseFilters', () => {
    test('should return empty object when no filters provided', () => {
      const filters = parseFilters({});
      expect(filters).toEqual({});
    });

    test('should parse filter-health as number', () => {
      const filters = parseFilters({ 'filter-health': '7' });
      expect(filters.minHealth).toBe(7);
    });

    test('should parse filter-health with decimal', () => {
      const filters = parseFilters({ 'filter-health': '6.5' });
      expect(filters.minHealth).toBe(6.5);
    });

    test('should ignore invalid filter-health', () => {
      const filters = parseFilters({ 'filter-health': 'abc' });
      expect(filters.minHealth).toBeUndefined();
    });

    test('should parse valid filter-debt', () => {
      const filters = parseFilters({ 'filter-debt': 'high' });
      expect(filters.debtLevel).toBe('high');
    });

    test('should ignore invalid filter-debt value', () => {
      const filters = parseFilters({ 'filter-debt': 'extreme' });
      expect(filters.debtLevel).toBeUndefined();
    });

    test('should parse both filters together', () => {
      const filters = parseFilters({
        'filter-health': '5',
        'filter-debt': 'critical',
      });
      expect(filters.minHealth).toBe(5);
      expect(filters.debtLevel).toBe('critical');
    });

    test('should accept all valid debt levels', () => {
      const levels = ['critical', 'high', 'moderate', 'low', 'minimal'];
      levels.forEach((level) => {
        const filters = parseFilters({ 'filter-debt': level });
        expect(filters.debtLevel).toBe(level);
      });
    });

    test('should handle null filter values', () => {
      const filters = parseFilters({
        'filter-health': null,
        'filter-debt': null,
      });
      expect(filters).toEqual({});
    });

    test('should handle undefined filter values', () => {
      const filters = parseFilters({
        'filter-health': undefined,
        'filter-debt': undefined,
      });
      expect(filters).toEqual({});
    });
  });

  describe('applyFilters', () => {
    const repos = [
      { name: 'repo-a', healthScore: 8, debtLevel: 'low' },
      { name: 'repo-b', healthScore: 5, debtLevel: 'high' },
      { name: 'repo-c', healthScore: 3, debtLevel: 'critical' },
      { name: 'repo-d', healthScore: 7, debtLevel: 'moderate' },
    ];

    test('should return all repos with empty filters', () => {
      const result = applyFilters(repos, {});
      expect(result.length).toBe(4);
    });

    test('should filter by minimum health', () => {
      const result = applyFilters(repos, { minHealth: 6 });
      expect(result.length).toBe(2);
      expect(result.every((r) => r.healthScore >= 6)).toBe(true);
    });

    test('should filter by debt level', () => {
      const result = applyFilters(repos, { debtLevel: 'high' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('repo-b');
    });

    test('should apply combined filters', () => {
      const result = applyFilters(repos, {
        minHealth: 5,
        debtLevel: 'high',
      });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('repo-b');
    });

    test('should return empty array when no repos match', () => {
      const result = applyFilters(repos, { minHealth: 10 });
      expect(result.length).toBe(0);
    });

    test('should filter critical debt repos', () => {
      const result = applyFilters(repos, { debtLevel: 'critical' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('repo-c');
    });
  });
});
