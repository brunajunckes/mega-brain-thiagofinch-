'use strict';

const fs = require('fs-extra');
const path = require('path');
const { PatternDetector } = require('../pattern-detector');

describe('PatternDetector', () => {
  let testDir;
  let detector;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-pattern-detector');
    await fs.ensureDir(testDir);
    detector = new PatternDetector({ rootPath: testDir });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create detector with custom root path', () => {
      expect(detector.rootPath).toBe(testDir);
    });
  });

  describe('architecture pattern detection', () => {
    it('should detect MVC pattern', async () => {
      await fs.ensureDir(path.join(testDir, 'models'));
      await fs.ensureDir(path.join(testDir, 'views'));
      await fs.ensureDir(path.join(testDir, 'controllers'));

      const result = await detector.detect();

      expect(result.patterns.architecture).toBeDefined();
      expect(result.patterns.architecture.score).toBeGreaterThan(0.5);
    });

    it('should detect Layered pattern', async () => {
      await fs.ensureDir(path.join(testDir, 'api'));
      await fs.ensureDir(path.join(testDir, 'application'));
      await fs.ensureDir(path.join(testDir, 'domain'));
      await fs.ensureDir(path.join(testDir, 'infrastructure'));

      const result = await detector.detect();

      expect(result.patterns.architecture.name).toBe('Layered');
      expect(result.patterns.architecture.score).toBeGreaterThan(0.3);
    });

    it('should detect Modular pattern', async () => {
      await fs.ensureDir(path.join(testDir, 'modules', 'auth'));
      await fs.ensureDir(path.join(testDir, 'modules', 'users'));
      await fs.writeFile(path.join(testDir, 'modules', 'auth', 'index.js'), 'module.exports = {}');

      const result = await detector.detect();

      expect(result.patterns.architecture.name).toBe('Modular');
    });
  });

  describe('API pattern detection', () => {
    it('should detect REST API', async () => {
      const pkgJson = {
        name: 'app',
        dependencies: { express: '^4.18.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await detector.detect();

      expect(result.patterns.api.rest).toBeDefined();
      expect(result.patterns.api.rest.detected).toBe(true);
    });

    it('should detect GraphQL API', async () => {
      const pkgJson = {
        name: 'app',
        dependencies: { graphql: '^16.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await detector.detect();

      expect(result.patterns.api.graphql).toBeDefined();
      expect(result.patterns.api.graphql.detected).toBe(true);
    });

    it('should detect gRPC API', async () => {
      const pkgJson = {
        name: 'app',
        dependencies: { '@grpc/grpc-js': '^1.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await detector.detect();

      expect(result.patterns.api.grpc).toBeDefined();
      expect(result.patterns.api.grpc.detected).toBe(true);
    });
  });

  describe('database pattern detection', () => {
    it('should detect Prisma', async () => {
      const pkgJson = {
        name: 'app',
        dependencies: { prisma: '^5.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await detector.detect();

      expect(result.patterns.database.prisma).toBeDefined();
      expect(result.patterns.database.prisma.detected).toBe(true);
    });

    it('should detect Sequelize ORM', async () => {
      const pkgJson = {
        name: 'app',
        dependencies: { sequelize: '^6.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

      const result = await detector.detect();

      expect(result.patterns.database.sequelize).toBeDefined();
    });

    it('should detect migrations', async () => {
      await fs.ensureDir(path.join(testDir, 'migrations'));
      await fs.writeFile(path.join(testDir, 'migrations', '001_init.sql'), 'CREATE TABLE users');

      const result = await detector.detect();

      expect(result.patterns.database.migrations).toBeDefined();
      expect(result.patterns.database.migrations.detected).toBe(true);
    });
  });

  describe('abstraction pattern detection', () => {
    it('should detect middleware pattern', async () => {
      await fs.ensureDir(path.join(testDir, 'middleware'));
      await fs.writeFile(path.join(testDir, 'middleware', 'auth.js'), 'module.exports = {}');

      const result = await detector.detect();

      expect(result.patterns.abstractions.middleware).toBeDefined();
      expect(result.patterns.abstractions.middleware.detected).toBe(true);
    });

    it('should detect guards pattern', async () => {
      await fs.ensureDir(path.join(testDir, 'guards'));
      await fs.writeFile(path.join(testDir, 'guards', 'auth.guard.ts'), 'export class AuthGuard');

      const result = await detector.detect();

      expect(result.patterns.abstractions.guards).toBeDefined();
    });
  });

  describe('CLI structure detection', () => {
    it('should detect CLI directory', async () => {
      await fs.ensureDir(path.join(testDir, 'cli'));
      await fs.writeFile(path.join(testDir, 'cli', 'index.js'), 'module.exports = {}');

      const result = await detector.detect();

      expect(result.patterns.cli.detected).toBe(true);
      expect(result.patterns.cli.confidence).toBeGreaterThan(0.8);
    });

    it('should detect bin structure', async () => {
      await fs.ensureDir(path.join(testDir, 'bin'));
      await fs.writeFile(path.join(testDir, 'bin', 'index.js'), '#!/usr/bin/env node');

      const result = await detector.detect();

      expect(result.patterns.cli.detected).toBe(true);
    });
  });

  describe('report generation', () => {
    it('should generate detection report', async () => {
      const result = await detector.detect();

      expect(result.timestamp).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.patterns.architecture).toBeDefined();
      expect(result.patterns.api).toBeDefined();
      expect(result.patterns.database).toBeDefined();
      expect(result.patterns.abstractions).toBeDefined();
      expect(result.patterns.cli).toBeDefined();
    });
  });

  describe('getter methods', () => {
    it('getPatterns should return all patterns', async () => {
      await detector.detect();
      const patterns = detector.getPatterns();

      expect(patterns).toBeDefined();
      expect(patterns.architecture).toBeDefined();
    });

    it('getArchitecturePattern should return architecture', async () => {
      await detector.detect();
      const arch = detector.getArchitecturePattern();

      expect(arch).toBeDefined();
      expect(arch.score).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle detection on non-existent path', async () => {
      const detector2 = new PatternDetector({ rootPath: '/nonexistent/path' });
      // Should not throw, just return minimal results
      const result = await detector2.detect();
      expect(result).toBeDefined();
    });
  });
});
