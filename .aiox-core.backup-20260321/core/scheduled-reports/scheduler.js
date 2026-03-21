'use strict';

const { randomUUID } = require('crypto');

/**
 * Report Scheduler — Manage recurring report schedules using cron expressions
 *
 * @class ReportScheduler
 * @version 1.0.0
 * @story 3.6
 */
class ReportScheduler {
  constructor() {
    this.schedules = new Map();
  }

  /**
   * Add a new report schedule
   * @param {string} name - Schedule name
   * @param {string} cronExpr - Cron expression (5-field format)
   * @param {string} reportType - Report type (portfolio, trends, insights, compliance)
   * @param {Object} config - Report configuration
   * @returns {Object} Created schedule with ID
   * @throws {Error} if cron expression is invalid
   */
  addSchedule(name, cronExpr, reportType, config = {}) {
    this._validateCronExpr(cronExpr);
    this._validateReportType(reportType);

    const id = `sch_${randomUUID()}`;
    const schedule = {
      id,
      name,
      cronExpr,
      reportType,
      config,
      active: config.active !== false,
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      nextRunAt: this._calculateNextRun(cronExpr),
      failureCount: 0,
    };

    this.schedules.set(id, schedule);
    return schedule;
  }

  /**
   * Get a schedule by ID
   * @param {string} id - Schedule ID
   * @returns {Object|null} Schedule object or null if not found
   */
  getSchedule(id) {
    return this.schedules.get(id) || null;
  }

  /**
   * List all schedules
   * @param {Object} options - Filter options
   * @param {boolean} options.active - Filter by active status
   * @param {string} options.reportType - Filter by report type
   * @returns {Array} Array of schedules
   */
  listSchedules(options = {}) {
    let schedules = Array.from(this.schedules.values());

    if (options.active !== undefined) {
      schedules = schedules.filter((s) => s.active === options.active);
    }

    if (options.reportType) {
      schedules = schedules.filter((s) => s.reportType === options.reportType);
    }

    return schedules.sort((a, b) => new Date(a.nextRunAt) - new Date(b.nextRunAt));
  }

  /**
   * Update a schedule
   * @param {string} id - Schedule ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated schedule
   * @throws {Error} if schedule not found
   */
  updateSchedule(id, updates) {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    if (updates.name !== undefined) {
      schedule.name = updates.name;
    }

    if (updates.cronExpr) {
      this._validateCronExpr(updates.cronExpr);
      schedule.cronExpr = updates.cronExpr;
      schedule.nextRunAt = this._calculateNextRun(updates.cronExpr);
    }

    if (updates.reportType) {
      this._validateReportType(updates.reportType);
      schedule.reportType = updates.reportType;
    }

    if (updates.config !== undefined) {
      schedule.config = updates.config;
    }

    if (updates.active !== undefined) {
      schedule.active = updates.active;
    }

    schedule.updatedAt = new Date().toISOString();
    this.schedules.set(id, schedule);
    return schedule;
  }

  /**
   * Delete a schedule
   * @param {string} id - Schedule ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteSchedule(id) {
    return this.schedules.delete(id);
  }

  /**
   * Mark schedule as executed
   * @param {string} id - Schedule ID
   * @param {boolean} success - Whether execution was successful
   */
  markExecuted(id, success = true) {
    const schedule = this.schedules.get(id);
    if (schedule) {
      schedule.lastRunAt = new Date().toISOString();
      schedule.nextRunAt = this._calculateNextRun(schedule.cronExpr);
      if (!success) {
        schedule.failureCount = (schedule.failureCount || 0) + 1;
      } else {
        schedule.failureCount = 0;
      }
    }
  }

  /**
   * Get schedules due to run
   * @returns {Array} Array of schedules that should run now
   */
  getSchedulesDueNow() {
    const now = new Date();
    return this.listSchedules({ active: true }).filter((s) => {
      const nextRun = new Date(s.nextRunAt);
      return nextRun <= now;
    });
  }

  /**
   * Get statistics about schedules
   * @returns {Object} Statistics object
   */
  getStats() {
    const all = Array.from(this.schedules.values());
    const active = all.filter((s) => s.active);
    const failed = all.filter((s) => s.failureCount > 0);
    const dueSoon = all.filter((s) => {
      const diff = new Date(s.nextRunAt) - new Date();
      return diff > 0 && diff < 60000; // Due within 1 minute
    });

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      failed: failed.length,
      dueSoon: dueSoon.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate next run time from cron expression
   * @private
   */
  _calculateNextRun(cronExpr) {
    const now = new Date();
    return this._getNextCronTime(cronExpr, now);
  }

  /**
   * Parse and validate cron expression
   * @private
   */
  _validateCronExpr(cronExpr) {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error('Cron expression must have 5 fields: minute hour day month weekday');
    }

    const [minute, hour, day, month, weekday] = parts;

    // Basic validation
    const isValid =
      this._isValidField(minute, 0, 59, 0) &&
      this._isValidField(hour, 0, 23, 1) &&
      this._isValidField(day, 1, 31, 2) &&
      this._isValidField(month, 1, 12, 3) &&
      this._isValidField(weekday, 0, 6, 4);

    if (!isValid) {
      throw new Error('Invalid cron expression: check field ranges');
    }
  }

  /**
   * Validate cron field
   * @private
   */
  _isValidField(field, min, max, fieldIndex) {
    if (field === '*') return true;

    if (field === '?') return true; // Allowed in day or weekday

    // Support text names for day (MON-SUN) and month (JAN-DEC)
    if (fieldIndex === 4) {
      // Weekday field
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      if (dayNames.includes(field)) return true;
    }

    if (fieldIndex === 3) {
      // Month field
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      if (monthNames.includes(field)) return true;
    }

    if (field.includes('/')) {
      const [base, step] = field.split('/');
      if (!Number.isInteger(parseInt(step)) || parseInt(step) < 1) return false;
      if (base !== '*' && !Number.isInteger(parseInt(base))) return false;
      return true;
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-');
      const s = parseInt(start);
      const e = parseInt(end);
      return (
        Number.isInteger(s) &&
        Number.isInteger(e) &&
        s >= min &&
        e <= max &&
        s <= e
      );
    }

    if (field.includes(',')) {
      return field.split(',').every((f) => {
        const num = parseInt(f);
        return Number.isInteger(num) && num >= min && num <= max;
      });
    }

    const num = parseInt(field);
    return Number.isInteger(num) && num >= min && num <= max;
  }

  /**
   * Get next cron run time
   * @private
   */
  _getNextCronTime(cronExpr, startTime) {
    const [minute, hour, day, month, weekday] = cronExpr.split(/\s+/);

    let current = new Date(startTime);
    current.setSeconds(0);
    current.setMilliseconds(0);
    current.setMinutes(current.getMinutes() + 1); // Start from next minute

    // Simple implementation: check each minute up to 1 year ahead
    const maxChecks = 365 * 24 * 60;
    let checks = 0;

    while (checks < maxChecks) {
      if (this._matchesCron(current, minute, hour, day, month, weekday)) {
        return current.toISOString();
      }
      current.setMinutes(current.getMinutes() + 1);
      checks++;
    }

    // Fallback: return 1 day from now if no match found
    const fallback = new Date(startTime);
    fallback.setDate(fallback.getDate() + 1);
    return fallback.toISOString();
  }

  /**
   * Check if time matches cron expression
   * @private
   */
  _matchesCron(date, minute, hour, day, month, weekday) {
    const m = date.getMinutes();
    const h = date.getHours();
    const d = date.getDate();
    const mo = date.getMonth() + 1;
    const w = date.getDay();

    return (
      this._fieldMatches(minute, m, 0, 59) &&
      this._fieldMatches(hour, h, 0, 23) &&
      (this._fieldMatches(day, d, 1, 31) || this._fieldMatches(weekday, w, 0, 6)) &&
      this._fieldMatches(month, mo, 1, 12)
    );
  }

  /**
   * Check if value matches cron field
   * @private
   */
  _fieldMatches(field, value, min, max) {
    if (field === '*') return true;
    if (field === '?') return true;

    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const stepNum = parseInt(step);
      if (base === '*') {
        return value % stepNum === 0;
      }
      const baseNum = parseInt(base);
      return value >= baseNum && (value - baseNum) % stepNum === 0;
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-');
      const s = parseInt(start);
      const e = parseInt(end);
      return value >= s && value <= e;
    }

    if (field.includes(',')) {
      return field.split(',').some((f) => parseInt(f) === value);
    }

    return parseInt(field) === value;
  }

  /**
   * Validate report type
   * @private
   */
  _validateReportType(reportType) {
    const validTypes = ['portfolio', 'trends', 'insights', 'compliance', 'custom'];
    if (!validTypes.includes(reportType)) {
      throw new Error(`Invalid report type: ${reportType}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Export all schedules (for persistence)
   * @returns {Array} Array of schedules
   */
  export() {
    return Array.from(this.schedules.values());
  }

  /**
   * Import schedules (for loading from persistence)
   * @param {Array} schedules - Array of schedules to import
   */
  import(schedules) {
    this.schedules.clear();
    for (const schedule of schedules) {
      this.schedules.set(schedule.id, { ...schedule });
    }
  }
}

module.exports = { ReportScheduler };
