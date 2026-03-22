'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { TaskChainConfig } = require('../../../packages/task-chaining/src/task-chain-config');

describe('TaskChainConfig', () => {
  let tmpDir;
  let configPath;

  const validYaml = `chains:
  build-and-test:
    description: Build then test
    tasks:
      - name: build
        task: npm run build
        timeout: 300
      - name: test
        task: npm test
        depends_on: build
  lint-only:
    description: Just lint
    tasks:
      - name: lint
        task: npm run lint
`;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-chain-'));
    configPath = path.join(tmpDir, 'task-chains.yaml');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should accept custom config path', () => {
      const config = new TaskChainConfig({ configPath: '/custom/path.yaml' });
      expect(config.configPath).toBe('/custom/path.yaml');
    });

    it('should accept custom yaml parser', () => {
      const parser = (content) => ({ chains: {} });
      const config = new TaskChainConfig({ yamlParser: parser });
      expect(config.yamlParser).toBe(parser);
    });
  });

  describe('load', () => {
    it('should load and parse valid config', () => {
      fs.writeFileSync(configPath, validYaml);
      const config = new TaskChainConfig({
        configPath,
        yamlParser: (content) => {
          // Simple parser for test
          return parseTestYaml(content);
        },
      });

      const result = config.load();
      expect(result).toBeDefined();
      expect(result.chains).toBeDefined();
    });

    it('should throw on missing config file', () => {
      const config = new TaskChainConfig({ configPath: '/nonexistent/file.yaml' });
      expect(() => config.load()).toThrow('Task chain config not found');
    });

    it('should throw on invalid config structure', () => {
      fs.writeFileSync(configPath, 'invalid content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({ invalid: true }),
      });

      expect(() => config.load()).toThrow('must have a "chains" section');
    });

    it('should throw when chains has no tasks array', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({ chains: { bad: { description: 'no tasks' } } }),
      });

      expect(() => config.load()).toThrow('must have a "tasks" array');
    });

    it('should throw when task has no name', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({
          chains: {
            test: { tasks: [{ task: 'npm test' }] },
          },
        }),
      });

      expect(() => config.load()).toThrow('must have a "name"');
    });
  });

  describe('getChains', () => {
    it('should return all chains', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      const chains = config.getChains();
      expect(Object.keys(chains)).toContain('build-and-test');
      expect(Object.keys(chains)).toContain('lint-only');
    });

    it('should auto-load if not already loaded', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      // getChains without explicit load
      const chains = config.getChains();
      expect(chains).toBeDefined();
    });
  });

  describe('getChain', () => {
    it('should return specific chain', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      const chain = config.getChain('build-and-test');
      expect(chain).toBeDefined();
      expect(chain.description).toBe('Build then test');
      expect(chain.tasks).toHaveLength(2);
    });

    it('should return null for unknown chain', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      expect(config.getChain('nonexistent')).toBeNull();
    });
  });

  describe('listChains', () => {
    it('should return chain names', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      const names = config.listChains();
      expect(names).toEqual(['build-and-test', 'lint-only']);
    });
  });

  describe('getOrderedTasks', () => {
    it('should return tasks in dependency order', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      const ordered = config.getOrderedTasks('build-and-test');
      expect(ordered[0].name).toBe('build');
      expect(ordered[1].name).toBe('test');
    });

    it('should return empty array for unknown chain', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      expect(config.getOrderedTasks('nonexistent')).toEqual([]);
    });

    it('should handle tasks with no dependencies', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      const ordered = config.getOrderedTasks('lint-only');
      expect(ordered).toHaveLength(1);
      expect(ordered[0].name).toBe('lint');
    });
  });

  describe('validateChain', () => {
    it('should validate a correct chain', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      const result = config.validateChain('build-and-test');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unknown chain', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });

      const result = config.validateChain('nonexistent');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not found');
    });

    it('should detect invalid dependency reference', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({
          chains: {
            bad: {
              description: 'Bad chain',
              tasks: [
                { name: 'a', depends_on: 'nonexistent' },
              ],
            },
          },
        }),
      });

      const result = config.validateChain('bad');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('unknown task');
    });

    it('should detect circular dependencies', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => ({
          chains: {
            circular: {
              description: 'Circular chain',
              tasks: [
                { name: 'a', depends_on: 'b' },
                { name: 'b', depends_on: 'a' },
              ],
            },
          },
        }),
      });

      const result = config.validateChain('circular');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Circular'))).toBe(true);
    });
  });

  describe('reload', () => {
    it('should return false if file does not exist', () => {
      const config = new TaskChainConfig({ configPath: '/nonexistent/file.yaml' });
      expect(config.reload()).toBe(false);
    });

    it('should return false if file has not changed', () => {
      fs.writeFileSync(configPath, 'content');
      const config = new TaskChainConfig({
        configPath,
        yamlParser: () => buildValidConfig(),
      });
      config.load();

      expect(config.reload()).toBe(false);
    });
  });

  describe('_simpleYamlParse', () => {
    it('should parse basic chain structure', () => {
      const config = new TaskChainConfig();
      const result = config._simpleYamlParse(validYaml);

      expect(result.chains).toBeDefined();
      expect(result.chains['build-and-test']).toBeDefined();
      expect(result.chains['build-and-test'].description).toBe('Build then test');
    });

    it('should handle empty content', () => {
      const config = new TaskChainConfig();
      const result = config._simpleYamlParse('');

      expect(result.chains).toBeDefined();
    });

    it('should handle comments', () => {
      const config = new TaskChainConfig();
      const result = config._simpleYamlParse('# comment\nchains:\n# another comment');

      expect(result.chains).toBeDefined();
    });
  });
});

/**
 * Build valid config object for testing
 */
function buildValidConfig() {
  return {
    chains: {
      'build-and-test': {
        description: 'Build then test',
        tasks: [
          { name: 'build', task: 'npm run build', timeout: 300 },
          { name: 'test', task: 'npm test', depends_on: 'build' },
        ],
      },
      'lint-only': {
        description: 'Just lint',
        tasks: [
          { name: 'lint', task: 'npm run lint' },
        ],
      },
    },
  };
}

/**
 * Parse test YAML (simplified)
 */
function parseTestYaml(content) {
  return buildValidConfig();
}
