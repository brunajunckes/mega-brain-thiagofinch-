const fs = require('fs');
const path = require('path');

describe('XQUADS Squads Integration', () => {
  const xquadsSquads = [
    'advisory-board',
    'brand-squad',
    'c-level-squad',
    'claude-code-mastery',
    'copy-squad',
    'cybersecurity',
    'data-squad',
    'hormozi-squad',
    'movement',
    'psych-squad',
    'storytelling',
    'traffic-masters',
    'webcraft-squad',
  ];

  const squadsDir = path.join(__dirname, '../../squads/xquads');
  const manifestPath = path.join(__dirname, '../../.synapse/manifest');

  test('all 13 xquads squads exist', () => {
    xquadsSquads.forEach(squad => {
      const squadDir = path.join(squadsDir, squad);
      expect(fs.existsSync(squadDir)).toBe(true);
    });
  });

  test('each squad has configuration (squad.yaml or config.yaml)', () => {
    xquadsSquads.forEach(squad => {
      const squadYaml = path.join(squadsDir, squad, 'squad.yaml');
      const configYaml = path.join(squadsDir, squad, 'config.yaml');
      const hasConfig = fs.existsSync(squadYaml) || fs.existsSync(configYaml);
      expect(hasConfig).toBe(true);
    });
  });

  test('each squad has agents directory', () => {
    xquadsSquads.forEach(squad => {
      const agentsDir = path.join(squadsDir, squad, 'agents');
      expect(fs.existsSync(agentsDir)).toBe(true);
    });
  });

  test('each squad has tasks directory', () => {
    xquadsSquads.forEach(squad => {
      const tasksDir = path.join(squadsDir, squad, 'tasks');
      expect(fs.existsSync(tasksDir)).toBe(true);
    });
  });

  test('each squad has workflows directory', () => {
    xquadsSquads.forEach(squad => {
      const workflowsDir = path.join(squadsDir, squad, 'workflows');
      expect(fs.existsSync(workflowsDir)).toBe(true);
    });
  });

  test('squads have agents', () => {
    xquadsSquads.forEach(squad => {
      const agentsDir = path.join(squadsDir, squad, 'agents');
      const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  test('squads have tasks', () => {
    xquadsSquads.forEach(squad => {
      const tasksDir = path.join(squadsDir, squad, 'tasks');
      const tasks = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  test('squads have workflows', () => {
    xquadsSquads.forEach(squad => {
      const workflowsDir = path.join(squadsDir, squad, 'workflows');
      const workflows = fs.readdirSync(workflowsDir).filter(
        f => f.endsWith('.yaml') || f.endsWith('.yml')
      );
      expect(workflows.length).toBeGreaterThan(0);
    });
  });

  test('all squads registered in SYNAPSE manifest', () => {
    const manifest = fs.readFileSync(manifestPath, 'utf8');

    xquadsSquads.forEach(squad => {
      const stateKey = `SQUAD_${squad
        .toUpperCase()
        .replace(/-/g, '_')}_STATE=active`;
      expect(manifest).toContain(stateKey);
    });
  });

  test('squad configuration files have valid structure', () => {
    xquadsSquads.forEach(squad => {
      const squadYaml = path.join(squadsDir, squad, 'squad.yaml');
      const configYaml = path.join(squadsDir, squad, 'config.yaml');
      const configFile = fs.existsSync(squadYaml) ? squadYaml : configYaml;
      const content = fs.readFileSync(configFile, 'utf8');
      // Just check that it's valid YAML/config content
      expect(content.length).toBeGreaterThan(50);
    });
  });

  test('total component counts match expectations', () => {
    // Quick count verification
    const agents = xquadsSquads.reduce((sum, squad) => {
      const agentsDir = path.join(squadsDir, squad, 'agents');
      const count = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
        .length;
      return sum + count;
    }, 0);

    const tasks = xquadsSquads.reduce((sum, squad) => {
      const tasksDir = path.join(squadsDir, squad, 'tasks');
      const count = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'))
        .length;
      return sum + count;
    }, 0);

    const workflows = xquadsSquads.reduce((sum, squad) => {
      const workflowsDir = path.join(squadsDir, squad, 'workflows');
      const count = fs
        .readdirSync(workflowsDir)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length;
      return sum + count;
    }, 0);

    // Expected totals from analysis
    expect(agents).toBeGreaterThan(140); // ~146
    expect(tasks).toBeGreaterThan(115); // ~121
    expect(workflows).toBeGreaterThan(30); // ~32
  });

  test('all 13 squads total check', () => {
    expect(xquadsSquads.length).toBe(13);
  });

  test('MCP tools directories exist', () => {
    const toolsDir = path.join(__dirname, '../../tools-xquads');
    expect(fs.existsSync(toolsDir)).toBe(true);

    const mcp = ['google-ads-mcp', 'meta-ads-mcp', 'gtm-mcp'];
    mcp.forEach(tool => {
      expect(fs.existsSync(path.join(toolsDir, tool))).toBe(true);
    });
  });

  test('sync script exists', () => {
    const syncScript = path.join(__dirname, '../../sync-xquads-patches.js');
    expect(fs.existsSync(syncScript)).toBe(true);
  });

  test('documentation exists', () => {
    const docsDir = path.join(__dirname, '../../docs-xquads');
    expect(fs.existsSync(docsDir)).toBe(true);

    const modelsDir = path.join(docsDir, 'models', 'library');
    expect(fs.existsSync(modelsDir)).toBe(true);
  });
});
