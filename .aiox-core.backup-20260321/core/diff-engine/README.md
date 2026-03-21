# Diff Engine — Repository Change Analysis

**Status:** Production Ready
**Tests:** 51 passing (100% coverage)
**Components:** 3 (DiffAnalyzer, ImpactCalculator, DiffReporter)

## Overview

The Diff Engine compares two repository analysis snapshots (from Story 2.1 Repo Analyzer) and generates structured impact assessments with recommendations. It powers the evolution tracking system to understand how repositories change over time.

## Architecture

```
repo-v1.json ─┐
              ├─→ DiffAnalyzer ──→ diff object
repo-v2.json ─┘
                    ↓
              ImpactCalculator ──→ impact assessment
                    ↓
              DiffReporter ──→ diff.json + DIFF-REPORT.md
```

### Three-Component Design

| Component | Purpose | Input | Output |
|-----------|---------|-------|--------|
| **DiffAnalyzer** | Compare snapshots | baseline, current | Structured diff |
| **ImpactCalculator** | Score severity | diff.changes | Assessment with score |
| **DiffReporter** | Format reports | diff, impact | JSON + Markdown |

## Usage

### Programmatic API

```javascript
const { DiffAnalyzer, ImpactCalculator, DiffReporter } = require('./diff-engine');
const fs = require('fs');

// Load analysis results
const baseline = JSON.parse(fs.readFileSync('repo-v1.json'));
const current = JSON.parse(fs.readFileSync('repo-v2.json'));

// Step 1: Analyze differences
const analyzer = new DiffAnalyzer();
const diff = await analyzer.compare(baseline, current);

// Step 2: Calculate impact
const calculator = new ImpactCalculator();
const impact = calculator.assess(diff);

// Step 3: Generate reports
const reporter = new DiffReporter();
const reports = await reporter.generate(diff, impact);

console.log(reports.reports.json);      // Machine-readable
console.log(reports.reports.markdown);  // Human-readable
```

### CLI Usage

```bash
# Compare two repository snapshots
aiox diff --baseline=/path/to/repo-v1.json --current=/path/to/repo-v2.json

# Generate JSON report
aiox diff --baseline=repo-v1.json --current=repo-v2.json --format=json

# Save reports to specific directory
aiox diff --baseline=repo-v1.json --current=repo-v2.json --output=/tmp

# Verbose progress output
aiox diff --baseline=repo-v1.json --current=repo-v2.json --verbose
```

### Help

```bash
aiox diff --help
```

## DiffAnalyzer

Compares two repo.json snapshots and detects all changes.

### Method: `compare(baseline, current)`

**Parameters:**
- `baseline` (Object): Previous repository analysis (repo.json)
- `current` (Object): Current repository analysis (repo.json)

**Returns:** Promise<Object> with structure:
```javascript
{
  baseline: { name, scannedAt },
  current: { name, scannedAt },
  changes: {
    metadata: { fileDelta, locDelta },
    languages: { added, removed, modified },
    dependencies: { added, removed, upgraded, downgraded },
    architecture: { changed, before, after, impact },
    metrics: { testCoverage, codeQuality, complexity, documentation }
  },
  timestamp: ISO8601
}
```

### Detection Features

**Languages:**
- ✅ Added languages (new file types)
- ✅ Removed languages (no more files)
- ✅ Modified languages (file/LOC changes)
- ✅ File and LOC deltas

**Dependencies:**
- ✅ Added packages
- ✅ Removed packages
- ✅ Upgraded versions
- ✅ Downgraded versions

**Architecture:**
- ✅ Pattern changes (Monolithic → Modular, etc.)
- ✅ Impact assessment (major/minor/none)
- ✅ Score tracking (before/after)

**Metrics:**
- ✅ Test coverage improvements/regressions
- ✅ Code quality changes
- ✅ Complexity tracking
- ✅ Documentation ratio changes

## ImpactCalculator

Scores change severity and generates recommendations.

### Method: `assess(diff)`

**Parameters:**
- `diff` (Object): Diff report from DiffAnalyzer

**Returns:** Object with:
```javascript
{
  overallScore: 0-10,
  severity: 'low' | 'moderate' | 'high' | 'critical',
  breaking: boolean,
  recommendations: ['string1', 'string2', ...],
  timestamp: ISO8601
}
```

### Scoring System

**Architecture Changes (0-3 points):**
- Major change (Monolithic ↔ Modular): 3 points + breaking flag
- Minor change: 1 point

**Dependency Changes (0-3 points):**
- Additions: 0.1 per package (low risk)
- Removals: 0.2 per package (moderate risk)
- Upgrades: 0.15 per package (higher risk)
- Recommendation triggers at 5+ upgrades

**Metrics Changes (0-2 points):**
- Test coverage regression: +1 point
- Code quality regression: +1 point
- Improvements praised (positive signal)

**Language Changes (0-2 points):**
- New languages: 0.1 per language (tooling required)
- Removed languages: 0.2 per language (deprecation warning)

**Total Score:** Sum of all categories, capped at 10

### Severity Levels

| Score | Severity | Action |
|-------|----------|--------|
| 0-3 | low | Monitor, no immediate action |
| 4-5 | moderate | Review before merge |
| 6-7 | high | Thorough testing required |
| 8-10 | critical | Architect review required |

### Breaking Changes

A change is marked as breaking when:
- Major architecture change detected
- Multiple significant upgrades required
- Test coverage drops significantly
- Critical dependencies removed

## DiffReporter

Generates human-readable and machine-readable reports.

### Method: `generate(diff, impact, options)`

**Parameters:**
- `diff` (Object): Diff report from DiffAnalyzer
- `impact` (Object): Impact assessment from ImpactCalculator
- `options` (Object): Optional output configuration

**Returns:** Promise<Object> with:
```javascript
{
  success: true,
  reports: {
    json: { ... },
    markdown: "# Diff Report\n..."
  },
  summary: {
    severity,
    breaking,
    overallScore,
    changeCount,
    timestamp
  }
}
```

### Report Formats

#### JSON Report (`diff.json`)

Machine-readable format for integration with other tools:
```json
{
  "metadata": {
    "baselineRepo": "repo-name",
    "baselineTime": "2024-01-01T00:00:00Z",
    "currentRepo": "repo-name",
    "currentTime": "2024-01-15T00:00:00Z",
    "generatedAt": "2024-01-15T12:00:00Z"
  },
  "impact": {
    "severity": "moderate",
    "score": 5,
    "breaking": false,
    "recommendations": ["..."]
  },
  "changes": {
    "languages": { "added": [...], "removed": [...] },
    "dependencies": { "added": [...], "upgraded": [...] },
    "architecture": { "changed": true, ... },
    "metrics": { "testCoverage": {...} }
  }
}
```

#### Markdown Report (`DIFF-REPORT.md`)

Human-readable summary with tables and recommendations:
- Header with severity and breaking indicator
- Repository comparison table
- Language changes table
- Dependency changes table
- Architecture changes section
- Metric changes section
- Recommendations list

## Integration Examples

### With Story 2.1 (Repo Analyzer)

Generate two snapshots:
```bash
# Capture baseline
aiox analyze --repo-path=/path/to/repo --output=/tmp --format=json

# Later, capture current state
aiox analyze --repo-path=/path/to/repo --output=/tmp --format=json

# Compare them
aiox diff --baseline=/tmp/repo-v1.json --current=/tmp/repo-v2.json
```

### With Story 2.3 (Decision Engine)

The diff output feeds into decision making:
```javascript
const decisions = await DecisionEngine.generate({
  baseline: repo1,
  current: repo2,
  diff: diffReport,
  impact: impactAssessment
});
```

## Testing

### Test Coverage

```
DiffAnalyzer:      15 tests
ImpactCalculator:  11 tests
DiffReporter:      20 tests
Integration:        5 tests
Total:            51 tests (100% passing)
```

### Running Tests

```bash
# All diff-engine tests
npm test -- .aiox-core/core/diff-engine/__tests__/

# Specific component
npm test -- .aiox-core/core/diff-engine/__tests__/diff-analyzer.test.js

# Watch mode
npm test -- --watch .aiox-core/core/diff-engine/__tests__/
```

### Test Scenarios

- Language additions, removals, modifications
- Dependency upgrades, downgrades, additions, removals
- Architecture pattern changes with impact levels
- Metric improvements and regressions
- No changes (identical snapshots)
- Major refactoring (multiple changes)
- Version tracking and comparison

## Output Examples

### CLI Output (Markdown)

```
✅ Diff analysis complete!

📊 Change Summary:
  - Severity:       MODERATE
  - Impact Score:   5/10
  - Breaking:       No
  - Total Changes:  4

  Languages: 1 change(s)
  Dependencies: 2 change(s)
  Metrics: Quality metrics changed

💡 Recommendations:
  - Test coverage regressed by 5% - add tests
  - Multiple dependency upgrades - test thoroughly

📄 Generated reports:
  - JSON:     /tmp/diff-repo-v1-to-repo-v2-2024-01-15.json
  - Markdown: /tmp/DIFF-REPORT-2024-01-15.md
```

### JSON Report Snippet

```json
{
  "impact": {
    "severity": "moderate",
    "score": 5,
    "breaking": false,
    "recommendations": [
      "Test coverage regressed by 5% - add tests",
      "Multiple dependency upgrades - test thoroughly"
    ]
  },
  "changes": {
    "languages": {
      "added": [
        {"language": "Go", "files": 2, "loc": 200}
      ]
    },
    "dependencies": {
      "upgraded": [
        {"name": "express", "from": "^4.17.0", "to": "^4.18.0"}
      ]
    }
  }
}
```

## Configuration

No external configuration required. The Diff Engine uses sensible defaults:
- Impact scoring thresholds
- Severity level boundaries
- Change detection rules

## Performance

- **Comparison speed:** < 100ms for typical repos
- **Report generation:** < 50ms
- **Memory usage:** < 5MB for most diffs
- **No external dependencies:** Zero npm dependencies

## Limitations & Future Enhancements

### Current Limitations
- Only compares JSON snapshots (requires Repo Analyzer)
- Version comparison uses simple numeric heuristics
- No semantic versioning analysis
- Architecture impact scored manually

### Planned Enhancements
- Semantic versioning comparison (semver)
- Custom scoring rules via configuration
- Historical trend analysis (3+ snapshots)
- Performance metrics tracking
- Integration with git history

## Related Documentation

- **Story 2.1:** [Repo Analyzer](../repo-analyzer/README.md)
- **Story 2.3:** Decision Engine (upcoming)
- **AIOX Constitution:** `.aiox-core/constitution.md`

## Troubleshooting

### "Both baseline and current analysis required"

Ensure both paths point to valid repo.json files from Story 2.1.

```bash
# Verify file format
cat /path/to/repo.json | jq '.repository'
```

### "Invalid diff format"

ImpactCalculator expects a diff object with `changes` property:

```javascript
const diff = await analyzer.compare(...);
const impact = calculator.assess(diff);  // ✅ Correct
// NOT: calculator.assess(diff.changes)  // ❌ Wrong
```

### No output files generated

Check output directory permissions:
```bash
ls -la /output/path
touch /output/path/test.txt
```

## Contributing

Changes to diff-engine must maintain:
- Zero npm dependencies
- 100% test coverage
- CLI-first design
- Backward-compatible output

Tests run automatically on commit via pre-commit hooks.

---

**Last Updated:** 2024 Q1
**Maintained By:** AIOX Development Team
**Story:** 2.2 (Diff Engine)
