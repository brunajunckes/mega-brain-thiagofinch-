/**
 * Global Hub Check
 *
 * Verifies that the AIOX Global Hub (~/.aiox/) exists, has valid structure,
 * and that the current project is registered.
 *
 * @module aiox-core/health-check/checks/project/global-hub
 * @story 9.1 — AIOX Global Hub
 * @version 1.0.0
 */

'use strict';

const path = require('path');
const { BaseCheck, CheckSeverity, CheckDomain } = require('../../base-check');

const HUB_MANAGER_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'core', 'global-hub', 'hub-manager');

/**
 * Global Hub health check
 *
 * @class GlobalHubCheck
 * @extends BaseCheck
 */
class GlobalHubCheck extends BaseCheck {
  constructor() {
    super({
      id: 'project.global-hub',
      name: 'AIOX Global Hub',
      description: 'Verifies ~/.aiox/ hub exists, has valid structure, and project is registered',
      domain: CheckDomain.PROJECT,
      severity: CheckSeverity.LOW,
      timeout: 3000,
      cacheable: true,
      healingTier: 2,
      tags: ['aiox', 'global-hub', 'config'],
    });
  }

  async execute(context) {
    let hub;
    try {
      hub = require(HUB_MANAGER_PATH);
    } catch (err) {
      return this.warning('hub-manager module not loadable', {
        recommendation: 'Ensure Story 9.1 implementation is complete',
        details: { error: err.message },
      });
    }

    const projectRoot = context.projectRoot || process.cwd();
    const details = {};

    // 1. Check if global hub exists
    if (!hub.isGlobalHubInitialized()) {
      return this.warning(`Global hub not found at: ${hub.getGlobalHubPath()}`, {
        recommendation: "Run 'aiox hub init' to create the global hub",
        healable: true,
        healingTier: 2,
        details: { hubPath: hub.getGlobalHubPath() },
      });
    }

    details.hubPath = hub.getGlobalHubPath();

    // 2. Validate hub structure
    const validation = hub.validateGlobalHub();
    if (!validation.valid) {
      return this.fail(`Global hub has critical issues: ${validation.issues.join('; ')}`, {
        recommendation: "Run 'aiox hub init' to repair the hub structure",
        details: { issues: validation.issues, warnings: validation.warnings },
      });
    }

    if (validation.warnings.length > 0) {
      details.warnings = validation.warnings;
    }

    // 3. Validate config.yaml
    let config;
    try {
      config = hub.loadGlobalConfig();
      details.version = config.version;
      details.defaultConcurrency = config.defaultConcurrency;
      details.handoffRetentionDays = config.handoffRetentionDays;
    } catch (err) {
      return this.fail(`Invalid ~/.aiox/config.yaml: ${err.message}`, {
        recommendation: 'Check YAML syntax in ~/.aiox/config.yaml',
        details: { error: err.message },
      });
    }

    // 4. List registered projects
    const projects = hub.listProjects();
    const projectNames = Object.keys(projects);
    details.registeredProjects = projectNames.length;

    // 5. Check if current project is registered
    const localConfig = hub.loadLocalConfig(projectRoot);
    if (!localConfig) {
      if (validation.warnings.length > 0) {
        return this.warning('Global hub OK but current project has no local .aiox/config.yaml', {
          recommendation: "Run 'aiox hub init' in this project to register it",
          details: { ...details, localConfig: null },
        });
      }
    } else {
      details.projectName = localConfig.name;
      details.extendsGlobal = localConfig.extends === 'global';
    }

    const message = validation.warnings.length > 0
      ? `Global hub OK with ${validation.warnings.length} warning(s). ${projectNames.length} project(s) registered.`
      : `Global hub OK. ${projectNames.length} project(s) registered.`;

    return this.pass(message, { details });
  }

  getHealer() {
    return {
      name: 'init-global-hub',
      action: 'run-command',
      successMessage: 'Global hub initialized',
      fix: async (_result) => {
        const hub = require(HUB_MANAGER_PATH);
        const { created } = await hub.createDefaultHub();
        return {
          success: true,
          message: `Created ${created.length} item(s) in global hub`,
        };
      },
    };
  }
}

module.exports = GlobalHubCheck;
