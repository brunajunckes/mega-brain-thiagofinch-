# Evolution Dashboard

Real-time repository evolution tracking and trend analysis dashboard.

**Part of Story 2.4: Evolution Dashboard** — Visualizes health trends, debt changes, and coverage improvements from Stories 2.1-2.3.

## Features

### 1. TimelineManager
Stores and manages historical repository snapshots:
- Store snapshots with timestamps
- Query historical data
- Calculate deltas between snapshots
- Analyze metric trends
- Compare time periods

### 2. MetricsAggregator
Aggregates and analyzes metrics over time:
- Health score trends (1-10 scale)
- Test coverage improvements
- Technical debt tracking
- Trend velocity calculation
- Future prediction (linear regression)
- Comparative period analysis

### 3. DashboardCLI
Displays formatted dashboards with ASCII charts:
- Health score trends
- Coverage improvements
- Debt level changes
- Actionable recommendations
- Trend predictions
- Period comparisons

## Installation

```bash
npm install
```

## Usage

### Programmatic

```javascript
const { TimelineManager, MetricsAggregator, DashboardCLI } = require('@aiox-fullstack/core/evolution-dashboard');

// Create managers
const timeline = new TimelineManager({ storageDir: './.evolution-timeline' });
const aggregator = new MetricsAggregator(timeline);
const cli = new DashboardCLI(aggregator);

// Store snapshot
const snapshotId = timeline.storeSnapshot('my-app', {
  healthScore: 7.5,
  stats: { totalFiles: 150, totalLines: 15000 },
  metrics: { testCoverage: 75, codeQuality: 8 },
  debtLevel: 'low',
});

// Display dashboard
cli.displayDashboard('my-app');

// Get health trends
const trends = aggregator.getHealthTrends('my-app', 30);
console.log(trends);

// Predict future health
const prediction = aggregator.predictHealthScore('my-app', 30);
console.log(prediction);
```

### CLI Usage

```bash
# Display dashboard
npx aiox dashboard show <repo-name>

# Display health chart
npx aiox dashboard health <repo-name> --days 30

# Display coverage chart
npx aiox dashboard coverage <repo-name> --days 30

# Display trend report
npx aiox dashboard trends <repo-name>

# Export trend data
npx aiox dashboard export <repo-name> --format json
```

## Data Flow

```
Snapshots (from Story 2.1/2.2/2.3)
    ↓
TimelineManager.storeSnapshot()
    ↓
JSON files in .evolution-timeline/
    ↓
MetricsAggregator (analyze trends)
    ↓
DashboardCLI (format & display)
    ↓
Dashboard output + predictions
```

## Output Format

```
╔════════════════════════════════════════════════════════════╗
║    Evolution Dashboard — Repository Health Overview        ║
╚════════════════════════════════════════════════════════════╝

Overall Status: ✅ GOOD

Health Score: 7.5/10 [████████████░░░░░░░░]
  Direction: 📈 improving
  Change: +5%

Test Coverage: 75% [███████████░░░░░░░░░]
  Improvement: +10%

Technical Debt: 🟢 LOW
  Status: ✅ Improving

📋 Recommendations:
  1. [HIGH] Improve test coverage
     → Target 80%, currently 75%
  2. [MEDIUM] Add API documentation
     → Document all public endpoints

Updated: 3/20/2026, 4:48 PM
```

## API Reference

### TimelineManager

#### `storeSnapshot(repoName, snapshot)`
Store a repository snapshot with automatic timestamp.
- **Parameters:** repoName (string), snapshot (object)
- **Returns:** snapshotId (string)

#### `getSnapshot(snapshotId)`
Retrieve a snapshot by ID.
- **Parameters:** snapshotId (string)
- **Returns:** snapshot data (object)

#### `getTimeline(repoName, options)`
Get all snapshots for a repository.
- **Parameters:** repoName (string), options (object)
  - limit: max snapshots (default: 100)
  - order: 'asc' or 'desc' (default: 'desc')
- **Returns:** array of snapshots

#### `calculateDelta(snapshotId1, snapshotId2)`
Calculate metrics change between snapshots.
- **Returns:** delta object with changes

#### `getMetricTrend(repoName, metricName, days)`
Get specific metric trend over time.
- **Returns:** array of { timestamp, value }

#### `analyzeTrend(trend)`
Analyze trend direction and velocity.
- **Returns:** { direction, velocity, totalDelta, dataPoints }

### MetricsAggregator

#### `getHealthTrends(repoName, days)`
Get health score trends over time.
- **Returns:** trends with analysis and current value

#### `getCoverageTrends(repoName, days)`
Get test coverage trends.
- **Returns:** coverage trends and improvements

#### `getDebtTrends(repoName, days)`
Get technical debt level trends.
- **Returns:** debt trends and transitions

#### `getHealthReport(repoName)`
Get comprehensive health report.
- **Returns:** detailed report with recommendations

#### `predictHealthScore(repoName, daysAhead)`
Predict future health score.
- **Returns:** { prediction, confidence, trend }

### DashboardCLI

#### `displayDashboard(repoName)`
Display full dashboard overview.

#### `displayHealthChart(repoName, days)`
Display health trend chart.

#### `displayCoverageChart(repoName, days)`
Display coverage trend chart.

#### `displayTrendReport(repoName)`
Display trend analysis and predictions.

## Testing

```bash
# Run all tests
npm test

# Run dashboard tests
npm test -- packages/evolution-dashboard

# Run with coverage
npm test -- packages/evolution-dashboard --coverage
```

## Performance

- **Snapshot Storage:** < 10ms per snapshot
- **Trend Analysis:** < 50ms for 100 snapshots
- **Dashboard Rendering:** < 20ms
- **Prediction:** < 100ms

## Storage

Snapshots stored in `.evolution-timeline/` directory:
- One JSON file per snapshot
- Automatic timestamp and ID
- Pruning available for old snapshots (90-day default)

## Integration with Evolution Engine

**Story 2.4 depends on:**
- Story 2.1 (Repo Analyzer) — generates repo.json
- Story 2.2 (Diff Engine) — generates diff.json
- Story 2.3 (Decision Engine) — generates recommendations

**Feeds into:**
- Story 3.1+ (Advanced evolution features)
- Analytics and reporting systems

## Architecture Decisions

### No External Dependencies
- Uses Node.js stdlib only (fs, path)
- Fast and lightweight
- Can be embedded in other tools

### JSON Storage
- Simple file-based storage
- No database required
- Easy backup and version control

### Linear Prediction
- Simple linear regression for prediction
- Calculates R-squared for confidence
- Works well for short-term predictions (7-30 days)

## Troubleshooting

### No data displayed?
- Ensure snapshots are stored using `storeSnapshot()`
- Check storage directory exists
- Verify repository name matches

### Predictions inaccurate?
- Need at least 3 snapshots for prediction
- More data = more accurate predictions
- Confidence score shows reliability

### Performance issues?
- Use `getTimeline()` with limit parameter
- Prune old snapshots with `pruneOldSnapshots()`
- Reduce days analyzed in trends

## Contributing

To add new metrics:
1. Update metric extraction in TimelineManager
2. Add aggregation in MetricsAggregator
3. Add visualization in DashboardCLI
4. Update tests

## License

Part of Synkra AIOX — MIT License

## Story References

- **Story 2.1:** Repo Analyzer — Generates repo.json input
- **Story 2.2:** Diff Engine — Generates diff.json input
- **Story 2.3:** Decision Engine — Generates recommendations
- **Story 2.4:** Evolution Dashboard (this module)

---

**Evolution Dashboard v1.0**
*Real-time repository evolution tracking*
*Story 2.4: Phases 1-3 Complete*
