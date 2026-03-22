'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Evolution Dashboard CLI', () => {
  let testDataDir;
  let originalCwd;

  beforeEach(() => {
    testDataDir = path.join(os.tmpdir(), `dashboard-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(testDataDir, { recursive: true });
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('should export handleDashboardCommand function', () => {
    const { handleDashboardCommand } = require('../../.aiox-core/cli/commands/dashboard');
    expect(typeof handleDashboardCommand).toBe('function');
  });

  it('should handle empty repository list gracefully', async () => {
    const { handleDashboardCommand } = require('../../.aiox-core/cli/commands/dashboard');

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    try {
      await handleDashboardCommand({ days: '30' });
      const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(output).toContain('No repositories found');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
