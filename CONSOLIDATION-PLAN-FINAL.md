# 🚀 VPS CONSOLIDATION — FINAL PLAN (Respecting Active Data)

**Status:** READY FOR EXECUTION
**Generated:** 2026-03-21
**Key Rule:** NEVER delete Docker volumes (production databases)

---

## 📊 VPS DISK ANALYSIS (Actual 140GB)

```
/var/lib/containerd      60 GB  ← Docker images (regenerable)
/var/lib/docker          27 GB  ← PRODUCTION DATABASES (DO NOT TOUCH)
  ├─ aiox_postgres-data     ← PostgreSQL (BookMe, AIOX)
  ├─ aiox_qdrant-data       ← Vector DB (production)
  ├─ aiox_redis-data        ← Cache (production)
  └─ [others - all in use]
/root/                   33 GB  ← Mix of source code + config
/workspace/AIOX         7.3 GB  ← BUILD ARTIFACT/CACHE
/usr/local/             5.2 GB  ← Binaries (keep as-is)
/srv/aiox              3.3 GB  ← Source code (canonical)
/var/log               598 MB  ← Logs
────────────────────────────────
TOTAL:                ~140 GB
```

---

## 🎯 CONSOLIDATION STRATEGY

### **What We Will Do:**
1. ✅ Keep ALL Docker volumes (production data)
2. ✅ Consolidate /root/* code/config to /srv/aiox
3. ✅ Delete /workspace/AIOX (build cache, regenerable)
4. ✅ Clean old logs (< 30 days old)
5. ✅ Create symlinks for backward compat

### **What We Will NOT Do:**
1. ❌ Delete /var/lib/docker (production databases)
2. ❌ Delete /var/lib/containerd (would break docker)
3. ❌ Delete /usr/local (system binaries)

---

## 📋 EXECUTION PLAN (4 Phases, 2 hours)

### **PHASE 1: Backup & Audit (30 min)**

```bash
# 1.1 Backup Docker volumes (safer than we thought)
docker volume ls -q | while read vol; do
  docker run --rm -v $vol:/data -v /tmp/backups:/backup \
    alpine tar czf /backup/$vol.tar.gz /data
done
# Saved to /tmp/backups/

# 1.2 Document what's in /root
ls -la /root/ | grep -E "AIOX|aiox|\.aiox"
du -sh /root/* | sort -h

# 1.3 Document /workspace
ls -la /workspace/
du -sh /workspace/*
```

### **PHASE 2: Merge Data (1 hour)**

```bash
# 2.1 Move non-duplicated data from /root to /srv/aiox
# (ONLY if unique, not in /srv/aiox already)

# Check which files are truly unique in /root/AIOX
for file in /root/AIOX/*; do
  if [ ! -e "/srv/aiox/$(basename $file)" ]; then
    echo "UNIQUE: $file"
    cp -r "$file" /srv/aiox/
  else
    echo "DUPLICATE: $file (already in /srv/aiox)"
  fi
done

# 2.2 Move unique .env configs
if [ -f /root/.env ]; then
  cp /root/.env /srv/aiox/.env.root-backup
  # Merge manually if different from /srv/aiox/.env
fi

# 2.3 Move unique .ollama models (if not already moved)
if [ -d /root/.ollama ]; then
  if [ ! -d /srv/aiox/.ollama ]; then
    mv /root/.ollama /srv/aiox/.ollama
  fi
fi

# 2.4 Move workspace project (if it's not duplicate)
if [ -d /workspace/AIOX ]; then
  ls /workspace/AIOX
  # If it's a build artifact: DELETE
  # If it's unique source: COPY
  # Ask user: is this duplicate or unique?
fi
```

### **PHASE 3: Clean & Symlink (30 min)**

```bash
# 3.1 Create symlinks for backward compatibility
ln -s /srv/aiox /root/aiox-canonical
ln -s /srv/aiox/.env.root-backup /root/.env

# 3.2 Clean non-critical /root dirs
rm -rf /root/AIOX             # Source code (now in /srv/aiox)
rm -rf /root/.aiox/backups    # Old backups (keep logs < 30 days)
find /root/.aiox -name "*.log" -mtime +30 -delete  # Logs older than 30 days

# 3.3 Clean /workspace if it's a duplicate
# ONLY if confirmed as duplicate/cache
# rm -rf /workspace/AIOX

# 3.4 Clean old logs in /var/log
find /var/log -name "*.log" -mtime +30 -delete  # Logs older than 30 days
find /var/log -name "*.gz" -delete              # Compressed old logs

# 3.5 Clean docker build cache (safe)
docker system prune -f  # Prune unused images
# DO NOT do: docker system prune -a --volumes  (would delete our data)
```

### **PHASE 4: Verify & Update (30 min)**

```bash
# 4.1 Verify Docker still works
docker ps
docker volume ls  # All volumes should still be there

# 4.2 Test containers
docker-compose -f /srv/aiox/docker-compose.yml ps

# 4.3 Verify agents accessible
ls /srv/aiox/.aiox-core/development/agents/ | wc -l

# 4.4 Create final index
cat > /srv/aiox/FINAL-CONSOLIDATION-INDEX.md << 'EOF'
# AIOX Consolidated Structure — Final

## Canonical Location
- **Framework:** `/srv/aiox/`
- **Config:** `/srv/aiox/.env.root-backup` (merged from /root/.env)

## Production Data (Untouched)
- **Docker volumes:** `/var/lib/docker/` (all databases)
- **Docker images:** `/var/lib/containerd/` (all images)

## Symlinks (Backward Compat)
- `/root/aiox-canonical` → `/srv/aiox`
- `/root/.env` → `/srv/aiox/.env.root-backup`

## Navigation
- Agents: `/srv/aiox/.aiox-core/development/agents/`
- Squads: `/srv/aiox/squads/`
- Skills: `/srv/aiox/.claude/skills/`
- Models: `/srv/aiox/.ollama/`
EOF
```

---

## 💾 EXPECTED DISK SAVINGS

```
BEFORE:
/root/AIOX              33 GB
/workspace/AIOX        7.3 GB  (if build cache)
/var/log old         ~200 MB
────────────────────────────
Removable:          ~40 GB

AFTER:
/root/               ~3 GB   (only essential system files)
/workspace/              0 GB   (cleaned)
/var/log            ~400 MB  (recent logs only)
────────────────────────────
SAVED:              ~35-40 GB
```

**Remaining 140 GB:**
- Docker volumes: 27 GB (PRODUCTION, never delete)
- Docker images: 60 GB (can rebuild if needed)
- Others: 40+ GB (system files, libraries, etc)

---

## ⚠️ QUESTIONS FOR USER

Before executing, clarify:

1. **Is /workspace/AIOX a duplicate or unique?**
   - `ls -la /workspace/AIOX/` and compare to `/srv/aiox/`
   - If duplicate: DELETE
   - If unique: COPY to /srv/aiox

2. **Merge strategy for /root/.env?**
   - Compare `/root/.env` with `/srv/aiox/.env`
   - Use which one as canonical?

3. **Keep /root/.ollama or move to /srv/aiox?**
   - If not already moved: MOVE
   - If already moved: DELETE

---

## 🔄 EXECUTION CHECKLIST

- [ ] Phase 1: Backup Docker volumes to /tmp/backups/
- [ ] Phase 1: Document /root and /workspace content
- [ ] Phase 2: Identify unique files (ask user for conflicts)
- [ ] Phase 2: Copy unique files to /srv/aiox
- [ ] Phase 3: Create symlinks
- [ ] Phase 3: Delete /root/AIOX (after confirming unique files copied)
- [ ] Phase 3: Clean old logs
- [ ] Phase 3: Delete /workspace/AIOX (if confirmed duplicate)
- [ ] Phase 4: Test Docker volumes still work
- [ ] Phase 4: Test containers run
- [ ] Phase 4: Create FINAL-CONSOLIDATION-INDEX.md
- [ ] Update memory with consolidation status

---

## ✨ NEXT STEPS

**Ready to execute?** Confirm answers to the 3 questions above, then we proceed with confidence.
