const fs = require('fs');
const path = require('path');

describe('Specialized Agents', () => {
  const specializedAgents = [
    'brad-frost',
    'dan-mall',
    'dave-malouf',
    'db-sage',
    'design-system',
    'nano-banana-generator',
    'oalanicolas',
    'pedro-valerio',
    'sop-extractor',
    'squad-chief',
    'squad',
    'story-chief',
    'tools-orchestrator',
    'traffic-masters-chief',
  ];

  const agentsDir = path.join(__dirname, '../../.claude/agents');

  test('all 14 specialized agents exist', () => {
    specializedAgents.forEach(agent => {
      const filePath = path.join(agentsDir, `${agent}.md`);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('all specialized agents have valid headers', () => {
    specializedAgents.forEach(agent => {
      const filePath = path.join(agentsDir, `${agent}.md`);
      const content = fs.readFileSync(filePath, 'utf8');
      // Check for either YAML frontmatter or markdown heading format
      const hasYamlFrontmatter = /^---/.test(content);
      const hasMarkdownHeading = new RegExp(`^# ${agent}`).test(content);
      const hasYamlCodeBlock = /```yaml/.test(content);

      const isValid = (hasYamlFrontmatter && content.includes(`name: ${agent}`)) ||
                      (hasMarkdownHeading && hasYamlCodeBlock);
      expect(isValid).toBe(true);
    });
  });

  test('specialized agents are properly formatted', () => {
    specializedAgents.forEach(agent => {
      const filePath = path.join(agentsDir, `${agent}.md`);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
      // Check for either YAML frontmatter or agent activation configuration
      const hasConfiguration = /activation-instructions|tools:|description:|persona:/.test(content);
      expect(hasConfiguration).toBe(true);
    });
  });

  test('specialized agents registered in SYNAPSE manifest', () => {
    const manifestPath = path.join(__dirname, '../../.synapse/manifest');
    const manifest = fs.readFileSync(manifestPath, 'utf8');

    specializedAgents.forEach(agent => {
      const stateKey = `AGENT_${agent.toUpperCase().replace(/-/g, '_')}_STATE=active`;
      expect(manifest).toContain(stateKey);
    });
  });

  test('all specialized agents total 14', () => {
    expect(specializedAgents.length).toBe(14);
  });
});
