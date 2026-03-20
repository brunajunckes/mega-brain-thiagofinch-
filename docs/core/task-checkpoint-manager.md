# Task Checkpointing - Resumable Execution

## Overview

The Checkpoint Manager enables resumable task execution. If a task execution is interrupted (crash, timeout, user interruption), execution can resume from the last successful checkpoint without losing progress or re-computing completed steps.

## Why Checkpointing Matters

Long-running task sequences are unreliable without checkpointing:
- **Without checkpointing:** Interrupt = restart from step 1 (inefficient)
- **With checkpointing:** Interrupt = resume from step N (efficient, reliable)

## Checkpoint Structure

```json
{
  "id": "uuid-1234",
  "task_id": "task-executor",
  "execution_id": "exec-abc123",
  "story_id": "8.1",
  "step": 3,
  "total_steps": 5,
  "status": "in_progress",
  "started_at": "2026-03-21T10:00:00Z",
  "last_checkpoint": "2026-03-21T10:05:00Z",
  "outputs": {
    "loaded_tasks": 205,
    "resolved_dependencies": true
  },
  "context": {
    "execution_mode": "autonomous",
    "max_retries": 3
  },
  "errors": [],
  "retry_count": 0,
  "metadata": {
    "executor_version": "1.0.0"
  }
}
```

## CheckpointManager API

### Initialize

```javascript
const { CheckpointManager } = require('.aiox-core/core/orchestration/checkpoint-manager');

const manager = new CheckpointManager({
  baseDir: '.aiox/checkpoints', // Default
});

await manager.initialize();
```

### Save Checkpoint

```javascript
// Save progress after each step
const checkpointId = await manager.saveCheckpoint({
  task_id: 'task-executor',
  execution_id: 'exec-abc123',
  story_id: '8.1',
  step: 3,
  total_steps: 5,
  status: 'in_progress',
  outputs: {
    loaded_tasks: 205,
    resolved_dependencies: true,
  },
  context: {
    execution_mode: 'autonomous',
  },
});

// Atomic write ensures no corruption even on crash
```

### Load Checkpoint

```javascript
// Load checkpoint by ID
const checkpoint = await manager.loadCheckpoint(checkpointId);

console.log(`Step: ${checkpoint.step}/${checkpoint.total_steps}`);
console.log(`Status: ${checkpoint.status}`);
console.log(`Outputs:`, checkpoint.outputs);
```

### Resume from Checkpoint

```javascript
// Get resume point for execution
const resumePoint = await manager.getResumePoint(executionId);

if (resumePoint) {
  const nextStep = resumePoint.next_step;
  const context = resumePoint.context;
  const outputs = resumePoint.outputs;

  console.log(`Resuming at step ${nextStep}`);
  // Continue from here...
} else {
  console.log('No checkpoint to resume from, starting fresh');
}
```

### Manage Checkpoints

```javascript
// Get latest checkpoint for a task
const latest = await manager.getLatestCheckpoint('task-executor');

// Get all checkpoints for an execution
const checkpoints = await manager.getCheckpointsForExecution('exec-abc123');

// Check if execution can resume
const canResume = await manager.canResume(executionId);

// Update checkpoint status
await manager.updateCheckpointStatus(checkpointId, 'completed', {
  outputs: { final_result: 'success' },
});

// Delete checkpoint
await manager.deleteCheckpoint(checkpointId);

// Cleanup old completed checkpoints
const result = await manager.cleanup(7, true); // Keep 7 days, only_completed
console.log(`Cleaned up ${result.deleted_count} checkpoints`);

// Get statistics
const stats = await manager.getStats();
console.log(`Total: ${stats.total_checkpoints}`);
console.log(`By status:`, stats.by_status);
```

## Execution Example: Resumable Task Loop

### Initial Execution

```javascript
const executionId = 'exec-abc123';
const steps = ['load-tasks', 'resolve-deps', 'sort-deps', 'execute', 'verify'];

for (let step = 0; step < steps.length; step++) {
  const checkpoint = await manager.getLatestCheckpoint('my-task');

  if (checkpoint && checkpoint.step > step) {
    // Resume from later checkpoint
    console.log(`Resuming from step ${checkpoint.step}`);
    continue;
  }

  // Execute step
  console.log(`Executing: ${steps[step]}`);
  const result = await executeStep(steps[step]);

  // Save checkpoint
  await manager.saveCheckpoint({
    task_id: 'my-task',
    execution_id: executionId,
    step,
    total_steps: steps.length,
    status: 'in_progress',
    outputs: result,
    context: { execution_mode: 'autonomous' },
  });
}
```

### Resume After Interruption

```javascript
// Later: Same execution interrupted, now resuming
const executionId = 'exec-abc123';

// Check if we can resume
if (await manager.canResume(executionId)) {
  // Get resume point
  const resumePoint = await manager.getResumePoint(executionId);
  const startStep = resumePoint.next_step;
  const previousOutputs = resumePoint.outputs;

  console.log(`Resuming from step ${startStep}`);

  // Continue from where we left off
  for (let step = startStep; step < totalSteps; step++) {
    // ...execute steps...
  }
} else {
  console.log('Execution already complete or no checkpoint');
}
```

## Checkpoint Statuses

| Status | Meaning | Resumable |
|--------|---------|-----------|
| **in_progress** | Task is executing | Yes |
| **completed** | Task finished successfully | No |
| **failed** | Task execution failed | Conditional (with retry) |
| **skipped** | Task was skipped | Yes |

## File Organization

```
.aiox/checkpoints/
├── checkpoint-task-1-exec-1-2026-03-21T10-00-00.json
├── checkpoint-task-1-exec-2-2026-03-21T10-05-00.json
├── checkpoint-task-2-exec-1-2026-03-21T10-10-00.json
└── ... (timestamped checkpoint files)
```

## Error Recovery with Retries

```javascript
// Execution with retry logic using checkpoints
let retryCount = 0;
const maxRetries = 3;

while (retryCount < maxRetries) {
  try {
    // Save checkpoint before attempt
    await manager.saveCheckpoint({
      task_id: 'my-task',
      execution_id: executionId,
      step: currentStep,
      status: 'in_progress',
      retry_count: retryCount,
      // ...
    });

    // Try to execute
    await executeCurrentStep();

    // Success - update to completed
    await manager.updateCheckpointStatus(currentCheckpointId, 'completed', {
      outputs: { result: 'success' },
    });
    break; // Success, exit retry loop

  } catch (error) {
    retryCount++;

    if (retryCount >= maxRetries) {
      // Final failure
      await manager.updateCheckpointStatus(currentCheckpointId, 'failed', {
        errors: [error.message],
        retry_count: retryCount,
      });
      throw error;
    }

    // Retry - checkpoint updated for next attempt
    await manager.updateCheckpointStatus(currentCheckpointId, 'in_progress', {
      errors: [error.message],
      retry_count: retryCount,
    });
  }
}
```

## Atomic Writes - No Corruption

Checkpoints use atomic write pattern to prevent corruption on crash:

```
1. Write to temp file: .../checkpoint-xxx.json.tmp
2. Rename atomically: .../checkpoint-xxx.json
3. Delete temp file if exists (cleanup)
```

This ensures:
- ✅ No partial writes on crash
- ✅ No corruption from concurrent access
- ✅ Consistent state on disk

## Best Practices

### Checkpoint Frequency

✅ **Do:**
- Save after each major step completes
- Save before risky operations
- Save when entering new context
- Include relevant outputs for resume

❌ **Don't:**
- Save too frequently (overhead)
- Save incomplete state
- Store sensitive data in checkpoint
- Checkpoint redundant information

### Context Preservation

```javascript
// Good: Essential context for resume
{
  context: {
    loaded_task_ids: [1, 2, 3, ...],
    resolved_graph: { ... },
    current_mode: 'autonomous',
  }
}

// Bad: Unnecessary context
{
  context: {
    temporary_variable: 'xyz',
    debug_info: 'large debug data',
    redundant_copy: { ... }
  }
}
```

## Testing

```bash
npx jest .aiox-core/core/orchestration/__tests__/checkpoint-manager.test.js --verbose
# 31 tests: Save, Load, Resume, Update, Cleanup, Stats
```

## Integration with Task Executor

Checkpointing integrates with the task executor:

```javascript
const { TaskExecutor } = require('.aiox-core/core/orchestration/task-executor');
const { CheckpointManager } = require('.aiox-core/core/orchestration/checkpoint-manager');

const executor = new TaskExecutor();
const checkpoints = new CheckpointManager();

// During execution
for (const task of tasksToExecute) {
  // Check for resume point
  const resumePoint = await checkpoints.getResumePoint(executionId);
  if (resumePoint) {
    executor.setContext(resumePoint.context);
  }

  // Execute task
  const result = await executor.executeTask(task.id);

  // Checkpoint after completion
  await checkpoints.saveCheckpoint({
    task_id: task.id,
    execution_id: executionId,
    outputs: result,
    status: 'completed',
  });
}
```

## Performance Considerations

| Operation | Time | Notes |
|-----------|------|-------|
| saveCheckpoint | ~10ms | Atomic, includes validation |
| loadCheckpoint | ~2ms | Cached after first load |
| getLatestCheckpoint | ~5ms | Linear scan, optimize with indexing |
| cleanup | ~50ms | For 100 old checkpoints |

## See Also

- `.aiox-core/core/orchestration/checkpoint-manager.js` - Implementation
- `.aiox-core/core/orchestration/__tests__/checkpoint-manager.test.js` - Tests
- `.aiox-core/core/orchestration/task-executor.js` - Task execution with checkpoints
