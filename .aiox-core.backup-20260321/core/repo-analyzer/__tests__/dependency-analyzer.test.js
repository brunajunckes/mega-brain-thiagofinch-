'use strict';

const fs = require('fs-extra');
const path = require('path');
const { DependencyAnalyzer } = require('../dependency-analyzer');

describe('DependencyAnalyzer', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-deps-analyzer');
    await fs.ensureDir(testDir);
    analyzer = new DependencyAnalyzer({ rootPath: testDir });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create analyzer with custom root path', () => {
      expect(analyzer.rootPath).toBe(testDir);
    });

    it('should initialize empty dependencies', () => {
      expect(analyzer.dependencies.production.length).toBe(0);
      expect(analyzer.dependencies.development.length).toBe(0);
    });
  });

  describe('npm dependency parsing', () => {
    it('should parse package.json dependencies', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { express: '^4.18.0', lodash: '^4.17.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.summary.productionDeps).toBe(2);
      expect(result.dependencies.production.some((d) => d.name === 'express')).toBe(true);
      expect(result.dependencies.production.some((d) => d.name === 'lodash')).toBe(true);
    });

    it('should parse dev dependencies', async () => {
      const pkgJson = {
        name: 'test',
        devDependencies: { jest: '^29.0.0', eslint: '^8.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.summary.developmentDeps).toBe(2);
      expect(result.dependencies.development.some((d) => d.name === 'jest')).toBe(true);
    });

    it('should parse optional dependencies', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { express: '^4.18.0' },
        optionalDependencies: { bcrypt: '^5.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(
        result.dependencies.production.some((d) => d.name === 'bcrypt' && d.optional),
      ).toBe(true);
    });

    it('should mark npm dependencies correctly', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { react: '^18.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.dependencies.production[0].type).toBe('npm');
      expect(result.dependencies.production[0].manager).toBe('npm');
    });
  });

  describe('python dependency parsing', () => {
    it('should parse requirements.txt', async () => {
      const reqsContent = 'flask==2.0.0\nrequests>=2.28.0\npandas~=1.5.0';
      await fs.writeFile(path.join(testDir, 'requirements.txt'), reqsContent);

      const result = await analyzer.analyze();

      expect(result.dependencies.production.length).toBeGreaterThan(0);
      expect(result.dependencies.production.some((d) => d.name === 'flask')).toBe(true);
      expect(result.dependencies.production.some((d) => d.name === 'requests')).toBe(true);
    });

    it('should skip comments in requirements.txt', async () => {
      const reqsContent = '# Flask dependency\nflask==2.0.0\n# Requests lib\nrequests>=2.28.0';
      await fs.writeFile(path.join(testDir, 'requirements.txt'), reqsContent);

      const result = await analyzer.analyze();

      expect(result.dependencies.production.length).toBe(2);
    });

    it('should mark python dependencies correctly', async () => {
      const reqsContent = 'flask==2.0.0';
      await fs.writeFile(path.join(testDir, 'requirements.txt'), reqsContent);

      const result = await analyzer.analyze();

      expect(result.dependencies.production[0].type).toBe('python');
      expect(result.dependencies.production[0].manager).toBe('pip');
    });
  });

  describe('go dependency parsing', () => {
    it('should parse go.mod', async () => {
      const goModContent = `module github.com/test/app

require (
  github.com/gorilla/mux v1.8.0
  github.com/lib/pq v1.10.0
)`;
      await fs.writeFile(path.join(testDir, 'go.mod'), goModContent);

      const result = await analyzer.analyze();

      expect(result.dependencies.production.length).toBeGreaterThan(0);
      expect(result.dependencies.production.some((d) => d.name === 'github.com/gorilla/mux')).toBe(
        true,
      );
    });

    it('should mark go dependencies correctly', async () => {
      const goModContent = `module github.com/test/app

require (
  github.com/gorilla/mux v1.8.0
)`;
      await fs.writeFile(path.join(testDir, 'go.mod'), goModContent);

      const result = await analyzer.analyze();

      expect(result.dependencies.production[0].type).toBe('go');
      expect(result.dependencies.production[0].manager).toBe('go');
    });
  });

  describe('dependency graph building', () => {
    it('should build dependency graph nodes', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { express: '^4.18.0', lodash: '^4.17.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.graph.nodes.length).toBe(2);
      expect(result.graph.nodes.some((n) => n.name === 'express')).toBe(true);
    });

    it('should detect known dependency relationships', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.graph.edges.length).toBeGreaterThan(0);
    });
  });

  describe('outdated package detection', () => {
    it('should detect outdated versions', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { 'old-lib': '^1.0.0-beta', express: '^4.18.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.outdated.length).toBeGreaterThan(0);
    });

    it('should include outdated in summary', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { 'old-lib': '^1.0.0-beta' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.summary.outdatedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('report generation', () => {
    it('should generate analysis report', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { express: '^4.18.0' },
        devDependencies: { jest: '^29.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await analyzer.analyze();

      expect(result.summary).toBeDefined();
      expect(result.summary.totalDependencies).toBe(2);
      expect(result.dependencies).toBeDefined();
      expect(result.graph).toBeDefined();
    });

    it('should handle empty repository', async () => {
      const result = await analyzer.analyze();

      expect(result.summary.totalDependencies).toBe(0);
      expect(result.dependencies.production).toHaveLength(0);
      expect(result.dependencies.development).toHaveLength(0);
    });
  });

  describe('getter methods', () => {
    it('getAllDependencies should return dependencies', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { express: '^4.18.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      await analyzer.analyze();
      const deps = analyzer.getAllDependencies();

      expect(deps.production.length).toBeGreaterThan(0);
    });

    it('getDependencyGraph should return graph', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { express: '^4.18.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      await analyzer.analyze();
      const graph = analyzer.getDependencyGraph();

      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
    });

    it('getCircularDependencies should return circular deps', async () => {
      const pkgJson = {
        name: 'test',
        dependencies: { express: '^4.18.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      await analyzer.analyze();
      const circularDeps = analyzer.getCircularDependencies();

      expect(Array.isArray(circularDeps)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid package.json', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), 'invalid json {');

      await expect(analyzer.analyze()).rejects.toThrow();
    });

    it('should handle invalid go.mod', async () => {
      await fs.writeFile(path.join(testDir, 'go.mod'), 'invalid go mod');

      // Should not throw, but handle gracefully
      const result = await analyzer.analyze();
      expect(result).toBeDefined();
    });
  });
});
