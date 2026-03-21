const fs = require('fs');
const path = require('path');

describe('IDE Sync Infrastructure', () => {
  const ideSync = path.join(__dirname, '../../.aiox-core/infrastructure/scripts/ide-sync');

  test('ide-sync directory exists', () => {
    expect(fs.existsSync(ideSync)).toBe(true);
  });

  test('ide-sync has main index.js', () => {
    const indexPath = path.join(ideSync, 'index.js');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  test('ide-sync has all required modules', () => {
    expect(fs.existsSync(path.join(ideSync, 'agent-parser.js'))).toBe(true);
    expect(fs.existsSync(path.join(ideSync, 'validator.js'))).toBe(true);
    expect(fs.existsSync(path.join(ideSync, 'redirect-generator.js'))).toBe(true);
  });

  test('all IDE directories exist', () => {
    const ideDir = path.join(__dirname, '../../');
    expect(fs.existsSync(path.join(ideDir, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(ideDir, '.codex'))).toBe(true);
    expect(fs.existsSync(path.join(ideDir, '.cursor'))).toBe(true);
    expect(fs.existsSync(path.join(ideDir, '.gemini'))).toBe(true);
    expect(fs.existsSync(path.join(ideDir, '.antigravity'))).toBe(true);
  });

  test('IDE directories have required structure', () => {
    const ideDir = path.join(__dirname, '../../');

    // Codex
    expect(fs.existsSync(path.join(ideDir, '.codex/agents'))).toBe(true);
    expect(fs.existsSync(path.join(ideDir, '.codex/skills'))).toBe(true);

    // Cursor
    expect(fs.existsSync(path.join(ideDir, '.cursor/rules'))).toBe(true);

    // Gemini
    expect(fs.existsSync(path.join(ideDir, '.gemini/commands'))).toBe(true);
    expect(fs.existsSync(path.join(ideDir, '.gemini/rules'))).toBe(true);

    // AntiGravity
    expect(fs.existsSync(path.join(ideDir, '.antigravity/rules'))).toBe(true);
  });

  test('transformers directory exists', () => {
    const transformers = path.join(ideSync, 'transformers');
    expect(fs.existsSync(transformers)).toBe(true);
    const files = fs.readdirSync(transformers);
    expect(files.length).toBeGreaterThan(0);
  });

  test('ide-sync has README documentation', () => {
    const readmePath = path.join(ideSync, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });
});
