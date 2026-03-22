'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { QARulesEngine } = require('../qa-rules-engine');

describe('QARulesEngine', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `qa-rules-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.aiox'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should load default rules when no config file exists', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const rules = engine.toConfig();

      expect(rules.codeStyle).toBeDefined();
      expect(rules.testCoverage).toBeDefined();
      expect(rules.documentation).toBeDefined();
      expect(rules.performance).toBeDefined();
      expect(rules.security).toBeDefined();
      expect(rules.typeSafety).toBeDefined();
      expect(rules.integration).toBeDefined();
    });

    it('should have all 7 criteria enabled by default', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });

      expect(engine.isEnabled('codeStyle')).toBe(true);
      expect(engine.isEnabled('testCoverage')).toBe(true);
      expect(engine.isEnabled('documentation')).toBe(true);
      expect(engine.isEnabled('performance')).toBe(true);
      expect(engine.isEnabled('security')).toBe(true);
      expect(engine.isEnabled('typeSafety')).toBe(true);
      expect(engine.isEnabled('integration')).toBe(true);
    });

    it('should return false for unknown criteria', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      expect(engine.isEnabled('nonExistent')).toBe(false);
    });
  });

  describe('custom rules loading', () => {
    it('should load custom rules from YAML file', () => {
      const customRules = `
codeStyle:
  maxLineLength: 100
  indentSize: 4
testCoverage:
  enabled: false
`;
      fs.writeFileSync(path.join(tmpDir, '.aiox', 'qa-rules.yaml'), customRules);

      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const rules = engine.toConfig();

      expect(rules.codeStyle.maxLineLength).toBe(100);
      expect(rules.codeStyle.indentSize).toBe(4);
      expect(rules.testCoverage.enabled).toBe(false);
      // Default values should still exist for non-overridden fields
      expect(rules.codeStyle.requireSemicolons).toBe(true);
    });

    it('should handle invalid YAML gracefully', () => {
      fs.writeFileSync(path.join(tmpDir, '.aiox', 'qa-rules.yaml'), '{{invalid yaml: :::');

      // Should not throw, should fall back to defaults
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const rules = engine.toConfig();

      expect(rules.codeStyle).toBeDefined();
      expect(rules.security).toBeDefined();
    });

    it('should support custom rules path', () => {
      const customPath = path.join(tmpDir, 'custom-rules.yaml');
      const customRules = `
security:
  severity: high
`;
      fs.writeFileSync(customPath, customRules);

      const engine = new QARulesEngine({ rulesPath: customPath, projectRoot: tmpDir });
      expect(engine.getSeverity('security')).toBe('high');
    });
  });

  describe('getEnabledRules', () => {
    it('should return only enabled rules', () => {
      const customRules = `
testCoverage:
  enabled: false
documentation:
  enabled: false
`;
      fs.writeFileSync(path.join(tmpDir, '.aiox', 'qa-rules.yaml'), customRules);

      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const enabled = engine.getEnabledRules();

      expect(enabled.testCoverage).toBeUndefined();
      expect(enabled.documentation).toBeUndefined();
      expect(enabled.codeStyle).toBeDefined();
      expect(enabled.security).toBeDefined();
    });
  });

  describe('severity', () => {
    it('should return correct default severities', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });

      expect(engine.getSeverity('security')).toBe('critical');
      expect(engine.getSeverity('testCoverage')).toBe('high');
      expect(engine.getSeverity('codeStyle')).toBe('medium');
    });

    it('should return medium for unknown criteria', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      expect(engine.getSeverity('nonExistent')).toBe('medium');
    });

    it('should return numeric severity values', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });

      expect(engine.getSeverityValue('critical')).toBe(3);
      expect(engine.getSeverityValue('high')).toBe(2);
      expect(engine.getSeverityValue('medium')).toBe(1);
      expect(engine.getSeverityValue('low')).toBe(0);
      expect(engine.getSeverityValue('CRITICAL')).toBe(3);
      expect(engine.getSeverityValue('unknown')).toBe(1);
    });
  });

  describe('getRule', () => {
    it('should return rule config for known criterion', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const rule = engine.getRule('security');

      expect(rule).toBeDefined();
      expect(rule.noHardcodedSecrets).toBe(true);
      expect(rule.noEval).toBe(true);
    });

    it('should return null for unknown criterion', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      expect(engine.getRule('nonExistent')).toBeNull();
    });
  });

  describe('evaluateCustomPatterns', () => {
    it('should detect custom security patterns', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const content = 'const password = "secret123";';

      const findings = engine.evaluateCustomPatterns(content);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].rule).toBe('hardcoded-password');
      expect(findings[0].severity).toBe('CRITICAL');
    });

    it('should skip when content uses env vars', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const content = 'const password = process.env.PASSWORD;';

      const findings = engine.evaluateCustomPatterns(content);
      expect(findings.length).toBe(0);
    });

    it('should handle empty patterns list', () => {
      const customRules = `
security:
  patterns: []
`;
      fs.writeFileSync(path.join(tmpDir, '.aiox', 'qa-rules.yaml'), customRules);

      const engine = new QARulesEngine({ projectRoot: tmpDir });
      const findings = engine.evaluateCustomPatterns('const x = 1;');
      expect(findings.length).toBe(0);
    });
  });

  describe('reload', () => {
    it('should reload rules from disk', () => {
      const engine = new QARulesEngine({ projectRoot: tmpDir });
      expect(engine.getSeverity('codeStyle')).toBe('medium');

      // Write new config
      const customRules = `
codeStyle:
  severity: high
`;
      fs.writeFileSync(path.join(tmpDir, '.aiox', 'qa-rules.yaml'), customRules);

      engine.reload();
      expect(engine.getSeverity('codeStyle')).toBe('high');
    });
  });
});
