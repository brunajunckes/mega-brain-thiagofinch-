'use strict';

const { ActionExecutor } = require('../action-executor');

describe('ActionExecutor', () => {
  it('should execute actions for insights', () => {
    const insights = [
      {
        type: 'regression',
        priority: 9,
        title: 'Test failure detected',
        description: 'Coverage dropped',
        action: 'alert_team',
      },
      {
        type: 'improvement',
        priority: 7,
        title: 'Quality improved',
        description: 'Health score increased',
        action: 'celebrate',
      },
    ];

    const result = ActionExecutor.executeActions(insights);

    expect(result.status).toBe('ok');
    expect(result.executed.length).toBeGreaterThan(0);
    expect(result.summary.queued).toBeGreaterThan(0);
  });

  it('should map insights to actions', () => {
    const actions = ActionExecutor.getAvailableActions();

    expect(actions.alert_team).toBeDefined();
    expect(actions.celebrate).toBeDefined();
    expect(actions.schedule_review).toBeDefined();
    expect(actions.create_task).toBeDefined();
  });

  it('should handle empty insights', () => {
    const result = ActionExecutor.executeActions([]);

    expect(result.status).toBe('no_actions');
    expect(result.executed.length).toBe(0);
  });
});
