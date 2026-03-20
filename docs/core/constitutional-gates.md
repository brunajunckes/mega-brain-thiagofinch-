# Constitutional Gates - AIOX Enforcement

## Overview

Constitutional Gates are automated validation checks that enforce AIOX's non-negotiable principles before code commits. They prevent violations of the constitution by validating branch names, file changes, story requirements, and quality checks.

## The 5 Constitutional Principles

### Gate I: CLI First
**Principle:** All features must work via CLI before UI
**Enforcement:** Warns if UI/component files change without corresponding CLI implementation

```javascript
// Warns on UI changes without CLI
const files = ['src/app/page.js', 'src/components/Button.tsx'];
await gates.gateCliFirst(files); // ⚠️ WARN: UI without CLI
```

### Gate III: Story-Driven Development
**Principle:** No code without an approved story with acceptance criteria
**Enforcement:** Validates branch contains story ID and story file exists with AC section

```javascript
// Requires story ID in branch (feature/8.1-name)
await gates.gateStoryDriven('feature/8.1-foundation');
// Checks for: ## Acceptance Criteria section
// Optional: ## File List section
```

### Gate IV: No Invention
**Principle:** Specs must trace to requirements or research
**Enforcement:** Validates all spec statements reference FR/NFR/CON/research

```javascript
// Bad: "Add quantum-resistant encryption layer"
// Good: "Add quantum-resistant encryption layer (FR-042)"

await gates.gateNoInvention(specContent);
```

### Gate V: Quality First
**Principle:** No commit without passing lint, typecheck, tests, build
**Enforcement:** Blocks commits if quality checks fail

```javascript
const checks = {
  lintPass: true,        // npm run lint
  typecheckPass: true,   // npm run typecheck
  testPass: true,        // npm test
  buildPass: true,       // npm run build
  coderabbitCritical: 0, // CodeRabbit review
};

await gates.gateQualityFirst(checks); // ✅ All pass or ❌ BLOCK
```

## Usage

### Direct API

```javascript
const { ConstitutionalGates } = require('.aiox-core/core/gates/constitutional-gates');

const gates = new ConstitutionalGates();

// Validate multiple principles
const result = await gates.validate({
  changedFiles: ['src/cli/command.js', 'src/app/page.js'],
  branch: 'feature/8.1-foundation',
  specContent: 'FR-001: Implementation details',
  qualityChecks: {
    lintPass: true,
    typecheckPass: true,
    testPass: true,
    buildPass: true,
    coderabbitCritical: 0,
  },
});

// Check result
if (result.valid) {
  console.log('✅ All gates passed');
} else {
  console.error('❌ Violations:', result.violations);
  console.warn('⚠️  Warnings:', result.warnings);
}

// Get formatted report
console.log(gates.getReport());
```

### Pre-Commit Hook

```javascript
const { runGates } = require('.aiox-core/core/gates/pre-commit-hook');

// Run gates before commit
try {
  await runGates({
    skipQuality: false,      // Run quality checks
    verbose: true,           // Detailed output
    allowWarnings: false,    // Block on any violations
  });
  console.log('✅ Safe to commit');
} catch (error) {
  console.error('❌ Commit blocked:', error.message);
}
```

## Violation Types

| Severity | Behavior | Recovery |
|----------|----------|----------|
| **CRITICAL** | Blocks commit | Must fix issue (lint, tests, story, etc.) |
| **WARN** | Allows commit | Advisory (UI without CLI, missing File List) |

## Integration Points

### Git Hooks
The pre-commit hook integrates with git to validate before each commit:

```bash
# Manual execution
node .aiox-core/core/gates/pre-commit-hook.js [--skip-quality] [--verbose]

# Automatic via git hooks
git config core.hooksPath .aiox/hooks
```

### CI/CD Pipeline
Gates should run in CI to prevent non-compliant code merging:

```bash
npm run lint       # Required by Quality First gate
npm run typecheck  # Required by Quality First gate
npm test           # Required by Quality First gate
npm run build      # Required by Quality First gate
```

## Examples

### Valid Commit (All gates pass)

```javascript
// Branch: feature/8.1-foundation
// Files: bin/aiox-cli.js (CLI), docs/stories/8.1.*.story.md (story exists)
// Story: Has ## Acceptance Criteria + ## File List
// Quality: lint ✅, typecheck ✅, tests ✅, build ✅

await gates.validate({
  changedFiles: ['bin/aiox-cli.js'],
  branch: 'feature/8.1-foundation',
  qualityChecks: { lintPass: true, typecheckPass: true, testPass: true, buildPass: true, coderabbitCritical: 0 }
});
// Result: ✅ VALID - all gates passed
```

### Invalid Commit (CRITICAL violations)

```javascript
// Branch: bugfix/no-id (❌ no story ID)
// Files: src/app/page.js (❌ UI without CLI)
// Quality: tests failed (❌)

await gates.validate({
  changedFiles: ['src/app/page.js'],
  branch: 'bugfix-fix-something',
  qualityChecks: { lintPass: true, typecheckPass: true, testPass: false, buildPass: true, coderabbitCritical: 0 }
});
// Result: ❌ INVALID - 3 CRITICAL violations block commit
```

## Customization

### Extend Gates with New Principles

```javascript
class CustomGates extends ConstitutionalGates {
  async gateCustom(data) {
    // Custom validation logic
    if (!data.valid) {
      this.violations.push({
        principle: 'Custom Principle',
        severity: 'CRITICAL',
        message: 'Custom violation message',
      });
    }
  }

  async validate(config) {
    // Call parent validate
    const result = await super.validate(config);

    // Add custom gate
    await this.gateCustom(config.customData);

    return result;
  }
}
```

## Testing

```bash
npx jest .aiox-core/core/gates/__tests__/ --verbose
# 50 tests: ConstitutionalGates (37) + Pre-commit hook (13)
```

## See Also

- `.aiox-core/constitution.md` - Full constitutional framework
- `.aiox-core/core/gates/constitutional-gates.js` - Implementation
- `.aiox-core/core/gates/pre-commit-hook.js` - Git integration
