# Mega-Brain Command Reference

The mega-brain system provides CLI commands for knowledge ingestion, RAG search, and multi-perspective deliberation.

## Commands Overview

### `/ingest` — Add Knowledge to the Knowledge Base

Ingest new knowledge entries (videos, PDFs, courses, podcasts, text, articles, transcripts) into the knowledge base.

**Usage:**
```bash
aiox mega-brain ingest --title "Title" --content "Content" --source "source" --type "text" --domain "domain"
```

**Options:**
- `--title` (required): Knowledge entry title
- `--content` (required): Content text
- `--source` (required): Source reference (URL, file, etc.)
- `--type` (required): Content type: `video`, `pdf`, `course`, `podcast`, `text`, `article`, `transcript`
- `--domain` (required): Knowledge domain (e.g., `ai`, `business`, `marketing`, `product`)
- `--expert` (optional): Expert/author name
- `--tags` (optional): Comma-separated tags
- `--metadata` (optional): JSON metadata

**Returns:**
```json
{
  "success": true,
  "id": "know_1704067200000_abc123",
  "message": "✅ Knowledge ingested successfully",
  "entry": {
    "id": "know_1704067200000_abc123",
    "title": "Title",
    "type": "text",
    "domain": "ai",
    "summary": "Auto-generated summary",
    "keyPoints": ["key point 1", "key point 2"]
  }
}
```

**Examples:**
```bash
# Ingest a text article
aiox mega-brain ingest \
  --title "Machine Learning Basics" \
  --content "Machine learning is a subset of artificial intelligence..." \
  --source "https://example.com/ml-basics" \
  --type text \
  --domain ai \
  --expert "John Doe" \
  --tags "ml,ai,fundamentals"

# Ingest video transcript
aiox mega-brain ingest \
  --title "YouTube: Building Scalable Systems" \
  --content "In this video, we discuss how to build..." \
  --source "youtube.com/watch?v=..." \
  --type transcript \
  --domain "system-design"
```

### `/ask-council` — Get Multi-Perspective Deliberation

Submit a question to the 11-member deliberation council for evidence-based recommendations.

**Usage:**
```bash
aiox mega-brain ask-council --question "Your question?" [--domains "domain1,domain2"]
```

**Options:**
- `--question` (required): Question to ask the council
- `--domains` (optional): Comma-separated domains to focus on

**Returns:**
```json
{
  "success": true,
  "recommendation": {
    "position": "YES|NO|MIXED",
    "confidence": "75.3%",
    "reasoning": "Based on 11 council members: 7 positive, 2 negative, 2 neutral.",
    "alternativePerspectives": ["Alternative 1", "Alternative 2"],
    "caveats": ["Caveat 1"],
    "actionItems": ["Action 1", "Action 2"]
  },
  "arguments": [
    {
      "agent": "member-1",
      "position": "Evidence-first approach...",
      "confidence": "85.0%",
      "evidence": 2
    }
  ],
  "evidence": {
    "citations": 5,
    "sources": ["source1", "source2"]
  },
  "message": "🎯 Council Deliberation Complete (145ms)"
}
```

**Council Members & Roles:**

| Member | Role | Perspective |
|--------|------|-------------|
| Analytic Mind | analyst | Evidence-first approach |
| Pragmatic Operator | pragmatist | What works in reality |
| Bold Initiator | hawk | Aggressive growth mindset |
| Cautious Guardian | dove | Risk mitigation focused |
| Idealist Visionary | idealist | Long-term mission alignment |
| Devil Advocate | devil-advocate | Challenge assumptions |
| Customer Champion | pragmatist | Customer-centric view |
| Systems Thinker | analyst | Holistic system view |
| Speed Champion | hawk | Bias toward action |
| Quality Guardian | dove | Excellence matters |
| Future Scanner | idealist | What could emerge |

**Examples:**
```bash
# Ask about a product decision
aiox mega-brain ask-council \
  --question "Should we launch the premium tier now or wait?"

# Ask about a technical decision with specific domains
aiox mega-brain ask-council \
  --question "Should we migrate to microservices?" \
  --domains "system-design,operations"

# Get council composition
aiox mega-brain get-council
```

### `/knowledge-search` — RAG Search with Citations

Search the knowledge base using Retrieval-Augmented Generation (RAG) with evidence tracking.

**Usage:**
```bash
aiox mega-brain search --query "Your query" [--domain "domain"] [--limit 5] [--min-relevance 0.6]
```

**Options:**
- `--query` (required): Search query
- `--domain` (optional): Restrict search to specific domain
- `--limit` (optional): Max results (default: 5)
- `--min-relevance` (optional): Relevance threshold 0.0-1.0 (default: 0.6)

**Returns:**
```json
{
  "success": true,
  "results": [
    {
      "rank": 1,
      "title": "Result Title",
      "type": "text",
      "domain": "ai",
      "relevance": "92.5%",
      "summary": "Summary text",
      "matchedText": "Matched excerpt from content",
      "expert": "Expert Name"
    }
  ],
  "citations": [
    {
      "rank": 1,
      "title": "Source Title",
      "source": "source-reference",
      "quote": "Relevant quote",
      "relevance": "92.5%",
      "domain": "ai",
      "expert": "Expert Name"
    }
  ],
  "summary": "Summary of results",
  "confidence": "87.3%",
  "message": "🔍 Found 3 relevant knowledge entries"
}
```

**Examples:**
```bash
# Basic search
aiox mega-brain search --query "How to scale distributed systems?"

# Search by domain
aiox mega-brain search \
  --query "Authentication patterns" \
  --domain "system-design"

# High relevance search
aiox mega-brain search \
  --query "Prompt engineering best practices" \
  --min-relevance 0.8 \
  --limit 10

# Search by domain
aiox mega-brain search-domain --domain "ai"

# Compare perspectives across domains
aiox mega-brain compare-domains \
  --query "Should we use AI for this task?" \
  --domains "ai,product,operations"
```

## Performance

- **Ingest**: 0-10ms per entry (local embeddings)
- **Search**: <100ms for 1000 entries
- **Deliberation**: <5 seconds for full council
- **Memory**: <50MB for 1000 entries

## Data Storage

Knowledge entries are stored in:
```
.aiox-core/data/knowledge/knowledge-base.json
```

This file is git-tracked for version control.

## API Integration

All commands return structured JSON for programmatic use:

```typescript
// TypeScript
import { ingestCommand } from './.aiox-core/commands/ingest';
import { askCouncilCommand } from './.aiox-core/commands/ask-council';
import { searchKnowledgeCommand } from './.aiox-core/commands/knowledge-search';

// Ingest
const result = await ingestCommand({
  title: 'My Knowledge',
  content: 'Content...',
  source: 'source',
  type: 'text',
  domain: 'ai'
});

// Ask Council
const rec = await askCouncilCommand({
  question: 'Should we do X?',
  domains: ['ai', 'product']
});

// Search
const search = await searchKnowledgeCommand({
  query: 'How to build...',
  domain: 'system-design',
  limit: 10
});
```

## Knowledge Domains

Recommended domains for organization:

- **ai** - Artificial Intelligence, Machine Learning
- **product** - Product Management, Requirements
- **system-design** - Architecture, Scalability
- **operations** - DevOps, Infrastructure
- **marketing** - Marketing, Growth
- **business** - Business Strategy
- **security** - Security, Privacy
- **ux** - User Experience, Design
- **data** - Data Engineering, Analytics
- **custom-domain** - Any custom domain

## Troubleshooting

**No results found:**
- Check knowledge base is not empty (run `aiox mega-brain stats`)
- Lower `--min-relevance` threshold
- Ensure domain matches indexed entries

**Council gives unclear answer:**
- Ask a more specific question
- Provide relevant domain hints
- Ingest more knowledge on the topic

**Knowledge base grows too large:**
- Export and archive: `aiox mega-brain export --output archive.json`
- Delete old entries: `aiox mega-brain delete-old --days 90`
- Manage in `knowledge-base.json` directly
