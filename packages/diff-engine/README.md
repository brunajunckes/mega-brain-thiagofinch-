# Diff Engine — Repository Change Analysis

Analyzes changes between two repository snapshots (`repo.json` files) and generates comprehensive change reports. Foundation for the Decision Engine (Story 2.3).

## Features

- **Structured Diff Analysis** — Compare two repo.json files and detect all changes
- **Impact Assessment** — Score changes 1-10 based on architecture, dependencies, and metrics
- **Multi-Format Reports** — JSON, Markdown, and impact assessment outputs
- **CLI Integration** — Command-line tool for quick analysis
- **Recommendation System** — Actionable suggestions prioritized by severity

## Installation

```bash
npm install @aiox/diff-engine
```

## Usage

### CLI

```bash
# Analyze differences between two repository snapshots
aiox diff --baseline baseline.json --current current.json

# With options
aiox diff --baseline baseline.json --current current.json \
  --output /tmp \
  --format markdown \
  --verbose
```

**Options:**
- `--baseline, -b <path>` — Baseline repo.json file (required)
- `--current, -c <path>` — Current repo.json file (required)
- `--output, -o <path>` — Output directory (default: current directory)
- `--format, -f <format>` — Report format: markdown, json (default: markdown)
- `--verbose, -v` — Show detailed progress

### Programmatic API

```javascript
const { DiffAnalyzer, ImpactCalculator, DiffReporter } = require('@aiox/diff-engine');
const fs = require('fs-extra');

// Load repository snapshots
const baseline = await fs.readJson('baseline.json');
const current = await fs.readJson('current.json');

// Phase 1: Analyze differences
const analyzer = new DiffAnalyzer({ verbose: true });
const diff = await analyzer.generateDiff(baseline, current);

// Phase 2: Calculate impact
const calculator = new ImpactCalculator({ verbose: true });
const impact = calculator.calculateImpact(diff);

// Phase 3: Generate reports
const reporter = new DiffReporter({ outputPath: '/tmp', verbose: true });
const reports = await reporter.generateReports(diff, impact);

console.log(`Overall Impact Score: ${impact.overallScore}/10`);
console.log(`Severity: ${impact.severity}`);
console.log(`Breaking Changes: ${impact.breaking ? 'YES' : 'NO'}`);
```

## Output Formats

### JSON Report (`diff.json`)

Machine-readable structured diff with all changes:

```json
{
  "baseline": {
    "repository": "my-app",
    "timestamp": "2026-02-01",
    "files": 100,
    "loc": 5000
  },
  "current": {
    "repository": "my-app",
    "timestamp": "2026-03-20",
    "files": 120,
    "loc": 6500
  },
  "changes": {
    "metadata": {
      "fileChange": 20,
      "locChange": 1500,
      "languagesCount": { "before": 2, "after": 3, "change": 1 }
    },
    "languages": {
      "added": [
        { "language": "Go", "files": 20, "loc": 1500, "percentage": 23 }
      ],
      "removed": [
        { "language": "Python", "files": 20, "loc": 1000 }
      ],
      "modified": [
        {
          "language": "JavaScript",
          "before": { "files": 80, "loc": 4000, "percentage": 80 },
          "after": { "files": 100, "loc": 5000, "percentage": 75 },
          "fileChange": 20,
          "locChange": 1000
        }
      ]
    },
    "dependencies": {
      "production": {
        "added": ["axios@0.27.0"],
        "removed": [],
        "upgraded": [
          { "name": "express", "from": "express@4.17.0", "to": "express@4.18.0" }
        ]
      },
      "total": { "before": 10, "after": 11, "change": 1 }
    },
    "architecture": {
      "before": { "name": "Monolithic", "confidence": 0.7 },
      "after": { "name": "Modular", "confidence": 0.8 },
      "changed": true,
      "change": { "from": "Monolithic", "to": "Modular" }
    },
    "metrics": {
      "testCoverage": {
        "before": 65,
        "after": 82,
        "change": 17,
        "status": "improved"
      },
      "codeQuality": {
        "before": 6,
        "after": 8,
        "change": 2,
        "status": "improved"
      }
    }
  }
}
```

### Markdown Report (`DIFF-REPORT.md`)

Human-readable summary:

```markdown
# Repository Change Report

**Baseline:** 2026-02-01 | **Current:** 2026-03-20
**Repository:** my-app | **Files:** 100 → 120 | **LOC:** 5,000 → 6,500

---

## Summary

Repository evolved from **Monolithic** to **Modular** architecture with significant language adoption.

---

## Changes by Category

### 🏗️ Architecture

- ✅ Pattern: Monolithic → Modular
- Confidence increased: 0.7 → 0.8

### 🌐 Languages

- ➕ Added: Go (20 files, 1,500 LOC, 23%)
- ➖ Removed: Python (20 files, 1,000 LOC)
- 📈 JavaScript: 80 → 100 files (+25%), 4,000 → 5,000 LOC (+25%)

### 📦 Dependencies

- ➕ Added: 1 package
  - axios@0.27.0
- 🔄 Upgraded: 1 package
  - express: 4.17.0 → 4.18.0

### 📊 Code Quality

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| Test Coverage | 65% | 82% | +17% | ✅ |
| Code Quality | 6/10 | 8/10 | +2 | ✅ |

---

## Impact Assessment

**Overall Impact Score:** 7.0/10
**Severity:** HIGH
**Breaking Changes:** NO ✅
**Effort Estimate:** Moderate refactoring needed

---

## Recommendations

1. 🔴 **CRITICAL** [Architecture] Verify new Modular architecture is fully tested
2. 🟠 **HIGH** [Testing] Test modular architecture integration thoroughly
3. 🟠 **HIGH** [Languages] Update Go tooling documentation and build setup
4. 🟡 **MEDIUM** [Languages] Deprecate Python components - migrate to Go

---

**Generated:** 2026-03-20T12:34:56.789Z
```

### Impact Assessment (`impact.json`)

```json
{
  "overallScore": 7,
  "severity": "high",
  "breaking": false,
  "components": {
    "architecture": 8,
    "dependencies": 1,
    "metrics": 5,
    "languages": 3
  },
  "summary": "Architecture shifted from Monolithic to Modular; +20 files (+20%); +1 dependencies",
  "recommendations": [
    {
      "category": "Architecture",
      "priority": "high",
      "message": "Verify new Modular architecture is fully tested"
    },
    {
      "category": "Languages",
      "priority": "medium",
      "message": "1 new language(s) added - update documentation and tooling"
    }
  ]
}
```

## API Reference

### DiffAnalyzer

Compares two repository snapshots and generates structured diffs.

```javascript
const analyzer = new DiffAnalyzer({ verbose: false });
const diff = await analyzer.generateDiff(baseline, current);
```

**Methods:**
- `generateDiff(baseline, current)` — Returns Promise<Object> with structured diff

### ImpactCalculator

Evaluates impact of changes on a 1-10 scale.

```javascript
const calculator = new ImpactCalculator({ verbose: false });
const impact = calculator.calculateImpact(diff);
```

**Methods:**
- `calculateImpact(diff)` — Returns Object with overall score, severity, and recommendations

**Scoring (1-10):**
- **1-2:** Minimal — trivial changes
- **3-4:** Low — minor updates
- **5-6:** Moderate — some refactoring needed
- **7-8:** High — significant changes, testing required
- **9-10:** Critical — major restructuring, extensive testing required

### DiffReporter

Generates human and machine-readable reports.

```javascript
const reporter = new DiffReporter({ outputPath: '/tmp', verbose: false });
const reports = await reporter.generateReports(diff, impact);
```

**Methods:**
- `generateReports(diff, impact)` — Returns Promise<Object> with paths to all generated reports

**Output:**
- `reports.json` — Path to structured diff JSON
- `reports.markdown` — Path to human-readable markdown
- `reports.impact` — Path to impact assessment JSON

## Test Coverage

All components have comprehensive test coverage:

- **DiffAnalyzer Tests** — 8 tests
  - Identical repositories
  - Language changes
  - Dependency changes
  - Architecture shifts
  - Metric regressions
  - Error handling

- **Integration Tests** — 3 tests
  - Full pipeline execution
  - Architecture shift impact
  - Code quality regression detection

## Example: Real-World Analysis

Compare AIOX repo with itself (no changes expected):

```bash
$ aiox diff --baseline repo.json --current repo.json --verbose

✅ Analysis complete!

📊 Change Summary:
  Baseline: aiox (3119 files)
  Current:  aiox (3119 files)

🎯 Impact Assessment:
  Overall Score:  2.3/10
  Severity:       LOW
  Breaking:       NO ✅

📄 Reports Generated:
  ✅ diff.json (2.5K)
  ✅ DIFF-REPORT.md (formatted)
  ✅ impact.json (377 bytes)
```

## Dependencies

- **fs-extra** — File system operations
- **Node.js stdlib** — No external dependencies for core logic

## Related Stories

- **Story 2.1** — [Repo Analyzer](../../.aiox-core/core/repo-analyzer/README.md) — Generates repo.json
- **Story 2.3** — Decision Engine — Consumes diff output for recommendations
- **Story 2.4** — Evolution Dashboard — Visualizes changes over time

## License

Part of Synkra AIOX. See root LICENSE file.
