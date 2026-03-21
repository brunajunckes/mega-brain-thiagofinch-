'use strict';

const fs = require('fs-extra');
const path = require('path');
const { QAValidator } = require('../qa-validator');

describe('QAValidator', () => {
  let validator;
  let testDir;

  beforeEach(async () => {
    validator = new QAValidator();
    testDir = path.join(__dirname, '.test-qa');
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('file validation', () => {
    it('should validate well-written file', async () => {
      const goodCode = `/**
 * Sample function with proper documentation
 * @param {string} name - User name
 * @returns {Object} User object
 */
function createUser(name) {
  if (!name) throw new Error('Name required');
  return { name, id: Math.random() };
}

module.exports = { createUser };`;

      const filePath = path.join(testDir, 'good.js');
      await fs.writeFile(filePath, goodCode);

      const result = await validator.validatePath(filePath);
      expect(result.score).toBeGreaterThan(70);
      expect(result.status).toBe('success');
    });

    it('should detect missing documentation', async () => {
      const code = `
function undocumentedFunction(x) {
  return x * 2;
}

const undocumentedVar = 42;

module.exports = { undocumentedFunction };
`;

      const filePath = path.join(testDir, 'undoc.js');
      await fs.writeFile(filePath, code);

      const result = await validator.validatePath(filePath);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should detect security issues (hardcoded secrets)', async () => {
      const code = `const apiKey = "sk-12345secretkey";`;

      const filePath = path.join(testDir, 'insecure.js');
      await fs.writeFile(filePath, code);

      const result = await validator.validatePath(filePath);
      const securityIssue = result.criteria.security.issues.some((i) => i.severity === 'CRITICAL');
      expect(securityIssue).toBe(true);
    });

    it('should approve secure code', async () => {
      const code = `const apiKey = process.env.API_KEY;`;

      const filePath = path.join(testDir, 'secure.js');
      await fs.writeFile(filePath, code);

      const result = await validator.validatePath(filePath);
      expect(result.criteria.security.pass).toBe(true);
    });

    it('should detect performance issues', async () => {
      const code = `
for (let i = 0; i < 100; i++) {
  for (let j = 0; j < 100; j++) {
    console.log(i, j);
  }
}
`;

      const filePath = path.join(testDir, 'perf.js');
      await fs.writeFile(filePath, code);

      const result = await validator.validatePath(filePath);
      const perfIssue = result.criteria.performance.issues.some((i) => i.message.includes('Nested loops'));
      expect(perfIssue).toBe(true);
    });

    it('should detect unsafe exec', async () => {
      const code = `
const { exec } = require('child_process');
exec(userInput);
`;

      const filePath = path.join(testDir, 'unsafe.js');
      await fs.writeFile(filePath, code);

      const result = await validator.validatePath(filePath);
      const issue = result.criteria.security.issues.some((i) => i.severity === 'HIGH');
      expect(issue).toBe(true);
    });
  });

  describe('verdict logic', () => {
    it('should return APPROVED for high scores', async () => {
      const code = `/**
 * Well-documented function
 * @param {string} x Input
 * @returns {string} Output
 */
function process(x) {
  return x.trim();
}

module.exports = { process };`;

      const filePath = path.join(testDir, 'good.js');
      await fs.writeFile(filePath, code);

      const result = await validator.validatePath(filePath);
      expect(['APPROVED', 'NEEDS_MINOR_WORK']).toContain(result.verdict);
    });

    it('should detect critical issues', async () => {
      const code = `const secret = "password123";
eval(userInput);`;

      const filePath = path.join(testDir, 'bad.js');
      await fs.writeFile(filePath, code);

      const result = await validator.validatePath(filePath);
      const hasCritical = result.findings.some((f) =>
        f.issues.some((i) => i.severity === 'CRITICAL'),
      );
      expect(hasCritical).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent file', async () => {
      const result = await validator.validatePath('/nonexistent/file.js');
      expect(result.status).toBe('error');
    });
  });
});
