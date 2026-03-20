#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { ConstitutionalGates } = require('./constitutional-gates');

/**
 * Pre-commit hook - Enforce constitutional gates
 * Blocks commits on CRITICAL violations
 * Warns on MUST violations
 * Reports SHOULD violations
 */

async function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    throw new Error(`Failed to get git branch: ${error.message}`);
  }
}

async function getChangedFiles() {
  try {
    // Get both staged and unstaged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(f => f);

    const unstagedFiles = execSync('git diff --name-only', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(f => f);

    return [...new Set([...stagedFiles, ...unstagedFiles])];
  } catch (error) {
    throw new Error(`Failed to get changed files: ${error.message}`);
  }
}

async function getQualityChecks() {
  const checks = {
    lintPass: true,
    typecheckPass: true,
    testPass: true,
    buildPass: true,
    coderabbitCritical: 0,
  };

  // Try to run lint check
  try {
    execSync('npm run lint --silent', {
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    checks.lintPass = false;
  }

  // Try to run typecheck
  try {
    execSync('npm run typecheck --silent', {
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    checks.typecheckPass = false;
  }

  // Try to run tests
  try {
    execSync('npm test --silent -- --testPathIgnorePatterns=integration', {
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    checks.testPass = false;
  }

  // Try to run build
  try {
    execSync('npm run build --silent', {
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    checks.buildPass = false;
  }

  // CodeRabbit check (if available)
  // This would be run if CodeRabbit CLI is configured
  // For now, we skip this unless explicitly enabled

  return checks;
}

async function runGates(options = {}) {
  const {
    skipQuality = false,
    verbose = false,
    allowWarnings = false,
  } = options;

  console.log('🏛️  Running Constitutional Gates...\n');

  const gates = new ConstitutionalGates();
  const branch = await getGitBranch();
  const changedFiles = await getChangedFiles();

  if (verbose) {
    console.log(`📋 Branch: ${branch}`);
    console.log(`📝 Changed files: ${changedFiles.length}`);
    console.log();
  }

  // Prepare config for gates
  const gateConfig = {
    branch,
    changedFiles,
  };

  // Only run quality checks if not skipped
  if (!skipQuality && changedFiles.length > 0) {
    console.log('⏳ Running quality checks...');
    const qualityChecks = await getQualityChecks();
    gateConfig.qualityChecks = qualityChecks;

    if (verbose) {
      console.log(`   ✓ Lint: ${qualityChecks.lintPass ? '✅' : '❌'}`);
      console.log(`   ✓ Typecheck: ${qualityChecks.typecheckPass ? '✅' : '❌'}`);
      console.log(`   ✓ Tests: ${qualityChecks.testPass ? '✅' : '❌'}`);
      console.log(`   ✓ Build: ${qualityChecks.buildPass ? '✅' : '❌'}`);
      console.log();
    }
  }

  // Run validation
  const result = await gates.validate(gateConfig);

  // Get report
  const report = gates.getReport();
  console.log(report);
  console.log();

  // Handle violations
  if (!result.valid) {
    if (!allowWarnings) {
      const error = new Error('Commit blocked: Constitutional violations detected');
      error.code = 1;
      throw error;
    } else {
      console.warn('⚠️  Proceeding with violations (--allow-warnings flag set)');
    }
  }

  // Success
  console.log('✅ Constitutional gates passed');
  return result;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    skipQuality: args.includes('--skip-quality'),
    verbose: args.includes('--verbose'),
    allowWarnings: args.includes('--allow-warnings'),
  };

  runGates(options).catch(error => {
    console.error('❌ Error running gates:', error.message);
    process.exit(error.code || 1);
  });
}

module.exports = { runGates };
