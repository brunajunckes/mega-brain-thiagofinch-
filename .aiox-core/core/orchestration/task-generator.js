/**
 * Task Generator - Template-based dynamic task generation
 * @module core/orchestration/task-generator
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * TaskGenerator - Generates tasks from templates with variable substitution
 */
class TaskGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.templates = new Map(); // templateId -> template definition
    this.generatedTasks = [];
    this.stats = {
      templatesRegistered: 0,
      tasksGenerated: 0,
      substitutions: 0,
      errors: 0
    };

    this.idCounter = 0;
    this.namingPattern = options.namingPattern || '{name}-{index}';
  }

  /**
   * Register a template
   */
  registerTemplate(templateId, template) {
    if (!template || !template.name) {
      throw new Error('Template must have name and id');
    }

    this.templates.set(templateId, {
      id: templateId,
      ...template,
      registeredAt: Date.now()
    });

    this.stats.templatesRegistered++;

    this.emit('template-registered', {
      templateId,
      name: template.name
    });

    return templateId;
  }

  /**
   * Generate a single task from template
   */
  generateTask(templateId, params = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      const task = this._applyTemplate(template, params);
      this.stats.tasksGenerated++;

      this.emit('task-generated', {
        templateId,
        taskId: task.id,
        taskName: task.name
      });

      return task;
    } catch (error) {
      this.stats.errors++;
      this.emit('generation-error', {
        templateId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate multiple tasks from single template
   */
  generateTasks(templateId, paramsList) {
    const tasks = [];

    for (const params of paramsList) {
      tasks.push(this.generateTask(templateId, params));
    }

    return tasks;
  }

  /**
   * Apply template to generate task
   */
  _applyTemplate(template, params) {
    const taskId = this._generateTaskId(template.name, params);

    // Clone template
    const task = JSON.parse(JSON.stringify(template));

    // Remove template metadata
    delete task.registeredAt;

    // Set task ID and name
    task.id = taskId;

    if (!task.name) {
      task.name = this._generateTaskName(template.name, params);
    }

    // Substitute variables
    this._substituteVariables(task, params);

    // Process dynamic fields
    if (template.dynamicFields) {
      for (const field of template.dynamicFields) {
        this._processDynamicField(task, field, params);
      }
    }

    this.generatedTasks.push(task);

    return task;
  }

  /**
   * Generate unique task ID
   */
  _generateTaskId(templateName, params) {
    const index = this.idCounter++;
    return `${templateName}-${index}-${Date.now()}`;
  }

  /**
   * Generate task name from pattern
   */
  _generateTaskName(templateName, params) {
    let name = this.namingPattern;
    name = name.replace('{name}', templateName);
    name = name.replace('{index}', this.idCounter);

    // Substitute params
    for (const [key, value] of Object.entries(params)) {
      name = name.replace(`{${key}}`, value);
    }

    return name;
  }

  /**
   * Substitute variables in task recursively
   */
  _substituteVariables(obj, params) {
    if (typeof obj === 'string') {
      let result = obj;
      for (const [key, value] of Object.entries(params)) {
        const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
        result = result.replace(pattern, value);
      }
      return result;
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') {
          obj[i] = this._substituteVariables(obj[i], params);
        } else if (typeof obj[i] === 'object') {
          this._substituteVariables(obj[i], params);
        }
      }
      return obj;
    }

    if (typeof obj === 'object') {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = this._substituteVariables(obj[key], params);
          this.stats.substitutions++;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          this._substituteVariables(obj[key], params);
        }
      }
    }

    return obj;
  }

  /**
   * Process dynamic field
   */
  _processDynamicField(task, field, params) {
    if (field.type === 'conditional') {
      this._processConditionalField(task, field, params);
    } else if (field.type === 'computed') {
      this._processComputedField(task, field, params);
    }
  }

  /**
   * Process conditional field
   */
  _processConditionalField(task, field, params) {
    const conditionMet = this._evaluateCondition(field.condition, params);

    if (conditionMet && field.thenValue) {
      task[field.name] = field.thenValue;
    } else if (!conditionMet && field.elseValue) {
      task[field.name] = field.elseValue;
    }
  }

  /**
   * Process computed field
   */
  _processComputedField(task, field, params) {
    if (typeof field.compute === 'function') {
      task[field.name] = field.compute(params);
    } else if (typeof field.compute === 'string') {
      // Simple arithmetic: count * 2
      task[field.name] = this._evaluateExpression(field.compute, params);
    }
  }

  /**
   * Evaluate condition
   */
  _evaluateCondition(condition, params) {
    if (typeof condition === 'function') {
      return condition(params);
    }

    if (typeof condition === 'string') {
      // Simple boolean: param1 === 'value'
      return this._evaluateExpression(condition, params);
    }

    return Boolean(condition);
  }

  /**
   * Evaluate expression
   */
  _evaluateExpression(expr, params) {
    // Replace variables
    let result = expr;
    for (const [key, value] of Object.entries(params)) {
      const pattern = new RegExp(`\\b${key}\\b`, 'g');
      result = result.replace(pattern, JSON.stringify(value));
    }

    // Safely evaluate
    try {
      // eslint-disable-next-line no-eval
      return eval(result);
    } catch {
      return false;
    }
  }

  /**
   * Generate tasks from loop
   */
  generateFromLoop(templateId, loopConfig) {
    const tasks = [];

    if (loopConfig.type === 'for-each') {
      return this._forEachLoop(templateId, loopConfig);
    } else if (loopConfig.type === 'range') {
      return this._rangeLoop(templateId, loopConfig);
    } else if (loopConfig.type === 'while') {
      return this._whileLoop(templateId, loopConfig);
    }

    return tasks;
  }

  /**
   * For-each loop
   */
  _forEachLoop(templateId, loopConfig) {
    const tasks = [];
    const items = loopConfig.items || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const params = {
        ...loopConfig.params,
        item,
        index: i,
        itemKey: loopConfig.keyField ? item[loopConfig.keyField] : i
      };

      tasks.push(this.generateTask(templateId, params));
    }

    return tasks;
  }

  /**
   * Range loop
   */
  _rangeLoop(templateId, loopConfig) {
    const tasks = [];
    const start = loopConfig.start || 0;
    const end = loopConfig.end || 10;
    const step = loopConfig.step || 1;

    for (let i = start; i < end; i += step) {
      const params = {
        ...loopConfig.params,
        index: i,
        value: i
      };

      tasks.push(this.generateTask(templateId, params));
    }

    return tasks;
  }

  /**
   * While loop
   */
  _whileLoop(templateId, loopConfig) {
    const tasks = [];
    let index = 0;
    let state = loopConfig.initialState || {};

    while (loopConfig.condition(state) && index < (loopConfig.maxIterations || 100)) {
      const params = {
        ...loopConfig.params,
        index,
        state
      };

      const task = this.generateTask(templateId, params);
      tasks.push(task);

      // Update state
      if (loopConfig.updateState) {
        state = loopConfig.updateState(state, params);
      }

      index++;
    }

    return tasks;
  }

  /**
   * Get generated task
   */
  getGeneratedTask(index) {
    return this.generatedTasks[index] || null;
  }

  /**
   * Get all generated tasks
   */
  getAllGeneratedTasks() {
    return [...this.generatedTasks];
  }

  /**
   * Clear generated tasks
   */
  clearGeneratedTasks() {
    const cleared = this.generatedTasks.length;
    this.generatedTasks = [];
    return cleared;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalGenerated: this.generatedTasks.length,
      templatesAvailable: this.templates.size
    };
  }

  /**
   * Get template
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * List all templates
   */
  listTemplates() {
    const templates = [];
    for (const [id, template] of this.templates) {
      templates.push({
        id,
        name: template.name,
        description: template.description,
        registeredAt: template.registeredAt
      });
    }
    return templates;
  }
}

module.exports = TaskGenerator;
