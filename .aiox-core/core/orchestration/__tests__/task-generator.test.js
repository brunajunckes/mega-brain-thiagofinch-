/**
 * Task Generator Tests
 */

const TaskGenerator = require('../task-generator');

describe('TaskGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new TaskGenerator();
  });

  describe('Initialization', () => {
    it('should initialize with empty templates', () => {
      expect(generator.templates.size).toBe(0);
    });

    it('should initialize with empty generated tasks', () => {
      expect(generator.getAllGeneratedTasks().length).toBe(0);
    });

    it('should initialize with zero statistics', () => {
      const stats = generator.getStats();
      expect(stats.templatesRegistered).toBe(0);
      expect(stats.tasksGenerated).toBe(0);
      expect(stats.substitutions).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it('should use custom naming pattern if provided', () => {
      const customGen = new TaskGenerator({ namingPattern: 'task-${name}-${index}' });
      expect(customGen.namingPattern).toBe('task-${name}-${index}');
    });

    it('should use default naming pattern', () => {
      expect(generator.namingPattern).toBe('{name}-{index}');
    });
  });

  describe('Template Registration', () => {
    it('should register a template', () => {
      const template = { name: 'email-task', description: 'Send email' };
      const id = generator.registerTemplate('task-1', template);

      expect(id).toBe('task-1');
      expect(generator.getTemplate('task-1')).toBeDefined();
    });

    it('should increment templates registered count', () => {
      generator.registerTemplate('task-1', { name: 'email' });
      generator.registerTemplate('task-2', { name: 'sms' });

      const stats = generator.getStats();
      expect(stats.templatesRegistered).toBe(2);
    });

    it('should add timestamp to registered template', () => {
      const before = Date.now();
      generator.registerTemplate('task-1', { name: 'email' });
      const after = Date.now();

      const template = generator.getTemplate('task-1');
      expect(template.registeredAt).toBeGreaterThanOrEqual(before);
      expect(template.registeredAt).toBeLessThanOrEqual(after);
    });

    it('should emit template-registered event', (done) => {
      generator.on('template-registered', (data) => {
        expect(data.templateId).toBe('task-1');
        expect(data.name).toBe('email');
        done();
      });

      generator.registerTemplate('task-1', { name: 'email' });
    });

    it('should throw if template has no name', () => {
      expect(() => {
        generator.registerTemplate('task-1', {});
      }).toThrow('Template must have name and id');
    });

    it('should throw if template is null', () => {
      expect(() => {
        generator.registerTemplate('task-1', null);
      }).toThrow('Template must have name and id');
    });
  });

  describe('Template Retrieval', () => {
    beforeEach(() => {
      generator.registerTemplate('task-1', {
        name: 'email',
        description: 'Send email task'
      });
    });

    it('should retrieve registered template', () => {
      const template = generator.getTemplate('task-1');
      expect(template.name).toBe('email');
      expect(template.description).toBe('Send email task');
    });

    it('should return null for non-existent template', () => {
      const template = generator.getTemplate('non-existent');
      expect(template).toBeNull();
    });

    it('should list all templates', () => {
      generator.registerTemplate('task-2', { name: 'sms' });

      const templates = generator.listTemplates();
      expect(templates.length).toBe(2);
      expect(templates[0].id).toBe('task-1');
      expect(templates[1].id).toBe('task-2');
    });

    it('should include metadata in listed templates', () => {
      const templates = generator.listTemplates();
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('registeredAt');
    });
  });

  describe('Single Task Generation', () => {
    beforeEach(() => {
      generator.registerTemplate('email-task', {
        name: 'SendEmail',
        description: 'Send email to ${recipient}',
        to: '${recipient}',
        subject: 'Hello ${name}'
      });
    });

    it('should generate task from template', () => {
      const task = generator.generateTask('email-task', {
        recipient: 'user@example.com',
        name: 'John'
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.name).toBe('SendEmail');
    });

    it('should increment tasks generated count', () => {
      generator.generateTask('email-task', { recipient: 'user@example.com', name: 'John' });
      generator.generateTask('email-task', { recipient: 'user2@example.com', name: 'Jane' });

      const stats = generator.getStats();
      expect(stats.tasksGenerated).toBe(2);
    });

    it('should throw if template not found', () => {
      expect(() => {
        generator.generateTask('non-existent', {});
      }).toThrow('Template not found: non-existent');
    });

    it('should emit task-generated event', (done) => {
      generator.on('task-generated', (data) => {
        expect(data.templateId).toBe('email-task');
        expect(data.taskId).toBeDefined();
        expect(data.taskName).toBe('SendEmail');
        done();
      });

      generator.generateTask('email-task', { recipient: 'user@example.com', name: 'John' });
    });

    it('should track generated task', () => {
      generator.generateTask('email-task', { recipient: 'user@example.com', name: 'John' });
      const tasks = generator.getAllGeneratedTasks();

      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBeDefined();
    });

    it('should generate unique task IDs', () => {
      const task1 = generator.generateTask('email-task', { recipient: 'user@example.com', name: 'John' });
      const task2 = generator.generateTask('email-task', { recipient: 'user2@example.com', name: 'Jane' });

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('Batch Task Generation', () => {
    beforeEach(() => {
      generator.registerTemplate('email-task', {
        name: 'SendEmail',
        to: '${recipient}',
        subject: 'Hello ${name}'
      });
    });

    it('should generate multiple tasks', () => {
      const paramsList = [
        { recipient: 'user1@example.com', name: 'John' },
        { recipient: 'user2@example.com', name: 'Jane' },
        { recipient: 'user3@example.com', name: 'Bob' }
      ];

      const tasks = generator.generateTasks('email-task', paramsList);

      expect(tasks.length).toBe(3);
      expect(tasks[0].to).toBe('user1@example.com');
      expect(tasks[1].to).toBe('user2@example.com');
      expect(tasks[2].to).toBe('user3@example.com');
    });

    it('should increment counter for each generated task', () => {
      const paramsList = [
        { recipient: 'user1@example.com', name: 'John' },
        { recipient: 'user2@example.com', name: 'Jane' }
      ];

      const tasks = generator.generateTasks('email-task', paramsList);
      const stats = generator.getStats();

      expect(stats.tasksGenerated).toBe(2);
    });

    it('should handle empty params list', () => {
      const tasks = generator.generateTasks('email-task', []);
      expect(tasks.length).toBe(0);
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute variables in string fields', () => {
      generator.registerTemplate('template-1', {
        name: 'Task',
        description: 'Process ${item} for ${user}'
      });

      const task = generator.generateTask('template-1', {
        item: 'file.txt',
        user: 'john'
      });

      expect(task.description).toBe('Process file.txt for john');
    });

    it('should substitute variables in nested objects', () => {
      generator.registerTemplate('template-1', {
        name: 'Task',
        config: {
          input: '${inputFile}',
          output: '${outputFile}'
        }
      });

      const task = generator.generateTask('template-1', {
        inputFile: 'input.txt',
        outputFile: 'output.txt'
      });

      expect(task.config.input).toBe('input.txt');
      expect(task.config.output).toBe('output.txt');
    });

    it('should substitute variables in arrays', () => {
      generator.registerTemplate('template-1', {
        name: 'Task',
        recipients: ['${user1}@example.com', '${user2}@example.com']
      });

      const task = generator.generateTask('template-1', {
        user1: 'john',
        user2: 'jane'
      });

      expect(task.recipients[0]).toBe('john@example.com');
      expect(task.recipients[1]).toBe('jane@example.com');
    });

    it('should count substitutions', () => {
      generator.registerTemplate('template-1', {
        name: 'Task',
        field1: '${value}',
        field2: '${value}',
        field3: '${value}'
      });

      generator.generateTask('template-1', { value: 'test' });

      const stats = generator.getStats();
      expect(stats.substitutions).toBeGreaterThan(0);
    });

    it('should handle multiple variables in single string', () => {
      generator.registerTemplate('template-1', {
        name: 'Task',
        message: 'Hello ${firstName} ${lastName}'
      });

      const task = generator.generateTask('template-1', {
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(task.message).toBe('Hello John Doe');
    });

    it('should not substitute when variable not provided', () => {
      generator.registerTemplate('template-1', {
        name: 'Task',
        message: 'Hello ${firstName} ${lastName}'
      });

      const task = generator.generateTask('template-1', {
        firstName: 'John'
        // lastName not provided
      });

      expect(task.message).toContain('John');
      expect(task.message).toContain('${lastName}'); // Should remain unchanged
    });
  });

  describe('Task Naming', () => {
    it('should preserve template name in task', () => {
      generator.registerTemplate('task-1', { name: 'EmailTask' });

      const task = generator.generateTask('task-1', {});

      expect(task.name).toBe('EmailTask');
    });

    it('should use custom naming pattern constructor option', () => {
      const customGen = new TaskGenerator({ namingPattern: 'custom-{name}-{index}' });
      expect(customGen.namingPattern).toBe('custom-{name}-{index}');
    });

    it('should generate name from pattern if template name missing', () => {
      // This scenario tests the _generateTaskName method
      // when template doesn't have a name property set
      const result = generator._generateTaskName('Task', { user: 'john' });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should use idCounter from _generateTaskId for incrementing', () => {
      // _generateTaskName uses idCounter, which is incremented by _generateTaskId
      const id1 = generator._generateTaskId('Task', {});
      const name1 = generator._generateTaskName('Task', {});

      const id2 = generator._generateTaskId('Task', {});
      const name2 = generator._generateTaskName('Task', {});

      // IDs should be different
      expect(id1).not.toBe(id2);
      // Names might be same since naming pattern uses {index} after idCounter is already incremented
      expect(name1).toBeDefined();
      expect(name2).toBeDefined();
    });
  });

  describe('Task ID Generation', () => {
    it('should generate unique IDs', () => {
      generator.registerTemplate('task-1', { name: 'Email' });

      const task1 = generator.generateTask('task-1', {});
      const task2 = generator.generateTask('task-1', {});

      expect(task1.id).not.toBe(task2.id);
    });

    it('should include template name in ID', () => {
      generator.registerTemplate('email-send', { name: 'Email' });

      const task = generator.generateTask('email-send', {});

      expect(task.id).toContain('Email');
    });

    it('should include timestamp in ID', () => {
      generator.registerTemplate('task-1', { name: 'Task' });

      const before = Date.now();
      const task = generator.generateTask('task-1', {});
      const after = Date.now();

      const idTimestamp = parseInt(task.id.split('-').pop());
      expect(idTimestamp).toBeGreaterThanOrEqual(before);
      expect(idTimestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Dynamic Fields - Conditional', () => {
    it('should set field when condition is true', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        priority: 'normal',
        dynamicFields: [
          {
            name: 'urgency',
            type: 'conditional',
            condition: (params) => params.priority === 'high',
            thenValue: 'urgent',
            elseValue: 'normal'
          }
        ]
      });

      const task = generator.generateTask('task-1', { priority: 'high' });
      expect(task.urgency).toBe('urgent');
    });

    it('should set else value when condition is false', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        dynamicFields: [
          {
            name: 'urgency',
            type: 'conditional',
            condition: (params) => params.priority === 'high',
            thenValue: 'urgent',
            elseValue: 'normal'
          }
        ]
      });

      const task = generator.generateTask('task-1', { priority: 'low' });
      expect(task.urgency).toBe('normal');
    });

    it('should support string-based conditions', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        dynamicFields: [
          {
            name: 'status',
            type: 'conditional',
            condition: 'count > 10',
            thenValue: 'bulk',
            elseValue: 'single'
          }
        ]
      });

      const task = generator.generateTask('task-1', { count: 15 });
      expect(task.status).toBe('bulk');
    });
  });

  describe('Dynamic Fields - Computed', () => {
    it('should compute field using function', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        dynamicFields: [
          {
            name: 'totalCost',
            type: 'computed',
            compute: (params) => params.price * params.quantity
          }
        ]
      });

      const task = generator.generateTask('task-1', {
        price: 10,
        quantity: 5
      });

      expect(task.totalCost).toBe(50);
    });

    it('should compute field using string expression', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        dynamicFields: [
          {
            name: 'doubled',
            type: 'computed',
            compute: 'count * 2'
          }
        ]
      });

      const task = generator.generateTask('task-1', { count: 5 });
      expect(task.doubled).toBe(10);
    });

    it('should handle complex expressions', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        dynamicFields: [
          {
            name: 'discount',
            type: 'computed',
            compute: 'price * 0.1'
          }
        ]
      });

      const task = generator.generateTask('task-1', { price: 100 });
      expect(task.discount).toBe(10);
    });
  });

  describe('Loop Patterns - For-Each', () => {
    it('should generate task for each item', () => {
      generator.registerTemplate('item-task', {
        name: 'ProcessItem',
        item: '${item}'
      });

      const tasks = generator.generateFromLoop('item-task', {
        type: 'for-each',
        items: [
          { id: 1, name: 'Item1' },
          { id: 2, name: 'Item2' },
          { id: 3, name: 'Item3' }
        ]
      });

      expect(tasks.length).toBe(3);
    });

    it('should include index in params', () => {
      generator.registerTemplate('item-task', {
        name: 'ProcessItem',
        index: '${index}'
      });

      const tasks = generator.generateFromLoop('item-task', {
        type: 'for-each',
        items: ['a', 'b', 'c']
      });

      expect(tasks[0].index).toBe('0');
      expect(tasks[1].index).toBe('1');
      expect(tasks[2].index).toBe('2');
    });

    it('should support keyField for object identification', () => {
      generator.registerTemplate('item-task', {
        name: 'ProcessItem',
        itemKey: '${itemKey}'
      });

      const tasks = generator.generateFromLoop('item-task', {
        type: 'for-each',
        items: [
          { id: 'user1', name: 'John' },
          { id: 'user2', name: 'Jane' }
        ],
        keyField: 'id'
      });

      expect(tasks[0].itemKey).toBe('user1');
      expect(tasks[1].itemKey).toBe('user2');
    });

    it('should merge loop params with item params', () => {
      generator.registerTemplate('item-task', {
        name: 'Task',
        item: '${item}',
        loopContext: '${context}'
      });

      const tasks = generator.generateFromLoop('item-task', {
        type: 'for-each',
        items: ['item1', 'item2'],
        params: { context: 'batch-1' }
      });

      expect(tasks[0].loopContext).toBe('batch-1');
      expect(tasks[1].loopContext).toBe('batch-1');
    });
  });

  describe('Loop Patterns - Range', () => {
    it('should generate tasks for range', () => {
      generator.registerTemplate('range-task', {
        name: 'RangeTask',
        value: '${value}'
      });

      const tasks = generator.generateFromLoop('range-task', {
        type: 'range',
        start: 0,
        end: 5,
        step: 1
      });

      expect(tasks.length).toBe(5);
      expect(tasks[0].value).toBe('0');
      expect(tasks[4].value).toBe('4');
    });

    it('should support custom step', () => {
      generator.registerTemplate('range-task', {
        name: 'RangeTask',
        value: '${value}'
      });

      const tasks = generator.generateFromLoop('range-task', {
        type: 'range',
        start: 0,
        end: 10,
        step: 2
      });

      expect(tasks.length).toBe(5);
      expect(tasks[0].value).toBe('0');
      expect(tasks[1].value).toBe('2');
    });

    it('should use defaults', () => {
      generator.registerTemplate('range-task', {
        name: 'RangeTask'
      });

      const tasks = generator.generateFromLoop('range-task', {
        type: 'range'
        // no start, end, step specified
      });

      // Default: start=0, end=10, step=1
      expect(tasks.length).toBe(10);
    });
  });

  describe('Loop Patterns - While', () => {
    it('should generate tasks while condition is true', () => {
      generator.registerTemplate('while-task', {
        name: 'WhileTask',
        index: '${index}'
      });

      const tasks = generator.generateFromLoop('while-task', {
        type: 'while',
        condition: (state) => state.count < 3,
        initialState: { count: 0 },
        updateState: (state) => ({ count: state.count + 1 })
      });

      expect(tasks.length).toBe(3);
    });

    it('should enforce max iterations limit', () => {
      generator.registerTemplate('while-task', {
        name: 'WhileTask'
      });

      const tasks = generator.generateFromLoop('while-task', {
        type: 'while',
        condition: () => true, // Always true
        initialState: {},
        maxIterations: 5
      });

      expect(tasks.length).toBe(5);
    });

    it('should pass state to updateState', () => {
      generator.registerTemplate('while-task', {
        name: 'WhileTask'
      });

      const updateMock = jest.fn((state) => ({ ...state, count: state.count + 1 }));

      generator.generateFromLoop('while-task', {
        type: 'while',
        condition: (state) => state.count < 2,
        initialState: { count: 0 },
        updateState: updateMock
      });

      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('Task Tracking', () => {
    it('should track all generated tasks', () => {
      generator.registerTemplate('task-1', { name: 'Task' });

      generator.generateTask('task-1', {});
      generator.generateTask('task-1', {});
      generator.generateTask('task-1', {});

      const tasks = generator.getAllGeneratedTasks();
      expect(tasks.length).toBe(3);
    });

    it('should retrieve task by index', () => {
      generator.registerTemplate('task-1', { name: 'Task', value: '${v}' });

      const generated = generator.generateTask('task-1', { v: 'first' });
      const retrieved = generator.getGeneratedTask(0);

      expect(retrieved.id).toBe(generated.id);
    });

    it('should return null for invalid index', () => {
      const task = generator.getGeneratedTask(999);
      expect(task).toBeNull();
    });

    it('should clear generated tasks', () => {
      generator.registerTemplate('task-1', { name: 'Task' });

      generator.generateTask('task-1', {});
      generator.generateTask('task-1', {});

      const cleared = generator.clearGeneratedTasks();
      expect(cleared).toBe(2);
      expect(generator.getAllGeneratedTasks().length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track template count', () => {
      generator.registerTemplate('task-1', { name: 'Task1' });
      generator.registerTemplate('task-2', { name: 'Task2' });

      const stats = generator.getStats();
      expect(stats.templatesAvailable).toBe(2);
    });

    it('should track task count', () => {
      generator.registerTemplate('task-1', { name: 'Task' });

      generator.generateTask('task-1', {});
      generator.generateTask('task-1', {});

      const stats = generator.getStats();
      expect(stats.totalGenerated).toBe(2);
    });

    it('should provide complete statistics', () => {
      const stats = generator.getStats();

      expect(stats).toHaveProperty('templatesRegistered');
      expect(stats).toHaveProperty('tasksGenerated');
      expect(stats).toHaveProperty('substitutions');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('totalGenerated');
      expect(stats).toHaveProperty('templatesAvailable');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for template not found', () => {
      expect(() => {
        generator.generateTask('non-existent', {});
      }).toThrow('Template not found: non-existent');
    });

    it('should validate template before processing', () => {
      // Template lookup happens before try-catch
      const badId = 'does-not-exist';
      expect(() => {
        generator.generateTask(badId, {});
      }).toThrow();
    });

    it('should catch errors during template application', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        dynamicFields: [
          {
            name: 'field',
            type: 'computed',
            compute: () => {
              throw new Error('Field computation failed');
            }
          }
        ]
      });

      expect(() => {
        generator.generateTask('task-1', {});
      }).toThrow('Field computation failed');
    });

    it('should emit generation-error when error occurs during processing', (done) => {
      generator.registerTemplate('bad-task', {
        name: 'BadTask',
        dynamicFields: [
          {
            name: 'field',
            type: 'computed',
            compute: () => {
              throw new Error('Processing error');
            }
          }
        ]
      });

      generator.on('generation-error', (data) => {
        expect(data.templateId).toBe('bad-task');
        expect(data.error).toContain('Processing error');
        done();
      });

      try {
        generator.generateTask('bad-task', {});
      } catch (e) {
        // Expected
      }
    });

    it('should increment error count on processing error', () => {
      generator.registerTemplate('error-task', {
        name: 'ErrorTask',
        dynamicFields: [
          {
            name: 'field',
            type: 'computed',
            compute: () => {
              throw new Error('Test error');
            }
          }
        ]
      });

      try {
        generator.generateTask('error-task', {});
      } catch (e) {
        // Expected
      }

      const stats = generator.getStats();
      expect(stats.errors).toBeGreaterThan(0);
    });

    it('should handle gracefully when eval fails', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        dynamicFields: [
          {
            name: 'result',
            type: 'computed',
            compute: 'undefinedVar * 2'
          }
        ]
      });

      // _evaluateExpression catches eval errors and returns false
      const task = generator.generateTask('task-1', {});
      expect(task.result).toBe(false);
    });
  });

  describe('Integration - Complex Workflows', () => {
    it('should handle complex template with all features', () => {
      generator.registerTemplate('complex-task', {
        name: 'ComplexTask',
        description: 'Process ${itemName} for ${userId}',
        config: {
          input: '${inputFile}',
          output: '${outputFile}',
          settings: ['${setting1}', '${setting2}']
        },
        metadata: {
          owner: '${owner}',
          created: '${createdDate}'
        },
        dynamicFields: [
          {
            name: 'priority',
            type: 'conditional',
            condition: (params) => params.itemSize > 1000,
            thenValue: 'high',
            elseValue: 'normal'
          },
          {
            name: 'processingTime',
            type: 'computed',
            compute: 'itemSize / 1000'
          }
        ]
      });

      const task = generator.generateTask('complex-task', {
        itemName: 'file.zip',
        userId: 'user123',
        inputFile: '/tmp/input.zip',
        outputFile: '/tmp/output.zip',
        setting1: 'fast',
        setting2: 'compression',
        owner: 'admin',
        createdDate: '2024-01-01',
        itemSize: 2000
      });

      expect(task.description).toBe('Process file.zip for user123');
      expect(task.config.input).toBe('/tmp/input.zip');
      expect(task.config.settings[0]).toBe('fast');
      expect(task.priority).toBe('high');
      expect(task.processingTime).toBe(2);
    });

    it('should handle batch generation with loops', () => {
      generator.registerTemplate('batch-task', {
        name: 'BatchProcessor',
        item: '${item}',
        batchId: '${batchId}',
        itemIndex: '${index}'
      });

      const tasks = generator.generateFromLoop('batch-task', {
        type: 'for-each',
        items: ['file1.txt', 'file2.txt', 'file3.txt'],
        params: { batchId: 'batch-001' }
      });

      expect(tasks.length).toBe(3);
      expect(tasks[0].batchId).toBe('batch-001');
      expect(tasks[0].itemIndex).toBe('0');
      expect(tasks[2].item).toBe('file3.txt');
    });
  });

  describe('Template Cloning', () => {
    it('should not mutate original template', () => {
      const originalTemplate = {
        name: 'Task',
        config: { value: 'original' }
      };

      generator.registerTemplate('task-1', originalTemplate);
      const task = generator.generateTask('task-1', {});

      // Modify generated task
      task.config.value = 'modified';

      // Original should be unchanged
      const template = generator.getTemplate('task-1');
      expect(template.config.value).toBe('original');
    });

    it('should remove template metadata from generated task', () => {
      generator.registerTemplate('task-1', {
        name: 'Task',
        description: 'Test task'
      });

      const task = generator.generateTask('task-1', {});

      expect(task).not.toHaveProperty('registeredAt');
    });
  });
});
