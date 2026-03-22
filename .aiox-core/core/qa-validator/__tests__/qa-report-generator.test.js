'use strict';

const { QAReportGenerator } = require('../qa-report-generator');

describe('QAReportGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new QAReportGenerator();
  });

  const singleFileResult = {
    file: 'example.js',
    status: 'success',
    score: 92,
    verdict: 'APPROVED',
    criteria: {
      codeStyle: { pass: true, issues: [] },
      testCoverage: { pass: true, issues: [] },
      documentation: { pass: false, issues: [{ severity: 'MEDIUM', message: 'No JSDoc comments' }] },
      performance: { pass: true, issues: [] },
      security: { pass: true, issues: [] },
      typeSafety: { pass: true, issues: [] },
      integration: { pass: true, issues: [] },
    },
    findings: [
      {
        criterion: 'documentation',
        issues: [{ severity: 'MEDIUM', message: 'No JSDoc comments' }],
      },
    ],
  };

  const directoryResult = {
    directory: 'src',
    fileCount: 3,
    status: 'warning',
    averageScore: 78,
    verdict: 'NEEDS_WORK',
    files: [
      { file: 'a.js', score: 95, verdict: 'APPROVED' },
      { file: 'b.js', score: 72, verdict: 'NEEDS_WORK' },
      { file: 'c.js', score: 67, verdict: 'BLOCKED' },
    ],
    summary: {
      total: 3,
      approved: 1,
      needsWork: 1,
      blocked: 1,
      passRate: 33,
    },
    findings: [
      {
        criterion: 'security',
        issues: [{ severity: 'CRITICAL', message: 'Hardcoded credentials detected' }],
      },
      {
        criterion: 'test Coverage',
        issues: [{ severity: 'HIGH', message: 'No test file found' }],
      },
    ],
  };

  describe('generateReport - markdown', () => {
    it('should generate markdown for single file', () => {
      const report = generator.generateReport(singleFileResult, { format: 'markdown' });

      expect(report).toContain('# QA Validation Report');
      expect(report).toContain('**Verdict:** APPROVED');
      expect(report).toContain('**Score:** 92/100');
      expect(report).toContain('**File:** example.js');
      expect(report).toContain('## Criteria Breakdown');
      expect(report).toContain('documentation');
      expect(report).toContain('No JSDoc comments');
    });

    it('should generate markdown for directory', () => {
      const report = generator.generateReport(directoryResult, { format: 'markdown' });

      expect(report).toContain('**Directory:** src');
      expect(report).toContain('**Files Analyzed:** 3');
      expect(report).toContain('## Summary');
      expect(report).toContain('Pass Rate');
      expect(report).toContain('33%');
      expect(report).toContain('## File Results');
      expect(report).toContain('a.js');
      expect(report).toContain('APPROVED');
    });

    it('should include recommendations', () => {
      const report = generator.generateReport(directoryResult, { format: 'markdown' });

      expect(report).toContain('## Recommendations');
      expect(report).toContain('security');
    });
  });

  describe('generateReport - json', () => {
    it('should generate valid JSON', () => {
      const report = generator.generateReport(singleFileResult, { format: 'json' });
      const parsed = JSON.parse(report);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.score).toBe(92);
      expect(parsed.verdict).toBe('APPROVED');
      expect(parsed.recommendations).toBeInstanceOf(Array);
    });

    it('should include recommendations in JSON', () => {
      const report = generator.generateReport(directoryResult, { format: 'json' });
      const parsed = JSON.parse(report);

      expect(parsed.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateReport - text', () => {
    it('should generate text report', () => {
      const report = generator.generateReport(singleFileResult, { format: 'text' });

      expect(report).toContain('=== QA Validation Report ===');
      expect(report).toContain('File: example.js');
      expect(report).toContain('Score: 92/100');
      expect(report).toContain('Verdict: APPROVED');
    });

    it('should generate directory text report', () => {
      const report = generator.generateReport(directoryResult, { format: 'text' });

      expect(report).toContain('Directory: src');
      expect(report).toContain('Files: 3');
      expect(report).toContain('Average Score: 78/100');
    });
  });

  describe('generateSummaryLine', () => {
    it('should generate summary for single file', () => {
      const line = generator.generateSummaryLine(singleFileResult);
      expect(line).toBe('example.js: 92/100 -- APPROVED');
    });

    it('should generate summary for directory', () => {
      const line = generator.generateSummaryLine(directoryResult);
      expect(line).toBe('src: 78/100 (3 files) -- NEEDS_WORK');
    });
  });

  describe('recommendations', () => {
    it('should recommend security fixes for critical issues', () => {
      const result = {
        score: 50,
        findings: [
          { criterion: 'security', issues: [{ severity: 'CRITICAL', message: 'test' }] },
        ],
      };

      const report = generator.generateReport(result, { format: 'json' });
      const parsed = JSON.parse(report);
      const secRec = parsed.recommendations.find((r) => r.includes('security'));

      expect(secRec).toBeDefined();
    });

    it('should recommend tests when test coverage fails', () => {
      const result = {
        score: 60,
        findings: [
          { criterion: 'test Coverage', issues: [{ severity: 'HIGH', message: 'No test file' }] },
        ],
      };

      const report = generator.generateReport(result, { format: 'json' });
      const parsed = JSON.parse(report);
      const testRec = parsed.recommendations.find((r) => r.includes('test'));

      expect(testRec).toBeDefined();
    });

    it('should not generate unnecessary recommendations for high-scoring code', () => {
      const result = {
        score: 96,
        findings: [],
      };

      const report = generator.generateReport(result, { format: 'json' });
      const parsed = JSON.parse(report);

      // No specific category recommendations, and no low-score recommendation
      const lowScoreRec = parsed.recommendations.find((r) => r.includes('below threshold'));
      expect(lowScoreRec).toBeUndefined();
    });
  });
});
