'use strict';

const path = require('path');
const fs = require('fs-extra');
const { TaskLoader } = require('../task-loader');

describe('TaskLoader', () => {
  let loader;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-tasks');
    await fs.ensureDir(testDir);
    loader = new TaskLoader({ tasksDir: testDir });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('discover', () => {
    it('should discover markdown files', async () => {
      // Create test task files
      await fs.writeFile(path.join(testDir, 'task-1.md'), '# Task 1\nContent');
      await fs.writeFile(path.join(testDir, 'task-2.md'), '# Task 2\nContent');

      const tasks = await loader.discover();
      expect(tasks).toContain('task-1');
      expect(tasks).toContain('task-2');
    });

    it('should return empty array for empty directory', async () => {
      const tasks = await loader.discover();
      expect(tasks).toEqual([]);
    });

    it('should ignore non-markdown files', async () => {
      await fs.writeFile(path.join(testDir, 'task-1.md'), '# Task 1');
      await fs.writeFile(path.join(testDir, 'readme.txt'), 'Not a task');
      await fs.writeFile(path.join(testDir, 'config.json'), '{}');

      const tasks = await loader.discover();
      expect(tasks).toEqual(['task-1']);
    });

    it('should handle nested directories', async () => {
      await fs.ensureDir(path.join(testDir, 'folder1'));
      await fs.writeFile(path.join(testDir, 'task-1.md'), '# Task 1');
      await fs.writeFile(path.join(testDir, 'folder1', 'task-2.md'), '# Task 2');

      const tasks = await loader.discover();
      // Should only find files in root directory, not nested
      expect(tasks).toContain('task-1');
    });
  });

  describe('load', () => {
    it('should load task with frontmatter', async () => {
      const content = `---
id: test-task
name: Test Task
priority: high
---

# Task Description

Task content here`;

      await fs.writeFile(path.join(testDir, 'test-task.md'), content);

      const task = await loader.load('test-task');
      expect(task.id).toBe('test-task');
      expect(task.metadata.id).toBe('test-task');
      expect(task.metadata.name).toBe('Test Task');
      expect(task.metadata.priority).toBe('high');
      expect(task.content).toContain('# Task Description');
    });

    it('should load task without frontmatter', async () => {
      const content = '# Task Content\n\nSome content';
      await fs.writeFile(path.join(testDir, 'plain-task.md'), content);

      const task = await loader.load('plain-task');
      expect(task.content).toBe(content);
      expect(task.metadata).toBeDefined();
    });

    it('should handle missing task file', async () => {
      await expect(loader.load('nonexistent')).rejects.toThrow();
    });

    it('should parse simple YAML frontmatter', async () => {
      const content = `---
priority: high
status: active
author: test
---

Content`;

      await fs.writeFile(path.join(testDir, 'complex-task.md'), content);

      const task = await loader.load('complex-task');
      expect(task.metadata.priority).toBe('high');
      expect(task.metadata.status).toBe('active');
      expect(task.metadata.author).toBe('test');
    });

    it('should handle task with empty content', async () => {
      const content = `---
name: Empty Task
---`;

      await fs.writeFile(path.join(testDir, 'empty-task.md'), content);

      const task = await loader.load('empty-task');
      expect(task.id).toBe('empty-task');
      expect(task.metadata.name).toBe('Empty Task');
    });

    it('should preserve content after frontmatter boundary', async () => {
      const content = `---
id: task-with-dashes
---

---
# This is not frontmatter
content: here
---

More content`;

      await fs.writeFile(path.join(testDir, 'task-with-dashes.md'), content);

      const task = await loader.load('task-with-dashes');
      expect(task.content).toContain('# This is not frontmatter');
      expect(task.content).toContain('content: here');
    });
  });

  describe('edge cases', () => {
    it('should handle task file with only frontmatter', async () => {
      const content = `---
name: Metadata Only Task
priority: high
---`;

      await fs.writeFile(path.join(testDir, 'metadata-only.md'), content);

      const task = await loader.load('metadata-only');
      expect(task.id).toBe('metadata-only');
      expect(task.metadata.name).toBe('Metadata Only Task');
    });

    it('should handle malformed frontmatter gracefully', async () => {
      const content = `---
invalid: unclosed
---

Content`;

      await fs.writeFile(path.join(testDir, 'bad-yaml.md'), content);

      // Should still load the task, even if frontmatter is simple
      const task = await loader.load('bad-yaml');
      expect(task.content).toBeDefined();
    });

    it('should handle file without closing frontmatter', async () => {
      const content = `---
name: No Close

Content without closing ---`;

      await fs.writeFile(path.join(testDir, 'no-close.md'), content);

      const task = await loader.load('no-close');
      // Should treat entire content as body since no closing --- found
      expect(task.content).toBeDefined();
    });

    it('should handle special characters in task ID', async () => {
      const content = '---\nname: Special Task\n---\nContent';
      await fs.writeFile(path.join(testDir, 'task-with-special_chars.v2.md'), content);

      const task = await loader.load('task-with-special_chars.v2');
      expect(task.id).toBe('task-with-special_chars.v2');
    });

    it('should handle Unicode in content', async () => {
      const content = `---
name: Unicode Task - 中文 🚀
---

Content with émojis 🎉 and spëcial chars`;

      await fs.writeFile(path.join(testDir, 'unicode-task.md'), content);

      const task = await loader.load('unicode-task');
      expect(task.metadata.name).toContain('中文');
      expect(task.content).toContain('🎉');
    });
  });
});
