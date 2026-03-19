'use strict';

const { EventSchema } = require('../../../.aiox-core/core/webhook-integration');

describe('EventSchema', () => {
  describe('createInsightEvent', () => {
    it('should create insight event from insight data', () => {
      const insight = {
        type: 'regression',
        priority: 9,
        repository: 'repo1',
        title: 'Test coverage dropped',
        description: 'Coverage below 60%',
        metrics: { coverage: 50 },
      };

      const event = EventSchema.createInsightEvent(insight);

      expect(event.type).toBe('insight.regression');
      expect(event.priority).toBe(9);
      expect(event.repository).toBe('repo1');
      expect(event.data.title).toBe('Test coverage dropped');
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it('should set default repository if not provided', () => {
      const insight = {
        type: 'improvement',
        priority: 5,
        title: 'Test',
      };

      const event = EventSchema.createInsightEvent(insight);

      expect(event.repository).toBe('unknown');
    });
  });

  describe('createActionEvent', () => {
    it('should create action event with default status', () => {
      const action = {
        insight: 'Test failure',
        action: 'alert_team',
        priority: 9,
        description: 'Send alert',
        repository: 'repo1',
      };

      const event = EventSchema.createActionEvent(action);

      expect(event.type).toBe('action.alert_team');
      expect(event.data.status).toBe('queued');
      expect(event.data.insight).toBe('Test failure');
    });

    it('should set custom status if provided', () => {
      const action = { action: 'alert_team', priority: 5 };

      const event = EventSchema.createActionEvent(action, 'completed');

      expect(event.data.status).toBe('completed');
    });
  });

  describe('createHealthEvent', () => {
    it('should create health event for repository', () => {
      const health = {
        repository: 'repo1',
        score: 8,
        previousScore: 7,
        trend: 'up',
        changes: { coverage: 85 },
      };

      const event = EventSchema.createHealthEvent(health);

      expect(event.type).toBe('health.status');
      expect(event.repository).toBe('repo1');
      expect(event.data.score).toBe(8);
      expect(event.priority).toBe(3); // Low priority for healthy repo
    });

    it('should assign high priority for unhealthy repo', () => {
      const health = {
        repository: 'repo1',
        score: 3,
      };

      const event = EventSchema.createHealthEvent(health);

      expect(event.priority).toBe(9); // High priority
    });
  });

  describe('createDashboardEvent', () => {
    it('should create dashboard event', () => {
      const metrics = {
        repository: 'repo1',
        data: { coverage: 85, loc: 50000 },
        timestamp: new Date().toISOString(),
      };

      const event = EventSchema.createDashboardEvent(metrics);

      expect(event.type).toBe('dashboard.update');
      expect(event.priority).toBe(5);
      expect(event.data.metrics).toEqual(metrics.data);
    });
  });

  describe('createCustomEvent', () => {
    it('should create custom event with specified values', () => {
      const event = EventSchema.createCustomEvent('custom.event', 7, 'repo1', {
        customField: 'value',
      });

      expect(event.type).toBe('custom.event');
      expect(event.priority).toBe(7);
      expect(event.repository).toBe('repo1');
      expect(event.data.customField).toBe('value');
    });

    it('should clamp priority to 1-10 range', () => {
      const event1 = EventSchema.createCustomEvent('test', 15, 'repo', {});
      const event2 = EventSchema.createCustomEvent('test', -5, 'repo', {});

      expect(event1.priority).toBe(10);
      expect(event2.priority).toBe(1);
    });
  });

  describe('validate', () => {
    it('should validate correct event', () => {
      const event = {
        id: 'evt_123',
        timestamp: new Date().toISOString(),
        type: 'insight.regression',
        priority: 5,
        repository: 'repo1',
        data: { title: 'Test' },
      };

      expect(EventSchema.validate(event)).toBe(true);
    });

    it('should reject event without id', () => {
      const event = {
        timestamp: new Date().toISOString(),
        type: 'insight.regression',
        data: {},
      };

      expect(() => EventSchema.validate(event)).toThrow('id');
    });

    it('should reject event with invalid priority', () => {
      const event = {
        id: 'evt_123',
        timestamp: new Date().toISOString(),
        type: 'insight.regression',
        priority: 15,
        data: {},
      };

      expect(() => EventSchema.validate(event)).toThrow('Priority');
    });

    it('should reject event without data', () => {
      const event = {
        id: 'evt_123',
        timestamp: new Date().toISOString(),
        type: 'insight.regression',
      };

      expect(() => EventSchema.validate(event)).toThrow('data');
    });
  });

  describe('filterByType', () => {
    it('should return all events for wildcard', () => {
      const events = [
        { type: 'insight.regression' },
        { type: 'action.alert' },
        { type: 'health.status' },
      ];

      expect(EventSchema.filterByType(events, '*')).toHaveLength(3);
      expect(EventSchema.filterByType(events, '*.*')).toHaveLength(3);
    });

    it('should filter by specific type', () => {
      const events = [
        { type: 'insight.regression' },
        { type: 'insight.improvement' },
        { type: 'action.alert' },
      ];

      const filtered = EventSchema.filterByType(events, 'insight.regression');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('insight.regression');
    });

    it('should filter by type prefix', () => {
      const events = [
        { type: 'insight.regression' },
        { type: 'insight.improvement' },
        { type: 'action.alert' },
      ];

      const filtered = EventSchema.filterByType(events, 'insight.*');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterByPriority', () => {
    it('should filter events by minimum priority', () => {
      const events = [{ priority: 3 }, { priority: 7 }, { priority: 9 }];

      const filtered = EventSchema.filterByPriority(events, 7);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterByRepository', () => {
    it('should filter by single repository', () => {
      const events = [
        { repository: 'repo1' },
        { repository: 'repo2' },
        { repository: 'repo1' },
      ];

      const filtered = EventSchema.filterByRepository(events, 'repo1');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by multiple repositories', () => {
      const events = [
        { repository: 'repo1' },
        { repository: 'repo2' },
        { repository: 'repo3' },
      ];

      const filtered = EventSchema.filterByRepository(events, ['repo1', 'repo3']);
      expect(filtered).toHaveLength(2);
    });
  });
});
