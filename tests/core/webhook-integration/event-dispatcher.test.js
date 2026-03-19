'use strict';

const { EventDispatcher, WebhookManager, EventSchema } = require('../../../.aiox-core/core/webhook-integration');

describe('EventDispatcher', () => {
  let dispatcher, webhookManager;

  beforeEach(() => {
    webhookManager = new WebhookManager();
    dispatcher = new EventDispatcher(webhookManager);
  });

  describe('dispatch', () => {
    it('should dispatch event to matching webhooks', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['insight.*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      // Dispatch will attempt HTTP call, but we just check it returns result
      const result = dispatcher.dispatch(event, [webhook]);

      expect(result.status).toBeDefined();
      expect(result.eventId).toBe(event.id);
    });

    it('should return no_webhooks when no match', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['action.*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      const result = dispatcher.dispatch(event, [webhook]);

      expect(result.status).toBe('no_webhooks');
      expect(result.dispatched).toHaveLength(0);
    });

    it('should reject invalid event', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook');
      const invalidEvent = { type: 'test' };

      const result = dispatcher.dispatch(invalidEvent, [webhook]);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Invalid event');
    });

    it('should skip inactive webhooks', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['*'],
      });
      webhookManager.updateWebhook(webhook.id, { active: false });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      const result = dispatcher.dispatch(event, [webhook]);

      expect(result.status).toBe('no_webhooks');
    });
  });

  describe('queue', () => {
    it('should queue event for async dispatch', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      const result = dispatcher.queue(event, [webhook]);

      expect(result.status).toBe('queued');
      expect(result.queued).toBe(1);
      expect(dispatcher.pendingQueue).toHaveLength(1);
    });

    it('should queue multiple webhooks for single event', () => {
      const w1 = webhookManager.addWebhook('https://example.com/webhook1', {
        events: ['*'],
      });
      const w2 = webhookManager.addWebhook('https://example.com/webhook2', {
        events: ['*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      const result = dispatcher.queue(event, [w1, w2]);

      expect(result.status).toBe('queued');
      expect(result.queued).toBe(2);
      expect(dispatcher.pendingQueue).toHaveLength(2);
    });

    it('should return no_webhooks for non-matching events', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['action.*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      const result = dispatcher.queue(event, [webhook]);

      expect(result.status).toBe('no_webhooks');
      expect(dispatcher.pendingQueue).toHaveLength(0);
    });
  });

  describe('processQueue', () => {
    it('should process queued items', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      dispatcher.queue(event, [webhook]);
      expect(dispatcher.pendingQueue).toHaveLength(1);

      // processQueue will attempt HTTP calls but returns result
      const result = dispatcher.processQueue();

      expect(result.status).toBe('ok');
      expect(result.processed).toBeGreaterThanOrEqual(0);
    });

    it('should not process if already processing', () => {
      dispatcher.isProcessing = true;
      dispatcher.pendingQueue.push({ test: true });

      const result = dispatcher.processQueue();

      expect(result.status).toBe('ok');
      expect(result.processed).toBe(0);
      expect(dispatcher.pendingQueue).toHaveLength(1);
    });

    it('should not process empty queue', () => {
      const result = dispatcher.processQueue();

      expect(result.status).toBe('ok');
      expect(result.processed).toBe(0);
      expect(dispatcher.pendingQueue).toHaveLength(0);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      dispatcher.queue(event, [webhook]);

      const stats = dispatcher.getQueueStats();

      expect(stats.queueLength).toBe(1);
      expect(stats.isProcessing).toBe(false);
      expect(stats.timestamp).toBeDefined();
    });
  });

  describe('clearQueue', () => {
    it('should clear all queued items', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['*'],
      });

      const event = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      dispatcher.queue(event, [webhook]);
      dispatcher.queue(event, [webhook]);

      const result = dispatcher.clearQueue();

      expect(result.status).toBe('ok');
      expect(result.cleared).toBe(2);
      expect(dispatcher.pendingQueue).toHaveLength(0);
    });
  });

  describe('Event matching logic', () => {
    it('should match specific event type', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['insight.regression'],
      });

      const regression = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      const improvement = EventSchema.createInsightEvent({
        type: 'improvement',
        priority: 5,
        title: 'Test',
      });

      const r1 = dispatcher.dispatch(regression, [webhook]);
      const r2 = dispatcher.dispatch(improvement, [webhook]);

      expect(r1.status).not.toBe('no_webhooks');
      expect(r2.status).toBe('no_webhooks');
    });

    it('should match wildcard events', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['insight.*'],
      });

      const regression = EventSchema.createInsightEvent({
        type: 'regression',
        priority: 9,
        title: 'Test',
      });

      const improvement = EventSchema.createInsightEvent({
        type: 'improvement',
        priority: 5,
        title: 'Test',
      });

      const r1 = dispatcher.dispatch(regression, [webhook]);
      const r2 = dispatcher.dispatch(improvement, [webhook]);

      expect(r1.status).not.toBe('no_webhooks');
      expect(r2.status).not.toBe('no_webhooks');
    });

    it('should match universal wildcard', () => {
      const webhook = webhookManager.addWebhook('https://example.com/webhook', {
        events: ['*'],
      });

      const events = [
        EventSchema.createInsightEvent({ type: 'regression', priority: 9, title: 'T1' }),
        EventSchema.createActionEvent({ action: 'alert_team', priority: 5 }, 'completed'),
        EventSchema.createHealthEvent({ repository: 'repo1', score: 8 }),
      ];

      for (const event of events) {
        const result = dispatcher.dispatch(event, [webhook]);
        expect(result.status).not.toBe('no_webhooks');
      }
    });
  });
});
