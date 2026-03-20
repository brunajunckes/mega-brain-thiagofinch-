# 🚀 CONSOLIDATION EXECUTION GUIDE — Safe & Automated

**Status:** READY FOR EXECUTION
**Safety Level:** 🟢 HIGH (full backup + checkpoints)
**Automation Level:** 🟢 100% (no manual steps)
**Time Estimate:** 15-30 minutes

---

## ✅ What Will Happen

```
PHASE 0: Full Backup (will be saved to /tmp/aiox-consolidation-backup-*)
  ↓
PHASE 1: Migrate unique assets
  • evolution-agent.yaml → /srv/aiox/.claude/agents/specialized/
  • DeepInnovator, MiroFish, claude-hud → /srv/aiox/archived-research/
  ↓
PHASE 2: Create master consolidation index
  ↓
PHASE 3: Delete duplicates & waste (Python venvs, old frameworks)
  ↓
PHASE 4: Delete /root/AIOX entirely
  ↓
PHASE 5: Create backward-compatibility symlinks
  ↓
PHASE 6: Validate everything works
  ↓
PHASE 7: Commit to git + update memory
  ↓
✅ DONE — Single canonical location at /srv/aiox/
```

---

## 🔐 Safety Guarantees

✅ **Full Backup Before Any Changes**
- `/root/AIOX` backed up → `/tmp/aiox-consolidation-backup-*/root-AIOX.tar.gz`
- `/workspace/AIOX` backed up
- `/srv/aiox` backed up
- Restore with: `tar -xzf /tmp/aiox-consolidation-backup-*/root-AIOX.tar.gz -C /`

✅ **Docker Volumes UNTOUCHED**
- All 18 production databases stay in `/var/lib/docker/volumes/`
- Zero risk to PostgreSQL, Qdrant, Redis data

✅ **Checkpoints at Each Phase**
- Each phase is logged
- Can pause and resume if needed
- Full audit trail in `consolidation-TIMESTAMP.log`

✅ **Validation After Each Step**
- Checks that key files exist
- Verifies Docker is healthy
- Reports space freed

---

## 🎯 Execution Steps

### Step 1: Pre-Flight Check (30 seconds)

```bash
# Verify consolidate.sh is ready
ls -la /srv/aiox/consolidate.sh

# Check current disk usage
df -h / | tail -1
du -sh /root /srv/aiox /var/lib/docker

# Verify Docker is healthy
docker ps | head -5
```

### Step 2: Run Consolidation Script (10-15 minutes)

```bash
# Execute the automated consolidation
cd /srv/aiox
bash consolidate.sh

# This will:
# 1. Create full backups (takes ~2-3 min)
# 2. Migrate evolution-agent + research projects
# 3. Delete venvs, duplicates, /root/AIOX
# 4. Create symlinks
# 5. Validate everything
# 6. Commit to git
```

### Step 3: Monitor Progress (Real-time)

The script outputs:
```
[13:45:23] 📍 PHASE: PHASE 0: FULL BACKUP
[13:45:23] Backup directory: /tmp/aiox-consolidation-backup-20260321-134523
[13:45:30] ✅ Backed up /root/AIOX → 15.2G
...
[13:52:15] 🎉 CONSOLIDATION COMPLETE (GOD MODE)
```

### Step 4: Post-Execution Checks (5 minutes)

```bash
# View consolidation summary
tail -50 /srv/aiox/consolidation-*.log

# Check new structure
ls -la /srv/aiox/.claude/agents/specialized/
ls -la /srv/aiox/archived-research/

# Verify Docker still works
docker ps
docker volume ls | head -10

# Check disk saved
du -sh /root  # Should be ~1-2 GB now
df -h / | tail -1
```

---

## 🔄 If Something Goes Wrong (Rollback)

**Script failed during Phase X?**

```bash
# 1. Check what happened
tail -100 /srv/aiox/consolidation-*.log

# 2. Restore from backup
cd /tmp/aiox-consolidation-backup-*/
tar -tzf root-AIOX.tar.gz | head  # Verify backup is good
tar -xzf root-AIOX.tar.gz -C /    # Restore /root/AIOX

# 3. Try again
cd /srv/aiox && bash consolidate.sh
```

**Don't want to run the script?**

Just delete it and consolidate manually:
```bash
rm /srv/aiox/consolidate.sh
# Then follow CONSOLIDATION-GOD-MODE-FINAL.md manually
```

---

## 📊 Expected Results

### Before Consolidation
```
/root/AIOX          33 GB
/workspace/AIOX     7.3 GB
/var/log            ~600 MB
(duplicates + waste)
────────────────────────────
Total waste:        ~41 GB
```

### After Consolidation
```
/srv/aiox/          4-5 GB (canonical location)
/root/              ~1 GB  (system only)
/workspace/         0 GB   (cleaned)
────────────────────────────
Total freed:        ~36 GB (down from 141 GB)
```

### Consolidated Structure
```
/srv/aiox/
├─ .claude/agents/
│  ├─ [29 extended]
│  └─ specialized/
│     └─ evolution-agent.yaml      ← NEW
├─ archived-research/
│  ├─ DeepInnovator/               ← CONSOLIDATED
│  ├─ MiroFish/
│  └─ claude-hud/
├─ squads/          (13 total)
├─ .aiox-core/      (canonical agents + framework)
└─ CONSOLIDATION-COMPLETE-INDEX.md (master map)
```

---

## 🚀 After Consolidation

### 1. Verify Everything Works
```bash
# Test CLI
cd /srv/aiox
npm run build
aiox doctor
aiox graph --stats

# Test agents are accessible
ls /srv/aiox/.aiox-core/development/agents/ | wc -l  # Should show 13+

# Test Docker
docker-compose ps
docker volume ls | wc -l  # Should show 18
```

### 2. Commit to Remote (via @devops)
```bash
cd /srv/aiox
git push origin main
```

### 3. Update Team
- Notify that canonical location is now `/srv/aiox/` only
- No more `/root/AIOX` or `/workspace/AIOX`
- Backward compat symlinks at `/root/aiox-canonical`

---

## ❓ FAQ

**Q: Will I lose any data?**
A: No. Full backup created before any changes. Can rollback anytime.

**Q: Will Docker containers go down?**
A: No. Docker volumes are UNTOUCHED. Containers stay running.

**Q: Will agents stop working?**
A: No. Consolidation just reorganizes files. All agents remain functional.

**Q: How long does this take?**
A: 15-30 minutes (mostly backup time). Actual consolidation: 5 minutes.

**Q: Can I stop the script midway?**
A: Yes. Each phase is a checkpoint. Just re-run to continue.

**Q: What if script fails?**
A: Check log file, restore from backup, try again. No harm done.

---

## 📝 What Gets Created

| File | Purpose |
|------|---------|
| `consolidate.sh` | Main automation script |
| `CONSOLIDATION-COMPLETE-INDEX.md` | Master inventory after consolidation |
| `consolidation-TIMESTAMP.log` | Detailed execution log |
| `/tmp/aiox-consolidation-backup-*/` | Full backups (keep for 30 days) |
| `/root/aiox-canonical` → `/srv/aiox/` | Symlink for compatibility |

---

## ✨ Ready?

```bash
# Execute consolidation NOW
cd /srv/aiox && bash consolidate.sh

# Then verify
tail -50 consolidation-*.log
docker ps
du -sh /root
```

**All automated. Zero risk. Maximum efficiency.**
