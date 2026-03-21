const fs = require('fs');
const path = require('path');

describe('Multi-LLM Support Integration', () => {
  test('Gemini commands directory exists', () => {
    const geminiDir = path.join(__dirname, '../../.gemini/commands');
    expect(fs.existsSync(geminiDir)).toBe(true);
  });

  test('Gemini has agent command files', () => {
    const geminiDir = path.join(__dirname, '../../.gemini/commands');
    const files = fs.readdirSync(geminiDir).filter(f => f.endsWith('.toml'));
    expect(files.length).toBeGreaterThan(5);
  });

  test('Claude Code integration maintained', () => {
    const claudeDir = path.join(__dirname, '../../.claude');
    expect(fs.existsSync(claudeDir)).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, 'agents'))).toBe(true);
  });

  test('All major IDE platforms available', () => {
    const ideDir = path.join(__dirname, '../../');
    const ides = ['.claude', '.codex', '.cursor', '.gemini', '.antigravity'];
    ides.forEach(ide => {
      expect(fs.existsSync(path.join(ideDir, ide))).toBe(true);
    });
  });

  test('Fallback routing configured', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.scripts['sync:ide:gemini']).toBeDefined();
    expect(packageJson.scripts['sync:ide:claude']).toBeDefined();
  });
});
