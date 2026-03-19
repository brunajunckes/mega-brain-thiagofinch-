'use strict';

const { WebhookManager } = require('../../../.aiox-core/core/webhook-integration');

describe('WebhookManager', () => {
  let manager;

  beforeEach(() => {
    manager = new WebhookManager();
  });

  describe('addWebhook', () => {
    it('should add a webhook with valid URL', () => {
      const webhook = manager.addWebhook('https://example.com/webhook', {
        events: ['insight.*'],
      });

      expect(webhook.id).toBeDefined();
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.active).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(() => {
        manager.addWebhook('not-a-url', {});
      }).toThrow();
    });

    it('should reject non-http protocol', () => {
      expect(() => {
        manager.addWebhook('ftp://example.com/webhook', {});
      }).toThrow();
    });

    it('should set defaults for optional config', () => {
      const webhook = manager.addWebhook('https://example.com/webhook');

      expect(webhook.timeout).toBe(5000);
      expect(webhook.retryAttempts).toBe(3);
      expect(webhook.active).toBe(true);
      expect(webhook.events).toEqual(['*']);
    });
  });

  describe('getWebhook', () => {
    it('should return webhook by ID', () => {
      const added = manager.addWebhook('https://example.com/webhook');
      const retrieved = manager.getWebhook(added.id);

      expect(retrieved).toEqual(added);
    });

    it('should return null for nonexistent ID', () => {
      expect(manager.getWebhook('nonexistent')).toBeNull();
    });
  });

  describe('listWebhooks', () => {
    it('should list all webhooks', () => {
      manager.addWebhook('https://example.com/webhook1');
      manager.addWebhook('https://example.com/webhook2');

      expect(manager.listWebhooks()).toHaveLength(2);
    });

    it('should filter by active status', () => {
      const w1 = manager.addWebhook('https://example.com/webhook1');
      manager.addWebhook('https://example.com/webhook2');

      manager.updateWebhook(w1.id, { active: false });

      expect(manager.listWebhooks({ active: true })).toHaveLength(1);
      expect(manager.listWebhooks({ active: false })).toHaveLength(1);
    });

    it('should filter by event type', () => {
      manager.addWebhook('https://example.com/webhook1', { events: ['insight.*'] });
      manager.addWebhook('https://example.com/webhook2', { events: ['action.*'] });
      manager.addWebhook('https://example.com/webhook3', { events: ['*'] });

      const results = manager.listWebhooks({ event: 'insight.regression' });
      expect(results).toHaveLength(2); // webhook1 and webhook3
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook URL', () => {
      const webhook = manager.addWebhook('https://example.com/webhook');
      const updated = manager.updateWebhook(webhook.id, { url: 'https://new.com/webhook' });

      expect(updated.url).toBe('https://new.com/webhook');
    });

    it('should update events', () => {
      const webhook = manager.addWebhook('https://example.com/webhook');
      const updated = manager.updateWebhook(webhook.id, { events: ['action.*', 'health.*'] });

      expect(updated.events).toEqual(['action.*', 'health.*']);
    });

    it('should throw for nonexistent webhook', () => {
      expect(() => {
        manager.updateWebhook('nonexistent', { active: false });
      }).toThrow();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook', () => {
      const webhook = manager.addWebhook('https://example.com/webhook');
      const deleted = manager.deleteWebhook(webhook.id);

      expect(deleted).toBe(true);
      expect(manager.getWebhook(webhook.id)).toBeNull();
    });

    it('should return false for nonexistent webhook', () => {
      expect(manager.deleteWebhook('nonexistent')).toBe(false);
    });
  });

  describe('markTriggered', () => {
    it('should update last triggered time on success', () => {
      const webhook = manager.addWebhook('https://example.com/webhook');
      manager.markTriggered(webhook.id, true);

      const updated = manager.getWebhook(webhook.id);
      expect(updated.lastTriggeredAt).toBeDefined();
      expect(updated.failureCount).toBe(0);
    });

    it('should increment failure count on error', () => {
      const webhook = manager.addWebhook('https://example.com/webhook');
      manager.markTriggered(webhook.id, false);
      manager.markTriggered(webhook.id, false);

      const updated = manager.getWebhook(webhook.id);
      expect(updated.failureCount).toBe(2);
    });
  });

  describe('getWebhooksForEvent', () => {
    it('should return webhooks matching event type', () => {
      manager.addWebhook('https://example.com/webhook1', { events: ['insight.*'] });
      manager.addWebhook('https://example.com/webhook2', { events: ['insight.regression'] });
      manager.addWebhook('https://example.com/webhook3', { events: ['action.*'] });

      const results = manager.getWebhooksForEvent('insight.regression');
      expect(results).toHaveLength(2);
    });

    it('should include wildcard webhooks', () => {
      manager.addWebhook('https://example.com/webhook1', { events: ['*'] });
      manager.addWebhook('https://example.com/webhook2', { events: ['insight.*'] });

      const results = manager.getWebhooksForEvent('action.alert');
      expect(results.some((w) => w.events.includes('*'))).toBe(true);
    });

    it('should exclude inactive webhooks', () => {
      const w1 = manager.addWebhook('https://example.com/webhook1', { events: ['*'] });
      manager.updateWebhook(w1.id, { active: false });

      const results = manager.getWebhooksForEvent('insight.regression');
      expect(results).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return webhook statistics', () => {
      manager.addWebhook('https://example.com/webhook1');
      const w2 = manager.addWebhook('https://example.com/webhook2');

      manager.updateWebhook(w2.id, { active: false });
      manager.markTriggered(w2.id, false);

      const stats = manager.getStats();
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.inactive).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });

  describe('export and import', () => {
    it('should export and reimport webhooks', () => {
      manager.addWebhook('https://example.com/webhook1', { events: ['insight.*'] });
      manager.addWebhook('https://example.com/webhook2', { events: ['action.*'] });

      const exported = manager.export();
      expect(exported).toHaveLength(2);

      const newManager = new WebhookManager();
      newManager.import(exported);

      expect(newManager.listWebhooks()).toHaveLength(2);
    });
  });
});
