# Rollback Framework

## Overview

The RollbackManager provides atomic rollback capability for task execution failures. It tracks file changes during task execution and can revert the filesystem to its pre-task state when a task fails permanently.

## RollbackManager

**File:** `.aiox-core/core/orchestration/rollback-manager.js`

### Initialization

```javascript
const RollbackManager = require('.aiox-core/core/orchestration/rollback-manager');

const rollbackManager = new RollbackManager(projectRoot, {
  baseDir: path.join(projectRoot, '.aiox', 'rollbacks'),
});
await rollbackManager.initialize();
```

### Tracking Changes

Before modifying files during task execution, register each change:

```javascript
// Track a file modification (saves backup of current content)
await rollbackManager.trackChange('src/module.js', 'modified');

// Track a new file creation
await rollbackManager.trackChange('src/new-file.js', 'created');

// Track a file deletion
await rollbackManager.trackChange('src/old-file.js', 'deleted');
```

### Performing Rollback

When a task fails and cannot be retried:

```javascript
// Rollback all changes for a specific task
await rollbackManager.rollback(taskId);

// Rollback all tracked changes
await rollbackManager.rollbackAll();
```

### Change History

```javascript
const history = rollbackManager.getHistory('src/module.js');
// Returns change tracking data for the file
```

## Rollback Strategy

### Change Types

| Type | Tracking | Rollback Action |
|------|----------|----------------|
| `modified` | Save original content to backup | Restore from backup |
| `created` | Record file path | Delete created file |
| `deleted` | Save full content to backup | Recreate from backup |

### Atomicity

Rollback operations are performed atomically per task:
1. All file changes for a task are tracked together
2. On rollback, all changes are reverted in reverse order
3. If rollback itself fails, the error is logged and partial state is preserved

### Storage

Backups are stored in `.aiox/rollbacks/` with timestamped keys:
```
.aiox/rollbacks/
├── src-module.js-1711065600000    # Backup of modified file
├── src-old-file.js-1711065600001  # Backup of deleted file
└── ...
```

## Integration with Execution Pipeline

The rollback framework integrates with the Master Orchestrator execution flow:

```
Task Start
  ├── Track all file changes (pre-execution backups)
  ├── Execute task
  ├── Success? → Clear tracking, save checkpoint
  └── Failure?
       ├── Retryable? → RetryManager handles
       └── Permanent? → RollbackManager.rollback() → fail fast
```

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Task fails after modifying 3 files | All 3 files rolled back to pre-task state |
| Backup directory missing | Auto-created on `initialize()` |
| Backup file corrupted | Log warning, skip that file's rollback |
| Concurrent modifications | Last-write-wins (single-threaded execution) |

## Related

- [Master Orchestrator](master-orchestrator.md)
- [Retry and Recovery](retry-and-recovery.md)
