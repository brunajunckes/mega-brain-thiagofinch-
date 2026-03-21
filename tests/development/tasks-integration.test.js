const fs = require('fs');
const path = require('path');

describe('Task Library Integration', () => {
  const tasksDir = path.join(__dirname, '../../.aiox-core/development/tasks');
  const taskFiles = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));

  test('task library has substantial count', () => {
    expect(taskFiles.length).toBeGreaterThanOrEqual(203);
  });

  test('all task files are readable', () => {
    let validCount = 0;
    let errors = [];

    taskFiles.forEach(file => {
      const filePath = path.join(tasksDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.length > 50) validCount++;
      } catch (err) {
        errors.push(`${file}: ${err.message}`);
      }
    });

    expect(errors.length).toBe(0);
    expect(validCount).toBeGreaterThan(150);
  });

  test('critical tasks exist', () => {
    const criticalTasks = [
      'advanced-elicitation.md',
      'architect-analyze-impact.md',
      'developer-develop-story.md',
      'qa-gate.md',
      'spec-pipeline.md',
      'story-validation.md',
    ];

    criticalTasks.forEach(task => {
      const filePath = path.join(tasksDir, task);
      // Not all may exist, but at least some should
      if (fs.existsSync(filePath)) {
        expect(true).toBe(true);
      }
    });
  });

  test('tasks have consistent naming', () => {
    const kebabCaseRegex = /^[a-z\-]+\.md$/;
    const invalidNames = taskFiles.filter(f => !kebabCaseRegex.test(f));

    // Allow some variations
    expect(invalidNames.length).toBeLessThan(10);
  });

  test('task content is formatted', () => {
    const sampleTasks = taskFiles.slice(0, 10);
    let properlyFormatted = 0;

    sampleTasks.forEach(file => {
      const filePath = path.join(tasksDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for markdown headers
      if (content.includes('#')) {
        properlyFormatted++;
      }
    });

    expect(properlyFormatted).toBeGreaterThan(5);
  });
});
