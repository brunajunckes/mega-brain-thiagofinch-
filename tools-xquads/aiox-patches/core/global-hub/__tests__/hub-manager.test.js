/**
 * Tests for hub-manager.js
 *
 * @story 9.1 — AIOX Global Hub
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// We'll mock the home directory to avoid touching the real ~/.aiox/
const MOCK_HOME = path.join(os.tmpdir(), `aiox-test-hub-${Date.now()}`);

// Patch os.homedir before requiring hub-manager
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => MOCK_HOME,
}));

const hub = require('../hub-manager');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rmrf(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Use a temp dir as fake project root
let tempProjectRoot;

beforeEach(() => {
  rmrf(MOCK_HOME);
  tempProjectRoot = path.join(os.tmpdir(), `aiox-test-project-${Date.now()}`);
  fs.mkdirSync(tempProjectRoot, { recursive: true });
});

afterEach(() => {
  rmrf(MOCK_HOME);
  rmrf(tempProjectRoot);
});

// ---------------------------------------------------------------------------
// Path Utilities
// ---------------------------------------------------------------------------

describe('Path Utilities', () => {
  test('getGlobalHubPath returns ~/.aiox', () => {
    expect(hub.getGlobalHubPath()).toBe(path.join(MOCK_HOME, '.aiox'));
  });

  test('getLocalConfigPath returns .aiox/config.yaml under projectRoot', () => {
    expect(hub.getLocalConfigPath('/some/project')).toBe(path.join('/some/project', '.aiox', 'config.yaml'));
  });
});

// ---------------------------------------------------------------------------
// createDefaultHub
// ---------------------------------------------------------------------------

describe('createDefaultHub', () => {
  test('creates ~/.aiox/ with all subdirs and config.yaml', async () => {
    const { created, skipped } = await hub.createDefaultHub();

    const hubPath = hub.getGlobalHubPath();
    expect(fs.existsSync(hubPath)).toBe(true);

    for (const subdir of hub.GLOBAL_SUBDIRS) {
      expect(fs.existsSync(path.join(hubPath, subdir))).toBe(true);
    }

    expect(fs.existsSync(hub.getGlobalConfigPath())).toBe(true);
    expect(created.length).toBeGreaterThan(0);
  });

  test('is idempotent — calling twice does not throw', async () => {
    await hub.createDefaultHub();
    const { skipped } = await hub.createDefaultHub();
    expect(skipped.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Global Config — Load / Save
// ---------------------------------------------------------------------------

describe('Global Config', () => {
  test('loadGlobalConfig returns defaults when file does not exist', () => {
    const config = hub.loadGlobalConfig();
    expect(config.version).toBe('1.0.0');
    expect(config.defaultConcurrency).toBe(3);
    expect(config.handoffRetentionDays).toBe(7);
    expect(config.projects).toEqual({});
  });

  test('saveGlobalConfig persists and loadGlobalConfig reads it back', async () => {
    await hub.createDefaultHub();

    const custom = {
      ...hub.GLOBAL_CONFIG_DEFAULTS,
      defaultConcurrency: 5,
      projects: { myproject: '/path/to/myproject' },
    };

    await hub.saveGlobalConfig(custom);
    const loaded = hub.loadGlobalConfig();

    expect(loaded.defaultConcurrency).toBe(5);
    expect(loaded.projects.myproject).toBe('/path/to/myproject');
  });
});

// ---------------------------------------------------------------------------
// Local Config — Load / Save
// ---------------------------------------------------------------------------

describe('Local Config', () => {
  test('loadLocalConfig returns null when .aiox/config.yaml does not exist', () => {
    const result = hub.loadLocalConfig(tempProjectRoot);
    expect(result).toBeNull();
  });

  test('saveLocalConfig creates .aiox/config.yaml and loadLocalConfig reads it back', async () => {
    const config = { extends: 'global', name: 'test-project', projectPath: tempProjectRoot };
    await hub.saveLocalConfig(config, tempProjectRoot);

    const loaded = hub.loadLocalConfig(tempProjectRoot);
    expect(loaded.name).toBe('test-project');
    expect(loaded.extends).toBe('global');
  });
});

// ---------------------------------------------------------------------------
// Project Registration
// ---------------------------------------------------------------------------

describe('Project Registration', () => {
  test('registerProject adds project to global config', async () => {
    await hub.registerProject('myapp', '/home/user/myapp');

    const projects = hub.listProjects();
    expect(projects.myapp).toBe('/home/user/myapp');
  });

  test('unregisterProject removes project and returns true', async () => {
    await hub.registerProject('myapp', '/home/user/myapp');

    const removed = await hub.unregisterProject('myapp');
    expect(removed).toBe(true);

    const projects = hub.listProjects();
    expect(projects.myapp).toBeUndefined();
  });

  test('unregisterProject returns false when project not found', async () => {
    await hub.createDefaultHub();
    const removed = await hub.unregisterProject('nonexistent');
    expect(removed).toBe(false);
  });

  test('registerProject multiple projects', async () => {
    await hub.registerProject('app1', '/projects/app1');
    await hub.registerProject('app2', '/projects/app2');

    const projects = hub.listProjects();
    expect(Object.keys(projects)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// initProject
// ---------------------------------------------------------------------------

describe('initProject', () => {
  test('creates global hub, local config, and registers project', async () => {
    const result = await hub.initProject(tempProjectRoot);

    expect(result.globalHubCreated).toBe(true);
    expect(result.projectName).toBeTruthy();
    expect(fs.existsSync(result.localConfigPath)).toBe(true);

    // Check project registered in global hub
    const projects = hub.listProjects();
    expect(projects[result.projectName]).toBe(tempProjectRoot);
  });

  test('detects project name from package.json', async () => {
    // Write a package.json with a name
    fs.writeFileSync(
      path.join(tempProjectRoot, 'package.json'),
      JSON.stringify({ name: 'my-cool-app', version: '1.0.0' }),
    );

    const result = await hub.initProject(tempProjectRoot);
    expect(result.projectName).toBe('my-cool-app');
  });

  test('falls back to directory name when no package.json', async () => {
    const result = await hub.initProject(tempProjectRoot);
    // Should be the basename of tempProjectRoot
    expect(result.projectName).toBe(path.basename(tempProjectRoot));
  });

  test('does not fail if global hub already exists', async () => {
    await hub.createDefaultHub();

    const result = await hub.initProject(tempProjectRoot);
    expect(result.globalHubCreated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveConfig (deep merge)
// ---------------------------------------------------------------------------

describe('resolveConfig', () => {
  test('returns global defaults when no local config exists', async () => {
    await hub.createDefaultHub();

    const resolved = hub.resolveConfig(tempProjectRoot);
    expect(resolved.defaultConcurrency).toBe(3);
  });

  test('local config overrides global when extends: global', async () => {
    await hub.saveGlobalConfig({ ...hub.GLOBAL_CONFIG_DEFAULTS, defaultConcurrency: 3 });

    const localConfig = { extends: 'global', name: 'myapp', defaultConcurrency: 5 };
    await hub.saveLocalConfig(localConfig, tempProjectRoot);

    const resolved = hub.resolveConfig(tempProjectRoot);
    expect(resolved.defaultConcurrency).toBe(5); // local wins
    expect(resolved.handoffRetentionDays).toBe(7); // inherited from global
  });
});

// ---------------------------------------------------------------------------
// Squad Resolution
// ---------------------------------------------------------------------------

describe('Squad Resolution', () => {
  test('resolveSquadPath returns null when squad not found', async () => {
    await hub.createDefaultHub();
    const result = hub.resolveSquadPath('nonexistent', tempProjectRoot);
    expect(result).toBeNull();
  });

  test('resolveSquadPath finds squad in global hub', async () => {
    await hub.createDefaultHub();

    const squadPath = path.join(hub.getGlobalHubPath(), 'squads', 'backend.yaml');
    fs.writeFileSync(squadPath, 'name: backend\nagents: [dev, qa]\n');

    const resolved = hub.resolveSquadPath('backend', tempProjectRoot);
    expect(resolved).toBe(squadPath);
  });

  test('local squad overrides global squad with same name', async () => {
    await hub.createDefaultHub();

    // Write global squad
    const globalSquadPath = path.join(hub.getGlobalHubPath(), 'squads', 'backend.yaml');
    fs.writeFileSync(globalSquadPath, 'name: backend-global\n');

    // Write local squad
    const localSquadsDir = path.join(tempProjectRoot, '.aiox', 'squads');
    fs.mkdirSync(localSquadsDir, { recursive: true });
    const localSquadPath = path.join(localSquadsDir, 'backend.yaml');
    fs.writeFileSync(localSquadPath, 'name: backend-local\n');

    const resolved = hub.resolveSquadPath('backend', tempProjectRoot);
    expect(resolved).toBe(localSquadPath); // local wins
  });

  test('listSquads returns all squads with correct source', async () => {
    await hub.createDefaultHub();

    // Global squad
    fs.writeFileSync(path.join(hub.getGlobalHubPath(), 'squads', 'alpha.yaml'), 'name: alpha\n');

    // Local squad
    const localSquadsDir = path.join(tempProjectRoot, '.aiox', 'squads');
    fs.mkdirSync(localSquadsDir, { recursive: true });
    fs.writeFileSync(path.join(localSquadsDir, 'beta.yaml'), 'name: beta\n');

    const squads = hub.listSquads(tempProjectRoot);
    expect(squads).toHaveLength(2);

    const alpha = squads.find((s) => s.name === 'alpha');
    const beta = squads.find((s) => s.name === 'beta');

    expect(alpha.source).toBe('global');
    expect(beta.source).toBe('local');
  });
});

// ---------------------------------------------------------------------------
// deepMerge
// ---------------------------------------------------------------------------

describe('deepMerge', () => {
  test('merges nested objects', () => {
    const target = { a: { b: 1, c: 2 }, d: 3 };
    const source = { a: { b: 99, e: 5 }, f: 6 };
    const result = hub.deepMerge(target, source);

    expect(result.a.b).toBe(99); // overridden
    expect(result.a.c).toBe(2); // preserved
    expect(result.a.e).toBe(5); // added
    expect(result.d).toBe(3); // preserved
    expect(result.f).toBe(6); // added
  });

  test('arrays are replaced, not merged', () => {
    const target = { arr: [1, 2, 3] };
    const source = { arr: [4, 5] };
    const result = hub.deepMerge(target, source);
    expect(result.arr).toEqual([4, 5]);
  });

  test('null source values override target', () => {
    const target = { a: 'hello' };
    const source = { a: null };
    const result = hub.deepMerge(target, source);
    expect(result.a).toBeNull();
  });
});
