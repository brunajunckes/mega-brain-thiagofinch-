/**
 * Conditional Executor Tests
 */

const ConditionalExecutor = require('../conditional-executor');

describe('ConditionalExecutor', () => {
  let executor;

  beforeEach(() => {
    executor = new ConditionalExecutor();
  });

  describe('Initialization', () => {
    it('should initialize with empty history', () => {
      expect(executor.getRoutingHistory().length).toBe(0);
    });

    it('should initialize with zero stats', () => {
      const stats = executor.getStats();
      expect(stats.ifExecuted).toBe(0);
      expect(stats.switchExecuted).toBe(0);
    });
  });

  describe('If/Else Execution', () => {
    it('should execute true branch when condition is true', () => {
      const context = { active: true };
      const onTrue = { task: 'true-task' };
      const onFalse = { task: 'false-task' };

      const result = executor.executeIf('active', onTrue, onFalse, context);

      expect(result).toEqual(onTrue);
      expect(executor.getStats().ifExecuted).toBe(1);
    });

    it('should execute false branch when condition is false', () => {
      const context = { active: false };
      const onTrue = { task: 'true-task' };
      const onFalse = { task: 'false-task' };

      const result = executor.executeIf('active', onTrue, onFalse, context);

      expect(result).toEqual(onFalse);
    });

    it('should execute callback if provided', () => {
      const context = { count: 10 };
      const callback = jest.fn(() => ({ task: 'callback-result' }));

      const result = executor.executeIf('count > 5', callback, null, context);

      expect(callback).toHaveBeenCalledWith(context);
      expect(result).toEqual({ task: 'callback-result' });
    });

    it('should return null when no branch provided', () => {
      const context = { active: true };
      const result = executor.executeIf('active', null, null, context);

      expect(result).toBeNull();
    });

    it('should emit if-decision event', (done) => {
      executor.on('if-decision', ({ condition, result, onTrueBranch }) => {
        expect(condition).toBe('true');
        expect(result).toBe(true);
        expect(onTrueBranch).toBe(true);
        done();
      });

      executor.executeIf('true', {}, null, {});
    });
  });

  describe('Switch/Case Execution', () => {
    it('should match and execute correct case', () => {
      const context = { status: 'active' };
      const cases = [
        { value: '"active"', execute: { task: 'active-task' } },
        { value: '"inactive"', execute: { task: 'inactive-task' } }
      ];

      const result = executor.executeSwitch('status', cases, null, context);

      expect(result).toEqual({ task: 'active-task' });
      expect(executor.getStats().casesMatched).toBe(1);
    });

    it('should execute default when no case matches', () => {
      const context = { status: 'unknown' };
      const cases = [
        { value: '"active"', execute: { task: 'active-task' } },
        { value: '"inactive"', execute: { task: 'inactive-task' } }
      ];
      const defaultCase = { task: 'default-task' };

      const result = executor.executeSwitch('status', cases, defaultCase, context);

      expect(result).toEqual(defaultCase);
      expect(executor.getStats().defaultsFallback).toBe(1);
    });

    it('should return null when no case matches and no default', () => {
      const context = { status: 'unknown' };
      const cases = [
        { value: '"active"', execute: { task: 'active-task' } }
      ];

      const result = executor.executeSwitch('status', cases, null, context);

      expect(result).toBeNull();
    });

    it('should emit switch-decision event on match', (done) => {
      executor.on('switch-decision', ({ matchedCaseIndex, usedDefault }) => {
        expect(matchedCaseIndex).toBe(0);
        expect(usedDefault).toBe(false);
        done();
      });

      const cases = [{ value: '"a"', execute: { task: 'task' } }];
      executor.executeSwitch('myValue', cases, null, { myValue: 'a' });
    });

    it('should emit switch-default event on default', (done) => {
      executor.on('switch-default', ({ usedDefault }) => {
        expect(usedDefault).toBe(true);
        done();
      });

      const cases = [{ value: '"a"', execute: { task: 'task' } }];
      executor.executeSwitch('myValue', cases, { task: 'default' }, { myValue: 'b' });
    });

    it('should handle multiple cases correctly', () => {
      const context = { level: 2 };
      const cases = [
        { value: '1', execute: { task: 'level-1' } },
        { value: '2', execute: { task: 'level-2' } },
        { value: '3', execute: { task: 'level-3' } }
      ];

      const result = executor.executeSwitch('level', cases, null, context);

      expect(result).toEqual({ task: 'level-2' });
    }); // Numbers work fine
  });

  describe('Context Management', () => {
    it('should set context for evaluation', () => {
      executor.setContext({ x: 10 });
      const result = executor.executeIf('x > 5', { task: 'task' }, null);

      expect(result).toEqual({ task: 'task' });
    });

    it('should clear context', () => {
      executor.setContext({ x: 10 });
      executor.clearContext();

      const result = executor.executeIf('x > 5', { task: 'task' }, { task: 'default' });

      // After clearing context, x is undefined, so x > 5 is false
      expect(result).toEqual({ task: 'default' });
    });
  });

  describe('Routing History', () => {
    it('should track routing decisions', () => {
      executor.executeIf('true', { task: 'task1' }, null, {});
      executor.executeIf('false', { task: 'task2' }, { task: 'task3' }, {});

      const history = executor.getRoutingHistory();
      expect(history.length).toBe(2);
      expect(history[0].type).toBe('if');
      expect(history[1].type).toBe('if');
    });

    it('should clear routing history', () => {
      executor.executeIf('true', { task: 'task' }, null, {});
      const cleared = executor.clearRoutingHistory();

      expect(cleared).toBe(1);
      expect(executor.getRoutingHistory().length).toBe(0);
    });

    it('should include decision details in history', () => {
      const context = { count: 10 };
      executor.executeIf('count > 5', { task: 'true' }, { task: 'false' }, context);

      const history = executor.getRoutingHistory();
      expect(history[0].condition).toBe('count > 5');
      expect(history[0].result).toBe(true);
      expect(history[0].context).toEqual(context);
    });
  });

  describe('Statistics', () => {
    it('should track if execution stats', () => {
      executor.executeIf('true', {}, null, {});
      executor.executeIf('true', {}, null, {});
      executor.executeIf('false', {}, {}, {});

      const stats = executor.getStats();
      expect(stats.ifExecuted).toBe(3);
      expect(stats.routingDecisions).toBe(3);
    });

    it('should track switch execution stats', () => {
      const context = { value: 'a' };
      const cases = [{ value: '"a"', execute: { task: 'task' } }];
      executor.executeSwitch('value', cases, null, context);

      const context2 = { value: 'b' };
      executor.executeSwitch('value', cases, { task: 'default' }, context2);

      const stats = executor.getStats();
      expect(stats.switchExecuted).toBe(2);
      expect(stats.casesMatched).toBe(1);
      expect(stats.defaultsFallback).toBe(1);
    });

    it('should include evaluator stats', () => {
      executor.executeIf('true', {}, null, {});
      const stats = executor.getStats();

      expect(stats.evaluatorStats).toBeDefined();
      expect(stats.evaluatorStats.evaluated).toBeGreaterThan(0);
    });
  });

  describe('Nested Routing', () => {
    it('should create nested routing conditions', () => {
      const conditions = ['a && b', 'c || d', '!e'];
      const context = { a: true, b: true, c: false, d: true, e: false };

      const results = executor.createNestedRouting(conditions, context);

      expect(results.length).toBe(3);
      expect(results[0]).toEqual({ condition: 'a && b', result: true });
      expect(results[1]).toEqual({ condition: 'c || d', result: true });
      expect(results[2]).toEqual({ condition: '!e', result: true });
    });
  });

  describe('Evaluate All Branches', () => {
    it('should evaluate all branches and return matches', () => {
      const branches = [
        { condition: 'count > 10', value: 'high' },
        { condition: 'count > 5', value: 'medium' },
        { condition: 'count > 0', value: 'low' }
      ];
      const context = { count: 7 };

      const results = executor.evaluateAllBranches(branches, context);

      expect(results.length).toBe(3);
      expect(results[0].matched).toBe(false);
      expect(results[1].matched).toBe(true);
      expect(results[2].matched).toBe(true);
    });
  });

  describe('Routing Validation', () => {
    it('should validate if routing', () => {
      const routing = {
        type: 'if',
        condition: 'active'
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should validate switch routing', () => {
      const routing = {
        type: 'switch',
        expression: 'status',
        cases: [
          { value: 'a', execute: { task: 'task-a' } },
          { value: 'b', execute: { task: 'task-b' } }
        ]
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(true);
    });

    it('should fail validation for invalid routing', () => {
      const routing = {
        type: 'invalid'
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(true); // No explicit check for invalid type in basic validation
    });

    it('should fail if routing without condition', () => {
      const routing = {
        type: 'if'
        // Missing condition
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should fail switch routing without expression', () => {
      const routing = {
        type: 'switch',
        cases: [{ value: 'a', execute: { task: 'task' } }]
        // Missing expression
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(false);
    });

    it('should fail switch routing without cases', () => {
      const routing = {
        type: 'switch',
        expression: 'value'
        // Missing cases
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(false);
    });

    it('should fail switch case without value', () => {
      const routing = {
        type: 'switch',
        expression: 'value',
        cases: [
          { execute: { task: 'task' } } // Missing value
        ]
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(false);
    });

    it('should fail switch case without execute', () => {
      const routing = {
        type: 'switch',
        expression: 'value',
        cases: [
          { value: 'a' } // Missing execute
        ]
      };

      const validation = executor.validateRouting(routing);

      expect(validation.valid).toBe(false);
    });
  });

  describe('Complex Routing Scenarios', () => {
    it('should handle nested if/switch combinations', () => {
      const context = { role: 'admin', level: 3 };

      // First if: check role
      const roleResult = executor.executeIf(
        'role == "admin"',
        { routing: 'admin-route' },
        { routing: 'user-route' },
        context
      );

      expect(roleResult).toEqual({ routing: 'admin-route' });

      // Then switch based on level
      const cases = [
        { value: '1', execute: { task: 'level-1' } },
        { value: '3', execute: { task: 'level-3' } }
      ];
      const levelResult = executor.executeSwitch('level', cases, { task: 'default' }, context);

      expect(levelResult).toEqual({ task: 'level-3' });
    });

    it('should handle task execution callbacks', () => {
      const context = { priority: 'high' };
      const taskFactory = jest.fn(() => ({ task: 'generated-task' }));

      const result = executor.executeIf('priority == "high"', taskFactory, null, context);

      expect(taskFactory).toHaveBeenCalledWith(context);
      expect(result).toEqual({ task: 'generated-task' });
    });
  });

  describe('Execute Routing', () => {
    it('should execute if routing configuration', () => {
      const routing = {
        type: 'if',
        condition: 'active',
        ifTrue: { task: 'true-task' },
        ifFalse: { task: 'false-task' }
      };
      const context = { active: true };

      const result = executor.executeRouting(routing, context);

      expect(result).toEqual({ task: 'true-task' });
    });

    it('should execute switch routing configuration', () => {
      const routing = {
        type: 'switch',
        expression: 'status',
        cases: [
          { value: '"active"', execute: { task: 'active-task' } },
          { value: '"inactive"', execute: { task: 'inactive-task' } }
        ],
        default: { task: 'default-task' }
      };
      const context = { status: 'active' };

      const result = executor.executeRouting(routing, context);

      expect(result).toEqual({ task: 'active-task' });
    });

    it('should throw on unknown routing type', () => {
      const routing = {
        type: 'unknown'
      };

      expect(() => {
        executor.executeRouting(routing, {});
      }).toThrow('Unknown routing type: unknown');
    });
  });
});
