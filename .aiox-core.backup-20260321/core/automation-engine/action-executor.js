'use strict';

/**
 * Action Executor — Executes automated actions based on insights
 *
 * @class ActionExecutor
 * @version 1.0.0
 * @story 3.4
 */
class ActionExecutor {
  /**
   * Execute actions for insights
   * @param {Array} insights Generated insights
   * @returns {Object} Execution results
   */
  static executeActions(insights) {
    if (!insights || insights.length === 0) {
      return { status: 'no_actions', executed: [] };
    }

    const executed = [];

    for (const insight of insights) {
      const action = this._mapInsightToAction(insight);
      if (action) {
        executed.push({
          insight: insight.title,
          action: action.name,
          status: 'queued',
          priority: insight.priority,
          description: action.description,
        });
      }
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      executed: executed.sort((a, b) => b.priority - a.priority),
      summary: {
        total: executed.length,
        queued: executed.filter((a) => a.status === 'queued').length,
      },
    };
  }

  /**
   * Map insight to automated action
   * @private
   */
  static _mapInsightToAction(insight) {
    const actions = {
      regression: {
        name: 'alert_team',
        description: 'Send alert to team about regression',
      },
      improvement: {
        name: 'celebrate',
        description: 'Log improvement milestone',
      },
      outlier: {
        name: 'schedule_review',
        description: 'Schedule architecture review',
      },
      recommendation: {
        name: 'create_task',
        description: 'Create improvement task',
      },
    };

    return actions[insight.type] || null;
  }

  /**
   * Get available actions
   */
  static getAvailableActions() {
    return {
      'alert_team': {
        description: 'Send Slack/email alert',
        config: { channels: [], severity: 'high' },
      },
      'celebrate': {
        description: 'Log achievement',
        config: { notify: true },
      },
      'schedule_review': {
        description: 'Schedule team meeting',
        config: { duration: 60, invitees: [] },
      },
      'create_task': {
        description: 'Create Jira/GitHub task',
        config: { project: '', priority: 'medium' },
      },
    };
  }
}

module.exports = { ActionExecutor };
