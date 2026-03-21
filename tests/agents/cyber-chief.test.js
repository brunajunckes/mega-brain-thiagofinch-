const fs = require('fs');
const path = require('path');

describe('cyber-chief agent', () => {
  const agentPath = path.join(__dirname, '../../.claude/agents/cyber-chief.md');

  test('agent file exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  test('agent has correct frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: cyber-chief/);
    expect(content).toMatch(/description:/);
  });

  test('agent has required sections', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toMatch(/## .*Persona/i);
    expect(content).toMatch(/## .*Mission/i);
  });

  test('agent file is not empty', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });
});
