'use strict';

const { randomUUID } = require('crypto');

/**
 * Webhook Manager — CRUD operations for webhook configurations
 *
 * @class WebhookManager
 * @version 1.0.0
 * @story 3.5
 */
class WebhookManager {
  constructor() {
    this.webhooks = new Map();
  }

  /**
   * Add a new webhook
   * @param {string} url - Webhook URL
   * @param {Object} config - Configuration object
   * @param {string[]} config.events - Event types to subscribe to
   * @param {string} config.name - Human-readable name
   * @param {Object} config.headers - Custom headers
   * @param {number} config.timeout - Request timeout in ms
   * @returns {Object} Created webhook with ID
   * @throws {Error} if URL is invalid or config is incomplete
   */
  addWebhook(url, config = {}) {
    this._validateUrl(url);
    this._validateConfig(config);

    const id = `wh_${randomUUID()}`;
    const webhook = {
      id,
      url,
      name: config.name || `Webhook ${id.substring(0, 8)}`,
      events: config.events || ['*'],
      headers: config.headers || {},
      timeout: config.timeout || 5000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      active: config.active !== false,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      failureCount: 0,
    };

    this.webhooks.set(id, webhook);
    return webhook;
  }

  /**
   * Get a webhook by ID
   * @param {string} id - Webhook ID
   * @returns {Object|null} Webhook object or null if not found
   */
  getWebhook(id) {
    return this.webhooks.get(id) || null;
  }

  /**
   * List all webhooks
   * @param {Object} options - Filter options
   * @param {boolean} options.active - Filter by active status
   * @param {string} options.event - Filter by event type
   * @returns {Array} Array of webhooks
   */
  listWebhooks(options = {}) {
    let webhooks = Array.from(this.webhooks.values());

    if (options.active !== undefined) {
      webhooks = webhooks.filter((w) => w.active === options.active);
    }

    if (options.event) {
      const baseType = options.event.split('.')[0];
      webhooks = webhooks.filter((w) => {
        return (
          w.events.includes('*') ||
          w.events.includes(options.event) ||
          w.events.includes(`${baseType}.*`)
        );
      });
    }

    return webhooks;
  }

  /**
   * Update a webhook configuration
   * @param {string} id - Webhook ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated webhook
   * @throws {Error} if webhook not found
   */
  updateWebhook(id, updates) {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      throw new Error(`Webhook not found: ${id}`);
    }

    if (updates.url) {
      this._validateUrl(updates.url);
      webhook.url = updates.url;
    }

    if (updates.name !== undefined) {
      webhook.name = updates.name;
    }

    if (updates.events) {
      this._validateEvents(updates.events);
      webhook.events = updates.events;
    }

    if (updates.headers) {
      webhook.headers = updates.headers;
    }

    if (updates.timeout !== undefined) {
      webhook.timeout = Math.max(1000, updates.timeout);
    }

    if (updates.retryAttempts !== undefined) {
      webhook.retryAttempts = Math.max(0, updates.retryAttempts);
    }

    if (updates.active !== undefined) {
      webhook.active = updates.active;
    }

    webhook.updatedAt = new Date().toISOString();
    this.webhooks.set(id, webhook);
    return webhook;
  }

  /**
   * Delete a webhook
   * @param {string} id - Webhook ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteWebhook(id) {
    return this.webhooks.delete(id);
  }

  /**
   * Mark webhook as triggered (update last triggered time)
   * @param {string} id - Webhook ID
   * @param {boolean} success - Whether dispatch was successful
   */
  markTriggered(id, success = true) {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      webhook.lastTriggeredAt = new Date().toISOString();
      if (!success) {
        webhook.failureCount = (webhook.failureCount || 0) + 1;
      } else {
        webhook.failureCount = 0;
      }
    }
  }

  /**
   * Get webhooks that match an event type
   * @param {string} eventType - Event type (e.g., 'insight.regression')
   * @returns {Array} Matching active webhooks
   */
  getWebhooksForEvent(eventType) {
    const baseType = eventType.split('.')[0]; // e.g., 'insight' from 'insight.regression'
    const patternType = `${baseType}.*`; // e.g., 'insight.*'

    return this.listWebhooks({ active: true }).filter((w) => {
      return (
        w.events.includes('*') ||
        w.events.includes(eventType) ||
        w.events.includes(patternType) ||
        w.events.includes(baseType)
      );
    });
  }

  /**
   * Get statistics about webhooks
   * @returns {Object} Statistics object
   */
  getStats() {
    const all = Array.from(this.webhooks.values());
    const active = all.filter((w) => w.active);
    const failed = all.filter((w) => w.failureCount > 0);

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      failed: failed.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Validate webhook URL format
   * @private
   */
  _validateUrl(url) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      throw new Error(`Invalid webhook URL: ${error.message}`);
    }
  }

  /**
   * Validate event array
   * @private
   */
  _validateEvents(events) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('Events must be non-empty array');
    }

    const validPrefixes = ['insight', 'action', 'health', '*'];
    for (const event of events) {
      if (typeof event !== 'string' || (event !== '*' && !validPrefixes.some((p) => event.startsWith(p)))) {
        throw new Error(`Invalid event type: ${event}`);
      }
    }
  }

  /**
   * Validate configuration object
   * @private
   */
  _validateConfig(config) {
    if (config.events !== undefined) {
      this._validateEvents(config.events);
    }

    if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout < 1000)) {
      throw new Error('Timeout must be at least 1000ms');
    }

    if (config.retryAttempts !== undefined && (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0)) {
      throw new Error('retryAttempts must be non-negative number');
    }
  }

  /**
   * Export all webhooks (for persistence)
   * @returns {Array} Array of webhooks
   */
  export() {
    return Array.from(this.webhooks.values());
  }

  /**
   * Import webhooks (for loading from persistence)
   * @param {Array} webhooks - Array of webhooks to import
   */
  import(webhooks) {
    this.webhooks.clear();
    for (const webhook of webhooks) {
      this.webhooks.set(webhook.id, { ...webhook });
    }
  }
}

module.exports = { WebhookManager };
