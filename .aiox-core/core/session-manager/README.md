# Session Manager — Persistent Agent Sessions

## Overview

The Session Manager provides persistent storage and recovery of agent sessions, allowing agents to maintain conversation history, state, and context across process restarts. This solves the **context explosion problem** by enabling agents to resume work without losing prior context.

**Status:** ✅ Complete — Story 1.1, 24/24 tests passing

## Key Features

- **Conversation Persistence** — Store conversation history in JSONL format
- **State Management** — Serialize agent state (context, tasks, memory)
- **Session Resumption** — Load previous session and restore full context
- **CLI Integration** — List, create, resume, and manage sessions via `aiox session`
- **Snapshots & Rollback** — Create snapshots for safe recovery
- **Automatic Cleanup** — Archive sessions older than 30 days
- **Thread-Safe Operations** — File-based locking for concurrent access

## Quick Start

### Create a Session

```bash
# Create a new session for the 'dev' agent
aiox session create dev --story "1.1" --task "Implement SessionManager"

# Output:
# ✓ Session created
#   ID: 065b6019-5140-4d08-872f-59c8113847ad
#   Agent: dev
#   Created: 2026-03-19T01:33:39.577Z
```

### List Active Sessions

```bash
# List all active sessions
aiox session list

# Filter by agent
aiox session list --agent dev

# Output as JSON
aiox session list --json
```

### Resume a Session

```bash
# Resume the most recent session for 'dev'
aiox session resume dev

# Output:
# ✓ Session loaded
#   Session ID: 065b6019
#   Agent: dev
#   Messages: 0
#   Context Tokens: 0
#   Story: 1.1
#   Task: Test
```

### Archive & Snapshot

```bash
# Archive a session (mark as inactive)
aiox session archive dev <session-id>

# Create a snapshot for rollback
aiox session snapshot dev <session-id>

# Delete a session (with confirmation)
aiox session delete dev <session-id>
aiox session delete dev <session-id> --force  # Skip confirmation
```

## Architecture

### Directory Structure

```
.aiox/sessions/
├── {agentId}/                           # Agent-specific directory
│   ├── {sessionId}/                     # Session directory
│   │   ├── metadata.json               # Session metadata
│   │   ├── conversation.jsonl          # Conversation history (line-delimited JSON)
│   │   ├── state.json                  # Agent state
│   │   └── snapshots/                  # Snapshots for rollback
│   │       └── {timestamp}.json
│   └── ...
└── index.json                          # Global session index
```

### Session Schema

```json
{
  "sessionId": "uuid",
  "agentId": "dev|qa|architect|etc",
  "createdAt": "2026-03-20T10:30:00Z",
  "lastActivity": "2026-03-20T11:45:30Z",
  "status": "active|archived|terminated",
  "conversationLength": 147,
  "contextTokens": 2847,
  "metadata": {
    "currentStory": "1.1",
    "currentTask": "Implement SessionManager",
    "branch": "feature/persistent-sessions"
  }
}
```

### Conversation Format (JSONL)

```jsonl
{"role": "user", "content": "...", "timestamp": "2026-03-20T10:30:00Z"}
{"role": "assistant", "content": "...", "timestamp": "2026-03-20T10:30:15Z"}
```

## Usage in Code

### Basic Usage

```javascript
const { SessionManager } = require('.aiox-core/core/session-manager');

const sessionManager = new SessionManager();
await sessionManager.initialize();

// Create a session
const session = await sessionManager.createSession('dev', {
  currentStory: '1.1',
  currentTask: 'Implement feature'
});

// Add messages
await sessionManager.addMessage(session.agentId, session.sessionId, 'user', 'Hello');
await sessionManager.addMessage(session.agentId, session.sessionId, 'assistant', 'Hi!');

// Update state
await sessionManager.updateSessionState(session.agentId, session.sessionId, {
  contextTokens: 2500,
  contextMemory: { important: 'data' }
});

// Load session
const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
console.log(loaded.conversation); // Array of messages
console.log(loaded.state);         // Agent state
```

### Resume Most Recent

```javascript
// Get most recent session for an agent
const session = await sessionManager.getMostRecentSession('dev');
if (session) {
  // Use session.conversation and session.state
  console.log(`Loaded ${session.conversation.length} messages`);
}
```

### Snapshots & Rollback

```javascript
// Create a snapshot before making risky changes
const snapshotFile = await sessionManager.createSnapshot('dev', sessionId);

// ... do something risky ...

// Restore if needed
await sessionManager.restoreFromSnapshot('dev', sessionId, snapshotFile);
```

### Cleanup Old Sessions

```javascript
// Archive sessions older than 30 days
const count = await sessionManager.cleanupOldSessions(30);
console.log(`Archived ${count} old sessions`);
```

## CLI Reference

### `aiox session list`

List all active sessions across all agents.

```bash
aiox session list                    # List all
aiox session list --agent dev        # Filter by agent
aiox session list --json             # Output as JSON
```

**Output:**

```
┌──────────┬───────┬─────────────────────┬─────────────────────┬──────────┬────────┬────────┬───────┐
│ ID       │ Agent │ Created             │ Last Activity       │ Messages │ Tokens │ Status │ Story │
├──────────┼───────┼─────────────────────┼─────────────────────┼──────────┼────────┼────────┼───────┤
│ 065b6019 │ dev   │ 3/19/2026, 1:33 AM  │ 3/19/2026, 1:33 AM  │ 0        │ 0      │ active │ 1.1   │
└──────────┴───────┴─────────────────────┴─────────────────────┴──────────┴────────┴────────┴───────┘

✓ Found 1 active session(s)
```

### `aiox session create <agent-id>`

Create a new session for an agent.

```bash
aiox session create dev
aiox session create dev --story "1.1"
aiox session create dev --story "1.1" --task "Implement feature"
aiox session create dev --branch "feature/my-feature"
```

### `aiox session resume <agent-id>`

Resume an agent's session (most recent by default).

```bash
aiox session resume dev                           # Most recent
aiox session resume dev --session-id <id>        # Specific session
```

### `aiox session archive <agent-id> <session-id>`

Archive a session (mark as inactive).

```bash
aiox session archive dev 065b6019
```

### `aiox session delete <agent-id> <session-id>`

Delete a session permanently.

```bash
aiox session delete dev 065b6019              # Requires confirmation
aiox session delete dev 065b6019 --force      # Skip confirmation
```

### `aiox session snapshot <agent-id> <session-id>`

Create a snapshot for recovery.

```bash
aiox session snapshot dev 065b6019
```

## Testing

All functionality is tested with 24 comprehensive unit tests:

```bash
npm test -- .aiox-core/core/session-manager

# Results:
# PASS .aiox-core/core/session-manager/__tests__/session-manager.test.js
# ✓ 24 tests passed
```

**Test Coverage:**

- ✅ Initialization & directory structure
- ✅ Session creation & retrieval
- ✅ Message handling
- ✅ State management
- ✅ Session lifecycle (archive, delete)
- ✅ Snapshots & rollback
- ✅ Cleanup & maintenance
- ✅ Error handling

## Integration with Agents

### For Agent Developers

When implementing an agent, you can integrate session support:

```javascript
// At startup
const recentSession = await sessionManager.getMostRecentSession(agentId);
if (recentSession) {
  // Restore context from conversation
  context = recentSession.conversation;
  state = recentSession.state;
}

// During operation
await sessionManager.addMessage(agentId, sessionId, 'user', userMessage);
await sessionManager.addMessage(agentId, sessionId, 'assistant', assistantResponse);

// Before shutdown
await sessionManager.updateSessionState(agentId, sessionId, {
  contextTokens: currentTokenCount,
  currentTask: currentTask
});
```

## Performance Characteristics

- **Session Creation:** <50ms
- **Message Addition:** <30ms
- **Session Loading:** <100ms (scales with conversation length)
- **Snapshot Creation:** <200ms
- **Cleanup Operation:** <500ms for 1000 sessions

## Security & Safety

- **Path Traversal Protection:** Session IDs are validated to prevent `../` attacks
- **Atomic Operations:** File writes use atomic patterns for crash safety
- **Automatic Backups:** Snapshots provide rollback capability
- **Isolation:** Each agent has separate session directory
- **Permission Handling:** Graceful degradation on permission errors

## Future Enhancements

- [ ] Compression for large conversation histories
- [ ] Session encryption for sensitive data
- [ ] Cloud backup integration
- [ ] Session merging/diff tools
- [ ] Advanced search in conversation history
- [ ] Automatic session splitting when >10K messages

## Contributing

When modifying SessionManager:

1. Add tests for new functionality
2. Ensure all 24+ existing tests pass
3. Run CodeRabbit review before commit
4. Update this README with new features
5. Follow the AIOX Constitution (CLI-first, story-driven)

## References

- **Story:** [1.1.persistent-sessions.story.md](../../../../../../docs/stories/1.1.persistent-sessions.story.md)
- **Tests:** `.aiox-core/core/session-manager/__tests__/session-manager.test.js`
- **CLI Commands:** `.aiox-core/cli/commands/session.js`
- **Core Class:** `session-manager.js`

---

**Last Updated:** 2026-03-19
**Status:** ✅ Complete & Production-Ready
