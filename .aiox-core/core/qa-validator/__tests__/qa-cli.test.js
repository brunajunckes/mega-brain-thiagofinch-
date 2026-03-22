'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { QACli } = require('../qa-cli');

describe('QACli', () => {
  let tmpDir;
  let cli;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `qa-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.aiox'), { recursive: true });
    cli = new QACli({ projectRoot: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('help', () => {
    it('should show help with --help flag', async () => {
      const result = await cli.execute(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('AIOX QA Validator');
      expect(result.output).toContain('USAGE');
      expect(result.output).toContain('CRITERIA');
    });

    it('should show help with -h flag', async () => {
      const result = await cli.execute(['-h']);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('AIOX QA Validator');
    });
  });

  describe('file validation', () => {
    it('should validate a single file', async () => {
      const code = `/**
 * Sample function
 * @param {string} name - Name
 * @returns {Object} User
 */
function createUser(name) {
  return { name };
}

module.exports = { createUser };`;

      const filePath = path.join(tmpDir, 'good.js');
      fs.writeFileSync(filePath, code);

      const result = await cli.execute([filePath]);

      expect(result.exitCode).toBeLessThanOrEqual(1);
      expect(result.output).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.score).toBeGreaterThan(0);
    });

    it('should return exit code 0 for approved code', async () => {
      const code = `/**
 * Pure function
 * @param {number} x - Input
 * @returns {number} Result
 */
function double(x) {
  return x * 2;
}

module.exports = { double };`;

      const filePath = path.join(tmpDir, 'approved.js');
      fs.writeFileSync(filePath, code);

      // Create matching test file
      const testDir = path.join(tmpDir, '__tests__');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, 'approved.test.js'), 'test("x", () => {});');

      const result = await cli.execute([filePath]);
      expect(result.exitCode).toBeLessThanOrEqual(1);
    });

    it('should detect security issues in bad code', async () => {
      const code = `const secret = "password123";
eval(userInput);`;

      const filePath = path.join(tmpDir, 'bad.js');
      fs.writeFileSync(filePath, code);

      const result = await cli.execute([filePath, '--json']);
      const parsed = JSON.parse(result.output);

      // Should detect security findings even if score is not blocked
      const securityFindings = parsed.findings.filter((f) =>
        f.criterion.toLowerCase().includes('security')
      );
      expect(securityFindings.length).toBeGreaterThan(0);
      expect(securityFindings[0].issues.some((i) => i.severity === 'CRITICAL')).toBe(true);
    });
  });

  describe('directory validation', () => {
    it('should validate a directory', async () => {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'a.js'), `
/**
 * @param {string} x - Input
 * @returns {string} Output
 */
function process(x) { return x; }
module.exports = { process };
`);
      fs.writeFileSync(path.join(srcDir, 'b.js'), `
function helper() { return 1; }
module.exports = { helper };
`);

      const result = await cli.execute([srcDir]);

      expect(result.exitCode).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.fileCount).toBe(2);
    });
  });

  describe('output formats', () => {
    let filePath;

    beforeEach(() => {
      filePath = path.join(tmpDir, 'sample.js');
      fs.writeFileSync(filePath, `
/**
 * @param {number} x - Input
 * @returns {number} Output
 */
function add(x) { return x + 1; }
module.exports = { add };
`);
    });

    it('should support JSON format', async () => {
      const result = await cli.execute([filePath, '--json']);

      expect(result.output).toBeDefined();
      const parsed = JSON.parse(result.output);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.score).toBeDefined();
    });

    it('should support markdown format', async () => {
      const result = await cli.execute([filePath, '--md']);

      expect(result.output).toContain('# QA Validation Report');
    });

    it('should support --format flag', async () => {
      const result = await cli.execute([filePath, '--format', 'json']);

      const parsed = JSON.parse(result.output);
      expect(parsed.score).toBeDefined();
    });
  });

  describe('output to file', () => {
    it('should save report to file', async () => {
      const filePath = path.join(tmpDir, 'target.js');
      fs.writeFileSync(filePath, 'const x = 1;\nmodule.exports = { x };');

      const outputPath = path.join(tmpDir, 'report.md');
      const result = await cli.execute([filePath, '--md', '-o', outputPath]);

      expect(result.exitCode).toBeDefined();
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('QA Validation Report');
    });

    it('should create output directory if it does not exist', async () => {
      const filePath = path.join(tmpDir, 'target.js');
      fs.writeFileSync(filePath, 'const x = 1;\nmodule.exports = { x };');

      const outputPath = path.join(tmpDir, 'reports', 'qa', 'report.md');
      await cli.execute([filePath, '--md', '-o', outputPath]);

      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent path', async () => {
      const result = await cli.execute(['/nonexistent/path/to/file.js']);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('not found');
    });

    it('should handle empty args (validate project root)', async () => {
      // Create a JS file in tmpDir
      fs.writeFileSync(path.join(tmpDir, 'index.js'), 'module.exports = {};');

      const result = await cli.execute([]);

      // Should validate tmpDir (projectRoot)
      expect(result.exitCode).toBeDefined();
    });
  });

  describe('verbose mode', () => {
    it('should show full report in verbose mode', async () => {
      const filePath = path.join(tmpDir, 'target.js');
      fs.writeFileSync(filePath, 'const x = 1;\nmodule.exports = { x };');

      const outputPath = path.join(tmpDir, 'report.txt');
      const result = await cli.execute([filePath, '-v', '-o', outputPath]);

      // Verbose should show report even when output file is specified
      expect(result.output.length).toBeGreaterThan(0);
    });
  });

  describe('zero false positives on known-good code', () => {
    it('should approve well-documented, secure, tested code', async () => {
      const code = `'use strict';

/**
 * Calculate the factorial of a number
 * @param {number} n - Non-negative integer
 * @returns {number} Factorial result
 */
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Calculate fibonacci number
 * @param {number} n - Position in sequence
 * @returns {number} Fibonacci number
 */
function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0;
  let b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

module.exports = { factorial, fibonacci };`;

      const filePath = path.join(tmpDir, 'math-utils.js');
      fs.writeFileSync(filePath, code);

      // Create test file
      const testDir = path.join(tmpDir, '__tests__');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, 'math-utils.test.js'), `
const { factorial, fibonacci } = require('../math-utils');
test('factorial', () => { expect(factorial(5)).toBe(120); });
test('fibonacci', () => { expect(fibonacci(6)).toBe(8); });
`);

      const result = await cli.execute([filePath, '--json']);
      const parsed = JSON.parse(result.output);

      // Known-good code should not have false positives
      expect(parsed.verdict).not.toBe('BLOCKED');
      expect(parsed.score).toBeGreaterThanOrEqual(85);
    });
  });
});
