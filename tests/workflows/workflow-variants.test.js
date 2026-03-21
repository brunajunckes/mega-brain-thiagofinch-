const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Workflow Variants', () => {
  const workflowsDir = path.join(__dirname, '../../.aiox-core/development/workflows');
  const workflowFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yaml'));

  test('workflows directory has expected files', () => {
    expect(workflowFiles.length).toBeGreaterThanOrEqual(14);
    expect(workflowFiles).toContain('greenfield-fullstack.yaml');
    expect(workflowFiles).toContain('brownfield-discovery.yaml');
    expect(workflowFiles).toContain('auto-worktree.yaml');
  });

  test('greenfield workflows exist', () => {
    expect(fs.existsSync(path.join(workflowsDir, 'greenfield-fullstack.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(workflowsDir, 'greenfield-service.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(workflowsDir, 'greenfield-ui.yaml'))).toBe(true);
  });

  test('brownfield workflows exist', () => {
    expect(fs.existsSync(path.join(workflowsDir, 'brownfield-discovery.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(workflowsDir, 'brownfield-fullstack.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(workflowsDir, 'brownfield-service.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(workflowsDir, 'brownfield-ui.yaml'))).toBe(true);
  });

  test('all workflow files have valid YAML syntax', () => {
    const results = {
      valid: 0,
      invalid: 0,
      errors: [],
    };

    workflowFiles.forEach(file => {
      const filePath = path.join(workflowsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        yaml.load(content);
        results.valid++;
      } catch (error) {
        results.invalid++;
        results.errors.push(`${file}: ${error.message}`);
      }
    });

    expect(results.invalid).toBe(0);
    expect(results.valid).toBeGreaterThanOrEqual(14);
  });

  test('design-system-build-quality workflow exists', () => {
    expect(fs.existsSync(path.join(workflowsDir, 'design-system-build-quality.yaml'))).toBe(true);
  });

  test('auto-worktree workflow exists', () => {
    expect(fs.existsSync(path.join(workflowsDir, 'auto-worktree.yaml'))).toBe(true);
  });

  test('all workflow files are not empty', () => {
    workflowFiles.forEach(file => {
      const filePath = path.join(workflowsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content.length).toBeGreaterThan(50);
    });
  });
});
