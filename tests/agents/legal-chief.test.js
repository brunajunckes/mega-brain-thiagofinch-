const fs = require('fs');
const path = require('path');

describe('legal-chief agent', () => {
  const agentPath = path.join(__dirname, '../../.claude/agents/legal-chief.md');

  test('agent file exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  test('agent has correct frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: legal-chief/);
  });

  test('agent file is not empty', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });
});
