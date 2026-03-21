const fs = require('fs');
const path = require('path');

describe('copy-chief agent', () => {
  const agentPath = path.join(__dirname, '../../.claude/agents/copy-chief.md');

  test('agent file exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  test('agent has correct frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: copy-chief/);
    expect(content).toMatch(/description:/);
  });

  test('agent has required sections', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toMatch(/## .*Persona/i);
    expect(content).toMatch(/## .*Mission/i);
    expect(content).toMatch(/## .*Router/i);
  });

  test('agent file is not empty', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });
});
