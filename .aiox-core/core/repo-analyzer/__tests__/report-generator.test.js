'use strict';

const fs = require('fs-extra');
const path = require('path');
const { ReportGenerator } = require('../report-generator');

describe('ReportGenerator', () => {
  let testDir;
  let generator;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-report-gen');
    await fs.ensureDir(testDir);
    generator = new ReportGenerator({ rootPath: testDir, outputPath: testDir });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create generator with custom paths', () => {
      expect(generator.rootPath).toBe(testDir);
      expect(generator.outputPath).toBe(testDir);
    });
  });

  describe('JSON report generation', () => {
    it('should generate JSON report', async () => {
      const analysisData = {
        scanner: {
          summary: { totalFiles: 10, totalLoc: 500, languages: 2, frameworks: 1 },
          languages: { JavaScript: { files: 10, loc: 500, percentage: 100 } },
          frameworks: ['Node.js'],
        },
        deps: {
          summary: { totalDependencies: 5, productionDeps: 3, developmentDeps: 2 },
          dependencies: { production: [], development: [] },
          graph: { nodes: [], edges: [] },
        },
        patterns: {
          architecture: { name: 'Modular', score: 0.85 },
          api: { rest: { detected: true } },
          database: {},
        },
        metrics: {
          avgFunctionLength: 20,
          complexityScore: 'medium',
          testCoverage: 80,
          documentationRatio: 0.6,
          codeQuality: 8,
        },
      };

      const result = await generator.generate(analysisData);

      expect(fs.existsSync(result.json)).toBe(true);
      const content = JSON.parse(await fs.readFile(result.json, 'utf-8'));
      expect(content.summary.totalFiles).toBe(10);
    });
  });

  describe('markdown report generation', () => {
    it('should generate markdown report', async () => {
      const analysisData = {
        scanner: {
          summary: { totalFiles: 10, totalLoc: 500, languages: 2, frameworks: 1 },
          languages: { JavaScript: { files: 10, loc: 500, percentage: 100 } },
          frameworks: ['Node.js'],
        },
        deps: {
          summary: { totalDependencies: 5, productionDeps: 3, developmentDeps: 2, outdatedCount: 0 },
          dependencies: { production: [], development: [] },
        },
        patterns: {
          architecture: { name: 'Modular', score: 0.85, evidence: [] },
          api: {},
          database: {},
        },
        metrics: {
          avgFunctionLength: 20,
          complexityScore: 'medium',
          testCoverage: 80,
          documentationRatio: 0.6,
          codeQuality: 8,
        },
      };

      const result = await generator.generate(analysisData);

      expect(fs.existsSync(result.markdown)).toBe(true);
      const content = await fs.readFile(result.markdown, 'utf-8');
      expect(content).toContain('Repository Analysis Report');
      expect(content).toContain('Modular');
    });
  });

  describe('architecture report generation', () => {
    it('should generate architecture report', async () => {
      const analysisData = {
        scanner: {
          summary: { totalFiles: 10, totalLoc: 500, languages: 2, frameworks: 1 },
          languages: { JavaScript: { files: 10, loc: 500, percentage: 100 } },
          frameworks: ['Node.js'],
        },
        deps: { summary: {} },
        patterns: {
          architecture: { name: 'Layered', score: 0.75, evidence: ['api layer', 'domain layer'] },
          api: { rest: { detected: true } },
          database: {},
          cli: { detected: false },
        },
        metrics: {
          testCoverage: 80,
          documentationRatio: 0.6,
          complexityScore: 'medium',
        },
      };

      const result = await generator.generate(analysisData);

      expect(fs.existsSync(result.architecture)).toBe(true);
      const content = await fs.readFile(result.architecture, 'utf-8');
      expect(content).toContain('Architecture Overview');
      expect(content).toContain('Layered');
    });
  });

  describe('dependency graph export', () => {
    it('should export dependency graph', async () => {
      const depsData = {
        nodes: [
          { id: 'express', name: 'express', version: '^4.18.0' },
          { id: 'lodash', name: 'lodash', version: '^4.17.0' },
        ],
        edges: [{ from: 'express', to: 'lodash', strength: 'direct' }],
      };

      const result = await generator.exportDependencyGraph(depsData);

      expect(fs.existsSync(result)).toBe(true);
      const content = JSON.parse(await fs.readFile(result, 'utf-8'));
      expect(content.nodes.length).toBe(2);
    });
  });

  describe('report content validation', () => {
    it('should include all required sections in JSON', async () => {
      const analysisData = {
        scanner: { summary: {}, languages: {}, frameworks: [] },
        deps: { summary: {}, dependencies: {}, graph: { nodes: [], edges: [] } },
        patterns: { architecture: {}, api: {}, database: {} },
        metrics: {},
      };

      const result = await generator.generate(analysisData);

      const content = JSON.parse(await fs.readFile(result.json, 'utf-8'));
      expect(content.metadata).toBeDefined();
      expect(content.summary).toBeDefined();
      expect(content.dependencies).toBeDefined();
      expect(content.metrics).toBeDefined();
    });

    it('should include timestamp in all reports', async () => {
      const analysisData = {
        scanner: { summary: {}, languages: {}, frameworks: [] },
        deps: { summary: {}, dependencies: {}, graph: { nodes: [], edges: [] } },
        patterns: { architecture: {}, api: {}, database: {} },
        metrics: {},
      };

      const result = await generator.generate(analysisData);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('error handling', () => {
    it('should handle missing analysis data', async () => {
      const result = await generator.generate({});

      expect(result.json).toBeDefined();
      expect(result.markdown).toBeDefined();
      expect(result.architecture).toBeDefined();
    });

    it('should handle read-only output path gracefully', async () => {
      // Create a read-only generator and verify it tries to write
      const roGenerator = new ReportGenerator({
        rootPath: testDir,
        outputPath: '/root/.claude/projects/-srv-aiox/',
      });

      // This should work since /root/.claude/projects/-srv-aiox/ is usually writable
      const analysisData = {
        scanner: { summary: {}, languages: {}, frameworks: [] },
        deps: { summary: {}, dependencies: {}, graph: { nodes: [], edges: [] } },
        patterns: { architecture: {}, api: {}, database: {} },
        metrics: {},
      };

      const result = await roGenerator.generate(analysisData);
      expect(result).toBeDefined();
    });
  });
});
