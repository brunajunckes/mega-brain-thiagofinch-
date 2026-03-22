'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * QA Rules Engine -- Loads and evaluates configurable validation rules
 *
 * Supports loading rules from .aiox/qa-rules.yaml with severity mapping
 * and custom rule evaluation.
 *
 * @class QARulesEngine
 * @version 1.0.0
 * @story 1.3
 */
class QARulesEngine {
  /**
   * @param {Object} options
   * @param {string} [options.rulesPath] - Path to qa-rules.yaml
   * @param {string} [options.projectRoot] - Project root directory
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.rulesPath = options.rulesPath || path.join(this.projectRoot, '.aiox', 'qa-rules.yaml');
    this.rules = this._loadRules();
    this.severityMap = {
      critical: 3,
      high: 2,
      medium: 1,
      low: 0,
    };
  }

  /**
   * Load rules from YAML config file
   * @private
   * @returns {Object} Parsed rules configuration
   */
  _loadRules() {
    const defaults = this._getDefaultRules();

    try {
      if (!fs.existsSync(this.rulesPath)) {
        return defaults;
      }

      const content = fs.readFileSync(this.rulesPath, 'utf-8');
      const custom = yaml.load(content) || {};

      return this._mergeRules(defaults, custom);
    } catch (error) {
      console.warn(`Warning: Could not load QA rules from ${this.rulesPath}: ${error.message}`);
      return defaults;
    }
  }

  /**
   * Get default rule set
   * @private
   * @returns {Object} Default rules
   */
  _getDefaultRules() {
    return {
      codeStyle: {
        enabled: true,
        severity: 'medium',
        maxLineLength: 120,
        requireSemicolons: true,
        indentSize: 2,
        quoteStyle: 'single',
      },
      testCoverage: {
        enabled: true,
        severity: 'high',
        requireTestFile: true,
        minCoveragePercent: 80,
      },
      documentation: {
        enabled: true,
        severity: 'medium',
        requireJSDoc: true,
        requireModuleComment: true,
      },
      performance: {
        enabled: true,
        severity: 'high',
        maxNestedLoops: 2,
        warnSyncInAsync: true,
        warnN1Queries: true,
      },
      security: {
        enabled: true,
        severity: 'critical',
        noHardcodedSecrets: true,
        noEval: true,
        noUnsafeExec: true,
        patterns: [
          { name: 'hardcoded-password', regex: 'password\\s*[:=]\\s*["\'][^"\']+["\']', severity: 'critical' },
          { name: 'hardcoded-api-key', regex: 'api[_-]?key\\s*[:=]\\s*["\'][^"\']+["\']', severity: 'critical' },
          { name: 'hardcoded-token', regex: 'token\\s*[:=]\\s*["\'][^"\']+["\']', severity: 'high' },
        ],
      },
      typeSafety: {
        enabled: true,
        severity: 'medium',
        warnAnyType: true,
        requireParamTypes: true,
      },
      integration: {
        enabled: true,
        severity: 'medium',
        requireExports: true,
        checkCircularDeps: true,
      },
    };
  }

  /**
   * Merge custom rules with defaults (custom takes precedence)
   * @private
   * @param {Object} defaults - Default rules
   * @param {Object} custom - Custom rules from YAML
   * @returns {Object} Merged rules
   */
  _mergeRules(defaults, custom) {
    const merged = { ...defaults };

    for (const [category, customConfig] of Object.entries(custom)) {
      if (merged[category]) {
        merged[category] = { ...merged[category], ...customConfig };
      } else {
        merged[category] = customConfig;
      }
    }

    return merged;
  }

  /**
   * Get enabled rules
   * @returns {Object} Only enabled rules
   */
  getEnabledRules() {
    const enabled = {};

    for (const [name, config] of Object.entries(this.rules)) {
      if (config.enabled !== false) {
        enabled[name] = config;
      }
    }

    return enabled;
  }

  /**
   * Get rule configuration for a specific criterion
   * @param {string} criterion - Rule category name
   * @returns {Object|null} Rule config or null
   */
  getRule(criterion) {
    return this.rules[criterion] || null;
  }

  /**
   * Check if a criterion is enabled
   * @param {string} criterion - Rule category name
   * @returns {boolean}
   */
  isEnabled(criterion) {
    const rule = this.rules[criterion];
    return rule ? rule.enabled !== false : false;
  }

  /**
   * Get severity level for a criterion
   * @param {string} criterion - Rule category name
   * @returns {string} Severity level
   */
  getSeverity(criterion) {
    const rule = this.rules[criterion];
    return rule ? rule.severity || 'medium' : 'medium';
  }

  /**
   * Get numeric severity value
   * @param {string} severityName - Severity name (critical, high, medium, low)
   * @returns {number} Numeric severity
   */
  getSeverityValue(severityName) {
    return this.severityMap[severityName.toLowerCase()] ?? 1;
  }

  /**
   * Evaluate custom security patterns against content
   * @param {string} content - File content
   * @returns {Array<Object>} Array of findings
   */
  evaluateCustomPatterns(content) {
    const findings = [];
    const securityRules = this.rules.security;

    if (!securityRules || !securityRules.patterns) {
      return findings;
    }

    for (const pattern of securityRules.patterns) {
      try {
        const regex = new RegExp(pattern.regex, 'gi');
        const matches = content.match(regex);

        if (matches && matches.length > 0) {
          // Skip if content uses env vars (safe pattern)
          if (/process\.env|getenv|config\(/i.test(content)) {
            continue;
          }

          findings.push({
            rule: pattern.name,
            severity: (pattern.severity || 'medium').toUpperCase(),
            message: `Custom pattern "${pattern.name}" matched ${matches.length} time(s)`,
            matchCount: matches.length,
          });
        }
      } catch (_error) {
        // Invalid regex -- skip silently
      }
    }

    return findings;
  }

  /**
   * Get all rules as a flat config object (for serialization)
   * @returns {Object} Rules configuration
   */
  toConfig() {
    return { ...this.rules };
  }

  /**
   * Reload rules from disk
   */
  reload() {
    this.rules = this._loadRules();
  }
}

module.exports = { QARulesEngine };
