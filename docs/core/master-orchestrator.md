# Master Orchestrator

## Overview

The Master Orchestrator is the central coordination layer for AIOX's task execution pipeline. It integrates all Sprint 1 components (TaskExecutor, ConstitutionalGates, CheckpointManager) with Sprint 2 additions (RetryManager, RollbackManager, CheckpointRecovery, PerformanceProfiler) into a unified execution engine.

## Architecture

```
MasterOrchestrator
├── TaskExecutor (Sprint 1) - Individual task execution
├── ConstitutionalGates (Sprint 1) - Pre-execution validation
├── CheckpointManager (Sprint 1) - Execution state persistence
├── RetryManager (Sprint 2) - Exponential backoff retry logic
├── RollbackManager (Sprint 2) - Atomic file change rollback
├── CheckpointRecovery (Sprint 2) - Resume from any checkpoint
└── PerformanceProfiler (Sprint 2) - Latency and memory tracking
```

## Execution Flow

1. **Load** -- Parse story file and extract task list
2. **Validate** -- Run ConstitutionalGates pre-execution checks
3. **Sort** -- Topological sort on task dependency graph
4. **Execute** -- For each task:
   - Check checkpoint for resume point
   - Load task context
   - Execute with RetryManager wrapping
   - Save checkpoint on success
   - On failure: RollbackManager reverts, RetryManager retries
5. **Audit** -- Write execution trail for observability

## Key Module

**File:** `.aiox-core/core/orchestration/story-executor.js`

The `StoryExecutor` class is the primary entry point. It wraps `TaskExecutor` and `CheckpointManager`, validates against `ConstitutionalGates`, and orchestrates the full story execution lifecycle.

### Constructor

```javascript
const executor = new StoryExecutor(projectRoot, storyId);
await executor.initialize();
```

### executeStory(options)

```javascript
const result = await executor.executeStory({
  tasks: [...],
  branch: 'feature/8.2-integration',
  qualityChecks: { buildPass: true, coderabbitCritical: 0 },
  skipQuality: false,
  maxRetries: 3,
  autoRecovery: true,
});
```

**Returns:** `{ success, completedTasks, failedTasks, duration }`

## Error Handling Strategy

| Error Type | Behavior |
|------------|----------|
| Transient (network, timeout) | Retry with exponential backoff |
| Permanent (validation, logic) | Rollback and fail fast |
| Constitutional violation | Block pre-execution |
| System error | Preserve state, request intervention |

## Performance Targets

- Task execution: < 500ms per task
- Gate validation: < 1000ms for 100 files
- Checkpoint save/load: < 100ms

## Related

- [Retry and Recovery](retry-and-recovery.md)
- [Rollback Framework](rollback-framework.md)
- [Constitutional Gates](constitutional-gates.md)
- [Task Checkpoint Manager](task-checkpoint-manager.md)
