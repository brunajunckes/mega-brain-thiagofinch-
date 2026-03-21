'use strict';

const { randomUUID } = require('crypto');

/**
 * Event Schema — Standardized event payload definitions
 *
 * @class EventSchema
 * @version 1.0.0
 * @story 3.5
 */
class EventSchema {
  /**
   * Create an insight event from insight data
   * @param {Object} insight - Insight object from Analytics Engine
   * @returns {Object} Standardized event payload
   */
  static createInsightEvent(insight) {
    return {
      id: `evt_${randomUUID()}`,
      timestamp: new Date().toISOString(),
      type: `insight.${insight.type}`,
      priority: insight.priority,
      repository: insight.repository || 'unknown',
      data: {
        title: insight.title,
        description: insight.description,
        action: insight.action,
        metrics: insight.metrics || {},
      },
    };
  }

  /**
   * Create an action event from action data
   * @param {Object} action - Action object from Action Executor
   * @param {string} status - Action status (queued, executing, completed, failed)
   * @returns {Object} Standardized event payload
   */
  static createActionEvent(action, status = 'queued') {
    return {
      id: `evt_${randomUUID()}`,
      timestamp: new Date().toISOString(),
      type: `action.${action.action}`,
      priority: action.priority,
      repository: action.repository || 'unknown',
      data: {
        insight: action.insight,
        action: action.action,
        status: status,
        description: action.description,
        result: action.result || null,
      },
    };
  }

  /**
   * Create a health event for repository health changes
   * @param {Object} health - Health data
   * @returns {Object} Standardized event payload
   */
  static createHealthEvent(health) {
    return {
      id: `evt_${randomUUID()}`,
      timestamp: new Date().toISOString(),
      type: 'health.status',
      priority: this._calculateHealthPriority(health.score),
      repository: health.repository,
      data: {
        score: health.score,
        previousScore: health.previousScore,
        trend: health.trend, // up, down, stable
        changes: health.changes || {},
      },
    };
  }

  /**
   * Create a dashboard event for metric changes
   * @param {Object} metrics - Metrics data
   * @returns {Object} Standardized event payload
   */
  static createDashboardEvent(metrics) {
    return {
      id: `evt_${randomUUID()}`,
      timestamp: new Date().toISOString(),
      type: 'dashboard.update',
      priority: 5,
      repository: metrics.repository,
      data: {
        metrics: metrics.data || {},
        timestamp: metrics.timestamp,
      },
    };
  }

  /**
   * Create a custom event
   * @param {string} type - Event type
   * @param {number} priority - Priority (1-10)
   * @param {string} repository - Repository name
   * @param {Object} data - Event data
   * @returns {Object} Standardized event payload
   */
  static createCustomEvent(type, priority, repository, data) {
    return {
      id: `evt_${randomUUID()}`,
      timestamp: new Date().toISOString(),
      type: type,
      priority: Math.max(1, Math.min(10, priority)),
      repository: repository,
      data: data,
    };
  }

  /**
   * Validate an event payload
   * @param {Object} event - Event to validate
   * @returns {boolean} True if valid
   * @throws {Error} if invalid
   */
  static validate(event) {
    if (!event || typeof event !== 'object') {
      throw new Error('Event must be an object');
    }

    if (!event.id || typeof event.id !== 'string') {
      throw new Error('Event must have an id');
    }

    if (!event.timestamp || typeof event.timestamp !== 'string') {
      throw new Error('Event must have a timestamp');
    }

    if (!event.type || typeof event.type !== 'string') {
      throw new Error('Event must have a type');
    }

    if (event.priority && (typeof event.priority !== 'number' || event.priority < 1 || event.priority > 10)) {
      throw new Error('Priority must be between 1 and 10');
    }

    if (!event.data || typeof event.data !== 'object') {
      throw new Error('Event must have data object');
    }

    return true;
  }

  /**
   * Filter events by type
   * @param {Array} events - Events to filter
   * @param {string} type - Type to filter for (supports wildcards)
   * @returns {Array} Filtered events
   */
  static filterByType(events, type) {
    if (type === '*' || type === '*.*') {
      return events;
    }

    if (type.endsWith('.*')) {
      const prefix = type.split('.')[0];
      return events.filter((e) => e.type.startsWith(prefix));
    }

    return events.filter((e) => e.type === type);
  }

  /**
   * Filter events by priority
   * @param {Array} events - Events to filter
   * @param {number} minPriority - Minimum priority
   * @returns {Array} Filtered events
   */
  static filterByPriority(events, minPriority) {
    return events.filter((e) => e.priority >= minPriority);
  }

  /**
   * Filter events by repository
   * @param {Array} events - Events to filter
   * @param {string|Array} repositories - Repository name or array of names
   * @returns {Array} Filtered events
   */
  static filterByRepository(events, repositories) {
    const repos = Array.isArray(repositories) ? repositories : [repositories];
    return events.filter((e) => repos.includes(e.repository));
  }

  /**
   * Get all valid event types
   * @returns {Array} Array of valid event type prefixes
   */
  static getValidTypes() {
    return ['insight', 'action', 'health', 'dashboard', '*'];
  }

  /**
   * Calculate priority based on health score
   * @private
   */
  static _calculateHealthPriority(score) {
    if (score >= 8) return 3; // Low priority - healthy
    if (score >= 5) return 6; // Medium priority
    return 9; // High priority - unhealthy
  }
}

module.exports = { EventSchema };
