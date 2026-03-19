# AIOX Orchestration Integration Guide

Complete guide to using Squad Orchestrator + Task Chain + Evolution Worker together.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      LLM Backend Layer                       │
│  LLMFactory: Routes to Claude API or Ollama (100% offline) │
└────────────────┬────────────────────────────┬───────────────┘
                 │                            │
        ┌────────▼──────────┐      ┌──────────▼────────┐
        │  Claude Backend   │      │  Ollama Backend   │
        │  (claude-opus)    │      │  (qwen2.5:14b)    │
        │  (claude-sonnet)  │      │  (deepseek-coder) │
        └────────┬──────────┘      └──────────┬────────┘
                 │                            │
     ┌───────────┴────────────────────────────┴──────────────┐
     │                                                        │
┌────▼────────────────────────┐      ┌──────────────────────▼────┐
│   Squad Orchestrator        │      │   Task Chain Manager       │
│   (Parallel Execution)      │      │   (Sequential Execution)   │
├─────────────────────────────┤      ├───────────────────────────┤
│ • registerSquad()           │      │ • addStep()               │
│ • executeSquad()            │      │ • execute()               │
│ • executeSequence()         │      │ • getProgress()           │
│ • getResult()               │      │ • saveProgress()          │
└────┬──────────────────┬─────┘      └───────────┬──────────────┘
     │                  │                        │
┌────▼──────┐   ┌──────▼────┐          ┌────────▼──────┐
│  @pm      │   │   @dev    │          │ Squad Chain   │
│  @po      │   │   @qa     │          │ (planning →   │
│  @sm      │   │ @devops   │          │  design →     │
│ (Parallel)│   │ (Parallel)│          │  dev → qa)    │
└───────────┘   └───────────┘          └───────────────┘
     │                  │                        │
     └──────────────────┼────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │ Evolution Worker   │
              │ 24/7 Autonomous    │
              └────────────────────┘
```

## Layer Responsibilities

### 1. LLM Backend (Abstract Interface)
- **File:** `.aiox-core/llm/llm-backend.js`
- **Responsibility:** Define standard interface for LLM operations
- **Methods:**
  - `executeAgent(agentId, task, context)`
  - `chat(prompt, options)`
  - `streamChat(prompt, onChunk, options)`
  - `getStatus()`
  - `getMetrics()`

### 2. Claude Backend
- **File:** `.aiox-core/llm/backends/claude-backend.js`
- **Responsibility:** Implement via Anthropic SDK
- **Models:**
  - `claude-opus-4-6` (complex reasoning)
  - `claude-sonnet-4-6` (default)
- **Cost:** Token-based (production)

### 3. Ollama Backend
- **File:** `.aiox-core/llm/backends/ollama-backend.js`
- **Responsibility:** Implement via HTTP API (localhost:11434)
- **Models:**
  - `qwen2.5:14b` (complex reasoning)
  - `deepseek-coder:6.7b` (code generation)
  - `qwen2.5:7b` (default/fast)
- **Cost:** Zero (100% offline)

### 4. LLM Factory
- **File:** `.aiox-core/llm/llm-factory.js`
- **Responsibility:** Create appropriate backend based on environment
- **Selection Logic:**
  - If `AIOX_OFFLINE_MODE=true` → Ollama
  - Else → Claude (default)

### 5. Squad Orchestrator
- **File:** `.aiox-core/orchestration/squad-orchestrator.js`
- **Responsibility:** Run multiple agents in parallel
- **Input:** Squad ID, list of agents, context
- **Output:** Results from all agents
- **Use Case:** Planning squad (@pm, @po, @sm) running simultaneously

### 6. Task Chain Manager
- **File:** `.aiox-core/orchestration/task-chain.js`
- **Responsibility:** Sequence squads with data flow
- **Pattern:** Squad 1 output → Squad 2 input → Squad 3 input
- **Use Case:** Full workflow (planning → design → dev → qa → deploy)

### 7. Evolution Worker
- **File:** `/force-ollama/executor/evolution-worker-24-7.js`
- **Responsibility:** 24/7 autonomous executor
- **Integration:** Uses LLMFactory + SquadOrchestrator + TaskChain
- **Default Backend:** Ollama (zero token cost)
- **Override:** `EVOLUTION_BACKEND=claude` to switch

## Usage Patterns

### Pattern 1: Quick Squad Execution (Parallel)

```javascript
const SquadOrchestrator = require('./.aiox-core/orchestration/squad-orchestrator');

const orchestrator = new SquadOrchestrator({ backendType: 'ollama' });
orchestrator.registerSquad('planning', ['@pm', '@po', '@sm']);

const results = await orchestrator.executeSquad('planning', {
  '@pm': { prompt: 'Analyze requirements' },
  '@po': { prompt: 'Define scope' },
  '@sm': { prompt: 'Create story' },
});

// All 3 agents ran in parallel
console.log('PM:', results.get('@pm').response);
console.log('PO:', results.get('@po').response);
console.log('SM:', results.get('@sm').response);
```

### Pattern 2: Full Workflow (Sequential)

```javascript
const TaskChain = require('./.aiox-core/orchestration/task-chain');

const chain = new TaskChain('story-5.1', { backendType: 'ollama' });

// Define workflow: planning → design → dev → qa → deploy
chain.addStep('planning', ['@pm', '@po', '@sm'], 'Requirements gathering');
chain.addStep('design', ['@architect', '@data-engineer'], 'System design');
chain.addStep('development', ['@dev'], 'Implementation');
chain.addStep('quality', ['@qa'], 'Testing');
chain.addStep('deployment', ['@devops'], 'Release');

// Execute (each step gets output from previous step)
const results = await chain.execute({
  storyId: 'story-5.1',
  requirements: '...',
});

// Check progress
console.log(chain.getProgress());
```

### Pattern 3: Evolution Worker Integration

```javascript
const EvolutionWorker = require('/force-ollama/executor/evolution-worker-24-7');

const worker = new EvolutionWorker(); // Uses Ollama by default
// Or: EVOLUTION_BACKEND=claude node evolution-worker-24-7.js

// Worker automatically:
// - Reads implementation-progress.md
// - Parses pending tasks
// - Routes to appropriate agents
// - Executes squads in parallel when possible
// - Chains squads together for workflows
// - Saves progress to memory/
await worker.run();
```

### Pattern 4: Backend Switching

```javascript
// For development (cheap/free)
const devOrchestrator = new SquadOrchestrator({ backendType: 'ollama' });

// For production (high quality)
const prodOrchestrator = new SquadOrchestrator({ backendType: 'claude' });

// Both execute the SAME workflow, just different backends!
// Zero code duplication
```

## Model Routing Strategy

### Ollama (Offline)
```javascript
// Complex reasoning (architects, PMs)
qwen2.5:14b  // @architect, @pm, @po, tasks > 500 chars

// Code tasks
deepseek-coder:6.7b  // @dev, code generation

// Default/fast
qwen2.5:7b  // Everything else
```

### Claude (API)
```javascript
// Complex reasoning
claude-opus-4-6  // @architect, @pm, @po, tasks > 500 chars

// Default
claude-sonnet-4-6  // Everything else
```

## Example: Full Story Development

```javascript
// Story 5.1: Implement real-time sync

const chain = new TaskChain('story-5.1', { backendType: 'ollama' });

// Phase 1: Planning (parallel)
chain.addStep('planning', ['@pm', '@po', '@sm'],
  'Gather requirements, define scope, create story');

// Phase 2: Design (parallel)
chain.addStep('design', ['@architect', '@data-engineer'],
  'Choose architecture, design schema');

// Phase 3: Implementation
chain.addStep('development', ['@dev'],
  'Build real-time sync feature');

// Phase 4: Quality
chain.addStep('quality', ['@qa'],
  'Integration tests, performance validation');

// Phase 5: Deployment
chain.addStep('deployment', ['@devops'],
  'Deploy to production, monitor');

// Execute full workflow
const results = await chain.execute({
  storyId: 'story-5.1',
  epic: 'EPIC-5: Evolution Engine',
  requirements: 'Implement real-time sync using WebSockets',
});

// All results available in memory/chain-story-5.1-progress.json
await chain.saveProgress();
```

## Configuration

### Environment Variables

```bash
# Choose backend
AIOX_OFFLINE_MODE=true          # Use Ollama (default)
AIOX_OFFLINE_MODE=false         # Use Claude

# Evolution Worker backend
EVOLUTION_BACKEND=ollama        # Default (free 24/7)
EVOLUTION_BACKEND=claude        # Alternative (token cost)

# Ollama settings
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Claude settings
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-opus-4-6
```

## Key Files

| File | Purpose |
|------|---------|
| `.aiox-core/llm/llm-backend.js` | Abstract interface |
| `.aiox-core/llm/backends/claude-backend.js` | Claude implementation |
| `.aiox-core/llm/backends/ollama-backend.js` | Ollama implementation |
| `.aiox-core/llm/llm-factory.js` | Backend factory |
| `.aiox-core/orchestration/squad-orchestrator.js` | Parallel execution |
| `.aiox-core/orchestration/task-chain.js` | Sequential execution |
| `.aiox-core/orchestration/index.js` | Orchestration exports |
| `.aiox-core/orchestration/example-usage.js` | Complete examples |
| `/force-ollama/executor/evolution-worker-24-7.js` | 24/7 autonomous worker |

## Benefits

✅ **Zero Code Duplication** - Same agents, squads, tasks for both Claude and Ollama
✅ **Flexible Backend** - Switch between Claude and Ollama with one environment variable
✅ **Parallel Execution** - Squads run agents in parallel for speed
✅ **Sequential Workflows** - Task chains coordinate multi-squad workflows
✅ **24/7 Autonomous** - Evolution Worker runs continuously without user input
✅ **Cost Optimization** - Use Ollama for dev (free), Claude for production (quality)
✅ **Progress Tracking** - All results saved to memory/ for transparency

## Next Steps

1. ✅ LLM Backend abstraction (Claude + Ollama)
2. ✅ Squad Orchestrator (parallel execution)
3. ✅ Task Chain Manager (sequential workflows)
4. ✅ Evolution Worker integration
5. ⏳ Web dashboard for monitoring
6. ⏳ Automated escalation rules
7. ⏳ Multi-team collaboration features
