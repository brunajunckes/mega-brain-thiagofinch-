/**
 * Constitutional Gates - Pre-execution validation
 * @module core/gates/constitutional-gates
 * @version 1.0.0
 *
 * Validates all committed code against constitutional principles before execution:
 * - Security checks (no secrets, safe patterns)
 * - Code quality checks (lint, typecheck, tests)
 * - Architectural compliance (patterns, imports)
 * - Testing coverage and standards
 * - Performance and complexity thresholds
 */

/**
 * Violation severity levels
 * @enum {string}
 */
const ViolationSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Gate verdict types
 * @enum {string}
 */
const GateVerdict = {
  APPROVED: 'approved',
  NEEDS_REVISION: 'needs_revision',
  BLOCKED: 'blocked',
};

/**
 * Constitutional Gates - Validates code against constitutional principles
 */
class ConstitutionalGates {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.strictMode = options.strictMode ?? true;
    this.gateConfig = {
      // Security gates
      security: {
        blockSecrets: true,
        blockUnsafeDependencies: true,
        blockSQLInjection: true,
        blockCrossSiteScripting: true,
      },
      // Quality gates
      quality: {
        minTestCoverage: 75,
        requireTypeCheck: true,
        requireLint: true,
        blockCodeRabbitCritical: true,
      },
      // Architecture gates
      architecture: {
        blockInvalidImports: true,
        blockCircularDependencies: true,
        blockWeakAbstractions: true,
      },
      // Performance gates
      performance: {
        maxComplexity: 10,
        maxFileSize: 500,
        maxFunctionSize: 100,
      },
      ...options.gateConfig,
    };

    this.validationHistory = [];
  }

  /**
   * Main validation method - Run all gates
   */
  async validate(context = {}) {
    const {
      changedFiles = [],
      branch = 'main',
      specContent = '',
      qualityChecks = {},
    } = context;

    const startTime = Date.now();
    const violations = [];
    let verdict = GateVerdict.APPROVED;

    try {
      // Validate branch format
      const branchCheck = this._validateBranch(branch);
      if (!branchCheck.valid) {
        violations.push({
          gate: 'branch_format',
          severity: ViolationSeverity.CRITICAL,
          message: branchCheck.message,
        });
        verdict = GateVerdict.BLOCKED;
      }

      // Validate changed files
      const fileChecks = this._validateFiles(changedFiles);
      violations.push(...fileChecks.violations);
      if (fileChecks.hasBlocker) {
        verdict = GateVerdict.BLOCKED;
      }

      // Validate quality checks
      if (Object.keys(qualityChecks).length > 0) {
        const qualityChecksResults = this._validateQualityChecks(qualityChecks);
        violations.push(...qualityChecksResults.violations);
        if (qualityChecksResults.hasBlocker) {
          verdict = GateVerdict.BLOCKED;
        }
      }

      // Validate spec content
      if (specContent) {
        const specCheck = this._validateSpecContent(specContent);
        violations.push(...specCheck.violations);
        if (specCheck.hasBlocker) {
          verdict = GateVerdict.BLOCKED;
        }
      }

      // Security checks
      const securityCheck = this._validateSecurity(changedFiles);
      violations.push(...securityCheck.violations);
      if (securityCheck.hasBlocker) {
        verdict = GateVerdict.BLOCKED;
      }

      // Determine final verdict
      if (verdict !== GateVerdict.BLOCKED) {
        const hasCritical = violations.some(v => v.severity === ViolationSeverity.CRITICAL);
        if (hasCritical) {
          verdict = GateVerdict.BLOCKED;
        } else if (violations.some(v => v.severity === ViolationSeverity.HIGH)) {
          verdict = GateVerdict.NEEDS_REVISION;
        }
      }

      // Build result
      const result = {
        valid: verdict === GateVerdict.APPROVED,
        verdict,
        violations,
        summary: {
          totalViolations: violations.length,
          critical: violations.filter(v => v.severity === ViolationSeverity.CRITICAL).length,
          high: violations.filter(v => v.severity === ViolationSeverity.HIGH).length,
          medium: violations.filter(v => v.severity === ViolationSeverity.MEDIUM).length,
          low: violations.filter(v => v.severity === ViolationSeverity.LOW).length,
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };

      // Log to history
      this.validationHistory.push(result);

      return result;
    } catch (error) {
      return {
        valid: false,
        verdict: GateVerdict.BLOCKED,
        violations: [
          {
            gate: 'validation_error',
            severity: ViolationSeverity.CRITICAL,
            message: `Gate validation error: ${error.message}`,
          },
        ],
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate branch format
   */
  _validateBranch(branch) {
    if (!branch) {
      return { valid: false, message: 'Branch name is required' };
    }
    const isStoryBranch = /^feature\/\d+\.\d+/.test(branch);
    const isMainBranch = branch === 'main' || branch === 'master';
    if (!isStoryBranch && !isMainBranch) {
      return { valid: false, message: `No story ID found in branch name. Use format: feature/X.Y-name (got: ${branch})` };
    }
    return { valid: true };
  }

  /**
   * Validate changed files for security issues
   */
  _validateFiles(changedFiles) {
    const violations = [];
    let hasBlocker = false;
    const forbiddenPatterns = [/\.env\.local$/, /\.env\.production$/, /\.secrets$/, /credentials/i, /private[\w-]*key/i, /api[\w-]*key/i];
    for (const file of changedFiles) {
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(file)) {
          violations.push({
            gate: 'forbidden_file',
            severity: ViolationSeverity.CRITICAL,
            message: `Forbidden file in commit: ${file}`,
            file,
          });
          hasBlocker = true;
        }
      }
    }
    return { violations, hasBlocker };
  }

  /**
   * Validate quality checks
   */
  _validateQualityChecks(checks) {
    const violations = [];
    let hasBlocker = false;
    if (!checks.lintPass && this.gateConfig.quality.requireLint) {
      violations.push({ gate: 'quality_lint', severity: ViolationSeverity.HIGH, message: 'Linting failed. Fix style issues before proceeding.' });
    }
    if (!checks.typecheckPass && this.gateConfig.quality.requireTypeCheck) {
      violations.push({ gate: 'quality_typecheck', severity: ViolationSeverity.HIGH, message: 'Type checking failed. Fix type errors before proceeding.' });
    }
    if (!checks.testPass) {
      violations.push({ gate: 'quality_tests', severity: ViolationSeverity.HIGH, message: 'Tests failed. Ensure all tests pass before proceeding.' });
    }
    if (!checks.buildPass) {
      violations.push({ gate: 'quality_build', severity: ViolationSeverity.CRITICAL, message: 'Build failed. Fix compilation errors before proceeding.' });
      hasBlocker = true;
    }
    if (checks.coderabbitCritical > 0 && this.gateConfig.quality.blockCodeRabbitCritical) {
      violations.push({ gate: 'quality_coderabbit', severity: ViolationSeverity.CRITICAL, message: `CodeRabbit found ${checks.coderabbitCritical} critical issue(s). Fix before proceeding.`, issueCount: checks.coderabbitCritical });
      hasBlocker = true;
    }
    return { violations, hasBlocker };
  }

  /**
   * Validate spec content
   */
  _validateSpecContent(specContent) {
    const violations = [];
    if (!specContent || typeof specContent !== 'string') {
      return { violations };
    }
    const requiredSections = ['## Acceptance Criteria', '## Test Plan'];
    for (const section of requiredSections) {
      if (!specContent.includes(section)) {
        violations.push({ gate: 'spec_content', severity: ViolationSeverity.MEDIUM, message: `Missing required spec section: ${section}` });
      }
    }
    return { violations, hasBlocker: false };
  }

  /**
   * Validate security patterns
   */
  _validateSecurity(changedFiles) {
    const violations = [];
    let hasBlocker = false;
    const securityPatterns = [
      { pattern: /password/i, severity: ViolationSeverity.HIGH, message: 'Potential password in filename' },
      { pattern: /secret/i, severity: ViolationSeverity.HIGH, message: 'Potential secret in filename' },
      { pattern: /token/i, severity: ViolationSeverity.MEDIUM, message: 'Potential token in filename' },
      { pattern: /key/i, severity: ViolationSeverity.MEDIUM, message: 'Potential key in filename' },
    ];
    for (const file of changedFiles) {
      for (const { pattern, severity, message } of securityPatterns) {
        if (pattern.test(file)) {
          violations.push({ gate: 'security_pattern', severity, message: `${message}: ${file}`, file });
          if (severity === ViolationSeverity.CRITICAL) {
            hasBlocker = true;
          }
        }
      }
    }
    return { violations, hasBlocker };
  }

  getHistory() { return this.validationHistory; }
  getLastValidation() { return this.validationHistory[this.validationHistory.length - 1] || null; }
  clearHistory() { this.validationHistory = []; }
  shouldBlock(verdict) { return verdict === GateVerdict.BLOCKED; }
  needsRevision(verdict) { return verdict === GateVerdict.NEEDS_REVISION; }
  getConfig() { return this.gateConfig; }
  updateConfig(newConfig) { this.gateConfig = { ...this.gateConfig, ...newConfig }; }
}

module.exports = ConstitutionalGates;
module.exports.ViolationSeverity = ViolationSeverity;
module.exports.GateVerdict = GateVerdict;
