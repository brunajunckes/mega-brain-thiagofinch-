# 🚀 VPS CONSOLIDATION PLAN — Single Canonical Location

**Status:** READY FOR EXECUTION
**Target:** `/srv/aiox` como single source of truth
**Timeline:** 4-6 horas
**Risk:** MEDIUM (but fully reversible with backups)

---

## 📊 CURRENT STATE (Before)

```
/srv/aiox/          1.2 GB  ← GIT REPO (canonical)
/root/AIOX/         7.6 GB  ← Legacy backup
/root/.aiox/        14 MB   ← Logs & state
/root/.ollama/      4 GB    ← Models (in use)
/root/.claude/      14 MB   ← Old config
/root/.docker/      2 GB    ← Docker volumes
/root/.cache/       100 MB  ← Cache
/root/.npm/         500 MB  ← npm cache
Other /root hidden  ~8 GB   ← Assorted

TOTAL: ~17 GB in /root (mostly waste)
```

---

## 🎯 TARGET STATE (After)

```
/srv/aiox/                  ← SINGLE CANONICAL LOCATION
├─ .aiox-core/              ✅ Framework core (L1-L3)
├─ agents/                  ✅ ALL agents consolidated
├─ squads/                  ✅ ALL squads consolidated
├─ skills/                  ✅ ALL skills consolidated
├─ projects/                ✅ BookMe, Evolution, Dashboard
├─ infrastructure/          ✅ Scripts, configs
├─ data/                    ✅ Environment files
├─ .ollama/                 ✅ Models migrated
├─ .env                     ✅ Single .env source
├─ CONSOLIDATED-INDEX.md    ✅ Central navigation
└─ [all other canonical locations]

/root/                      ← MINIMAL (only system essentials)
├─ .ssh/                    (keep - private keys)
├─ .docker/                 (keep - daemon.json only)
├─ .local/                  (keep - installed binaries)
└─ [system files only]

FREED SPACE: ~15 GB
```

---

## 📋 PHASE 1: Pre-Consolidation Audit (30 min)

### 1.1 Create Full Backup

```bash
# Backup everything before touching
tar -czf /tmp/vps-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  /root/AIOX \
  /root/.aiox \
  /root/.ollama \
  /root/.claude \
  --exclude=node_modules \
  --exclude=venv \
  2>&1 | tee /tmp/backup.log

# Verify backup
tar -tzf /tmp/vps-backup-*.tar.gz | wc -l  # Should show file count
```

### 1.2 Audit Current Structure

```bash
# Map all agents
find /srv/aiox -name "*.agent.md" -o -name "*agent*.yaml" | wc -l
find /root/AIOX -name "*.agent.md" -o -name "*agent*.yaml" 2>/dev/null | wc -l

# Map all squads
ls /srv/aiox/squads/
ls /root/AIOX/squads/ 2>/dev/null

# Identify critical configs
ls -la /root/.env
ls -la /root/AIOX/.env 2>/dev/null
```

### 1.3 Document Active Containers

```bash
docker ps --format "{{.Names}}\t{{.Mounts}}"
# Record which containers use /root paths
```

---

## 📝 PHASE 2: Migrate Critical Data (1.5 hours)

### 2.1 Move Models & Data

```bash
# Move Ollama models (4 GB, in use)
mkdir -p /srv/aiox/.ollama
cp -r /root/.ollama/* /srv/aiox/.ollama/

# Verify copy complete
du -sh /srv/aiox/.ollama
du -sh /root/.ollama

# Update container mounts to use new location
# (see PHASE 4)
```

### 2.2 Consolidate .env Files

```bash
# Merge /root/.env and /root/AIOX/.env into single location
cat /root/.env > /srv/aiox/.env.prod
cat /root/AIOX/.env >> /srv/aiox/.env.prod 2>/dev/null

# Review merged file
nano /srv/aiox/.env.prod  # Remove duplicates

# Create symbolic link for backward compatibility
ln -s /srv/aiox/.env.prod /root/.env
```

### 2.3 Migrate Agents

```bash
# Move extended agents from /root/AIOX if any
ls /root/AIOX/.claude/agents/ 2>/dev/null
cp -r /root/AIOX/.claude/agents/* /srv/aiox/.claude/agents/ 2>/dev/null || true

# Verify consolidation
find /srv/aiox -name "*.md" | grep agent | wc -l
```

### 2.4 Migrate Projects

```bash
# Move legacy projects (36 MB)
# Only if they're not already in /srv/aiox
cp -r /root/AIOX/projects/* /srv/aiox/projects/ 2>/dev/null || true
```

### 2.5 Migrate Logs (Selective)

```bash
# Keep ONLY last 30 days of logs
mkdir -p /srv/aiox/.logs
find /root/.aiox -name "*.log" -mtime -30 -exec cp {} /srv/aiox/.logs/ \;
find /root/AIOX/core/logs -name "*.log" -mtime -30 -exec cp {} /srv/aiox/.logs/ \; 2>/dev/null || true
```

---

## 🧹 PHASE 3: Clean Duplicates (1 hour)

### 3.1 Identify Duplicates

```bash
# Compare framework core
diff -r /srv/aiox/.aiox-core /root/AIOX/.aiox-core 2>/dev/null | head -20

# Compare .claude configs
diff -r /srv/aiox/.claude /root/.claude 2>/dev/null | head -20
```

### 3.2 Delete Legacy Duplicates

```bash
# DELETE WITH CAUTION — use checkpoints

# Step 1: Delete Python venv (safest, largest)
rm -rf /root/AIOX/venv
# Freed: 7.5 GB

# Step 2: Delete legacy .aiox-core
rm -rf /root/AIOX/.aiox-core
# Freed: 2.3 GB

# Step 3: Delete legacy evolution (superseded by /srv/aiox/aiox-engine)
rm -rf /root/AIOX/evolution
# Freed: 1.6 GB

# Step 4: Delete obsolete projects (already migrated)
rm -rf /root/AIOX/projects
# Freed: 36 MB

# Step 5: Delete misc unused
rm -rf /root/AIOX/{supreme-brain,deeptutor,ai-gateway,flowise,portals}
# Freed: ~250 KB

# Step 6: Delete old claude config in /root
rm -rf /root/.claude
# Freed: 14 MB

# Step 7: Delete /root/.aiox logs (moved selective to /srv/aiox)
rm -rf /root/.aiox/backups
rm -rf /root/.aiox/*.log
# Freed: ~90 MB

# Step 8: Clean /root/AIOX remnants
rm -rf /root/AIOX
# Cleaned
```

### 3.3 Clean Caches

```bash
# npm cache
npm cache clean --force
# Freed: ~500 MB

# Docker system
docker system prune -a --volumes -f 2>/dev/null || true
# Freed: ~500 MB - 1 GB (varies)

# Pip cache
rm -rf /root/.cache/pip
# Freed: ~100 MB
```

---

## 🔗 PHASE 4: Update All References (1 hour)

### 4.1 Docker Container Mounts

**BEFORE running containers, update docker-compose & configs:**

```bash
# Update /srv/aiox/docker-compose.yml
# Change volume mounts from /root paths to /srv/aiox paths

# Example:
# OLD: volumes:
#       - /root/AIOX/evolution:/evolution
# NEW: volumes:
#       - /srv/aiox/aiox-engine:/evolution

# OLD: - /root/.ollama:/models
# NEW: - /srv/aiox/.ollama:/models

# OLD: - /root/.env:/app/.env
# NEW: - /srv/aiox/.env.prod:/app/.env
```

### 4.2 Update Environment Variables

```bash
# Update all scripts/configs that reference /root/AIOX
grep -r "/root/AIOX" /srv/aiox --include="*.js" --include="*.sh" --include="*.yaml" | head -20

# For each, replace with /srv/aiox
sed -i 's|/root/AIOX|/srv/aiox|g' /srv/aiox/scripts/*.sh
sed -i 's|/root/AIOX|/srv/aiox|g' /srv/aiox/bin/*.js
```

### 4.3 Update Git Config

```bash
# No changes needed (git repo is already at /srv/aiox)
# Verify:
cd /srv/aiox && git remote -v
```

### 4.4 Symlinks for Backward Compatibility (Optional)

```bash
# If external tools still reference /root paths:
ln -s /srv/aiox /root/aiox-canonical  # For scripts finding /root/aiox*
ln -s /srv/aiox/.env.prod /root/.env
```

---

## ✅ PHASE 5: Verification & Testing (1 hour)

### 5.1 Verify Structure

```bash
# Check consolidation
du -sh /srv/aiox/
du -sh /root/  # Should now be ~1-2 GB (system only)

# Verify agents consolidated
find /srv/aiox -name "*.agent.md" | wc -l  # Should show all agents

# Verify squads consolidated
ls /srv/aiox/squads/  # All squads present

# Verify data moved
ls /srv/aiox/.env.prod
ls /srv/aiox/.ollama/ | head  # Models present
```

### 5.2 Test Containers

```bash
# Stop all containers
docker-compose -f /srv/aiox/docker-compose.yml down

# Start with new paths
docker-compose -f /srv/aiox/docker-compose.yml up -d

# Check health
docker ps -a
docker logs {container-name}  # Check for mount errors
```

### 5.3 Test CLI

```bash
# Test aiox CLI
cd /srv/aiox
npm run build
aiox doctor
aiox graph --stats
```

### 5.4 Test Agent Access

```bash
# Verify agents accessible
ls -la /srv/aiox/.aiox-core/development/agents/
ls -la /srv/aiox/.claude/agents/
```

---

## 🔄 PHASE 6: Cleanup & Documentation (30 min)

### 6.1 Remove /root/AIOX Entirely (After verification)

```bash
# Only after containers verified working
rm -rf /root/AIOX
rm -f /root/aiox-router /root/aiox-system  # Empty files
```

### 6.2 Create Central Index

**Create `/srv/aiox/CONSOLIDATED-INDEX.md`:**

```markdown
# AIOX Single Canonical Location Index

All framework, agents, squads, skills, and projects are now in `/srv/aiox/`

## Navigation

### Agents
- **Canonical:** `/srv/aiox/.aiox-core/development/agents/` (13 core)
- **Extended:** `/srv/aiox/.claude/agents/` (29 extended)
- **Clones:** `/srv/aiox/.claude/agent-memory/` (22+ personas)

### Squads
- **All:** `/srv/aiox/squads/`
- **Production:** claude-code-mastery, mind-cloning-system
- **Domain:** ai-ml, business-growth, ... (10 templates)

### Skills
- **All:** `/srv/aiox/.claude/skills/`

### Configuration
- **Master Config:** `/srv/aiox/core-config.yaml`
- **Environment:** `/srv/aiox/.env.prod` (symlinked to /root/.env)
- **Docker:** `/srv/aiox/docker-compose.yml`

### Projects
- **BookMe:** `/srv/aiox/packages/bookme-web/`
- **Evolution Engine:** `/srv/aiox/aiox-engine/`
- **Models:** `/srv/aiox/.ollama/`

### Documentation
- **Getting Started:** `/srv/aiox/README.md`
- **Framework Rules:** `/srv/aiox/.claude/CLAUDE.md`
- **Stories:** `/srv/aiox/docs/stories/`
```

### 6.3 Update Memory

```markdown
# Update /root/.claude/projects/-srv-aiox/memory/MEMORY.md with:

**✅ CONSOLIDATION COMPLETE (2026-03-21)**
- Single canonical location: `/srv/aiox/`
- All agents, squads, skills, projects consolidated
- /root/AIOX deleted (~7.6 GB freed)
- Space saved: ~15 GB
- All containers updated to new paths
```

---

## 📊 EXPECTED RESULTS

### Disk Usage Before → After

```
/srv/aiox/   1.2 GB → 3-4 GB (added models, data)
/root/       ~17 GB → ~1-2 GB (cleaned to system only)
───────────────────────────────────────
TOTAL        ~18 GB → ~5-6 GB (66% reduction!)
```

### Organization After

```
/srv/aiox/  [SINGLE CANONICAL LOCATION]
├─ .aiox-core/           (Framework core)
├─ .claude/              (Agents, skills, config)
├─ agents/               (If needed, consolidated)
├─ squads/               (All squads)
├─ projects/             (BookMe, Evolution, Dashboard)
├─ .ollama/              (Models)
├─ .env.prod             (Single env file)
├─ CONSOLIDATED-INDEX.md (Central map)
└─ [all other canonical files]

/root/      [SYSTEM ONLY]
├─ .ssh/                 (Private keys)
├─ .docker/              (daemon.json)
├─ .local/               (Binaries)
└─ [system files]
```

---

## ⚠️ ROLLBACK PROCEDURE

If anything breaks:

```bash
# 1. Stop all containers
docker-compose -f /srv/aiox/docker-compose.yml down

# 2. Restore backup
cd /tmp
tar -xzf vps-backup-*.tar.gz -C /

# 3. Restart containers
docker-compose up -d

# 4. Investigate error logs
tail -f /root/AIOX/core/logs/*
```

---

## ✨ NEXT STEPS AFTER CONSOLIDATION

1. **Commit to Git:** `git add . && git commit -m "consolidate: single canonical location /srv/aiox"`
2. **Update CI/CD:** All GitHub Actions should reference `/srv/aiox` paths
3. **Update Documentation:** Update all setup guides to point to `/srv/aiox`
4. **Archive VPS State:** Update memory with completion status
5. **Team Notification:** Notify all users of new structure

---

**Ready to execute?** Start with PHASE 1 and work sequentially. Each phase can be reversed until PHASE 3 step 6.
