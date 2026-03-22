# Model Economy — Agent Cost Optimization Rules

## Model Selection by Task Category

Every Agent tool call MUST specify the `model` parameter based on the task category below.
Default to the cheapest model that can handle the task. Escalate only when needed.

### Category → Model Matrix

| Category | Model | Cost Ratio | Examples |
|----------|-------|------------|---------|
| **Search & Explore** | `haiku` | 1x (base) | File search, grep patterns, codebase exploration, listing files, reading configs |
| **Diagnostics** | `haiku` | 1x | SYNAPSE diagnostics, health checks, status reports, lint/typecheck runs |
| **Documentation** | `haiku` | 1x | Reading docs, generating summaries, creating READMEs, changelogs |
| **Simple Implementation** | `sonnet` | 5x | Bug fixes, small features, test writing, config changes, refactoring |
| **Complex Implementation** | `sonnet` | 5x | Multi-file features, API endpoints, test suites, integrations |
| **Architecture & Design** | `opus` | 24x | System design, complex algorithms, security review, critical decisions |
| **Multi-step Autonomous** | `sonnet` | 5x | YOLO mode tasks, story implementation, delegation chains |

### Rules

1. **Always specify `model` in Agent calls** — never let it default to opus for subagents
2. **Explore agents → haiku** — they only read files and search, no writing needed
3. **Test/lint/diagnostic agents → haiku** — they run commands and report results
4. **Implementation agents → sonnet** — good enough for 95% of coding tasks
5. **Only use opus for subagents when** the task requires complex reasoning across many files simultaneously

### Anti-Patterns (NEVER do)

- Running Explore agent on opus ($9.50 vs $0.40 on haiku)
- Running diagnostic/status checks on opus ($4 vs $0.20 on haiku)
- Leaving model unspecified for background agents (defaults to expensive parent model)
- Using opus subagent for simple file reads or searches

### Session Management

- Use `/compact` after completing each major task
- Start new session after ~200 messages (cost grows quadratically)
- Delegate independent tasks to subagents (isolated context = lower cost)
- Prefer parallel haiku subagents over sequential opus main-thread work
