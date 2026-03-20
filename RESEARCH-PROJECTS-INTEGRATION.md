# 🔬 Research Projects Integration — Full Access

**Status:** INTEGRATED & ACTIVE
**Location:** `/srv/aiox/squads/research-projects/`
**Access:** 100% functional as active squad

---

## Projects Consolidated

### 1. DeepInnovator
```
Location: /srv/aiox/squads/research-projects/DeepInnovator/
Status: ACTIVE & ACCESSIBLE
Access: Full integration as squad component
```

### 2. MiroFish
```
Location: /srv/aiox/squads/research-projects/MiroFish/
Status: ACTIVE & ACCESSIBLE
Access: Full integration as squad component
```

### 3. claude-hud
```
Location: /srv/aiox/squads/research-projects/claude-hud/
Status: ACTIVE & ACCESSIBLE
Access: Full integration as squad component
```

---

## How to Access

### Via File System
```bash
# Browse research projects
ls -la /srv/aiox/squads/research-projects/

# Access specific project
cd /srv/aiox/squads/research-projects/DeepInnovator
ls -la
```

### Via AIOX CLI
```bash
# List all squads (including research-projects)
aiox squad list

# Navigate to research-projects squad
cd /srv/aiox/squads/research-projects

# View structure
aiox graph --deps
```

### Via Git
```bash
# All projects are now under version control
cd /srv/aiox
git log --oneline -- squads/research-projects/

# Track changes
git status squads/research-projects/
```

---

## Integration Details

### What Remained Consolidated
- ✅ All source files
- ✅ All configurations
- ✅ All data structures
- ✅ Full directory hierarchy

### What's Now Accessible
- ✅ Via `/srv/aiox/squads/research-projects/` path
- ✅ Via AIOX squad management commands
- ✅ Via Git version control
- ✅ Via IDE file explorer
- ✅ Via CLI tools

### What's Enabled
- ✅ Development on any project
- ✅ Integration with other squads
- ✅ Version control tracking
- ✅ Automation via AIOX CLI
- ✅ Agent-based work (via appropriate agents)

---

## Using Research Projects

### Example 1: Work on DeepInnovator
```bash
cd /srv/aiox/squads/research-projects/DeepInnovator
# View project structure
ls -la

# Check for README
cat README.md

# Start development
npm install    # if applicable
npm run dev    # if applicable
```

### Example 2: Run Tests
```bash
cd /srv/aiox/squads/research-projects/MiroFish
npm test
```

### Example 3: Integrate with AIOX Workflow
```bash
# Create story from research project
@sm *create-story --project=research-projects/claude-hud

# Deploy research project component
aiox deploy --squad=research-projects --project=claude-hud
```

---

## Structure After Consolidation

```
/srv/aiox/squads/research-projects/
├─ DeepInnovator/
│  ├─ agents/          (9 agent configs)
│  ├─ tasks/
│  ├─ workflows/
│  ├─ README.md
│  └─ [source files]
├─ MiroFish/
│  ├─ agents/
│  ├─ tasks/
│  └─ [source files]
└─ claude-hud/
   ├─ agents/
   ├─ tasks/
   └─ [source files]
```

---

## Benefits of Integration

✅ **Single Location:** Everything in `/srv/aiox/` canonical location
✅ **Full Access:** No archival or hiding, fully operational
✅ **Version Control:** Git tracks all changes
✅ **Automation:** AIOX CLI can work with research projects
✅ **Discoverability:** Easy to find via squad structure
✅ **Collaboration:** Can be shared with team via AIOX agents
✅ **Flexibility:** Can move to production when ready

---

## Migration Notes

- **Original Location:** `/root/AIOX/projects/{DeepInnovator,MiroFish,claude-hud}`
- **New Location:** `/srv/aiox/squads/research-projects/{project-name}`
- **Date Consolidated:** 2026-03-21
- **Status:** FULLY INTEGRATED & OPERATIONAL

---

**All research projects are now treated as first-class AIOX squads with full access and integration capabilities.**
