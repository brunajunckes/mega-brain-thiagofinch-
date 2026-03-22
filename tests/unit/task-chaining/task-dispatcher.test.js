'use strict';

const { TaskDispatcher } = require('../../../.aiox-core/core/task-chaining/task-dispatcher');

describe('TaskDispatcher', () => {
  let dispatcher;

  beforeEach(() => {
    dispatcher = new TaskDispatcher();
  });

  describe('task registration', () => {
    it('should register task executor', () => {
      dispatcher.registerTask('build', async () => ({ ok: true }));
      expect(dispatcher.getRegisteredTasks()).toContain('build');
    });

    it('should throw on non-function executor', () => {
      expect(() => dispatcher.registerTask('bad', 'string')).toThrow('must be a function');
    });

    it('should allow overwriting registered task', () => {
      dispatcher.registerTask('t', async () => ({ v: 1 }));
      dispatcher.registerTask('t', async () => ({ v: 2 }));
      expect(dispatcher.getRegisteredTasks()).toContain('t');
    });
  });

  describe('chain execution', () => {
    it('should execute single task chain', async () => {
      dispatcher.registerTask('build', async () => ({ artifacts: ['app.js'] }));

      const result = await dispatcher.executeChain([{ name: 'build' }]);
      expect(result.status).toBe('success');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].output).toEqual({ artifacts: ['app.js'] });
    });

    it('should execute multi-task chain in order', async () => {
      const order = [];
      dispatcher.registerTask('first', async () => {
        order.push('first');
        return { step: 1 };
      });
      dispatcher.registerTask('second', async () => {
        order.push('second');
        return { step: 2 };
      });

      const result = await dispatcher.executeChain([
        { name: 'first' },
        { name: 'second' },
      ]);

      expect(result.status).toBe('success');
      expect(order).toEqual(['first', 'second']);
    });

    it('should pass input mapping between tasks', async () => {
      dispatcher.registerTask('build', async () => ({ artifacts: ['app.js'] }));
      dispatcher.registerTask('deploy', async (input) => ({
        deployed: input.buildArtifacts,
      }));

      const result = await dispatcher.executeChain([
        { name: 'build' },
        {
          name: 'deploy',
          depends_on: 'build',
          input_mapping: { buildArtifacts: 'artifacts' },
        },
      ]);

      expect(result.status).toBe('success');
      expect(result.results[1].output.deployed).toEqual(['app.js']);
    });

    it('should handle task failure with continueOnError', async () => {
      dispatcher.registerTask('fail', async () => {
        throw new Error('boom');
      });
      dispatcher.registerTask('next', async () => ({ ok: true }));

      const result = await dispatcher.executeChain([
        { name: 'fail' },
        { name: 'next' },
      ]);

      // Default behavior: continues on error
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);
    });

    it('should abort on failure when continueOnError is false', async () => {
      dispatcher.registerTask('fail', async () => {
        throw new Error('critical failure');
      });
      dispatcher.registerTask('next', async () => ({ ok: true }));

      const result = await dispatcher.executeChain([
        { name: 'fail', continueOnError: false },
        { name: 'next' },
      ]);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('critical failure');
      // The throw happens before results.push, so failed task is not in results
      expect(result.results).toHaveLength(0);
    });

    it('should handle missing executor gracefully', async () => {
      const result = await dispatcher.executeChain([
        { name: 'nonexistent' },
      ]);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('No executor');
    });

    it('should use inline handler if provided', async () => {
      const result = await dispatcher.executeChain([
        {
          name: 'inline',
          handler: async () => ({ inline: true }),
        },
      ]);

      expect(result.status).toBe('success');
      expect(result.results[0].output).toEqual({ inline: true });
    });

    it('should throw on empty chain', async () => {
      await expect(dispatcher.executeChain([])).rejects.toThrow('non-empty array');
    });

    it('should throw on non-array chain', async () => {
      await expect(dispatcher.executeChain('bad')).rejects.toThrow('non-empty array');
    });

    it('should include chainId in result', async () => {
      dispatcher.registerTask('t', async () => ({}));
      const result = await dispatcher.executeChain([{ name: 't' }]);
      expect(result.chainId).toMatch(/^chain-/);
    });

    it('should calculate total duration', async () => {
      dispatcher.registerTask('t', async () => ({}));
      const result = await dispatcher.executeChain([{ name: 't' }]);
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('lifecycle callbacks', () => {
    it('should call onTaskStart and onTaskEnd', async () => {
      const starts = [];
      const ends = [];

      const d = new TaskDispatcher({
        onTaskStart: ({ taskName }) => starts.push(taskName),
        onTaskEnd: ({ taskName }) => ends.push(taskName),
      });

      d.registerTask('a', async () => ({}));
      d.registerTask('b', async () => ({}));

      await d.executeChain([{ name: 'a' }, { name: 'b' }]);

      expect(starts).toEqual(['a', 'b']);
      expect(ends).toEqual(['a', 'b']);
    });

    it('should call onChainError on failure', async () => {
      let errorInfo = null;
      const d = new TaskDispatcher({
        onChainError: (info) => { errorInfo = info; },
      });

      d.registerTask('fail', async () => { throw new Error('x'); });

      await d.executeChain([{ name: 'fail', continueOnError: false }]);

      expect(errorInfo).toBeDefined();
      expect(errorInfo.error.message).toContain('x');
    });
  });

  describe('history tracking', () => {
    it('should record execution history', async () => {
      dispatcher.registerTask('t', async () => ({}));

      await dispatcher.executeChain([{ name: 't' }]);
      await dispatcher.executeChain([{ name: 't' }]);

      const history = dispatcher.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].chainId).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
    });

    it('should limit history by parameter', async () => {
      dispatcher.registerTask('t', async () => ({}));

      for (let i = 0; i < 5; i++) {
        await dispatcher.executeChain([{ name: 't' }]);
      }

      expect(dispatcher.getHistory(2)).toHaveLength(2);
    });

    it('should clear history', async () => {
      dispatcher.registerTask('t', async () => ({}));
      await dispatcher.executeChain([{ name: 't' }]);

      dispatcher.clearHistory();
      expect(dispatcher.getHistory()).toHaveLength(0);
    });

    it('should respect maxHistory limit', async () => {
      const d = new TaskDispatcher({ maxHistory: 3 });
      d.registerTask('t', async () => ({}));

      for (let i = 0; i < 5; i++) {
        await d.executeChain([{ name: 't' }]);
      }

      expect(d.getHistory().length).toBeLessThanOrEqual(3);
    });
  });

  describe('_getNestedValue', () => {
    it('should get top-level value', () => {
      const val = dispatcher._getNestedValue({ foo: 42 }, 'foo');
      expect(val).toBe(42);
    });

    it('should get nested value', () => {
      const val = dispatcher._getNestedValue({ a: { b: { c: 'deep' } } }, 'a.b.c');
      expect(val).toBe('deep');
    });

    it('should return undefined for missing path', () => {
      expect(dispatcher._getNestedValue({ a: 1 }, 'b')).toBeUndefined();
    });

    it('should return undefined for null object', () => {
      expect(dispatcher._getNestedValue(null, 'a')).toBeUndefined();
    });

    it('should return undefined for non-string path', () => {
      expect(dispatcher._getNestedValue({ a: 1 }, null)).toBeUndefined();
    });
  });

  describe('timeout', () => {
    it('should timeout slow tasks', async () => {
      dispatcher.registerTask('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {};
      });

      const result = await dispatcher.executeChain([
        { name: 'slow', timeout: 50 },
      ]);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('timeout');
    });
  });
});
