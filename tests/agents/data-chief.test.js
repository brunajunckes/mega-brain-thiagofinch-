const fs = require('fs');
const path = require('path');

describe('data-chief agent', () => {
  const agentPath = path.join(__dirname, '../../.claude/agents/data-chief.md');

  test('agent file exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  test('agent has correct frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: data-chief/);
  });

  test('agent file is not empty', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });
});
