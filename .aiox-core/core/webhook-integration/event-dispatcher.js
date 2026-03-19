'use strict';

const https = require('https');
const http = require('http');
const { EventSchema } = require('./event-schema');

/**
 * Event Dispatcher — Route and dispatch events to webhooks
 *
 * @class EventDispatcher
 * @version 1.0.0
 * @story 3.5
 */
class EventDispatcher {
  constructor(webhookManager) {
    this.webhookManager = webhookManager;
    this.pendingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Dispatch an event to matching webhooks
   * @param {Object} event - Event to dispatch
   * @param {Array} webhooks - Webhooks to send to
   * @returns {Object} Dispatch result with status
   */
  dispatch(event, webhooks) {
    try {
      EventSchema.validate(event);
    } catch (error) {
      return {
        status: 'error',
        message: `Invalid event: ${error.message}`,
        dispatched: [],
        failed: [],
      };
    }

    const matchingWebhooks = webhooks.filter((w) => this._shouldDispatch(event, w));

    if (matchingWebhooks.length === 0) {
      return {
        status: 'no_webhooks',
        message: 'No matching webhooks for event',
        dispatched: [],
        failed: [],
      };
    }

    const results = {
      status: 'ok',
      eventId: event.id,
      eventType: event.type,
      dispatched: [],
      failed: [],
    };

    for (const webhook of matchingWebhooks) {
      const result = this._sendWebhook(event, webhook);
      if (result.success) {
        results.dispatched.push({
          webhookId: webhook.id,
          status: 'sent',
          timestamp: new Date().toISOString(),
        });
        this.webhookManager.markTriggered(webhook.id, true);
      } else {
        results.failed.push({
          webhookId: webhook.id,
          status: 'failed',
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        this.webhookManager.markTriggered(webhook.id, false);
      }
    }

    return results;
  }

  /**
   * Queue an event for async dispatch
   * @param {Object} event - Event to queue
   * @param {Array} webhooks - Webhooks to send to
   * @returns {Object} Queue result
   */
  queue(event, webhooks) {
    try {
      EventSchema.validate(event);
    } catch (error) {
      return {
        status: 'error',
        message: `Invalid event: ${error.message}`,
      };
    }

    const matchingWebhooks = webhooks.filter((w) => this._shouldDispatch(event, w));

    if (matchingWebhooks.length === 0) {
      return {
        status: 'no_webhooks',
        queued: 0,
      };
    }

    for (const webhook of matchingWebhooks) {
      this.pendingQueue.push({
        event,
        webhook,
        retries: 0,
        maxRetries: webhook.retryAttempts,
      });
    }

    return {
      status: 'queued',
      queued: matchingWebhooks.length,
      queueLength: this.pendingQueue.length,
    };
  }

  /**
   * Process queued events (should be called periodically)
   * @returns {Object} Processing result
   */
  processQueue() {
    if (this.isProcessing || this.pendingQueue.length === 0) {
      return {
        status: 'ok',
        processed: 0,
        remaining: this.pendingQueue.length,
      };
    }

    this.isProcessing = true;
    let processed = 0;

    while (this.pendingQueue.length > 0) {
      const item = this.pendingQueue.shift();
      const result = this._sendWebhookWithRetry(item);

      if (result.success) {
        processed++;
        this.webhookManager.markTriggered(item.webhook.id, true);
      } else if (result.retryable && item.retries < item.maxRetries) {
        item.retries++;
        // Re-queue with delay
        setTimeout(() => {
          this.pendingQueue.push(item);
        }, Math.min(1000 * Math.pow(2, item.retries), 30000)); // Max 30s delay
      } else {
        this.webhookManager.markTriggered(item.webhook.id, false);
      }
    }

    this.isProcessing = false;
    return {
      status: 'ok',
      processed,
      remaining: this.pendingQueue.length,
    };
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue stats
   */
  getQueueStats() {
    return {
      queueLength: this.pendingQueue.length,
      isProcessing: this.isProcessing,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if event should be dispatched to webhook
   * @private
   */
  _shouldDispatch(event, webhook) {
    if (!webhook.active) {
      return false;
    }

    const baseType = event.type.split('.')[0];
    return (
      webhook.events.includes('*') ||
      webhook.events.includes(event.type) ||
      webhook.events.includes(`${baseType}.*`)
    );
  }

  /**
   * Send webhook request
   * @private
   */
  _sendWebhook(event, webhook) {
    return new Promise((resolve) => {
      const timeout = webhook.timeout || 5000;
      const url = new URL(webhook.url);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const payload = JSON.stringify(event);
      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'AIOX-WebhookDispatcher/1.0',
        'X-Webhook-Event': event.type,
        'X-Webhook-ID': event.id,
        ...webhook.headers,
      };

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: headers,
        timeout: timeout,
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const success = res.statusCode >= 200 && res.statusCode < 300;
          resolve({
            success,
            statusCode: res.statusCode,
            body,
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          retryable: true,
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          retryable: !error.code || error.code !== 'ENOTFOUND',
        });
      });

      req.write(payload);
      req.end();
    }).then((result) => result);
  }

  /**
   * Send webhook with retry logic
   * @private
   */
  _sendWebhookWithRetry(item) {
    const result = this._sendWebhook(item.event, item.webhook);
    if (!result.success) {
      return {
        success: false,
        retryable: result.retryable !== false,
      };
    }
    return {
      success: true,
      retryable: false,
    };
  }

  /**
   * Clear all queued events
   */
  clearQueue() {
    const cleared = this.pendingQueue.length;
    this.pendingQueue = [];
    return {
      status: 'ok',
      cleared,
    };
  }
}

module.exports = { EventDispatcher };
