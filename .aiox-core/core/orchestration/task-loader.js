/**
 * Task Loader - Loads task definitions from filesystem
 * @module task-loader
 */

'use strict';

const fs = require('fs').promises;
const path = require('path');

class TaskLoader {
  constructor(options = {}) {
    this.tasksDir = options.tasksDir;
  }

  /**
   * Discover all task files
   */
  async discover() {
    try {
      const files = await fs.readdir(this.tasksDir);
      return files
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace(/\.md$/, ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Load a single task definition
   */
  async load(taskId) {
    const filePath = path.join(this.tasksDir, `${taskId}.md`);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return this.parseTask(taskId, content);
    } catch (error) {
      throw new Error(`Failed to load task ${taskId}: ${error.message}`);
    }
  }

  /**
   * Parse task markdown with frontmatter
   */
  parseTask(taskId, content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    const metadata = match ? this.parseFrontmatter(match[1]) : {};

    return {
      id: taskId,
      metadata: {
        id: taskId,
        title: metadata.task || taskId,
        ...metadata,
      },
      content,
    };
  }

  /**
   * Parse YAML-like frontmatter
   */
  parseFrontmatter(yaml) {
    const metadata = {};
    const lines = yaml.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      metadata[key.trim()] = value || true;
    }

    return metadata;
  }
}

module.exports = { TaskLoader };
