'use strict';

const { ReportScheduler } = require('../../../.aiox-core/core/scheduled-reports');

describe('ReportScheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new ReportScheduler();
  });

  describe('addSchedule', () => {
    it('should add a schedule with valid cron expression', () => {
      const schedule = scheduler.addSchedule('Daily Report', '0 9 * * *', 'portfolio');

      expect(schedule.id).toBeDefined();
      expect(schedule.name).toBe('Daily Report');
      expect(schedule.cronExpr).toBe('0 9 * * *');
      expect(schedule.reportType).toBe('portfolio');
      expect(schedule.active).toBe(true);
    });

    it('should reject invalid cron expression', () => {
      expect(() => {
        scheduler.addSchedule('Invalid', 'invalid', 'portfolio');
      }).toThrow();
    });

    it('should reject invalid report type', () => {
      expect(() => {
        scheduler.addSchedule('Test', '0 9 * * *', 'invalid-type');
      }).toThrow();
    });

    it('should calculate next run time', () => {
      const schedule = scheduler.addSchedule('Test', '0 9 * * *', 'portfolio');

      expect(schedule.nextRunAt).toBeDefined();
      const nextRun = new Date(schedule.nextRunAt);
      expect(nextRun.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getSchedule', () => {
    it('should return schedule by ID', () => {
      const added = scheduler.addSchedule('Test', '0 9 * * *', 'portfolio');
      const retrieved = scheduler.getSchedule(added.id);

      expect(retrieved).toEqual(added);
    });

    it('should return null for nonexistent ID', () => {
      expect(scheduler.getSchedule('nonexistent')).toBeNull();
    });
  });

  describe('listSchedules', () => {
    it('should list all schedules', () => {
      scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      scheduler.addSchedule('Weekly', '0 0 * * MON', 'trends');

      expect(scheduler.listSchedules()).toHaveLength(2);
    });

    it('should filter by active status', () => {
      const s1 = scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      scheduler.addSchedule('Weekly', '0 0 * * MON', 'trends');

      scheduler.updateSchedule(s1.id, { active: false });

      expect(scheduler.listSchedules({ active: true })).toHaveLength(1);
      expect(scheduler.listSchedules({ active: false })).toHaveLength(1);
    });

    it('should filter by report type', () => {
      scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      scheduler.addSchedule('Weekly', '0 0 * * MON', 'trends');

      expect(scheduler.listSchedules({ reportType: 'portfolio' })).toHaveLength(1);
      expect(scheduler.listSchedules({ reportType: 'trends' })).toHaveLength(1);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule name', () => {
      const schedule = scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      const updated = scheduler.updateSchedule(schedule.id, { name: 'Updated Daily' });

      expect(updated.name).toBe('Updated Daily');
    });

    it('should update cron expression', () => {
      const schedule = scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      const updated = scheduler.updateSchedule(schedule.id, { cronExpr: '0 10 * * *' });

      expect(updated.cronExpr).toBe('0 10 * * *');
    });

    it('should throw for nonexistent schedule', () => {
      expect(() => {
        scheduler.updateSchedule('nonexistent', { name: 'Test' });
      }).toThrow();
    });
  });

  describe('deleteSchedule', () => {
    it('should delete schedule', () => {
      const schedule = scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      const deleted = scheduler.deleteSchedule(schedule.id);

      expect(deleted).toBe(true);
      expect(scheduler.getSchedule(schedule.id)).toBeNull();
    });

    it('should return false for nonexistent schedule', () => {
      expect(scheduler.deleteSchedule('nonexistent')).toBe(false);
    });
  });

  describe('markExecuted', () => {
    it('should update last run time on success', () => {
      const schedule = scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      scheduler.markExecuted(schedule.id, true);

      const updated = scheduler.getSchedule(schedule.id);
      expect(updated.lastRunAt).toBeDefined();
      expect(updated.failureCount).toBe(0);
    });

    it('should increment failure count on error', () => {
      const schedule = scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      scheduler.markExecuted(schedule.id, false);
      scheduler.markExecuted(schedule.id, false);

      const updated = scheduler.getSchedule(schedule.id);
      expect(updated.failureCount).toBe(2);
    });
  });

  describe('getSchedulesDueNow', () => {
    it('should return no schedules when none are due', () => {
      scheduler.addSchedule('Tomorrow', '0 9 * * *', 'portfolio');

      const due = scheduler.getSchedulesDueNow();
      expect(due).toHaveLength(0);
    });

    it('should exclude inactive schedules', () => {
      const s = scheduler.addSchedule('Daily', '0 * * * *', 'portfolio');
      scheduler.updateSchedule(s.id, { active: false });

      const due = scheduler.getSchedulesDueNow();
      expect(due.every((s) => s.active)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return schedule statistics', () => {
      scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      const s2 = scheduler.addSchedule('Weekly', '0 0 * * MON', 'trends');

      scheduler.updateSchedule(s2.id, { active: false });
      scheduler.markExecuted(s2.id, false);

      const stats = scheduler.getStats();
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.inactive).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });

  describe('Cron expression validation', () => {
    it('should accept valid 5-field cron expressions', () => {
      const validExpressions = [
        '0 9 * * *',        // 9am daily
        '0 0 * * 0',        // Sunday midnight
        '*/15 * * * *',     // Every 15 minutes
        '0 */6 * * *',      // Every 6 hours
        '0 0 1 * *',        // 1st of month
        '0 0 * * MON',      // Monday (text)
      ];

      for (const expr of validExpressions) {
        expect(() => {
          scheduler.addSchedule('Test', expr, 'portfolio');
        }).not.toThrow();
      }
    });

    it('should reject invalid cron expressions', () => {
      const invalidExpressions = [
        '0 25 * * *',       // Invalid hour
        '0 0 32 * *',       // Invalid day
        '0 0 * 13 *',       // Invalid month
        '60 0 * * *',       // Invalid minute
        '0 0',              // Too few fields
        '0 0 * * * * *',    // Too many fields
      ];

      for (const expr of invalidExpressions) {
        expect(() => {
          scheduler.addSchedule('Test', expr, 'portfolio');
        }).toThrow();
      }
    });
  });

  describe('export and import', () => {
    it('should export and reimport schedules', () => {
      scheduler.addSchedule('Daily', '0 9 * * *', 'portfolio');
      scheduler.addSchedule('Weekly', '0 0 * * MON', 'trends');

      const exported = scheduler.export();
      expect(exported).toHaveLength(2);

      const newScheduler = new ReportScheduler();
      newScheduler.import(exported);

      expect(newScheduler.listSchedules()).toHaveLength(2);
    });
  });
});
