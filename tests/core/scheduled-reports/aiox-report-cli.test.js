'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('aiox-report CLI', () => {
  let cli;
  let tmpDir;
  let originalCwd;
  let originalArgv;
  let originalExit;
  let exitCode;
  let consoleOutput;
  let consoleErrors;

  beforeEach(() => {
    // Create temp directory for test isolation
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiox-report-cli-'));
    originalCwd = process.cwd;
    process.cwd = jest.fn(() => tmpDir);
    originalArgv = process.argv;
    exitCode = null;
    consoleOutput = [];
    consoleErrors = [];

    // Mock process.exit
    originalExit = process.exit;
    process.exit = jest.fn((code) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    });

    // Capture console output
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      consoleOutput.push(args.join(' '));
    });
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      consoleErrors.push(args.join(' '));
    });

    // Fresh require for each test
    jest.resetModules();
    cli = require('../../../bin/aiox-report');
  });

  afterEach(() => {
    process.cwd = originalCwd;
    process.argv = originalArgv;
    process.exit = originalExit;
    jest.restoreAllMocks();

    // Cleanup temp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  // ─── getFlag ──────────────────────────────────────────────────────────

  describe('getFlag', () => {
    it('should extract flag value from args', () => {
      expect(cli.getFlag(['--format', 'markdown'], 'format', 'json')).toBe('markdown');
    });

    it('should return default when flag not present', () => {
      expect(cli.getFlag(['--other', 'val'], 'format', 'json')).toBe('json');
    });

    it('should return default when flag has no value', () => {
      expect(cli.getFlag(['--format'], 'format', 'json')).toBe('json');
    });
  });

  // ─── formatReport ────────────────────────────────────────────────────

  describe('formatReport', () => {
    const report = {
      id: 'report_test',
      type: 'portfolio',
      timestamp: '2026-03-22T00:00:00.000Z',
      status: 'empty',
      message: 'No repositories available',
    };

    it('should format as JSON by default', () => {
      const result = cli.formatReport(report, 'json');
      expect(JSON.parse(result)).toEqual(report);
    });

    it('should format as markdown', () => {
      const result = cli.formatReport(report, 'markdown');
      expect(result).toContain('# Portfolio Report');
    });

    it('should format as CSV', () => {
      const result = cli.formatReport(report, 'csv');
      expect(typeof result).toBe('string');
    });
  });

  // ─── generateReport ──────────────────────────────────────────────────

  describe('generateReport', () => {
    it('should generate portfolio report', () => {
      const report = cli.generateReport('portfolio', []);
      expect(report.type).toBe('portfolio');
      expect(report.status).toBe('empty');
    });

    it('should generate trends report', () => {
      const report = cli.generateReport('trends', []);
      expect(report.type).toBe('trends');
    });

    it('should generate insights report', () => {
      const report = cli.generateReport('insights', []);
      expect(report.type).toBe('insights');
    });

    it('should generate compliance report', () => {
      const report = cli.generateReport('compliance', []);
      expect(report.type).toBe('compliance');
    });
  });

  // ─── cmdAdd ───────────────────────────────────────────────────────────

  describe('cmdAdd', () => {
    it('should add a schedule and save config', () => {
      cli.cmdAdd(['add', 'Daily', '0 9 * * *', 'portfolio']);

      const output = consoleOutput.join('\n');
      expect(output).toContain('Schedule added:');
      expect(output).toContain('Name: Daily');
      expect(output).toContain('Type: portfolio');

      // Verify config file was written
      const configPath = path.join(tmpDir, '.aiox-reports', 'schedules.json');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should exit with error when args are missing', () => {
      expect(() => {
        cli.cmdAdd(['add', 'Daily']);
      }).toThrow('process.exit(1)');
      expect(consoleErrors[0]).toContain('name, cron expression, and report type are required');
    });

    it('should exit with error for invalid cron', () => {
      expect(() => {
        cli.cmdAdd(['add', 'Bad', 'invalid', 'portfolio']);
      }).toThrow('process.exit(1)');
    });

    it('should accept optional --format flag', () => {
      cli.cmdAdd(['add', 'Weekly', '0 0 * * MON', 'trends', '--format', 'markdown']);

      const output = consoleOutput.join('\n');
      expect(output).toContain('Schedule added:');
    });
  });

  // ─── cmdList ──────────────────────────────────────────────────────────

  describe('cmdList', () => {
    it('should show empty message when no schedules', () => {
      cli.cmdList(['list']);
      expect(consoleOutput[0]).toBe('No schedules configured.');
    });

    it('should list schedules as JSON', () => {
      cli.cmdAdd(['add', 'Test', '0 9 * * *', 'portfolio']);
      consoleOutput = [];

      cli.cmdList(['list']);
      const parsed = JSON.parse(consoleOutput[0]);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('Test');
    });

    it('should list schedules as markdown', () => {
      cli.cmdAdd(['add', 'Test', '0 9 * * *', 'portfolio']);
      consoleOutput = [];

      cli.cmdList(['list', '--format', 'markdown']);
      const output = consoleOutput.join('\n');
      expect(output).toContain('# Scheduled Reports');
      expect(output).toContain('Test');
      expect(output).toContain('portfolio');
    });
  });

  // ─── cmdDelete ────────────────────────────────────────────────────────

  describe('cmdDelete', () => {
    it('should delete an existing schedule', () => {
      cli.cmdAdd(['add', 'ToDelete', '0 9 * * *', 'portfolio']);
      const addOutput = consoleOutput.join('\n');
      const idMatch = addOutput.match(/Schedule added: (sch_[\w-]+)/);
      const scheduleId = idMatch[1];
      consoleOutput = [];

      cli.cmdDelete(['delete', scheduleId]);
      expect(consoleOutput[0]).toContain('Schedule deleted:');
    });

    it('should exit with error for missing ID', () => {
      expect(() => {
        cli.cmdDelete(['delete']);
      }).toThrow('process.exit(1)');
    });

    it('should exit with error for non-existent schedule', () => {
      expect(() => {
        cli.cmdDelete(['delete', 'sch_nonexistent']);
      }).toThrow('process.exit(1)');
      expect(consoleErrors[0]).toContain('Schedule not found');
    });
  });

  // ─── cmdRun ───────────────────────────────────────────────────────────

  describe('cmdRun', () => {
    it('should run a schedule and save to history', () => {
      cli.cmdAdd(['add', 'Runner', '0 9 * * *', 'portfolio']);
      const addOutput = consoleOutput.join('\n');
      const idMatch = addOutput.match(/Schedule added: (sch_[\w-]+)/);
      const scheduleId = idMatch[1];
      consoleOutput = [];

      cli.cmdRun(['run', scheduleId]);

      // Should output report
      const output = consoleOutput[0];
      const report = JSON.parse(output);
      expect(report.type).toBe('portfolio');

      // Should save history
      const historyPath = path.join(tmpDir, '.aiox-reports', 'history.json');
      expect(fs.existsSync(historyPath)).toBe(true);
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      expect(history.length).toBe(1);
      expect(history[0].scheduleName).toBe('Runner');
    });

    it('should exit with error for missing ID', () => {
      expect(() => {
        cli.cmdRun(['run']);
      }).toThrow('process.exit(1)');
    });

    it('should exit with error for non-existent schedule', () => {
      expect(() => {
        cli.cmdRun(['run', 'sch_nonexistent']);
      }).toThrow('process.exit(1)');
      expect(consoleErrors[0]).toContain('Schedule not found');
    });

    it('should support --format markdown', () => {
      cli.cmdAdd(['add', 'FmtTest', '0 9 * * *', 'portfolio']);
      const addOutput = consoleOutput.join('\n');
      const idMatch = addOutput.match(/Schedule added: (sch_[\w-]+)/);
      const scheduleId = idMatch[1];
      consoleOutput = [];

      cli.cmdRun(['run', scheduleId, '--format', 'markdown']);
      const output = consoleOutput[0];
      expect(output).toContain('# Portfolio Report');
    });

    it('should support --repos file', () => {
      const reposFile = path.join(tmpDir, 'repos.json');
      fs.writeFileSync(reposFile, JSON.stringify([
        { repository: 'test-repo', healthScore: 8, testCoverage: 90, loc: 1000, dependencies: 5 },
      ]));

      cli.cmdAdd(['add', 'RepoTest', '0 9 * * *', 'portfolio']);
      const addOutput = consoleOutput.join('\n');
      const idMatch = addOutput.match(/Schedule added: (sch_[\w-]+)/);
      const scheduleId = idMatch[1];
      consoleOutput = [];

      cli.cmdRun(['run', scheduleId, '--repos', reposFile]);
      const report = JSON.parse(consoleOutput[0]);
      expect(report.status).toBe('ok');
      expect(report.summary.totalRepositories).toBe(1);
    });
  });

  // ─── cmdHistory ───────────────────────────────────────────────────────

  describe('cmdHistory', () => {
    it('should show empty message when no history', () => {
      cli.cmdHistory(['history']);
      expect(consoleOutput[0]).toBe('No report history found.');
    });

    it('should show history entries as JSON', () => {
      // Run a report first
      cli.cmdAdd(['add', 'HistTest', '0 9 * * *', 'portfolio']);
      const addOutput = consoleOutput.join('\n');
      const idMatch = addOutput.match(/Schedule added: (sch_[\w-]+)/);
      const scheduleId = idMatch[1];
      cli.cmdRun(['run', scheduleId]);
      consoleOutput = [];

      cli.cmdHistory(['history']);
      const entries = JSON.parse(consoleOutput[0]);
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(1);
      expect(entries[0].scheduleName).toBe('HistTest');
      expect(entries[0].reportType).toBe('portfolio');
    });

    it('should respect --limit flag', () => {
      // Create multiple history entries
      cli.cmdAdd(['add', 'Limit1', '0 9 * * *', 'portfolio']);
      const addOutput1 = consoleOutput.join('\n');
      const id1 = addOutput1.match(/Schedule added: (sch_[\w-]+)/)[1];

      cli.cmdRun(['run', id1]);
      cli.cmdRun(['run', id1]);
      cli.cmdRun(['run', id1]);
      consoleOutput = [];

      cli.cmdHistory(['history', '--limit', '2']);
      const entries = JSON.parse(consoleOutput[0]);
      expect(entries.length).toBe(2);
    });

    it('should show history as markdown', () => {
      cli.cmdAdd(['add', 'MdHist', '0 9 * * *', 'trends']);
      const addOutput = consoleOutput.join('\n');
      const scheduleId = addOutput.match(/Schedule added: (sch_[\w-]+)/)[1];
      cli.cmdRun(['run', scheduleId]);
      consoleOutput = [];

      cli.cmdHistory(['history', '--format', 'markdown']);
      const output = consoleOutput.join('\n');
      expect(output).toContain('# Report History');
      expect(output).toContain('MdHist');
      expect(output).toContain('trends');
    });
  });

  // ─── cmdView ──────────────────────────────────────────────────────────

  describe('cmdView', () => {
    it('should view a previously generated report', () => {
      // Generate a report
      cli.cmdAdd(['add', 'ViewTest', '0 9 * * *', 'portfolio']);
      const addOutput = consoleOutput.join('\n');
      const scheduleId = addOutput.match(/Schedule added: (sch_[\w-]+)/)[1];
      cli.cmdRun(['run', scheduleId]);

      // Get the report ID from history
      const history = cli.loadHistory();
      const reportId = history[0].id;
      consoleOutput = [];

      cli.cmdView(['view', reportId]);
      const report = JSON.parse(consoleOutput[0]);
      expect(report.type).toBe('portfolio');
      expect(report.id).toBe(reportId);
    });

    it('should view in markdown format', () => {
      cli.cmdAdd(['add', 'MdView', '0 9 * * *', 'portfolio']);
      const addOutput = consoleOutput.join('\n');
      const scheduleId = addOutput.match(/Schedule added: (sch_[\w-]+)/)[1];
      cli.cmdRun(['run', scheduleId]);

      const history = cli.loadHistory();
      const reportId = history[0].id;
      consoleOutput = [];

      cli.cmdView(['view', reportId, '--format', 'markdown']);
      const output = consoleOutput[0];
      expect(output).toContain('# Portfolio Report');
    });

    it('should exit with error for missing report ID', () => {
      expect(() => {
        cli.cmdView(['view']);
      }).toThrow('process.exit(1)');
      expect(consoleErrors[0]).toContain('report ID is required');
    });

    it('should exit with error for non-existent report', () => {
      expect(() => {
        cli.cmdView(['view', 'report_nonexistent']);
      }).toThrow('process.exit(1)');
      expect(consoleErrors[0]).toContain('Report not found');
    });
  });

  // ─── loadHistory / saveHistoryEntry ───────────────────────────────────

  describe('history persistence', () => {
    it('should return empty array when no history file', () => {
      expect(cli.loadHistory()).toEqual([]);
    });

    it('should persist and load history correctly', () => {
      const scheduler = cli._getScheduler();
      const schedule = scheduler.addSchedule('Persist', '0 9 * * *', 'portfolio');
      const report = { id: 'report_persist_test', type: 'portfolio', status: 'ok', timestamp: new Date().toISOString() };

      const entry = cli.saveHistoryEntry(schedule, report, 'json');
      expect(entry.id).toBe('report_persist_test');
      expect(entry.scheduleName).toBe('Persist');

      const loaded = cli.loadHistory();
      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe('report_persist_test');

      // Report file should also exist
      const paths = cli._getPaths();
      const reportFile = path.join(paths.REPORTS_DIR, 'report_persist_test.json');
      expect(fs.existsSync(reportFile)).toBe(true);
    });

    it('should trim history to 100 entries', () => {
      const scheduler = cli._getScheduler();
      const schedule = scheduler.addSchedule('Trim', '0 9 * * *', 'portfolio');

      // Save 105 entries
      for (let i = 0; i < 105; i++) {
        const report = { id: `report_trim_${i}`, type: 'portfolio', status: 'ok', timestamp: new Date().toISOString() };
        cli.saveHistoryEntry(schedule, report, 'json');
      }

      const loaded = cli.loadHistory();
      expect(loaded.length).toBe(100);
    });
  });

  // ─── printHelp ────────────────────────────────────────────────────────

  describe('printHelp', () => {
    it('should display help text with all 6 commands', () => {
      cli.printHelp();
      const output = consoleOutput.join('\n');
      expect(output).toContain('aiox report add');
      expect(output).toContain('aiox report list');
      expect(output).toContain('aiox report delete');
      expect(output).toContain('aiox report run');
      expect(output).toContain('aiox report history');
      expect(output).toContain('aiox report view');
    });
  });
});
