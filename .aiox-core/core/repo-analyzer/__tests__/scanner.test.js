'use strict';

const fs = require('fs-extra');
const path = require('path');
const { RepoScanner } = require('../scanner');

describe('RepoScanner', () => {
  let testDir;
  let scanner;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-repo-scanner');
    await fs.ensureDir(testDir);
    scanner = new RepoScanner({ rootPath: testDir });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create scanner with custom root path', () => {
      expect(scanner.rootPath).toBe(testDir);
    });

    it('should have ignored directories', () => {
      expect(scanner.ignoredDirs.has('node_modules')).toBe(true);
      expect(scanner.ignoredDirs.has('.git')).toBe(true);
    });

    it('should have ignored files', () => {
      expect(scanner.ignoredFiles.has('.DS_Store')).toBe(true);
      expect(scanner.ignoredFiles.has('.env')).toBe(true);
    });
  });

  describe('file scanning', () => {
    it('should detect JavaScript files', async () => {
      await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("hello");\nconst x = 1;');
      const result = await scanner.scan();

      expect(result.languages.JavaScript).toBeDefined();
      expect(result.languages.JavaScript.files).toBe(1);
      expect(result.languages.JavaScript.loc).toBeGreaterThan(0);
    });

    it('should detect TypeScript files', async () => {
      await fs.writeFile(path.join(testDir, 'test.ts'), 'const x: number = 1;');
      const result = await scanner.scan();

      expect(result.languages.TypeScript).toBeDefined();
      expect(result.languages.TypeScript.files).toBe(1);
    });

    it('should detect Python files', async () => {
      await fs.writeFile(path.join(testDir, 'test.py'), 'print("hello")\nx = 1');
      const result = await scanner.scan();

      expect(result.languages.Python).toBeDefined();
      expect(result.languages.Python.files).toBe(1);
    });

    it('should count lines of code accurately', async () => {
      const jsCode = 'line1\nline2\nline3\n\nline5';
      await fs.writeFile(path.join(testDir, 'test.js'), jsCode);
      const result = await scanner.scan();

      expect(result.languages.JavaScript.loc).toBe(4); // Empty lines excluded
    });

    it('should handle nested directories', async () => {
      const nestedPath = path.join(testDir, 'src', 'components');
      await fs.ensureDir(nestedPath);
      await fs.writeFile(path.join(nestedPath, 'component.js'), 'function Component() {}');

      const result = await scanner.scan();

      expect(result.languages.JavaScript.files).toBe(1);
      expect(Object.keys(result.fileStats).length).toBe(1);
    });

    it('should skip node_modules directory', async () => {
      const nodeModulesPath = path.join(testDir, 'node_modules');
      await fs.ensureDir(nodeModulesPath);
      await fs.writeFile(path.join(nodeModulesPath, 'package.js'), 'module.exports = {}');

      const result = await scanner.scan();

      expect(result.languages.JavaScript).toBeUndefined();
    });

    it('should skip .git directory', async () => {
      const gitPath = path.join(testDir, '.git');
      await fs.ensureDir(gitPath);
      await fs.writeFile(path.join(gitPath, 'config'), 'git config');

      const result = await scanner.scan();

      expect(result.summary.totalFiles).toBe(0);
    });

    it('should skip ignored files', async () => {
      await fs.writeFile(path.join(testDir, '.DS_Store'), 'ignored');
      await fs.writeFile(path.join(testDir, 'test.js'), 'code');

      const result = await scanner.scan();

      expect(result.languages.JavaScript.files).toBe(1);
      expect(Object.keys(result.fileStats).length).toBe(1);
    });
  });

  describe('language detection', () => {
    it('should detect multiple languages', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'console.log("js")');
      await fs.writeFile(path.join(testDir, 'app.ts'), 'const x: number = 1');
      await fs.writeFile(path.join(testDir, 'app.py'), 'print("py")');

      const result = await scanner.scan();

      expect(Object.keys(result.languages).length).toBe(3);
      expect(result.languages.JavaScript.files).toBe(1);
      expect(result.languages.TypeScript.files).toBe(1);
      expect(result.languages.Python.files).toBe(1);
    });

    it('should calculate language percentages', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'a\nb\nc'); // 3 LOC
      await fs.writeFile(path.join(testDir, 'app.py'), 'x\ny'); // 2 LOC

      const result = await scanner.scan();

      expect(result.languages.JavaScript.percentage).toBe(60);
      expect(result.languages.Python.percentage).toBe(40);
    });
  });

  describe('framework detection', () => {
    it('should detect React from package.json', async () => {
      const pkgJson = {
        name: 'test-app',
        dependencies: { react: '^18.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));
      await fs.writeFile(path.join(testDir, 'app.js'), 'code');

      const result = await scanner.scan();

      expect(result.frameworks).toContain('React');
      expect(result.frameworks).toContain('Node.js');
    });

    it('should detect Express from package.json', async () => {
      const pkgJson = {
        name: 'test-app',
        dependencies: { express: '^4.18.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));
      await fs.writeFile(path.join(testDir, 'app.js'), 'code');

      const result = await scanner.scan();

      expect(result.frameworks).toContain('Express');
    });

    it('should detect multiple frameworks', async () => {
      const pkgJson = {
        name: 'test-app',
        dependencies: { react: '^18.0.0', 'express': '^4.18.0' },
        devDependencies: { typescript: '^5.0.0' },
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));
      await fs.writeFile(path.join(testDir, 'app.js'), 'code');

      const result = await scanner.scan();

      expect(result.frameworks.length).toBeGreaterThanOrEqual(3);
      expect(result.frameworks).toContain('React');
      expect(result.frameworks).toContain('Express');
      expect(result.frameworks).toContain('TypeScript');
    });

    it('should detect Python framework', async () => {
      await fs.writeFile(path.join(testDir, 'requirements.txt'), 'flask==1.0.0');
      await fs.writeFile(path.join(testDir, 'app.py'), 'code');

      const result = await scanner.scan();

      expect(result.frameworks).toContain('Python');
    });

    it('should detect Go framework', async () => {
      await fs.writeFile(path.join(testDir, 'go.mod'), 'module github.com/test/app');
      await fs.writeFile(path.join(testDir, 'main.go'), 'code');

      const result = await scanner.scan();

      expect(result.frameworks).toContain('Go');
    });
  });

  describe('report generation', () => {
    it('should generate scan report', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'console.log("hello")\nconst x = 1');

      const result = await scanner.scan();

      expect(result.repository).toBeDefined();
      expect(result.repository.path).toBe(testDir);
      expect(result.repository.scannedAt).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalFiles).toBeGreaterThan(0);
      expect(result.summary.totalLoc).toBeGreaterThan(0);
      expect(result.languages).toBeDefined();
      expect(result.frameworks).toBeDefined();
      expect(result.fileStats).toBeDefined();
    });

    it('should include timestamp in report', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'code');
      const before = new Date();
      const result = await scanner.scan();
      const after = new Date();
      const scannedAt = new Date(result.repository.scannedAt);

      expect(scannedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(scannedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should handle empty repository', async () => {
      const result = await scanner.scan();

      expect(result.summary.totalFiles).toBe(0);
      expect(result.summary.totalLoc).toBe(0);
      expect(Object.keys(result.languages).length).toBe(0);
    });
  });

  describe('getter methods', () => {
    it('getLanguages should return language list', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'a\nb\nc');
      await fs.writeFile(path.join(testDir, 'app.py'), 'x');

      await scanner.scan();
      const languages = scanner.getLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBe(2);
      expect(languages.some((l) => l.name === 'JavaScript')).toBe(true);
    });

    it('getFrameworks should return detected frameworks', async () => {
      const pkgJson = { name: 'app', dependencies: { react: '^18.0.0' } };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));
      await fs.writeFile(path.join(testDir, 'app.js'), 'code');

      await scanner.scan();
      const frameworks = scanner.getFrameworks();

      expect(Array.isArray(frameworks)).toBe(true);
      expect(frameworks).toContain('React');
    });

    it('getTotalLoc should return total lines of code', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'a\nb\nc');
      await fs.writeFile(path.join(testDir, 'app.py'), 'x\ny');

      await scanner.scan();
      const totalLoc = scanner.getTotalLoc();

      expect(totalLoc).toBe(5);
    });

    it('getTotalFiles should return total file count', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'a');
      await fs.writeFile(path.join(testDir, 'app.py'), 'x');
      await fs.writeFile(path.join(testDir, 'app.ts'), 'z');

      await scanner.scan();
      const totalFiles = scanner.getTotalFiles();

      expect(totalFiles).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should handle scan on non-existent path', async () => {
      const scanner2 = new RepoScanner({ rootPath: '/nonexistent/path' });
      await expect(scanner2.scan()).rejects.toThrow();
    });

    it('should skip files that cannot be read', async () => {
      await fs.writeFile(path.join(testDir, 'readable.js'), 'code');
      // File that will be created but can't be read after (simulating permission issue)

      const result = await scanner.scan();

      expect(result.languages.JavaScript.files).toBe(1);
    });
  });
});
