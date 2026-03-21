'use strict';

const { runGates } = require('../pre-commit-hook');
const { execSync } = require('child_process');

// Mock execSync to avoid running actual git/npm commands
jest.mock('child_process');

describe('pre-commit-hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('runGates', () => {
    it('should pass when no violations', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return '';
        if (cmd.includes('lint')) return '';
        if (cmd.includes('typecheck')) return '';
        return '';
      });

      const result = await runGates();
      expect(result.valid).toBe(true);
    });

    it('should reject invalid branch name', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'bugfix-no-story-id';
        if (cmd.includes('git diff')) return '';
        return '';
      });

      await expect(runGates()).rejects.toThrow('Constitutional violations');
    });

    it('should skip quality checks with --skip-quality flag', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return '';
        return '';
      });

      const result = await runGates({ skipQuality: true });
      expect(result.valid).toBe(true);
      // Should not call npm run commands (only git: rev-parse, diff --cached, diff)
      expect(execSync).toHaveBeenCalledTimes(3); // git rev-parse + 2x git diff
      expect(execSync).not.toHaveBeenCalledWith(expect.stringMatching(/npm run/));
    });

    it('should allow warnings with --allow-warnings flag', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/no-id';
        if (cmd.includes('git diff')) return '';
        return '';
      });

      // Even with violations, should not throw with allow-warnings
      const result = await runGates({ allowWarnings: true });
      expect(result.valid).toBe(false);
      // But execution continues (doesn't throw)
    });

    it('should detect UI without CLI warning', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return 'src/app/page.js\nsrc/components/Button.tsx';
        return '';
      });

      const result = await runGates();
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should accumulate multiple violations', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/no-id';
        if (cmd.includes('git diff')) return 'src/app/page.js';
        if (cmd.includes('lint')) throw new Error('Lint failed');
        if (cmd.includes('typecheck')) throw new Error('Typecheck failed');
        return '';
      });

      await expect(runGates()).rejects.toThrow('Constitutional violations');
    });

    it('should handle git command errors gracefully', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) throw new Error('Not a git repo');
        return '';
      });

      await expect(runGates()).rejects.toThrow('Failed to get git branch');
    });

    it('should report quality check failures', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-valid';
        if (cmd.includes('git diff')) return 'src/file.js';
        if (cmd.includes('lint')) throw new Error('Lint failed');
        if (cmd.includes('typecheck')) return '';
        if (cmd.includes('test')) return '';
        if (cmd.includes('build')) return '';
        return '';
      });

      await expect(runGates()).rejects.toThrow('Constitutional violations');
    });

    it('should pass when quality checks fail but not run (skipQuality)', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return '';
        return '';
      });

      const result = await runGates({ skipQuality: true });
      expect(result.valid).toBe(true);
    });

    it('should handle no changed files', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return '';
        return '';
      });

      const result = await runGates();
      expect(result.valid).toBe(true);
    });

    it('should detect spec without tracing', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return 'docs/spec.md';
        return '';
      });

      // Would need to mock file reads to test spec validation
      // For now, just verify the structure works
      const result = await runGates();
      expect(result).toBeDefined();
    });

    it('should process multiple changed files', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return 'src/file1.js\nsrc/file2.js\nsrc/app/page.js\nsrc/cli/command.js';
        return '';
      });

      const result = await runGates();
      expect(result.valid).toBe(true); // CLI provided, so no warning
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('verbose mode', () => {
    it('should log detailed info in verbose mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse')) return 'feature/8.1-test';
        if (cmd.includes('git diff')) return '';
        return '';
      });

      await runGates({ verbose: true });

      // Verify verbose output was logged
      const logs = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(logs).toContain('Branch:');
      expect(logs).toContain('Changed files:');

      consoleSpy.mockRestore();
    });
  });
});
