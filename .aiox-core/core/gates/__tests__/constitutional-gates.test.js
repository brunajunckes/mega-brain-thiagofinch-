'use strict';

const path = require('path');
const fs = require('fs-extra');
const { ConstitutionalGates } = require('../constitutional-gates');

describe('ConstitutionalGates', () => {
  let gates;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-gates');
    await fs.ensureDir(testDir);
    gates = new ConstitutionalGates();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('gateCliFirst', () => {
    it('should not warn when UI and CLI both changed', async () => {
      const files = [
        'src/cli/command.js',
        'src/app/component.js',
      ];
      await gates.gateCliFirst(files);
      expect(gates.warnings).toHaveLength(0);
    });

    it('should warn when UI changed without CLI', async () => {
      const files = ['src/app/page.js', 'src/pages/home.jsx'];
      await gates.gateCliFirst(files);

      expect(gates.warnings).toHaveLength(1);
      expect(gates.warnings[0].principle).toBe('CLI First');
      expect(gates.warnings[0].severity).toBe('WARN');
      expect(gates.warnings[0].files).toContain('src/app/page.js');
    });

    it('should warn for components without CLI', async () => {
      const files = ['src/components/Button.tsx'];
      await gates.gateCliFirst(files);

      expect(gates.warnings).toHaveLength(1);
      expect(gates.warnings[0].files).toContain('src/components/Button.tsx');
    });

    it('should not warn for CLI-only changes', async () => {
      const files = ['bin/aiox.js', 'src/cli/index.js'];
      await gates.gateCliFirst(files);
      expect(gates.warnings).toHaveLength(0);
    });

    it('should not warn for non-UI/CLI files', async () => {
      const files = ['src/utils/helpers.js', 'tests/test.js'];
      await gates.gateCliFirst(files);
      expect(gates.warnings).toHaveLength(0);
    });

    it('should handle mixed file patterns', async () => {
      const files = [
        'src/app/layout.jsx',
        'src/pages/api/route.js',
        'src/components/Card.tsx',
        'src/lib/utils.js',
      ];
      await gates.gateCliFirst(files);

      expect(gates.warnings).toHaveLength(1);
      expect(gates.warnings[0].files).toHaveLength(3);
    });
  });

  describe('gateStoryDriven', () => {
    beforeEach(async () => {
      // Create docs/stories directory
      const storiesDir = path.join(testDir, 'docs', 'stories');
      await fs.ensureDir(storiesDir);

      // Create a test story file
      const storyContent = `# Story 8.1

## Acceptance Criteria
- [ ] Test AC1

## File List
- src/file.js
`;
      await fs.writeFile(
        path.join(storiesDir, '8.1.test-story.story.md'),
        storyContent
      );

      // Mock process.cwd to return testDir
      this.originalCwd = process.cwd;
      process.cwd = () => testDir;
    });

    afterEach(() => {
      process.cwd = this.originalCwd;
    });

    it('should reject branch without story ID', async () => {
      await gates.gateStoryDriven('feature/my-feature');

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].principle).toBe('Story-Driven');
      expect(gates.violations[0].severity).toBe('CRITICAL');
      expect(gates.violations[0].message).toContain('No story ID');
    });

    it('should pass when story ID found with AC and File List', async () => {
      await gates.gateStoryDriven('feature/8.1-foundation');

      expect(gates.violations).toHaveLength(0);
      expect(gates.warnings).toHaveLength(0);
    });

    it('should warn when File List missing', async () => {
      const storiesDir = path.join(testDir, 'docs', 'stories');
      const badStoryContent = `# Story 8.2

## Acceptance Criteria
- [ ] Test AC1
`;
      await fs.writeFile(
        path.join(storiesDir, '8.2.no-filelist.story.md'),
        badStoryContent
      );

      await gates.gateStoryDriven('feature/8.2-nofiles');

      expect(gates.violations).toHaveLength(0);
      expect(gates.warnings).toHaveLength(1);
      expect(gates.warnings[0].message).toContain('File List');
    });

    it('should violate when AC missing', async () => {
      const storiesDir = path.join(testDir, 'docs', 'stories');
      const badStoryContent = `# Story 8.3

## File List
- src/file.js
`;
      await fs.writeFile(
        path.join(storiesDir, '8.3.no-ac.story.md'),
        badStoryContent
      );

      await gates.gateStoryDriven('feature/8.3-noac');

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].message).toContain('Acceptance Criteria');
    });

    it('should violate when story file not found', async () => {
      await gates.gateStoryDriven('feature/9.9-missing');

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].message).toContain('Story not found');
    });

    it('should handle complex branch names', async () => {
      await gates.gateStoryDriven('feature/8.1-foundation-with-long-name');

      expect(gates.violations).toHaveLength(0);
    });
  });

  describe('gateNoInvention', () => {
    it('should pass when all statements traced', async () => {
      const spec = `
## Implementation

This implements FR-001 (Authentication system).

The system will use JWT tokens, as per NFR-002 (Token-based auth).

Additional context: Research: industry standards for JWT
`;
      await gates.gateNoInvention(spec);
      expect(gates.violations).toHaveLength(0);
    });

    it('should violate on invented statements', async () => {
      const spec = `
## Implementation

We should add a quantum-resistant encryption layer to protect against future threats.

This uses CON-001 (Compliance requirement).
`;
      await gates.gateNoInvention(spec);
      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].principle).toBe('No Invention');
    });

    it('should allow headers without tracing', async () => {
      const spec = `
# Header

## Subheader

- List item with FR-001
`;
      await gates.gateNoInvention(spec);
      expect(gates.violations).toHaveLength(0);
    });

    it('should ignore short lines', async () => {
      const spec = `
FR-001: Basic implementation

Run it.
`;
      await gates.gateNoInvention(spec);
      expect(gates.violations).toHaveLength(0);
    });

    it('should check next line for trace', async () => {
      const spec = `
Implement database migration
NFR-003 - Performance requirement
`;
      await gates.gateNoInvention(spec);
      expect(gates.violations).toHaveLength(0);
    });

    it('should handle research: prefix lowercase', async () => {
      const spec = `
The system architecture
research: industry standard patterns
`;
      await gates.gateNoInvention(spec);
      expect(gates.violations).toHaveLength(0);
    });

    it('should detect multiple invented statements', async () => {
      const spec = `
This amazing new feature is invented today.

Another inventive idea nobody asked for.
`;
      await gates.gateNoInvention(spec);
      expect(gates.violations).toHaveLength(1);
    });
  });

  describe('gateQualityFirst', () => {
    it('should pass all checks when all pass', async () => {
      const checks = {
        lintPass: true,
        typecheckPass: true,
        testPass: true,
        buildPass: true,
        coderabbitCritical: 0,
      };
      await gates.gateQualityFirst(checks);
      expect(gates.violations).toHaveLength(0);
    });

    it('should violate on lint failure', async () => {
      const checks = {
        lintPass: false,
        typecheckPass: true,
        testPass: true,
        buildPass: true,
        coderabbitCritical: 0,
      };
      await gates.gateQualityFirst(checks);

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].message).toContain('Lint failed');
    });

    it('should violate on typecheck failure', async () => {
      const checks = {
        lintPass: true,
        typecheckPass: false,
        testPass: true,
        buildPass: true,
        coderabbitCritical: 0,
      };
      await gates.gateQualityFirst(checks);

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].message).toContain('Typecheck failed');
    });

    it('should violate on test failure', async () => {
      const checks = {
        lintPass: true,
        typecheckPass: true,
        testPass: false,
        buildPass: true,
        coderabbitCritical: 0,
      };
      await gates.gateQualityFirst(checks);

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].message).toContain('Tests failed');
    });

    it('should violate on build failure', async () => {
      const checks = {
        lintPass: true,
        typecheckPass: true,
        testPass: true,
        buildPass: false,
        coderabbitCritical: 0,
      };
      await gates.gateQualityFirst(checks);

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].message).toContain('Build failed');
    });

    it('should violate on CodeRabbit CRITICAL issues', async () => {
      const checks = {
        lintPass: true,
        typecheckPass: true,
        testPass: true,
        buildPass: true,
        coderabbitCritical: 2,
      };
      await gates.gateQualityFirst(checks);

      expect(gates.violations).toHaveLength(1);
      expect(gates.violations[0].message).toContain('CodeRabbit found 2 CRITICAL');
    });

    it('should accumulate multiple violations', async () => {
      const checks = {
        lintPass: false,
        typecheckPass: false,
        testPass: false,
        buildPass: false,
        coderabbitCritical: 3,
      };
      await gates.gateQualityFirst(checks);

      expect(gates.violations).toHaveLength(5);
    });
  });

  describe('validate', () => {
    it('should handle empty config', async () => {
      const result = await gates.validate({});
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate multiple gates in one call', async () => {
      const config = {
        changedFiles: ['src/app/page.js'],
        qualityChecks: {
          lintPass: false,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      };
      const result = await gates.validate(config);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });

    it('should return violations in result', async () => {
      const config = {
        branch: 'feature/no-story',
      };
      const result = await gates.validate(config);

      expect(result.valid).toBe(false);
      expect(result.violations[0].principle).toBe('Story-Driven');
    });

    it('should return warnings in result', async () => {
      const config = {
        changedFiles: ['src/app/page.js'],
      };
      const result = await gates.validate(config);

      expect(result.valid).toBe(true); // UI without CLI is only a warning
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('getReport', () => {
    it('should show success message when no violations', async () => {
      const report = gates.getReport();
      expect(report).toContain('✅ All constitutional gates passed');
    });

    it('should format violations', async () => {
      gates.violations.push({
        principle: 'Story-Driven',
        severity: 'CRITICAL',
        message: 'No story ID found',
      });

      const report = gates.getReport();
      expect(report).toContain('❌ CONSTITUTIONAL VIOLATIONS');
      expect(report).toContain('[Story-Driven]');
      expect(report).toContain('No story ID found');
    });

    it('should format warnings', async () => {
      gates.warnings.push({
        principle: 'CLI First',
        severity: 'WARN',
        message: 'UI changes detected',
      });

      const report = gates.getReport();
      expect(report).toContain('⚠️  CONSTITUTIONAL WARNINGS');
      expect(report).toContain('[CLI First]');
      expect(report).toContain('UI changes detected');
    });

    it('should show both violations and warnings', async () => {
      gates.violations.push({
        principle: 'Story-Driven',
        severity: 'CRITICAL',
        message: 'Missing story',
      });
      gates.warnings.push({
        principle: 'CLI First',
        severity: 'WARN',
        message: 'UI without CLI',
      });

      const report = gates.getReport();
      expect(report).toContain('❌ CONSTITUTIONAL VIOLATIONS');
      expect(report).toContain('⚠️  CONSTITUTIONAL WARNINGS');
    });

    it('should list multiple violations', async () => {
      gates.violations.push({
        principle: 'Quality First',
        severity: 'CRITICAL',
        message: 'Tests failed',
      });
      gates.violations.push({
        principle: 'No Invention',
        severity: 'CRITICAL',
        message: 'Spec not traced',
      });

      const report = gates.getReport();
      expect(report).toContain('[Quality First] Tests failed');
      expect(report).toContain('[No Invention] Spec not traced');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full feature branch validation', async () => {
      const config = {
        changedFiles: ['bin/feature-cli.js'],
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      };
      const result = await gates.validate(config);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should catch multiple principle violations', async () => {
      gates.violations = [];
      const config = {
        changedFiles: ['src/app/broken-page.js'],
        branch: 'feature/no-id',
        qualityChecks: {
          lintPass: false,
          typecheckPass: false,
          testPass: false,
          buildPass: false,
          coderabbitCritical: 1,
        },
      };

      const result = await gates.validate(config);

      expect(result.valid).toBe(false);
      // Should have violations from: Story-Driven (branch) + QualityFirst (5 checks) = 6
      expect(result.violations.length).toBeGreaterThan(3);
    });
  });
});
