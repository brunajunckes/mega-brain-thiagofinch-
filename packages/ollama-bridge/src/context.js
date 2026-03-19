const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class Context {
  static loadContext() {
    return {
      branch: Context.getBranch(),
      stories: Context.getActiveStories(),
      rules: Context.getRules(),
      lastCommit: Context.getLastCommit(),
      projectPath: process.cwd(),
    };
  }

  static getBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  static getLastCommit() {
    try {
      return execSync('git log -1 --oneline', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  static getActiveStories() {
    const storiesDir = path.join(process.cwd(), 'docs', 'stories');
    if (!fs.existsSync(storiesDir)) return [];
    return fs.readdirSync(storiesDir)
      .filter(f => f.endsWith('.story.md'))
      .map(f => f.replace('.story.md', ''))
      .sort()
      .slice(0, 5);
  }

  static getRules() {
    const rulesDir = path.join(process.cwd(), '.claude', 'rules');
    if (!fs.existsSync(rulesDir)) return [];
    return fs.readdirSync(rulesDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  }

  static formatContext() {
    const ctx = Context.loadContext();
    return `
## AIOX Context
- **Branch:** ${ctx.branch}
- **Last Commit:** ${ctx.lastCommit}
- **Active Stories:** ${ctx.stories.join(', ') || 'none'}
- **Rules Loaded:** ${ctx.rules.join(', ') || 'none'}
`;
  }
}

module.exports = Context;
