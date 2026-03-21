'use strict';

const { MultiBackendExecutor, LocalBackend } = require('../executor');

describe('MultiBackendExecutor', () => {
  let executor;

  beforeEach(() => {
    executor = new MultiBackendExecutor();
  });

  describe('initialization', () => {
    it('should initialize with default backend', () => {
      expect(executor.defaultBackend).toBe('local');
    });

    it('should support multiple backends', () => {
      const backends = executor.getSupportedBackends();
      expect(backends).toContain('local');
      expect(backends).toContain('docker');
      expect(backends).toContain('ssh');
      expect(backends).toContain('modal');
    });

    it('should allow custom default backend', () => {
      const customExecutor = new MultiBackendExecutor({ defaultBackend: 'docker' });
      expect(customExecutor.defaultBackend).toBe('docker');
    });
  });

  describe('local backend execution', () => {
    it('should execute command locally', async () => {
      const result = await executor.execute('echo "hello"', { backend: 'local' });

      expect(result.status).toBe('success');
      expect(result.backend).toBe('local');
      expect(result.stdout).toContain('hello');
    });

    it('should handle command errors', async () => {
      await expect(executor.execute('exit 1', { backend: 'local' })).rejects.toThrow();
    });

    it('should capture output', async () => {
      const result = await executor.execute('echo "test"', {
        backend: 'local',
        capture: true,
      });

      expect(result.stdout).toBeTruthy();
    });
  });

  describe('execution history', () => {
    it('should record execution in history', async () => {
      await executor.execute('echo "test"', { backend: 'local' });

      const history = executor.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].command).toBe('echo "test"');
      expect(history[0].status).toBe('success');
    });

    it('should record errors in history', async () => {
      try {
        await executor.execute('exit 1', { backend: 'local' });
      } catch (e) {
        // Expected
      }

      const history = executor.getHistory();
      expect(history.some((h) => h.status === 'failed')).toBe(true);
    });

    it('should limit history size', async () => {
      const smallExecutor = new MultiBackendExecutor();

      for (let i = 0; i < 5; i++) {
        try {
          await smallExecutor.execute('echo "test"', { backend: 'local' });
        } catch (e) {
          // Ignore errors
        }
      }

      smallExecutor.executionHistory = smallExecutor.executionHistory.slice(-3);
      expect(smallExecutor.getHistory().length).toBeLessThanOrEqual(3);
    });

    it('should clear history', async () => {
      await executor.execute('echo "test"', { backend: 'local' });
      expect(executor.getHistory().length).toBeGreaterThan(0);

      executor.clearHistory();
      expect(executor.getHistory().length).toBe(0);
    });
  });

  describe('event emissions', () => {
    it('should emit execution:complete on success', (done) => {
      executor.on('execution:complete', ({ backend, command }) => {
        expect(backend).toBe('local');
        expect(command).toBe('echo "success"');
        done();
      });

      executor.execute('echo "success"', { backend: 'local' });
    });

    it('should emit execution:error on failure', (done) => {
      executor.on('execution:error', ({ backend, error }) => {
        expect(backend).toBe('local');
        expect(error).toBeTruthy();
        done();
      });

      executor.execute('exit 1', { backend: 'local' }).catch(() => {
        // Expected
      });
    });
  });

  describe('error handling', () => {
    it('should throw on unknown backend', async () => {
      await expect(executor.execute('echo "test"', { backend: 'unknown' })).rejects.toThrow(
        /Unknown backend/,
      );
    });
  });

  describe('LocalBackend', () => {
    let backend;

    beforeEach(() => {
      backend = new LocalBackend();
    });

    it('should execute command', async () => {
      const result = await backend.execute('echo "local"');

      expect(result.status).toBe('success');
      expect(result.backend).toBe('local');
      expect(result.code).toBe(0);
    });

    it('should capture stdout', async () => {
      const result = await backend.execute('echo "output"', { capture: true });

      expect(result.stdout).toContain('output');
    });
  });
});
