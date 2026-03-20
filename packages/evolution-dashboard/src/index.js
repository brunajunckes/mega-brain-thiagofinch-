'use strict';

/**
 * Evolution Dashboard — Real-time Evolution Tracking
 *
 * @module evolution-dashboard
 * @version 1.0.0
 * @story 2.4
 */

const TimelineManager = require('./timeline-manager');
const MetricsAggregator = require('./metrics-aggregator');
const DashboardCLI = require('./dashboard-cli');

module.exports = {
  TimelineManager,
  MetricsAggregator,
  DashboardCLI,
};
