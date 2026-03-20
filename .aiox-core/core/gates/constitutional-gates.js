'use strict';

const fs = require('fs').promises;
const path = require('path');

/**
 * Constitutional Gates - Enforce AIOX principles
 * Blocks/warns on violations of non-negotiable principles
 */
class ConstitutionalGates {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  /**
   * Gate I: CLI First
   * Ensure all features work via CLI before UI
   */
  async gateCliFirst(changedFiles) {
    const uiFiles = changedFiles.filter(f =>
      f.includes('/app/') || f.includes('/pages/') || f.includes('components/')
    );
    const cliFiles = changedFiles.filter(f =>
      f.includes('/cli/') || f.includes('bin/') || f.includes('-cli.js')
    );

    // If UI added without CLI, warn
    if (uiFiles.length > 0 && cliFiles.length === 0) {
      this.warnings.push({
        principle: 'CLI First',
        severity: 'WARN',
        message: 'UI changes detected without corresponding CLI implementation',
        files: uiFiles,
      });
    }
  }

  /**
   * Gate III: Story-Driven Development
   * Require valid story with acceptance criteria
   */
  async gateStoryDriven(branch) {
    // Extract story ID from branch (e.g., feature/8.1-foundation → 8.1)
    const storyMatch = branch.match(/(\d+\.\d+)/);
    if (!storyMatch) {
      this.violations.push({
        principle: 'Story-Driven',
        severity: 'CRITICAL',
        message: 'No story ID found in branch name. Use format: feature/X.Y-name',
      });
      return;
    }

    const storyId = storyMatch[1];
    const storyPath = path.join(process.cwd(), 'docs', 'stories', `${storyId}*.story.md`);

    try {
      // Check if story exists with acceptance criteria
      const files = await fs.readdir(path.dirname(storyPath));
      const story = files.find(f => f.startsWith(storyId) && f.endsWith('.story.md'));

      if (!story) {
        this.violations.push({
          principle: 'Story-Driven',
          severity: 'CRITICAL',
          message: `Story not found: ${storyId}. Create at docs/stories/${storyId}.*.story.md`,
        });
        return;
      }

      const content = await fs.readFile(path.join(path.dirname(storyPath), story), 'utf8');

      // Check for acceptance criteria
      if (!content.includes('## Acceptance Criteria')) {
        this.violations.push({
          principle: 'Story-Driven',
          severity: 'CRITICAL',
          message: `Story ${storyId} missing "## Acceptance Criteria" section`,
        });
      }

      // Check for file list
      if (!content.includes('## File List')) {
        this.warnings.push({
          principle: 'Story-Driven',
          severity: 'WARN',
          message: `Story ${storyId} missing "## File List" section`,
        });
      }
    } catch (error) {
      this.violations.push({
        principle: 'Story-Driven',
        severity: 'CRITICAL',
        message: `Error validating story: ${error.message}`,
      });
    }
  }

  /**
   * Gate IV: No Invention
   * Specs must trace to requirements or research
   */
  async gateNoInvention(specContent) {
    // Check that spec statements trace to FR/NFR/CON/research
    const lines = specContent.split('\n');
    const requiredPrefixes = ['FR-', 'NFR-', 'CON-', 'Research:', 'research:'];
    let hasInventions = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip empty lines and headers
      if (!line || line.startsWith('#') || line.startsWith('-') || line.startsWith('>')) continue;

      // Check if line traces to requirement or research
      const traced = requiredPrefixes.some(prefix =>
        line.includes(prefix) ||
        (i < lines.length - 1 && lines[i + 1].includes(prefix))
      );

      if (!traced && line.length > 10) {
        hasInventions = true;
        break;
      }
    }

    if (hasInventions) {
      this.violations.push({
        principle: 'No Invention',
        severity: 'CRITICAL',
        message: 'Spec contains statements not traced to FR/NFR/CON/research',
      });
    }
  }

  /**
   * Gate V: Quality First
   * Validate build/lint/test before commit
   */
  async gateQualityFirst(checks) {
    const { lintPass, typecheckPass, testPass, buildPass, coderabbitCritical } = checks;

    if (!lintPass) {
      this.violations.push({
        principle: 'Quality First',
        severity: 'CRITICAL',
        message: 'Lint failed. Run: npm run lint',
      });
    }

    if (!typecheckPass) {
      this.violations.push({
        principle: 'Quality First',
        severity: 'CRITICAL',
        message: 'Typecheck failed. Run: npm run typecheck',
      });
    }

    if (!testPass) {
      this.violations.push({
        principle: 'Quality First',
        severity: 'CRITICAL',
        message: 'Tests failed. Run: npm test',
      });
    }

    if (!buildPass) {
      this.violations.push({
        principle: 'Quality First',
        severity: 'CRITICAL',
        message: 'Build failed. Run: npm run build',
      });
    }

    if (coderabbitCritical > 0) {
      this.violations.push({
        principle: 'Quality First',
        severity: 'CRITICAL',
        message: `CodeRabbit found ${coderabbitCritical} CRITICAL issues`,
      });
    }
  }

  /**
   * Validate all gates
   */
  async validate(config) {
    const { changedFiles, branch, specContent, qualityChecks } = config;

    // Gate I: CLI First
    if (changedFiles) {
      await this.gateCliFirst(changedFiles);
    }

    // Gate III: Story-Driven
    if (branch) {
      await this.gateStoryDriven(branch);
    }

    // Gate IV: No Invention
    if (specContent) {
      await this.gateNoInvention(specContent);
    }

    // Gate V: Quality First
    if (qualityChecks) {
      await this.gateQualityFirst(qualityChecks);
    }

    return {
      valid: this.violations.length === 0,
      violations: this.violations,
      warnings: this.warnings,
    };
  }

  /**
   * Get report
   */
  getReport() {
    const report = [];

    if (this.violations.length > 0) {
      report.push('❌ CONSTITUTIONAL VIOLATIONS:\n');
      this.violations.forEach(v => {
        report.push(`  [${v.principle}] ${v.message}`);
      });
      report.push('');
    }

    if (this.warnings.length > 0) {
      report.push('⚠️  CONSTITUTIONAL WARNINGS:\n');
      this.warnings.forEach(w => {
        report.push(`  [${w.principle}] ${w.message}`);
      });
    }

    return report.length > 0 ? report.join('\n') : '✅ All constitutional gates passed';
  }
}

module.exports = { ConstitutionalGates };
