/**
 * Graceful Degradation Tests - CircuitBreaker and DegradationManager
 */

const CircuitBreaker = require('../circuit-breaker');
const DegradationManager = require('../degradation-manager');

describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      resetTimeoutMs: 100,
      halfOpenThreshold: 2
    });
  });

  describe('Initialization', () => {
    it('should initialize in CLOSED state', () => {
      expect(breaker.state).toBe('CLOSED');
    });

    it('should initialize statistics', () => {
      const stats = breaker.getStats();
      expect(stats.attempts).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.failures).toBe(0);
    });

    it('should have zero call history', () => {
      expect(breaker.getHistory().length).toBe(0);
    });
  });

  describe('Success Path', () => {
    it('should execute successful call', async () => {
      const fn = jest.fn(() => 'success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should increment success count', async () => {
      const fn = () => 'success';
      await breaker.execute(fn);

      const stats = breaker.getStats();
      expect(stats.successes).toBe(1);
      expect(stats.attempts).toBe(1);
    });

    it('should stay CLOSED on success', async () => {
      const fn = () => 'success';
      await breaker.execute(fn);

      expect(breaker.state).toBe('CLOSED');
    });

    it('should handle async functions', async () => {
      const fn = async () => {
        return new Promise(resolve => setTimeout(() => resolve('async-success'), 10));
      };
      const result = await breaker.execute(fn);

      expect(result).toBe('async-success');
    });

    it('should reset failure count on success', async () => {
      const succeedFn = () => 'success';
      const failFn = () => { throw new Error('fail'); };

      // Cause some failures
      try {
        await breaker.execute(failFn);
      } catch (e) {}

      const stateAfterFailure = breaker.failureCount;
      expect(stateAfterFailure).toBeGreaterThan(0);

      // Success should reset
      await breaker.execute(succeedFn);
      expect(breaker.failureCount).toBe(0);
    });
  });

  describe('Failure Path', () => {
    it('should reject call on failure', async () => {
      const fn = () => { throw new Error('failed'); };

      await expect(breaker.execute(fn)).rejects.toThrow('failed');
    });

    it('should increment failure count', async () => {
      const fn = () => { throw new Error('fail'); };

      try {
        await breaker.execute(fn);
      } catch (e) {}

      const stats = breaker.getStats();
      expect(stats.failures).toBe(1);
    });

    it('should open circuit after threshold', async () => {
      const fn = () => { throw new Error('fail'); };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {}
      }

      expect(breaker.state).toBe('OPEN');
    });

    it('should reject requests when OPEN', async () => {
      const fn = () => { throw new Error('fail'); };

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {}
      }

      // Try to execute when open
      const successFn = () => 'success';
      await expect(breaker.execute(successFn)).rejects.toThrow('Circuit breaker');

      const stats = breaker.getStats();
      expect(stats.rejects).toBe(1);
    });

    it('should emit request-rejected event', (done) => {
      const fn = () => { throw new Error('fail'); };

      breaker.on('request-rejected', () => {
        done();
      });

      (async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
          try {
            await breaker.execute(fn);
          } catch (e) {}
        }

        // This will trigger rejection
        try {
          await breaker.execute(() => 'success');
        } catch (e) {}
      })();
    });
  });

  describe('State Transitions', () => {
    it('should transition CLOSED -> OPEN', async () => {
      const fn = () => { throw new Error('fail'); };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {}
      }

      expect(breaker.state).toBe('OPEN');
    });

    it('should transition OPEN -> HALF_OPEN after timeout', (done) => {
      const fn = () => { throw new Error('fail'); };

      (async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
          try {
            await breaker.execute(fn);
          } catch (e) {}
        }

        expect(breaker.state).toBe('OPEN');

        setTimeout(async () => {
          const successFn = () => 'success';
          // This will trigger _checkReset and transition to HALF_OPEN
          try {
            await breaker.execute(successFn);
          } catch (e) {}

          expect(breaker.state).toBe('HALF_OPEN');
          done();
        }, 150);
      })();
    });

    it('should transition HALF_OPEN -> CLOSED on success', (done) => {
      const failFn = () => { throw new Error('fail'); };
      const successFn = () => 'success';

      (async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
          try {
            await breaker.execute(failFn);
          } catch (e) {}
        }

        // Wait for reset
        setTimeout(async () => {
          // Try to execute to transition from OPEN to HALF_OPEN
          try {
            await breaker.execute(successFn);
          } catch (e) {}

          // Should be HALF_OPEN now
          expect(breaker.state).toBe('HALF_OPEN');

          // Execute another successful call
          await breaker.execute(successFn);

          // Should be CLOSED (after 2 successes)
          expect(breaker.state).toBe('CLOSED');
          done();
        }, 150);
      })();
    });

    it('should transition HALF_OPEN -> OPEN on failure', (done) => {
      const failFn = () => { throw new Error('fail'); };

      (async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
          try {
            await breaker.execute(failFn);
          } catch (e) {}
        }

        // Wait for reset
        setTimeout(async () => {
          const successFn = () => 'success';
          // Try to execute - should transition to HALF_OPEN
          try {
            await breaker.execute(successFn);
          } catch (e) {}

          expect(breaker.state).toBe('HALF_OPEN');

          // Now fail
          try {
            await breaker.execute(failFn);
          } catch (e) {}

          // Should be back to OPEN
          expect(breaker.state).toBe('OPEN');
          done();
        }, 150);
      })();
    });

    it('should emit state-change event', (done) => {
      const fn = () => { throw new Error('fail'); };

      breaker.on('state-change', (data) => {
        expect(data.previousState).toBe('CLOSED');
        expect(data.newState).toBe('OPEN');
        done();
      });

      (async () => {
        for (let i = 0; i < 3; i++) {
          try {
            await breaker.execute(fn);
          } catch (e) {}
        }
      })();
    });
  });

  describe('Statistics', () => {
    it('should calculate failure rate', async () => {
      const failFn = () => { throw new Error('fail'); };
      const successFn = () => 'success';

      try {
        await breaker.execute(failFn);
      } catch (e) {}

      await breaker.execute(successFn);

      const stats = breaker.getStats();
      expect(stats.failureRate).toBe(50);
    });

    it('should calculate reject rate', async () => {
      const failFn = () => { throw new Error('fail'); };

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch (e) {}
      }

      // Try to execute when open
      try {
        await breaker.execute(() => 'success');
      } catch (e) {}

      const stats = breaker.getStats();
      expect(stats.rejectRate).toBeGreaterThan(0);
    });

    it('should include current state in stats', () => {
      const stats = breaker.getStats();
      expect(stats.currentState).toBe('CLOSED');
    });
  });

  describe('History', () => {
    it('should record call history', async () => {
      const fn = () => 'success';
      await breaker.execute(fn);

      const history = breaker.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].result).toBe('success');
    });

    it('should include state in history', async () => {
      const fn = () => 'success';
      await breaker.execute(fn);

      const history = breaker.getHistory();
      expect(history[0]).toHaveProperty('state');
      expect(history[0].state).toBe('CLOSED');
    });

    it('should trim history to max', async () => {
      const limitedBreaker = new CircuitBreaker({ maxHistory: 3 });
      const fn = () => 'success';

      for (let i = 0; i < 5; i++) {
        await limitedBreaker.execute(fn);
      }

      const history = limitedBreaker.getHistory();
      expect(history.length).toBe(3);
    });
  });

  describe('Manual Control', () => {
    it('should reset manually', async () => {
      const fn = () => { throw new Error('fail'); };

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {}
      }

      breaker.reset();

      expect(breaker.state).toBe('CLOSED');
      expect(breaker.failureCount).toBe(0);
    });

    it('should emit reset event', (done) => {
      breaker.on('manual-reset', () => {
        done();
      });

      breaker.reset();
    });

    it('should force open', async () => {
      breaker.forceOpen();
      expect(breaker.state).toBe('OPEN');

      const fn = () => 'success';
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker');
    });

    it('should emit force-open event', (done) => {
      breaker.on('force-open', () => {
        done();
      });

      breaker.forceOpen();
    });

    it('should clear history', async () => {
      const fn = () => 'success';
      await breaker.execute(fn);
      await breaker.execute(fn);

      const cleared = breaker.clearHistory();
      expect(cleared).toBe(2);
      expect(breaker.getHistory().length).toBe(0);
    });

    it('should report health', async () => {
      expect(breaker.isHealthy()).toBe(true);

      const fn = () => { throw new Error('fail'); };
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {}
      }

      expect(breaker.isHealthy()).toBe(false);
    });
  });

  describe('State Information', () => {
    it('should provide current state info', () => {
      const state = breaker.getState();

      expect(state.name).toBe('test-breaker');
      expect(state.state).toBe('CLOSED');
      expect(state).toHaveProperty('failureCount');
    });
  });
});

describe('DegradationManager', () => {
  let manager;

  beforeEach(() => {
    manager = new DegradationManager({
      degradedCpuThreshold: 70,
      degradedMemoryThreshold: 70,
      criticalCpuThreshold: 85,
      criticalMemoryThreshold: 85
    });
  });

  describe('Initialization', () => {
    it('should initialize in NORMAL mode', () => {
      expect(manager.mode).toBe('NORMAL');
    });

    it('should initialize statistics', () => {
      const stats = manager.getStats();
      expect(stats.modeChanges).toBe(0);
      expect(stats.rejectedRequests).toBe(0);
    });

    it('should have empty mode history', () => {
      expect(manager.modeHistory.length).toBe(0);
    });
  });

  describe('Mode Transitions', () => {
    it('should transition to DEGRADED', () => {
      manager.updateLoad(75, 50, 500, 10);
      expect(manager.mode).toBe('DEGRADED');
    });

    it('should transition to CRITICAL', () => {
      manager.updateLoad(90, 50, 500, 10);
      expect(manager.mode).toBe('CRITICAL');
    });

    it('should stay NORMAL with low load', () => {
      manager.updateLoad(50, 50, 500, 10);
      expect(manager.mode).toBe('NORMAL');
    });

    it('should go CRITICAL on memory', () => {
      manager.updateLoad(50, 90, 500, 10);
      expect(manager.mode).toBe('CRITICAL');
    });

    it('should go DEGRADED on queue depth', () => {
      manager.updateLoad(50, 50, 1500, 10);
      expect(manager.mode).toBe('DEGRADED');
    });

    it('should emit mode-changed event', (done) => {
      manager.on('mode-changed', (data) => {
        expect(data.previousMode).toBe('NORMAL');
        expect(data.newMode).toBe('DEGRADED');
        done();
      });

      manager.updateLoad(75, 50, 500, 10);
    });

    it('should record mode history', () => {
      manager.updateLoad(75, 50, 500, 10);
      manager.updateLoad(50, 50, 500, 10);

      expect(manager.modeHistory.length).toBe(2);
    });
  });

  describe('Degradation Features', () => {
    it('should disable features in NORMAL mode', () => {
      manager.updateLoad(50, 50, 500, 10);

      expect(manager.degradedFeatures.reduceHeavyProcessing).toBe(false);
      expect(manager.degradedFeatures.reduceConcurrency).toBe(false);
    });

    it('should enable degraded features', () => {
      manager.updateLoad(75, 50, 500, 10);

      expect(manager.degradedFeatures.reduceHeavyProcessing).toBe(true);
      expect(manager.degradedFeatures.skipOptionalValidation).toBe(true);
      expect(manager.degradedFeatures.reduceConcurrency).toBe(true);
    });

    it('should enable critical features', () => {
      manager.updateLoad(90, 50, 500, 10);

      expect(manager.criticalFeatures.fastFailOnTimeout).toBe(true);
      expect(manager.criticalFeatures.rejectNonCritical).toBe(true);
      expect(manager.criticalFeatures.pauseNewWork).toBe(true);
    });

    it('should check feature status', () => {
      manager.updateLoad(75, 50, 500, 10);

      expect(manager.isFeatureEnabled('reduceHeavyProcessing')).toBe(true);
      expect(manager.isFeatureEnabled('disableCaching')).toBe(true);
    });
  });

  describe('Request Acceptance', () => {
    it('should accept all requests in NORMAL', () => {
      manager.updateLoad(50, 50, 500, 10);

      expect(manager.shouldAcceptRequest({ priority: 'low' })).toBe(true);
      expect(manager.shouldAcceptRequest({ priority: 'normal' })).toBe(true);
    });

    it('should reject low-priority in CRITICAL', () => {
      manager.updateLoad(90, 50, 500, 10);

      expect(manager.shouldAcceptRequest({ priority: 'low' })).toBe(false);
      expect(manager.shouldAcceptRequest({ priority: 'critical' })).toBe(true);
    });

    it('should emit rejection event', (done) => {
      manager.on('request-rejected', () => {
        done();
      });

      manager.updateLoad(90, 50, 500, 10);
      manager.shouldAcceptRequest({ priority: 'low' });
    });

    it('should increment rejection count', () => {
      manager.updateLoad(90, 50, 500, 10);
      manager.shouldAcceptRequest({ priority: 'low' });

      const stats = manager.getStats();
      expect(stats.rejectedRequests).toBe(1);
    });
  });

  describe('Concurrency Limits', () => {
    it('should return max concurrency for NORMAL', () => {
      manager.updateLoad(50, 50, 500, 10);
      expect(manager.getMaxConcurrency()).toBe(50);
    });

    it('should return reduced concurrency for DEGRADED', () => {
      manager.updateLoad(75, 50, 500, 10);
      expect(manager.getMaxConcurrency()).toBe(25);
    });

    it('should return minimal concurrency for CRITICAL', () => {
      manager.updateLoad(90, 50, 500, 10);
      expect(manager.getMaxConcurrency()).toBe(10);
    });
  });

  describe('Retry Limits', () => {
    it('should return retry attempts for NORMAL', () => {
      manager.updateLoad(50, 50, 500, 10);
      expect(manager.getRetryAttempts()).toBe(3);
    });

    it('should reduce retries for DEGRADED', () => {
      manager.updateLoad(75, 50, 500, 10);
      expect(manager.getRetryAttempts()).toBe(1);
    });

    it('should disable retries for CRITICAL', () => {
      manager.updateLoad(90, 50, 500, 10);
      expect(manager.getRetryAttempts()).toBe(0);
    });
  });

  describe('Status and Reporting', () => {
    it('should provide degradation status', () => {
      manager.updateLoad(75, 50, 500, 10);

      const status = manager.getStatus();
      expect(status.mode).toBe('DEGRADED');
      expect(status.load).toHaveProperty('cpuPercent');
      expect(status.limits).toHaveProperty('maxConcurrency');
      expect(status.features).toHaveProperty('degraded');
    });

    it('should get statistics', () => {
      manager.updateLoad(75, 50, 500, 10);
      manager.updateLoad(50, 50, 500, 10);

      const stats = manager.getStats();
      expect(stats.modeChanges).toBe(2);
      expect(stats.currentMode).toBe('NORMAL');
    });

    it('should get mode history', () => {
      manager.updateLoad(75, 50, 500, 10);
      manager.updateLoad(50, 50, 500, 10);

      const history = manager.getModeHistory();
      expect(history.length).toBe(2);
    });

    it('should calculate time in modes', () => {
      manager.updateLoad(75, 50, 500, 10);
      setTimeout(() => {
        manager.updateLoad(50, 50, 500, 10);
      }, 50);

      const times = manager.getTimeInModes();
      expect(times).toHaveProperty('NORMAL');
      expect(times).toHaveProperty('DEGRADED');
    });
  });

  describe('Manual Control', () => {
    it('should force mode change', () => {
      manager.forceMode('CRITICAL');
      expect(manager.mode).toBe('CRITICAL');
    });

    it('should emit forced-mode-change event', (done) => {
      manager.on('forced-mode-change', () => {
        done();
      });

      manager.forceMode('DEGRADED');
    });

    it('should reset to NORMAL', () => {
      manager.updateLoad(90, 50, 500, 10);
      manager.reset();

      expect(manager.mode).toBe('NORMAL');
      expect(manager.modeHistory.length).toBe(0);
      expect(manager.getStats().rejectedRequests).toBe(0);
    });

    it('should emit reset event', (done) => {
      manager.on('reset', () => {
        done();
      });

      manager.reset();
    });

    it('should clear history', () => {
      manager.updateLoad(75, 50, 500, 10);
      manager.updateLoad(50, 50, 500, 10);

      const cleared = manager.clearHistory();
      expect(cleared).toBe(2);
      expect(manager.modeHistory.length).toBe(0);
    });

    it('should validate mode on force', () => {
      expect(() => {
        manager.forceMode('INVALID');
      }).toThrow('Invalid mode');
    });
  });
});
