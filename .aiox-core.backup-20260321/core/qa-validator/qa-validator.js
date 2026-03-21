'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * QA Validator — Automated Code Quality Validation
 *
 * Discriminator-based QA that validates code across 7 criteria:
 * 1. Code Style (eslint patterns)
 * 2. Test Coverage (test file presence)
 * 3. Documentation (comments, README)
 * 4. Performance (no obvious bottlenecks)
 * 5. Security (no hardcoded secrets)
 * 6. Type Safety (type annotations)
 * 7. Integration (imports, exports, integration patterns)
 *
 * @class QAValidator
 * @version 1.0.0
 * @story 1.3
 */
class QAValidator {
  constructor(options = {}) {
    this.rules = this._initializeRules(options.rules || {});
    this.severity = {
      CRITICAL: 3,
      HIGH: 2,
      MEDIUM: 1,
      LOW: 0,
    };
  }

  /**
   * Validate a file or directory
   * @param {string} filePath File or directory path
   * @returns {Object} Validation result with score and findings
   */
  async validatePath(filePath) {
    try {
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        return await this._validateDirectory(filePath);
      } else {
        return await this._validateFile(filePath);
      }
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        score: 0,
      };
    }
  }

  /**
   * Validate a single file
   * @private
   * @param {string} filePath File path
   * @returns {Object} Validation result
   */
  async _validateFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const basename = path.basename(filePath);
    const ext = path.extname(filePath);

    const criteria = {
      codeStyle: this._checkCodeStyle(content, ext),
      testCoverage: this._checkTestCoverage(filePath),
      documentation: this._checkDocumentation(content),
      performance: this._checkPerformance(content),
      security: this._checkSecurity(content),
      typeSafety: this._checkTypeSafety(content, ext),
      integration: this._checkIntegration(content),
    };

    const findings = this._compileFings(criteria);
    const score = this._calculateScore(criteria);

    return {
      file: basename,
      status: this._getStatus(score),
      score: Math.round(score * 100),
      criteria,
      findings,
      verdict: this._getVerdict(score),
    };
  }

  /**
   * Validate a directory
   * @private
   * @param {string} dirPath Directory path
   * @returns {Object} Validation result
   */
  async _validateDirectory(dirPath) {
    const files = await this._getJsFiles(dirPath);
    const results = [];
    let totalScore = 0;

    for (const file of files) {
      const result = await this._validateFile(file);
      results.push(result);
      totalScore += result.score;
    }

    const avgScore = files.length > 0 ? totalScore / files.length : 0;

    return {
      directory: path.basename(dirPath),
      fileCount: files.length,
      status: this._getStatus(avgScore / 100),
      averageScore: Math.round(avgScore),
      files: results,
      verdict: this._getVerdict(avgScore / 100),
      summary: this._generateSummary(results),
    };
  }

  /**
   * Check code style (formatting, naming conventions)
   * @private
   */
  _checkCodeStyle(content, ext) {
    if (!this._isCodeFile(ext)) return { pass: true, issues: [] };

    const issues = [];
    const lines = content.split('\n');

    // Check indentation (should be 2 spaces)
    const badIndent = lines.filter((l) => /^ {3,}(?! )/.test(l) || /^\t/.test(l));
    if (badIndent.length > 0) {
      issues.push({
        severity: 'MEDIUM',
        message: `Found ${badIndent.length} lines with non-standard indentation`,
      });
    }

    // Check variable naming (camelCase)
    const badNaming = content.match(/const [A-Z_]+\s*=/g);
    if (badNaming && badNaming.length > 0) {
      issues.push({
        severity: 'LOW',
        message: 'Constants should use SCREAMING_SNAKE_CASE',
      });
    }

    return { pass: issues.length === 0, issues };
  }

  /**
   * Check test coverage
   * @private
   */
  _checkTestCoverage(filePath) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const testFile1 = path.join(dir, `${base}.test.js`);
    const testFile2 = path.join(dir, `${base}.spec.js`);
    const testDir = path.join(dir, '__tests__', `${base}.test.js`);

    const hasTest = fs.existsSync(testFile1) || fs.existsSync(testFile2) || fs.existsSync(testDir);

    return {
      pass: hasTest,
      issues: hasTest
        ? []
        : [{ severity: 'HIGH', message: 'No test file found for this module' }],
    };
  }

  /**
   * Check documentation (comments, JSDoc)
   * @private
   */
  _checkDocumentation(content) {
    const issues = [];

    const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
    const hasComments = /\/\/|\/\*/.test(content);
    const functions = (content.match(/^(async\s+)?function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(/gm) || []).length;
    const docBlocks = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;

    if (functions > 0 && docBlocks === 0) {
      issues.push({
        severity: 'MEDIUM',
        message: 'No JSDoc comments found for exported functions',
      });
    }

    if (!hasComments && functions > 5) {
      issues.push({
        severity: 'LOW',
        message: 'Complex code lacks explanatory comments',
      });
    }

    return { pass: issues.length === 0, issues };
  }

  /**
   * Check performance (obvious bottlenecks)
   * @private
   */
  _checkPerformance(content) {
    const issues = [];

    // Check for nested loops
    if (/(for|while)[\s\S]*?(for|while)/.test(content)) {
      issues.push({
        severity: 'MEDIUM',
        message: 'Nested loops detected - verify algorithm efficiency',
      });
    }

    // Check for synchronous file operations in async context
    if (/fs\.readFileSync|fs\.writeFileSync/.test(content) && /async\s+function|async\s*\(/.test(content)) {
      issues.push({
        severity: 'HIGH',
        message: 'Synchronous file operations in async code - use async versions',
      });
    }

    // Check for N+1 queries pattern
    if (/for[\s\S]*?await[\s\S]*?query|\.map[\s\S]*?await/.test(content)) {
      issues.push({
        severity: 'HIGH',
        message: 'Potential N+1 query pattern - consider batch operations',
      });
    }

    return { pass: issues.length === 0, issues };
  }

  /**
   * Check security (hardcoded secrets, unsafe patterns)
   * @private
   */
  _checkSecurity(content) {
    const issues = [];

    // Check for hardcoded credentials
    if (/password\s*[:=]|api[_-]?key\s*[:=]|secret\s*[:=]|token\s*[:=]/i.test(content)) {
      if (!/process\.env|getenv|config\(/i.test(content)) {
        issues.push({
          severity: 'CRITICAL',
          message: 'Potential hardcoded credentials detected',
        });
      }
    }

    // Check for eval/unsafe code
    if (/eval\(|new Function\(|require\(.*\+|require\(.*\$/.test(content)) {
      issues.push({
        severity: 'CRITICAL',
        message: 'Unsafe dynamic code execution detected',
      });
    }

    // Check for command injection patterns
    if (/exec\(|spawn\(|shell:true/.test(content)) {
      if (!/validateInput|sanitize|escape/.test(content)) {
        issues.push({
          severity: 'HIGH',
          message: 'Command execution detected - ensure input is validated',
        });
      }
    }

    return { pass: issues.length === 0, issues };
  }

  /**
   * Check type safety (JSDoc types, TypeScript)
   * @private
   */
  _checkTypeSafety(content, ext) {
    const issues = [];

    if (ext === '.ts' || ext === '.tsx') {
      // TypeScript file
      if (/:(\s*(any|any\[)|function.*any)/.test(content)) {
        issues.push({
          severity: 'MEDIUM',
          message: 'Use of `any` type detected - prefer specific types',
        });
      }
    } else if (ext === '.js' || ext === '.jsx') {
      // JavaScript file - check for JSDoc types
      const hasJSDocTypes = /@param\s*{[^}]+}|@returns\s*{[^}]+}|@type\s*{[^}]+}/.test(content);

      const functions = (content.match(/function\s+\w+\(|const\s+\w+\s*=\s*\(/g) || []).length;

      if (functions > 0 && !hasJSDocTypes) {
        issues.push({
          severity: 'LOW',
          message: 'JSDoc type annotations missing - recommend adding @param/@returns',
        });
      }
    }

    return { pass: issues.length === 0, issues };
  }

  /**
   * Check integration (imports, exports, dependencies)
   * @private
   */
  _checkIntegration(content) {
    const issues = [];

    // Check for circular imports pattern
    if (/from\s+['"]\.\.\/\.\.\//.test(content) && /require\(['"]\.\.\/\.\.\//.test(content)) {
      issues.push({
        severity: 'MEDIUM',
        message: 'Possible circular dependency - check import paths',
      });
    }

    // Check for proper exports
    if (/(function\s+\w+|class\s+\w+)\s*{[\s\S]*?}/.test(content) && !/module\.exports|export\s+(default|const|function)/.test(content)) {
      issues.push({
        severity: 'MEDIUM',
        message: 'Functions/classes defined but not exported',
      });
    }

    // Check for unused imports (heuristic)
    const imports = content.match(/import\s+\{?(\w+)[^}]*from|const\s+(\w+)\s*=\s*require/g) || [];
    const unused = imports.filter((imp) => {
      const name = imp.match(/[{\s](\w+)[}\s]/)?.[1];
      return name && !new RegExp(`\\b${name}\\b`).test(content.replace(imp, ''));
    });

    if (unused.length > 0) {
      issues.push({
        severity: 'LOW',
        message: `${unused.length} unused import(s) detected`,
      });
    }

    return { pass: issues.length === 0, issues };
  }

  /**
   * Calculate overall quality score
   * @private
   */
  _calculateScore(criteria) {
    const weights = {
      codeStyle: 0.15,
      testCoverage: 0.25,
      documentation: 0.1,
      performance: 0.15,
      security: 0.2,
      typeSafety: 0.1,
      integration: 0.05,
    };

    let score = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const pass = criteria[key].pass ? 1 : Math.max(0, 1 - criteria[key].issues.length * 0.15);
      score += pass * weight;
    }

    return score;
  }

  /**
   * Get verdict based on score
   * @private
   */
  _getVerdict(score) {
    if (score >= 0.95) return 'APPROVED';
    if (score >= 0.85) return 'NEEDS_MINOR_WORK';
    if (score >= 0.70) return 'NEEDS_WORK';
    return 'BLOCKED';
  }

  /**
   * Get status based on score
   * @private
   */
  _getStatus(score) {
    if (score >= 0.85) return 'success';
    if (score >= 0.70) return 'warning';
    return 'failed';
  }

  /**
   * Compile findings from criteria
   * @private
   */
  _compileFings(criteria) {
    const findings = [];

    for (const [criterion, result] of Object.entries(criteria)) {
      if (!result.pass) {
        findings.push({
          criterion: criterion.replace(/([A-Z])/g, ' $1').trim(),
          issues: result.issues,
        });
      }
    }

    return findings;
  }

  /**
   * Generate summary for directory validation
   * @private
   */
  _generateSummary(results) {
    const total = results.length;
    const approved = results.filter((r) => r.verdict === 'APPROVED').length;
    const needsWork = results.filter((r) => r.verdict === 'NEEDS_WORK').length;
    const blocked = results.filter((r) => r.verdict === 'BLOCKED').length;

    return {
      total,
      approved,
      needsWork,
      blocked,
      passRate: Math.round((approved / total) * 100),
    };
  }

  /**
   * Get all JavaScript files in directory
   * @private
   */
  async _getJsFiles(dirPath, fileList = []) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (file.startsWith('.') || file === 'node_modules') continue;

      const fullPath = path.join(dirPath, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await this._getJsFiles(fullPath, fileList);
      } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
        fileList.push(fullPath);
      }
    }

    return fileList;
  }

  /**
   * Check if file is code
   * @private
   */
  _isCodeFile(ext) {
    return /^\.(js|ts|jsx|tsx)$/.test(ext);
  }

  /**
   * Initialize rules
   * @private
   */
  _initializeRules(customRules) {
    return {
      ...customRules,
    };
  }
}

module.exports = { QAValidator };
