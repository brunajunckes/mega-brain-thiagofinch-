# Repo Analyzer — Repository Analysis Engine

**Version:** 1.0.0
**Story:** 2.1
**Status:** Complete (Phases 1-6)

---

## Overview

Repo Analyzer provides automated, comprehensive analysis of any software repository. It scans project structure, analyzes dependencies, detects architectural patterns, collects code quality metrics, and generates multi-format reports.

**Key Features:**
- 🔍 Multi-language support (20+ languages)
- 📦 Dependency analysis (npm, Python, Go)
- 🏗️ Architecture pattern detection (MVC, Layered, Modular)
- 📊 Code quality metrics
- 📄 Multi-format reports (JSON, Markdown, Architecture)
- ⚡ Zero external dependencies (stdlib only)

---

## Installation

```bash
# Already included in AIOX Core
npm install aiox-core

# CLI command available
node bin/aiox-analyze.js --help
```

---

## Quick Start

### Basic Usage

```bash
# Analyze current directory
node bin/aiox-analyze.js

# Analyze specific repository
node bin/aiox-analyze.js --repo-path=/path/to/repo

# Output as JSON
node bin/aiox-analyze.js --format=json

# Show progress
node bin/aiox-analyze.js --verbose
```

### Programmatic Usage

```javascript
const {
  RepoScanner,
  DependencyAnalyzer,
  PatternDetector,
  MetricsCollector,
  ReportGenerator,
} = require('./repo-analyzer');

// Phase 1: Scan repository
const scanner = new RepoScanner({ rootPath: '/path/to/repo' });
const scanResult = await scanner.scan();
console.log(`Found ${scanResult.summary.totalFiles} files`);

// Phase 2: Analyze dependencies
const depsAnalyzer = new DependencyAnalyzer({ rootPath: '/path/to/repo' });
const depsResult = await depsAnalyzer.analyze();
console.log(`${depsResult.summary.totalDependencies} dependencies`);

// Phase 3: Detect patterns
const patternDetector = new PatternDetector({ rootPath: '/path/to/repo' });
const patternsResult = await patternDetector.detect();
console.log(`Architecture: ${patternsResult.patterns.architecture.name}`);

// Phase 4: Collect metrics
const metricsCollector = new MetricsCollector({ rootPath: '/path/to/repo' });
const metricsResult = await metricsCollector.collect();
console.log(`Code Quality: ${metricsResult.summary.codeQuality}/10`);

// Phase 5: Generate reports
const reportGen = new ReportGenerator({ rootPath: '/path/to/repo' });
const reports = await reportGen.generate({
  scanner: scanResult,
  deps: depsResult,
  patterns: patternsResult.patterns,
  metrics: metricsResult.metrics,
});

console.log(`Reports generated:`, reports);
```

---

## Architecture

```
Repo Analyzer
├── Phase 1: RepoScanner
│   └── Scans directory structure, detects languages/frameworks, counts LOC
├── Phase 2: DependencyAnalyzer
│   └── Parses npm/Python/Go dependencies, builds dependency graphs
├── Phase 3: PatternDetector
│   └── Identifies architecture patterns, API patterns, code abstractions
├── Phase 4: MetricsCollector
│   └── Measures code quality metrics
├── Phase 5: ReportGenerator
│   └── Generates JSON, Markdown, and Architecture reports
└── Phase 6: CLI Integration
    └── bin/aiox-analyze.js command-line interface
```

---

## Components

### 1. RepoScanner

**Purpose:** Analyze repository structure and detect languages/frameworks

```javascript
const scanner = new RepoScanner({ rootPath: '/path/to/repo' });
const result = await scanner.scan();

// Result includes:
// - languages: { JavaScript: { files: 100, loc: 5000, percentage: 80 }, ... }
// - frameworks: ['React', 'Express', 'Jest']
// - summary: { totalFiles, totalLoc, languages, frameworks }
// - fileStats: { 'src/app.js': { language, loc, bytes, ... }, ... }
```

**Supported Languages:** JavaScript, TypeScript, Python, Go, Java, C++, C#, Ruby, PHP, Rust, Kotlin, Scala, Shell, YAML, JSON, HTML, CSS, SCSS, SQL, Markdown

**Features:**
- Respects .gitignore patterns
- Ignores common directories (node_modules, .git, dist, build, venv)
- Accurate LOC counting (excludes blank lines)

### 2. DependencyAnalyzer

**Purpose:** Parse dependencies and build dependency graphs

```javascript
const analyzer = new DependencyAnalyzer({ rootPath: '/path/to/repo' });
const result = await analyzer.analyze();

// Result includes:
// - dependencies: { production: [...], development: [...] }
// - graph: { nodes: [...], edges: [...] }
// - circularDeps: [...]
// - outdated: [...]
// - summary: { totalDependencies, productionDeps, developmentDeps, ... }
```

**Supported Package Managers:**
- npm (package.json)
- Python (requirements.txt, pyproject.toml, Pipfile)
- Go (go.mod)

### 3. PatternDetector

**Purpose:** Identify code and architecture patterns

```javascript
const detector = new PatternDetector({ rootPath: '/path/to/repo' });
const result = await detector.detect();

// Result includes:
// - architecture: { name: 'Modular', score: 0.85, evidence: [...] }
// - api: { rest: { detected: true }, graphql: { detected: false } }
// - database: { prisma: { detected: true, confidence: 0.95 } }
// - abstractions: { middleware: { detected: true } }
// - cli: { detected: true, confidence: 0.90 }
```

**Architecture Patterns:** MVC, Layered, Modular, Monolithic
**API Patterns:** REST, GraphQL, gRPC
**Database Patterns:** Prisma, Sequelize, TypeORM, raw SQL
**Abstractions:** Middleware, Interceptors, Guards, Decorators

### 4. MetricsCollector

**Purpose:** Measure code quality metrics

```javascript
const collector = new MetricsCollector({ rootPath: '/path/to/repo' });
const result = await collector.collect();

// Result includes:
// - metrics: {
//     avgFunctionLength: 24,
//     complexityScore: 'medium',
//     testCoverage: 82,
//     documentationRatio: 0.65,
//     unusedImports: [...],
//     deadCodeEstimate: 'low'
//   }
// - summary: {
//     codeQuality: 8,
//     recommendations: [...]
//   }
```

**Metrics:**
- Function length (average lines per function)
- Cyclomatic complexity (estimation)
- Test coverage (percentage)
- Documentation ratio (comments vs code)
- Unused imports
- Dead code patterns
- Overall code quality score (1-10)

### 5. ReportGenerator

**Purpose:** Generate multi-format reports

```javascript
const gen = new ReportGenerator({ rootPath: '/path/to/repo', outputPath: '/tmp' });
const result = await gen.generate(analysisData);

// Result includes:
// - json: '/tmp/repo.json'
// - markdown: '/tmp/REPO-ANALYSIS.md'
// - architecture: '/tmp/ARCHITECTURE.md'
// - timestamp: '2026-03-20T...'
```

**Output Formats:**
- **repo.json:** Structured machine-readable format
- **REPO-ANALYSIS.md:** Human-readable markdown report
- **ARCHITECTURE.md:** System overview and technology stack

---

## CLI Usage

### Help

```bash
node bin/aiox-analyze.js --help
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--repo-path` | path | cwd | Repository path to analyze |
| `--output` | path | repo-path | Output directory for reports |
| `--format` | enum | markdown | Output format (json, markdown, md) |
| `--verbose` | flag | false | Show detailed progress |
| `--help` | flag | — | Show help message |

### Examples

```bash
# Analyze current directory, output markdown
node bin/aiox-analyze.js

# Analyze specific repo, JSON output
node bin/aiox-analyze.js --repo-path=/srv/myproject --format=json

# Save to custom location with verbose output
node bin/aiox-analyze.js \
  --repo-path=/srv/aiox \
  --output=/tmp/reports \
  --verbose

# Quick JSON analysis
node bin/aiox-analyze.js --format=json | jq '.summary'
```

---

## Output Examples

### repo.json Structure

```json
{
  "metadata": {
    "generatedAt": "2026-03-20T10:30:00Z",
    "repository": {
      "path": "/srv/aiox",
      "name": "aiox"
    }
  },
  "summary": {
    "totalFiles": 2614,
    "totalLoc": 755212,
    "languages": 11,
    "frameworks": 4,
    "dependencies": 38
  },
  "languages": {
    "JavaScript": {
      "files": 1054,
      "loc": 305739,
      "percentage": 40,
      "extensions": [".js", ".jsx"]
    }
  },
  "frameworks": ["Node.js", "Jest", "TypeScript"],
  "dependencies": {
    "production": [
      {
        "name": "express",
        "version": "^4.18.0",
        "type": "npm",
        "isDev": false
      }
    ],
    "development": [...]
  },
  "architecture": {
    "pattern": {
      "name": "Modular",
      "score": 0.85
    }
  },
  "metrics": {
    "avgFunctionLength": 24,
    "complexityScore": "medium",
    "testCoverage": 82,
    "documentationRatio": 0.65,
    "codeQuality": 8
  }
}
```

### REPO-ANALYSIS.md Structure

```markdown
# Repository Analysis Report

**Generated:** 2026-03-20T10:30:00Z

## Executive Summary
This repository contains **755,212 lines of code** across **2,614 files** in **11 languages**.

## Language Breakdown
| Language | Files | LOC | % |
|----------|-------|-----|---|
| Markdown | 1215 | 337654 | 45% |

## Code Quality Metrics
| Metric | Value |
|--------|-------|
| Test Coverage | 82% |
| Code Quality Score | 8/10 |
| Complexity | medium |
| Documentation | 65% |

## Recommendations
- Increase test coverage to 70%+
- Add more documentation

---
*Analysis report generated by AIOX Repo Analyzer*
```

---

## Integration with Other AIOX Components

### Story 2.2: Diff Engine
Repo Analyzer output (`repo.json`) feeds into Diff Engine to compare repositories over time and identify architectural changes.

### Story 2.3: Decision Engine
Analysis results inform Decision Engine recommendations for architecture improvements and dependency updates.

### Story 1.1: Persistent Sessions
Analysis results can be stored in persistent agent sessions for later retrieval.

### Story 1.3: QA Validator
Metrics from Repo Analyzer validate code quality across the project.

---

## Performance

**Analysis Time:**
- Small project (< 100 files): ~1-2 seconds
- Medium project (100-1000 files): ~5-10 seconds
- Large project (1000+ files): ~20-60 seconds

**Memory Usage:**
- Minimal memory footprint (< 50MB typical)
- Streams file processing to avoid memory exhaustion
- Graceful handling of inaccessible files

---

## Testing

Run all tests:
```bash
npm test -- .aiox-core/core/repo-analyzer/__tests__/
```

Test coverage:
- **Unit Tests:** 91 tests across 5 components
- **Integration Tests:** 4 end-to-end tests
- **Total:** 95 tests, 100% passing

---

## Troubleshooting

### Analysis shows 0 files
- Verify `--repo-path` points to a valid directory
- Check that directory contains source files
- Verify permissions allow reading the directory

### Reports not generated
- Check `--output` directory exists and is writable
- Verify disk space available
- Check for permission issues with `--verbose` flag

### Slow analysis on large repos
- Repo Analyzer scales linearly with file count
- For 10k+ files, expect 1-2 minutes
- Performance is I/O bound, not CPU bound

---

## API Reference

See individual component files for detailed API documentation:
- `scanner.js` — RepoScanner class methods
- `dependency-analyzer.js` — DependencyAnalyzer class methods
- `pattern-detector.js` — PatternDetector class methods
- `metrics-collector.js` — MetricsCollector class methods
- `report-generator.js` — ReportGenerator class methods

---

## Contributing

Story 2.1 implementation complete. For enhancements:
1. Create story in backlog
2. Update acceptance criteria
3. Add tests before implementation
4. Ensure all quality gates pass

---

## License

Part of AIOX-FullStack. See LICENSE file in root.

---

**Generated:** 2026-03-20
**Story:** 2.1 (Complete)
**Status:** Production Ready ✅
