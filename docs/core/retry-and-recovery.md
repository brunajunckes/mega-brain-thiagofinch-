# Retry and Recovery Framework

## Overview

The retry and recovery system provides resilience for task execution through two complementary components: **RetryManager** for transient failure handling and **CheckpointRecovery** for resuming interrupted executions.

## RetryManager

**File:** `.aiox-core/core/orchestration/retry-manager.js`

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxRetries` | 3 | Maximum retry attempts per task |
| `initialDelay` | 1000ms | First retry delay |
| `maxDelay` | 8000ms | Maximum delay cap |
| `backoffMultiplier` | 2 | Exponential backoff factor |

### Backoff Schedule

With default configuration:
- Attempt 1: immediate
- Retry 1: 2000ms delay
- Retry 2: 4000ms delay
- Retry 3: 8000ms delay (capped at maxDelay)

### Usage

```javascript
const RetryManager = require('.aiox-core/core/orchestration/retry-manager');

const retryManager = new RetryManager({
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
});

const result = await retryManager.executeWithRetry('task-id', async () => {
  // Task execution logic
  return await executeTask();
}, {
  onRetry: (taskId, attempt, delay, error) => {
    console.log(`Retrying ${taskId}, attempt ${attempt}, delay ${delay}ms`);
  },
});
```

### Retry Decision Logic

The `shouldRetry(error, attemptNumber)` method determines whether to retry:
- Returns `false` if `attemptNumber >= maxRetries`
- Returns `false` if `error.code === 'PERMANENT'` or `error.permanent === true`
- Returns `true` for all other (transient) errors

### Retry History

```javascript
const history = retryManager.getHistory('task-id');
// { attempts: 2, success: true }

retryManager.clearHistory('task-id'); // Clear specific
retryManager.clearHistory();          // Clear all
```

## CheckpointRecovery

**File:** `.aiox-core/core/orchestration/checkpoint-recovery.js`

### Purpose

Extends `CheckpointManager` with recovery workflows for resuming execution from any saved checkpoint after system interruption.

### Usage

```javascript
const CheckpointRecovery = require('.aiox-core/core/orchestration/checkpoint-recovery');

const recovery = new CheckpointRecovery(projectRoot, {
  baseDir: path.join(projectRoot, 'checkpoints'),
});
await recovery.initialize();

// Validate checkpoint integrity
const isValid = await recovery.validateCheckpoint(checkpointId);

// Resume from checkpoint
const result = await recovery.resumeFromCheckpoint(checkpointId);
```

### Checkpoint Validation

Required fields for a valid checkpoint:
- `task_id` -- Identifier of the task
- `execution_id` -- Unique execution run identifier
- `step` -- Current step in the workflow
- `status` -- Execution status at checkpoint time

### Recovery Workflow

1. Load checkpoint from persistent storage
2. Validate checkpoint integrity (required fields present)
3. Determine resume point based on last completed step
4. Re-execute remaining tasks from that point
5. Handle corrupted checkpoints gracefully (skip and log)

## Integration with Master Orchestrator

The StoryExecutor uses both components:
1. Before each task: check for existing checkpoint (resume point)
2. During execution: RetryManager wraps task calls
3. After each task: save checkpoint for future recovery
4. On failure: retry with backoff, then checkpoint partial progress

## Related

- [Master Orchestrator](master-orchestrator.md)
- [Rollback Framework](rollback-framework.md)
