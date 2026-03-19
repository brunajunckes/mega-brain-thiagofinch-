'use strict';

const { TaskDispatcher } = require('../task-dispatcher');

describe('TaskDispatcher', () => {
  let dispatcher;

  beforeEach(() => {
    dispatcher = new TaskDispatcher();
  });

  describe('task registration', () => {
    it('should register task executor', () => {
      const executor = async (input) => ({ result: 'ok' });
      dispatcher.registerTask('test-task', executor);

      const tasks = dispatcher.getRegisteredTasks();
      expect(tasks).toContain('test-task');
    });

    it('should throw on invalid executor', () => {
      expect(() => dispatcher.registerTask('invalid', 'not-a-function')).toThrow();
    });
  });

  describe('chain execution', () => {
    it('should execute single task chain', async () => {
      dispatcher.registerTask('build', async () => ({ artifacts: ['app.js'] }));

      const chain = [{ name: 'build' }];
      const result = await dispatcher.executeChain(chain);

      expect(result.status).toBe('success');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
    });

    it('should execute multi-task chain', async () => {
      dispatcher.registerTask('build', async () => ({ artifacts: ['app.js'] }));
      dispatcher.registerTask('test', async () => ({ passed: 10 }));

      const chain = [{ name: 'build' }, { name: 'test' }];
      const result = await dispatcher.executeChain(chain);

      expect(result.status).toBe('success');
      expect(result.results).toHaveLength(2);
    });

    it('should handle task failure', async () => {
      dispatcher.registerTask('fail-task', async () => {
        throw new Error('Task failed');
      });

      const chain = [{ name: 'fail-task' }];
      const result = await dispatcher.executeChain(chain);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('Task failed');
    });
  });

  describe('history tracking', () => {
    it('should record execution history', async () => {
      dispatcher.registerTask('test', async () => ({ ok: true }));

      const chain = [{ name: 'test' }];
      await dispatcher.executeChain(chain);
      await dispatcher.executeChain(chain);

      const history = dispatcher.getHistory();
      expect(history.length).toBe(2);
    });

    it('should clear history', async () => {
      dispatcher.registerTask('test', async () => ({ ok: true }));
      await dispatcher.executeChain([{ name: 'test' }]);

      dispatcher.clearHistory();
      expect(dispatcher.getHistory()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should throw on empty chain', async () => {
      await expect(dispatcher.executeChain([])).rejects.toThrow();
    });

    it('should handle missing task executor', async () => {
      const chain = [{ name: 'unknown-task' }];
      const result = await dispatcher.executeChain(chain);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('No executor');
    });
  });
});
