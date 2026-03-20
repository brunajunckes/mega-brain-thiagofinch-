# Agent Handoff Protocol - Context Preservation

## Overview

The Agent Handoff Protocol enables seamless context transfer when control passes between AI agents (dev → qa → devops). Handoffs preserve decisions, file changes, blockers, and execution context without losing information.

## Why Handoffs Matter

When Agent A passes work to Agent B:
- **Without Handoffs:** Agent B must re-analyze full context (wasted tokens, lost nuance)
- **With Handoffs:** Agent B resumes with explicit context (efficient, targeted)

## Handoff Artifact Structure

A handoff is a compact JSON document (~379 tokens vs 3-5KB for full agent context):

```json
{
  "id": "uuid-1234",
  "from_agent": "dev",
  "to_agent": "qa",
  "story_context": {
    "story_id": "8.1",
    "story_status": "In Progress",
    "current_task": "Task 1.3: Task Executor",
    "branch": "feature/8.1-foundation",
    "commit_hash": "a1bd08d0..."
  },
  "decisions": [
    {
      "decision": "Use topological sort for dependency resolution",
      "rationale": "Handles complex task graphs, proven algorithm",
      "timestamp": "2026-03-21T10:00:00Z"
    }
  ],
  "files_modified": [
    {
      "path": "src/task-executor.js",
      "status": "created",
      "lines_added": 250,
      "lines_removed": 0
    }
  ],
  "blockers": [
    {
      "blocker": "Session manager race conditions",
      "severity": "HIGH",
      "workaround": "Added async locking with queue-based waits"
    }
  ],
  "next_action": "*run-tests",
  "context_summary": "Task executor implementation complete with 16 tests passing. Ready for integration tests.",
  "created_at": "2026-03-21T10:30:00Z",
  "consumed": false
}
```

## HandoffArtifact API

### Creating a Handoff

```javascript
const { HandoffArtifact } = require('.aiox-core/core/agent-system/handoff');

const handoff = new HandoffArtifact({
  from_agent: 'dev',
  to_agent: 'qa',
  story_context: {
    story_id: '8.1',
    story_status: 'In Progress',
    current_task: 'Task 1.3',
    branch: 'feature/8.1-foundation',
  },
  next_action: '*run-tests',
  context_summary: 'Executor implementation ready for QA',
});

// Add decision
handoff.addDecision(
  'Use topological sort for task ordering',
  'Industry standard, handles complex graphs'
);

// Track file changes
handoff.addFileModified('src/task-executor.js', 'created', 250, 0);
handoff.addFileModified('tests/task-executor.test.js', 'created', 150, 0);

// Record blockers
handoff.addBlocker(
  'Session race conditions resolved',
  'HIGH',
  'Added async locking mechanism'
);

// Validate
const validation = handoff.validate();
if (!validation.valid) {
  console.error('Handoff invalid:', validation.errors);
}

// Get summary
console.log(handoff.getSummary());
```

### Serialization

```javascript
// Serialize for storage
const json = handoff.toJSON();

// Deserialize from storage
const restored = HandoffArtifact.fromJSON(json);
```

### Marking as Consumed

```javascript
handoff.markConsumed(); // Sets consumed: true and consumed_at timestamp
```

## HandoffStore API

### Initialize

```javascript
const { HandoffStore } = require('.aiox-core/core/agent-system/handoff-store');

const store = new HandoffStore({
  baseDir: '.aiox/handoffs', // Default: .aiox/handoffs
  maxHandoffs: 100,
});

await store.initialize();
```

### Save Handoff

```javascript
const handoffId = await store.save(handoff);
// Saves to: .aiox/handoffs/handoff-dev-to-qa-2026-03-21T10-30-00.json
// Atomic write: temp file → rename
```

### Load Handoff

```javascript
const loaded = await store.load(handoffId);
// Uses in-memory cache for subsequent loads
```

### Get Latest Unconsumed

```javascript
const latest = await store.getLatestUnconsumed();
if (latest) {
  console.log(`Resume from: ${latest.from_agent} → ${latest.to_agent}`);
  console.log(`Next action: ${latest.next_action}`);
}
```

### Manage Handoffs

```javascript
// Get handoffs from specific agent
const devHandoffs = await store.getHandoffsFrom('dev');

// Get all unconsumed
const pending = await store.getAllUnconsumed();

// Mark as consumed
await store.markConsumed(handoffId);

// Cleanup old handoffs
const result = await store.cleanup(7); // Keep 7 days, default complete only
console.log(`Deleted ${result.deleted_count} old handoffs`);

// List all
const all = await store.listAll();

// Get statistics
const stats = await store.getStats();
console.log(`Total: ${stats.total_checkpoints}`);
console.log(`By status:`, stats.by_status);
```

## Workflow Example: Agent Handoff Cycle

### Dev Agent Creates Handoff

```javascript
// dev agent finishes implementation
const handoff = new HandoffArtifact({
  from_agent: 'dev',
  to_agent: 'qa',
  story_context: {
    story_id: '8.1',
    branch: 'feature/8.1-foundation',
  },
  next_action: '*run-tests',
});

handoff.addDecision('Chose async locking for race conditions', 'Thread-safe, proven');
handoff.addFileModified('src/executor.js', 'created', 300, 0);

await store.save(handoff);
// QA agent can now load this handoff
```

### QA Agent Consumes Handoff

```javascript
// qa agent starts
const latest = await store.getLatestUnconsumed();

console.log(`Resuming from: ${latest.from_agent}`);
console.log(`Task: ${latest.story_context.current_task}`);
console.log(`Branch: ${latest.story_context.branch}`);
console.log(`Next: ${latest.next_action}`);

// Do work...

// When finished
await store.markConsumed(latest.id);
```

## File Organization

```
.aiox/handoffs/
├── handoff-dev-to-qa-2026-03-21T10-30-00.json
├── handoff-qa-to-architect-2026-03-21T11-45-00.json
├── handoff-architect-to-dev-2026-03-21T13-00-00.json
└── ... (timestamped handoff files)
```

## Schema Reference

See `.aiox-core/core/agent-system/handoff.schema.json` for full validation schema:

- **Required fields:** id, from_agent, to_agent, story_id, created_at, decisions
- **Array limits:** decisions (5), files_modified (10), blockers (3)
- **String limits:** from_agent/to_agent (50 chars), context_summary (500 chars)
- **Enum fields:** status (in_progress, completed, failed, skipped)

## Best Practices

### Creating Effective Handoffs

✅ **Do:**
- Include only non-obvious decisions
- Track high-impact file changes
- Note active blockers with workarounds
- Keep context_summary to essentials
- Set clear next_action

❌ **Don't:**
- Over-document (handoffs are compact, not books)
- Include trivial decisions
- Leave blockers unresolved
- Create duplicate handoffs
- Forget to mark as consumed

### Handoff Timing

| Phase | When | Actor |
|-------|------|-------|
| **Create** | Task complete, ready for next phase | Outgoing agent |
| **Store** | Before agent switch | Outgoing agent |
| **Load** | At start of new phase | Incoming agent |
| **Consume** | When work is done | Incoming agent |

## Testing

```bash
npx jest .aiox-core/core/agent-system/__tests__/handoff.test.js --verbose
# 35 tests: HandoffArtifact (13) + HandoffStore (22)
```

## Integration with Agent System

Handoffs integrate with AIOX agent lifecycle:

```
Agent A completes work
  ↓
Creates HandoffArtifact
  ↓
HandoffStore.save() → .aiox/handoffs/
  ↓
Agent B starts
  ↓
HandoffStore.getLatestUnconsumed()
  ↓
Resumes with explicit context
  ↓
HandoffStore.markConsumed()
```

## See Also

- `.aiox-core/core/agent-system/handoff.js` - HandoffArtifact implementation
- `.aiox-core/core/agent-system/handoff-store.js` - Storage/retrieval
- `.aiox-core/core/agent-system/handoff.schema.json` - Validation schema
- CLAUDE.md `.claude/rules/agent-handoff.md` - Protocol governance rules
