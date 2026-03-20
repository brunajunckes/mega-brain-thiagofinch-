# Health Reporter

Multi-repository health consolidation and portfolio risk assessment.

**Part of Story 3.1** — Generates consolidated health reports for portfolios of repositories.

## Features

### 1. PortfolioManager
Aggregates health metrics across repositories:
- Add/manage repository metrics
- Calculate portfolio summary
- Rank repositories by health or debt
- Filter by criteria
- Get statistics and distributions

### 2. RiskAssessor
Identifies at-risk projects:
- Assess overall portfolio risk
- Create risk matrix
- Detect regressions
- Track debt trends
- Generate risk recommendations

### 3. ReportGenerator
Generates executive reports:
- Executive summaries
- Detailed portfolio reports
- Ranked lists
- Trend analysis
- Action plans

## Installation

```bash
npm install
```

## Usage

```javascript
const { PortfolioManager, RiskAssessor, ReportGenerator } = require('@aiox-fullstack/core/health-reporter');

// Create managers
const portfolio = new PortfolioManager();
const risk = new RiskAssessor(portfolio);
const report = new ReportGenerator(portfolio, risk);

// Add repositories
portfolio.addRepository('app1', {
  healthScore: 7.5,
  testCoverage: 80,
  codeQuality: 8,
  debtLevel: 'low',
  totalFiles: 100,
  totalLines: 10000,
});

// Get portfolio summary
const summary = portfolio.getPortfolioSummary();
console.log(summary);

// Assess risks
const riskAssessment = risk.assessPortfolioRisk();
console.log(riskAssessment);

// Generate reports
console.log(report.generateExecutiveSummary());
console.log(report.generateRankedList('health'));
console.log(report.generateActionPlan());
```

## Testing

```bash
npm test -- packages/health-reporter
```

## Story References

- **Story 2.1:** Repo Analyzer — Provides repo.json input
- **Story 2.2:** Diff Engine — Provides diff data
- **Story 2.3:** Decision Engine — Provides recommendations
- **Story 2.4:** Evolution Dashboard — Provides trends
- **Story 3.1:** Health Reporter (this module)

---

**Health Reporter v1.0**
*Multi-repository health consolidation*
*Story 3.1: Phases 1-3 Complete*
