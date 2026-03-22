'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { TaskAnalyzer } = require('../../../.aiox-core/core/task-chaining/task-analyzer');
const { TaskDispatcher } = require('../../../.aiox-core/core/task-chaining/task-dispatcher');
const { TaskChainConfig } = require('../../../packages/task-chaining/src/task-chain-config');

describe('Task Chaining Integration', () => {
  let tmpDir;
  let configPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-chain-integ-'));
    configPath = path.join(tmpDir, 'task-chains.yaml');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('full chain workflow', () => {
    it('should load config, validate, and execute chain end-to-end', async () => {
      // Step 1: Write config
      fs.writeFileSync(configPath, 'chains config');

      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({
          chains: {
            'build-test-deploy': {
              description: 'Full pipeline',
              tasks: [
                { name: 'build', task: 'echo build' },
                { name: 'test', task: 'echo test', depends_on: 'build' },
                { name: 'deploy', task: 'echo deploy', depends_on: 'test' },
              ],
            },
          },
        }),
      });

      // Step 2: Load and validate
      config.load();
      const validation = config.validateChain('build-test-deploy');
      expect(validation.valid).toBe(true);

      // Step 3: Get ordered tasks
      const orderedTasks = config.getOrderedTasks('build-test-deploy');
      expect(orderedTasks).toHaveLength(3);
      expect(orderedTasks[0].name).toBe('build');
      expect(orderedTasks[1].name).toBe('test');
      expect(orderedTasks[2].name).toBe('deploy');

      // Step 4: Execute with dispatcher
      const dispatcher = new TaskDispatcher();
      dispatcher.registerTask('build', async () => ({ artifacts: ['app.js'], buildId: 'b-1' }));
      dispatcher.registerTask('test', async (input) => ({
        passed: 42,
        failed: 0,
        buildId: input.lastResult?.output?.buildId,
      }));
      dispatcher.registerTask('deploy', async (input) => ({
        url: 'https://app.example.com',
        version: '1.0.0',
      }));

      const result = await dispatcher.executeChain(orderedTasks);

      expect(result.status).toBe('success');
      expect(result.results).toHaveLength(3);
      expect(result.results[0].output.artifacts).toEqual(['app.js']);
      expect(result.results[1].output.passed).toBe(42);
      expect(result.results[2].output.url).toBe('https://app.example.com');
    });

    it('should analyze outputs and suggest next chains', async () => {
      const analyzer = new TaskAnalyzer();
      const dispatcher = new TaskDispatcher();

      // Execute build task
      dispatcher.registerTask('build', async () => ({
        artifacts: ['dist/app.js', 'dist/app.css'],
        duration: 4500,
      }));

      const buildResult = await dispatcher.executeChain([{ name: 'build' }]);
      const buildOutput = buildResult.results[0];

      // Analyze build output
      const analysis = analyzer.analyzeTask({
        name: buildOutput.name,
        status: buildOutput.success ? 'success' : 'failed',
        output: buildOutput.output,
      });

      // Should detect build-output pattern and suggest test
      expect(analysis.detectedPatterns).toContain('build-output');
      expect(analysis.suggestedChains.length).toBeGreaterThan(0);
      expect(analysis.suggestedChains.some((c) => c.nextTask === 'test')).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.5);
    });

    it('should handle chain failure and record history', async () => {
      const dispatcher = new TaskDispatcher();

      dispatcher.registerTask('build', async () => ({ ok: true }));
      dispatcher.registerTask('test', async () => {
        throw new Error('Tests failed: 3 failures');
      });

      const result = await dispatcher.executeChain([
        { name: 'build' },
        { name: 'test', continueOnError: false },
      ]);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Tests failed');
      expect(result.failedAt).toBe(1);

      // History should be recorded
      const history = dispatcher.getHistory();
      expect(history).toHaveLength(1);
    });

    it('should respect task priority ordering through config', async () => {
      fs.writeFileSync(configPath, 'config');

      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({
          chains: {
            'quality-gate': {
              description: 'Quality checks',
              tasks: [
                { name: 'lint', task: 'npm run lint', timeout: 120 },
                { name: 'typecheck', task: 'npm run typecheck', timeout: 180 },
                { name: 'test', task: 'npm test', depends_on: 'typecheck', timeout: 600 },
              ],
            },
          },
        }),
      });

      config.load();
      const ordered = config.getOrderedTasks('quality-gate');

      // lint and typecheck have no deps (order preserved), test depends on typecheck
      const testIdx = ordered.findIndex((t) => t.name === 'test');
      const typecheckIdx = ordered.findIndex((t) => t.name === 'typecheck');
      expect(testIdx).toBeGreaterThan(typecheckIdx);
    });
  });

  describe('error recovery', () => {
    it('should continue execution after non-critical failure', async () => {
      const dispatcher = new TaskDispatcher();

      dispatcher.registerTask('lint', async () => {
        throw new Error('3 warnings');
      });
      dispatcher.registerTask('test', async () => ({ passed: 10 }));

      const result = await dispatcher.executeChain([
        { name: 'lint' }, // default: continue on error
        { name: 'test' },
      ]);

      expect(result.status).toBe('success');
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);
    });
  });

  describe('config + analyzer integration', () => {
    it('should match analyzer suggestions to configured chains', () => {
      fs.writeFileSync(configPath, 'config');

      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({
          chains: {
            'build-and-test': {
              description: 'Build then test',
              tasks: [
                { name: 'build', task: 'npm run build' },
                { name: 'test', task: 'npm test', depends_on: 'build' },
              ],
            },
          },
        }),
      });
      config.load();

      const analyzer = new TaskAnalyzer();
      const analysis = analyzer.analyzeTask({
        name: 'build',
        status: 'success',
        output: { artifacts: ['app.js'] },
      });

      // Check if any suggested chain matches a configured chain
      const configuredNames = config.listChains();
      const hasMatch = analysis.suggestedChains.some((s) =>
        configuredNames.some((c) => c.includes(s.nextTask)),
      );

      expect(hasMatch).toBe(true);
    });
  });
});
