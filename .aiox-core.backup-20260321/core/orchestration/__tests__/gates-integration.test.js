'use strict';

const ConstitutionalGates = require('../../gates/constitutional-gates');
const { ViolationSeverity, GateVerdict } = require('../../gates/constitutional-gates');

describe('Constitutional Gates Integration', () => {
  let gates;

  beforeEach(() => {
    gates = new ConstitutionalGates({ strictMode: true });
  });

  describe('Validation Basics', () => {
    it('should pass validation with clean context', async () => {
      const result = await gates.validate({
        changedFiles: ['src/index.js'],
        branch: 'feature/2.1-test',
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(result.valid).toBe(true);
      expect(result.verdict).toBe(GateVerdict.APPROVED);
      expect(result.violations.length).toBe(0);
    });

    it('should block on CRITICAL violations', async () => {
      const result = await gates.validate({
        changedFiles: ['src/.env.local'],
        branch: 'feature/2.1-test',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      expect(result.valid).toBe(false);
      expect(result.verdict).toBe(GateVerdict.BLOCKED);
      expect(result.violations.some(v => v.severity === ViolationSeverity.CRITICAL)).toBe(true);
    });

    it('should need revision on HIGH violations', async () => {
      const result = await gates.validate({
        changedFiles: ['src/index.js'],
        branch: 'feature/2.1-test',
        qualityChecks: {
          lintPass: false,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(result.valid).toBe(false);
      expect(result.verdict).toBe(GateVerdict.NEEDS_REVISION);
    });
  });

  describe('Branch Validation', () => {
    it('should validate story branch format', async () => {
      const result = await gates.validate({
        branch: 'feature/8.2-integration',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      expect(result.violations.filter(v => v.gate === 'branch_format').length).toBe(0);
    });

    it('should reject invalid branch format', async () => {
      const result = await gates.validate({
        branch: 'bugfix/some-branch',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      expect(result.valid).toBe(false);
      const branchViolation = result.violations.find(v => v.gate === 'branch_format');
      expect(branchViolation).toBeDefined();
      expect(branchViolation.severity).toBe(ViolationSeverity.CRITICAL);
    });

    it('should allow main branch', async () => {
      const result = await gates.validate({
        branch: 'main',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      expect(result.violations.filter(v => v.gate === 'branch_format').length).toBe(0);
    });
  });

  describe('Security Validation', () => {
    it('should reject .env.local files', async () => {
      const result = await gates.validate({
        changedFiles: ['config/.env.local'],
        branch: 'feature/2.1-test',
      });

      const violation = result.violations.find(v => v.gate === 'forbidden_file');
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(ViolationSeverity.CRITICAL);
    });

    it('should reject credentials files', async () => {
      const result = await gates.validate({
        changedFiles: ['credentials.json'],
        branch: 'feature/2.1-test',
      });

      const violation = result.violations.find(v => v.gate === 'forbidden_file');
      expect(violation).toBeDefined();
    });

    it('should warn on files with password in name', async () => {
      const result = await gates.validate({
        changedFiles: ['src/default-password.js'],
        branch: 'feature/2.1-test',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      const violation = result.violations.find(v => v.gate === 'security_pattern');
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(ViolationSeverity.HIGH);
    });

    it('should handle multiple security issues', async () => {
      const result = await gates.validate({
        changedFiles: ['.env.production', 'src/api-key.js', 'secrets.yml'],
        branch: 'feature/2.1-test',
      });

      expect(result.violations.length).toBeGreaterThan(1);
      const criticalViolations = result.violations.filter(v => v.severity === ViolationSeverity.CRITICAL);
      expect(criticalViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Validation', () => {
    it('should block on lint failure', async () => {
      const result = await gates.validate({
        branch: 'feature/2.1-test',
        qualityChecks: {
          lintPass: false,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      const violation = result.violations.find(v => v.gate === 'quality_lint');
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(ViolationSeverity.HIGH);
    });

    it('should block on typecheck failure', async () => {
      const result = await gates.validate({
        branch: 'feature/2.1-test',
        qualityChecks: {
          lintPass: true,
          typecheckPass: false,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      const violation = result.violations.find(v => v.gate === 'quality_typecheck');
      expect(violation).toBeDefined();
    });

    it('should block on build failure (CRITICAL)', async () => {
      const result = await gates.validate({
        branch: 'feature/2.1-test',
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: false,
          coderabbitCritical: 0,
        },
      });

      const violation = result.violations.find(v => v.gate === 'quality_build');
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(ViolationSeverity.CRITICAL);
      expect(result.verdict).toBe(GateVerdict.BLOCKED);
    });

    it('should block on CodeRabbit CRITICAL issues', async () => {
      const result = await gates.validate({
        branch: 'feature/2.1-test',
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 2,
        },
      });

      const violation = result.violations.find(v => v.gate === 'quality_coderabbit');
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(ViolationSeverity.CRITICAL);
      expect(violation.issueCount).toBe(2);
    });
  });

  describe('Spec Validation', () => {
    it('should pass with complete spec', async () => {
      const spec = `
        ## Acceptance Criteria
        - AC1: Feature works
        - AC2: Tests pass

        ## Test Plan
        - Test scenario 1
        - Test scenario 2
      `;

      const result = await gates.validate({
        branch: 'feature/2.1-test',
        specContent: spec,
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      expect(result.violations.filter(v => v.gate === 'spec_content').length).toBe(0);
    });

    it('should warn on missing Acceptance Criteria', async () => {
      const spec = `## Test Plan\n- Test 1`;

      const result = await gates.validate({
        branch: 'feature/2.1-test',
        specContent: spec,
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      const violation = result.violations.find(
        v => v.gate === 'spec_content' && v.message.includes('Acceptance Criteria')
      );
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(ViolationSeverity.MEDIUM);
    });
  });

  describe('Violation Summary', () => {
    it('should correctly count violations by severity', async () => {
      const result = await gates.validate({
        changedFiles: [
          '.env.local',
          'src/password-config.js',
          'src/test-token.js',
        ],
        branch: 'feature/2.1-test',
      });

      expect(result.summary.critical).toBeGreaterThan(0);
      expect(result.summary.high).toBeGreaterThan(0);
      expect(result.summary.medium).toBeGreaterThan(0);
    });

    it('should calculate total violations correctly', async () => {
      const result = await gates.validate({
        changedFiles: ['.env.local', 'secrets.yml'],
        branch: 'feature/2.1-test',
      });

      expect(result.summary.totalViolations).toBe(result.violations.length);
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = { quality: { minTestCoverage: 90 } };
      gates.updateConfig(newConfig);

      const config = gates.getConfig();
      expect(config.quality.minTestCoverage).toBe(90);
    });

    it('should maintain default config values', () => {
      const config = gates.getConfig();
      expect(config.quality.requireLint).toBe(true);
      expect(config.quality.blockCodeRabbitCritical).toBe(true);
    });
  });

  describe('Verdict Helpers', () => {
    it('should correctly identify blocking verdicts', () => {
      expect(gates.shouldBlock(GateVerdict.BLOCKED)).toBe(true);
      expect(gates.shouldBlock(GateVerdict.APPROVED)).toBe(false);
      expect(gates.shouldBlock(GateVerdict.NEEDS_REVISION)).toBe(false);
    });

    it('should correctly identify revision-needed verdicts', () => {
      expect(gates.needsRevision(GateVerdict.NEEDS_REVISION)).toBe(true);
      expect(gates.needsRevision(GateVerdict.APPROVED)).toBe(false);
      expect(gates.needsRevision(GateVerdict.BLOCKED)).toBe(false);
    });
  });

  describe('History Tracking', () => {
    it('should track validation history', async () => {
      await gates.validate({ branch: 'feature/2.1-test', qualityChecks: { buildPass: true } });
      await gates.validate({ branch: 'feature/2.2-test', qualityChecks: { buildPass: true } });

      const history = gates.getHistory();
      expect(history.length).toBe(2);
    });

    it('should retrieve last validation', async () => {
      await gates.validate({ branch: 'feature/2.1-test', qualityChecks: { buildPass: true } });
      const result = await gates.validate({ branch: 'feature/2.2-test', qualityChecks: { buildPass: true } });

      const lastValidation = gates.getLastValidation();
      expect(lastValidation).toEqual(result);
    });

    it('should clear validation history', async () => {
      await gates.validate({ branch: 'feature/2.1-test', qualityChecks: { buildPass: true } });
      gates.clearHistory();

      expect(gates.getHistory().length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const gatesWithBrokenValidator = new ConstitutionalGates();
      gatesWithBrokenValidator._validateBranch = () => {
        throw new Error('Test error');
      };

      const result = await gatesWithBrokenValidator.validate({ branch: 'feature/2.1' });

      expect(result.valid).toBe(false);
      expect(result.verdict).toBe(GateVerdict.BLOCKED);
      expect(result.violations.some(v => v.gate === 'validation_error')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const start = Date.now();

      await gates.validate({
        changedFiles: Array(50).fill(0).map((_, i) => `src/file-${i}.js`),
        branch: 'feature/2.1-test',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should track validation result metadata', async () => {
      const result = await gates.validate({
        branch: 'feature/2.1-test',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });
});
