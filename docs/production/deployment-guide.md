# Deployment Guide — Sprint 2 Orchestration System

**Story:** 8.2 Sprint 2 - Integration & Orchestration
**Task:** 3.5 - Deployment Procedures (16h)
**Date:** 2026-03-21
**Status:** Complete

---

## Table of Contents

1. [Pre-Deployment Validation](#pre-deployment-validation)
2. [Deployment Checklist](#deployment-checklist)
3. [Rollback Procedures](#rollback-procedures)
4. [Monitoring & Alerting Setup](#monitoring--alerting-setup)
5. [Incident Response Playbooks](#incident-response-playbooks)
6. [Break-Glass Procedures](#break-glass-procedures)

---

## Pre-Deployment Validation

### Step 1: Code Quality Gate
```bash
# Run CodeRabbit pre-deployment review
npm run coderabbit -- --base main --all

# Verify: 0 CRITICAL issues
# Expected output: "✅ CodeRabbit passed - 0 CRITICAL issues"
```

**Validation Criteria:**
- [ ] No CRITICAL severity issues
- [ ] No security vulnerabilities (OWASP Top 10)
- [ ] No SQL injection risks
- [ ] No XSS risks
- [ ] No authentication bypass risks
- [ ] Dependency vulnerabilities checked

### Step 2: Test Suite Validation
```bash
# Run full test suite
npm test

# Expected output:
# - All 104 tests passing
# - Coverage >= 85%
# - Performance tests passed (<500ms baseline)
# - No flaky tests
```

**Validation Criteria:**
- [ ] Unit tests: 100% pass rate
- [ ] Integration tests: 100% pass rate
- [ ] E2E tests: 100% pass rate
- [ ] Performance tests: Baselines met
- [ ] Code coverage: ≥85%
- [ ] No flaky tests (run 3x to confirm)

### Step 3: Performance Baseline Validation
```bash
# Verify performance metrics
npm run test -- performance-profiler.test.js

# Check output for:
# - Task execution: 50-150ms typical (target <500ms)
# - Gate validation: 10-50ms typical (target <100ms)
# - Checkpoint save: 5-20ms typical
# - No regressions from baseline
```

**Validation Criteria:**
- [ ] Task execution time within baseline
- [ ] Gate validation time within baseline
- [ ] Memory usage within bounds (no leaks)
- [ ] CPU usage moderate
- [ ] No timeout issues

### Step 4: Security Audit
```bash
# Run security checks
npm run audit

# Check for:
# - No high/critical vulnerabilities in dependencies
# - No secrets in logs
# - No hardcoded credentials
# - RLS policies in place (if DB used)
```

**Validation Criteria:**
- [ ] Zero high/critical dependency vulnerabilities
- [ ] No secrets in code or logs
- [ ] No hardcoded credentials
- [ ] Input validation strict
- [ ] Error handling safe
- [ ] Security checklist (see production-checklist.md) passed

### Step 5: Documentation Validation
```bash
# Verify all documentation files exist
ls -la docs/production/
ls -la docs/core/ | grep -E "orchestrator|retry|rollback"

# Check for completeness
grep -l "Usage" docs/production/*.md
```

**Validation Criteria:**
- [ ] deployment-guide.md exists (this file)
- [ ] monitoring-setup.md exists
- [ ] Module documentation complete
- [ ] Usage examples clear
- [ ] Error guides present
- [ ] Version number documented

---

## Deployment Checklist

### Pre-Deployment Phase (30 minutes)

**Environment Preparation:**
- [ ] Production environment ready (servers, databases, APIs)
- [ ] Configuration files staged (.env, deployment.json)
- [ ] Database backups created
- [ ] Monitoring dashboards prepared
- [ ] Alerting rules configured
- [ ] Team on standby (support, monitoring, rollback)

**Code Validation:**
- [ ] All tests passing (npm test)
- [ ] CodeRabbit clean (0 CRITICAL)
- [ ] Performance baselines met
- [ ] Security audit clean
- [ ] Documentation complete
- [ ] Version bumped (package.json)

**Deployment Window:**
- [ ] Low-traffic window selected
- [ ] Stakeholders notified
- [ ] Rollback plan reviewed
- [ ] Communication channels open
- [ ] Monitoring active
- [ ] Incident response team ready

### Deployment Phase (15 minutes)

**Staging Deployment:**
```bash
# 1. Deploy to staging first
npm run deploy:staging

# 2. Verify staging deployment
npm run test:e2e:staging

# 3. Check staging metrics
curl https://staging.aiox.local/health
```

**Checklist:**
- [ ] Staging deployment successful
- [ ] Staging tests pass
- [ ] Staging metrics normal
- [ ] No errors in staging logs

**Production Deployment:**
```bash
# 1. Deploy to production (blue/green)
npm run deploy:prod

# 2. Verify health check
curl https://api.aiox.local/health

# 3. Monitor metrics (first 5 minutes)
npm run monitor:realtime
```

**Checklist:**
- [ ] Production deployment successful
- [ ] Health check passing
- [ ] Metrics normal
- [ ] No critical errors
- [ ] Feature gates working
- [ ] All components responding

### Post-Deployment Phase (30 minutes)

**Smoke Tests:**
```bash
# Run critical path tests
npm run test:critical-path

# Expected: All critical workflows functioning
```

**Checklist:**
- [ ] Constitutional gates validation working
- [ ] Task executor processing tasks
- [ ] Checkpoints saving correctly
- [ ] Retry logic functional
- [ ] Rollback mechanism ready
- [ ] Performance within baselines

**Monitoring Verification:**
```bash
# Check monitoring integration
npm run check:monitoring

# Verify:
# - Metrics ingesting correctly
# - Alerts configured
# - Dashboards populated
# - Logs aggregating
```

**Checklist:**
- [ ] Metrics dashboard populated
- [ ] Logs visible in aggregator
- [ ] Alerts enabled
- [ ] Health checks passing
- [ ] Performance metrics visible
- [ ] Error tracking functional

---

## Rollback Procedures

### Automatic Rollback (Blue/Green Deployment)

**Trigger Condition:** Any critical error in first 5 minutes post-deployment

```bash
# Automatic fallback (if blue/green enabled)
npm run deploy:rollback

# What happens:
# 1. Requests routed back to previous version
# 2. Data consistency checked
# 3. Metrics monitored
# 4. Alert sent to team
```

**Rollback Validation:**
- [ ] Previous version now active
- [ ] Requests processing normally
- [ ] Metrics returned to baseline
- [ ] No customer impact
- [ ] Error rate returned to normal

### Manual Rollback (if automatic fails)

**Step 1: Stop Current Deployment**
```bash
# Immediately stop any ongoing operations
npm run deploy:stop

# Kill active processes
pkill -f "aiox-orchestrator"

# Verify processes stopped
ps aux | grep aiox-orchestrator
```

**Step 2: Revert to Previous Version**
```bash
# Get previous commit hash
git log --oneline -5

# Revert to known-good version
git checkout <previous_commit_hash>

# Install previous dependencies
npm install

# Start previous version
npm run start:prod
```

**Step 3: Verify Rollback**
```bash
# Check health
curl https://api.aiox.local/health

# Run smoke tests
npm run test:critical-path

# Monitor metrics for 5 minutes
npm run monitor:realtime
```

**Rollback Checklist:**
- [ ] Current deployment stopped
- [ ] Previous version deployed
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] Metrics normal
- [ ] No customer impact
- [ ] Team notified
- [ ] Incident logged
- [ ] Root cause analysis started

### Data Recovery (if needed)

**Checkpoint Recovery:**
```bash
# List available checkpoints
.aiox-core/core/orchestration/checkpoint-manager.js list-checkpoints

# Recover from specific checkpoint
.aiox-core/core/orchestration/checkpoint-recovery.js recover <execution_id>

# Verify recovered state
npm run verify:state
```

**File Recovery (Rollback):**
```bash
# Check rollback history
.aiox-core/core/orchestration/rollback-manager.js get-history

# Restore files from backup
.aiox-core/core/orchestration/rollback-manager.js restore <execution_id>

# Verify file integrity
npm run verify:files
```

---

## Monitoring & Alerting Setup

### Prometheus Metrics (Recommended)

**Configuration:**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aiox-orchestrator'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

**Key Metrics to Monitor:**

| Metric | Type | Threshold | Alert |
|--------|------|-----------|-------|
| `orchestrator_task_duration_ms` | Histogram | p95 < 500ms | > 1000ms |
| `orchestrator_gate_violations_total` | Counter | trend | Any CRITICAL |
| `orchestrator_retry_attempts_total` | Counter | trend | > 10% of tasks |
| `orchestrator_rollback_total` | Counter | trend | > 0 per hour |
| `orchestrator_checkpoint_save_ms` | Histogram | p95 < 20ms | > 100ms |
| `orchestrator_memory_bytes` | Gauge | < 500MB | > 1000MB |
| `orchestrator_errors_total` | Counter | trend | > 1% error rate |

### Grafana Dashboard

**Create dashboard with panels:**
1. Task Execution Latency (p50, p95, p99)
2. Gate Violations (CRITICAL, HIGH, MEDIUM)
3. Retry Rate (% of tasks retrying)
4. Rollback Count (per hour, per day)
5. Checkpoint Performance (save time, load time)
6. Memory Usage (heap, RSS)
7. Error Rate (% of operations failing)
8. System Load (CPU, disk I/O)

**Dashboard Template:**
```json
{
  "dashboard": {
    "title": "AIOX Orchestrator",
    "panels": [
      {
        "title": "Task Execution Latency",
        "targets": [
          {"expr": "histogram_quantile(0.95, orchestrator_task_duration_ms)"}
        ],
        "alert": {"gt": 1000}
      },
      {
        "title": "Gate Violations (CRITICAL)",
        "targets": [
          {"expr": "rate(orchestrator_gate_violations_total{severity='CRITICAL'}[5m])"}
        ],
        "alert": {"gt": 0}
      },
      {
        "title": "Retry Rate",
        "targets": [
          {"expr": "rate(orchestrator_retry_attempts_total[5m])"}
        ],
        "alert": {"gt": 0.1}
      }
    ]
  }
}
```

### Alert Rules

**Create AlertManager rules:**

```yaml
# alerts.yml
groups:
  - name: aiox-orchestrator
    interval: 15s
    rules:
      - alert: HighTaskLatency
        expr: histogram_quantile(0.95, orchestrator_task_duration_ms) > 1000
        for: 5m
        annotations:
          summary: "Task execution exceeds 1s (95th percentile)"

      - alert: CriticalGateViolation
        expr: rate(orchestrator_gate_violations_total{severity='CRITICAL'}[5m]) > 0
        for: 1m
        annotations:
          summary: "CRITICAL gate violations detected"

      - alert: HighRetryRate
        expr: rate(orchestrator_retry_attempts_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: ">10% of tasks retrying"

      - alert: HighErrorRate
        expr: rate(orchestrator_errors_total[5m]) > 0.01
        for: 5m
        annotations:
          summary: ">1% error rate"

      - alert: HighMemoryUsage
        expr: orchestrator_memory_bytes > 1000000000
        for: 5m
        annotations:
          summary: "Memory usage exceeds 1GB"
```

### Log Aggregation (ELK/Splunk)

**Configure log ingestion:**
```bash
# Application logs include:
# - timestamp
# - level (info, warn, error)
# - component (gates, executor, retry, rollback, checkpoint)
# - execution_id
# - task_id
# - message
# - duration_ms (if applicable)
# - error (if applicable)
```

**Sample log entry:**
```json
{
  "timestamp": "2026-03-21T00:30:00Z",
  "level": "error",
  "component": "gates",
  "execution_id": "8.2-1711000000",
  "message": "CRITICAL gate violation: No TypeCheck passed",
  "violations": ["typecheckPass required"],
  "duration_ms": 45
}
```

---

## Incident Response Playbooks

### Playbook 1: High Gate Violation Rate

**Trigger:** >10 CRITICAL violations in 5 minutes

**Response:**
1. **Immediate (0-5 min):**
   - Page on-call engineer
   - Check alert dashboard for details
   - Verify which gate is failing (branch/files/quality/security)

2. **Diagnostic (5-15 min):**
   ```bash
   # Get violation details
   curl https://api.aiox.local/metrics?filter=gate_violations

   # Check logs for pattern
   grep "CRITICAL" logs/orchestrator.log | tail -20

   # Identify common cause
   # - Branch validation? Check branch protection rules
   # - File validation? Check forbidden file list
   # - Quality checks? Check build/lint/test failures
   # - Security? Check for hardcoded secrets
   ```

3. **Mitigation (15-30 min):**
   - If branch validation: Update branch protection rules
   - If quality checks: Fix failing tests/lint
   - If security: Remove secrets and retry
   - If temporary config issue: Rollback gate config (not deployment)

4. **Follow-up:**
   - [ ] Root cause documented
   - [ ] Fix deployed
   - [ ] Monitoring alert tuned
   - [ ] Runbook updated

---

### Playbook 2: High Task Execution Latency

**Trigger:** p95 task execution > 1000ms for 5 minutes

**Response:**
1. **Immediate (0-5 min):**
   - Check CPU/memory on server
   - Check disk I/O
   - Check network connectivity

2. **Diagnostic (5-15 min):**
   ```bash
   # Profile slow tasks
   npm run profile:tasks -- --percentile=95

   # Identify bottleneck
   # - Gate validation slow? Too many checks?
   # - Task execution slow? External dependency?
   # - Checkpoint save slow? Disk I/O?

   # Check for issues
   ps aux | grep -E "cpu|mem"
   iostat -x 1 10
   netstat -i
   ```

3. **Mitigation:**
   - If gate validation: Optimize gate checks (remove redundant checks)
   - If task execution: Check external dependencies (API, database)
   - If checkpoint save: Check disk space and I/O
   - If system resource: Scale up resources temporarily

4. **Follow-up:**
   - [ ] Bottleneck identified
   - [ ] Performance target adjusted if needed
   - [ ] Optimization planned
   - [ ] Monitoring alert tuned

---

### Playbook 3: High Error Rate

**Trigger:** >1% of operations failing for 5 minutes

**Response:**
1. **Immediate (0-5 min):**
   - Check error logs for pattern
   - Determine error type (permanent vs transient)
   - Assess customer impact

2. **Diagnostic (5-15 min):**
   ```bash
   # Get error distribution
   curl https://api.aiox.local/metrics?filter=errors | jq '.by_type'

   # Check logs
   grep "ERROR" logs/orchestrator.log | head -50

   # Identify error categories:
   # - Permanent: Code bug, data corruption, config error
   # - Transient: Network timeout, resource exhaustion, race condition
   ```

3. **Mitigation:**
   - If transient: Verify retry logic is triggering (should auto-heal)
   - If permanent: Check recent deployments (may need rollback)
   - If data corruption: Run recovery procedure
   - If config error: Fix config and redeploy

4. **Follow-up:**
   - [ ] Error root cause found
   - [ ] Fix deployed or data recovered
   - [ ] Error tracking reviewed
   - [ ] Alert tuned if needed

---

### Playbook 4: Rollback Triggered

**Trigger:** Automatic or manual rollback executed

**Response:**
1. **Immediate (0-5 min):**
   - Confirm rollback successful
   - Verify previous version active
   - Monitor for additional issues

2. **Diagnostic (5-15 min):**
   ```bash
   # Get deployment history
   git log --oneline -10

   # Compare versions
   git diff main~1 main -- .aiox-core/core/orchestration/

   # Get metrics before/after rollback
   curl https://api.aiox.local/metrics?range=1h
   ```

3. **Root Cause Analysis:**
   - Identify what broke in new deployment
   - Check if tests should have caught it
   - Review code changes
   - Plan fix

4. **Follow-up:**
   - [ ] Root cause documented
   - [ ] Fix tested thoroughly
   - [ ] Deployment validation improved
   - [ ] Test coverage for issue added
   - [ ] Redeployment scheduled

---

## Break-Glass Procedures

### Emergency: Disable Gates (for critical production issue)

**When to use:** Production is down, gates are blocking recovery

```bash
# CAUTION: Only use if gates are blocking legitimate operations

# Disable gate validation (temporary)
export AIOX_DISABLE_GATES=true
npm run start:prod

# NOTE: This disables constitutional validation - use only in emergency
# Re-enable gates once issue resolved
unset AIOX_DISABLE_GATES
```

**Post-Emergency Checklist:**
- [ ] Re-enable gates immediately after recovery
- [ ] Audit what operations ran without gates
- [ ] Verify no malicious activity
- [ ] Review why gates were blocking legitimate operation
- [ ] Update gate rules if needed

### Emergency: Force Rollback (if standard rollback fails)

**When to use:** System is completely broken, standard rollback procedures failing

```bash
# Hard reset to previous working commit
git reset --hard <working_commit_hash>

# Verify commit
git log --oneline -1

# Force reinstall
rm -rf node_modules package-lock.json
npm install --production

# Start services
npm run start:prod

# Verify system
curl https://api.aiox.local/health
npm run test:critical-path
```

**Post-Emergency Checklist:**
- [ ] System responding
- [ ] Smoke tests passing
- [ ] Data integrity verified
- [ ] Customer impact assessed
- [ ] Root cause analysis started
- [ ] Incident report filed

### Emergency: Manual Checkpoint Recovery

**When to use:** Checkpoint system corrupted, need to resume execution

```bash
# List available checkpoints
ls -la .aiox/checkpoints/

# Find last valid checkpoint
cat .aiox/checkpoints/*/checkpoint.json | grep -l "status.*completed" | sort -r | head -1

# Manually recover execution
npm run recover:execution -- --checkpoint=<checkpoint_file>

# Verify recovery
npm run verify:execution -- --execution-id=<execution_id>
```

**Post-Emergency Checklist:**
- [ ] Execution resumed successfully
- [ ] No duplicate work
- [ ] Data consistency verified
- [ ] Checkpoint system investigated
- [ ] Preventive measures implemented

---

## Summary

**Deployment Readiness:**
- ✅ Pre-deployment validation procedures defined
- ✅ Step-by-step deployment checklist provided
- ✅ Multiple rollback mechanisms available
- ✅ Monitoring and alerting configured
- ✅ 4 major incident playbooks documented
- ✅ 3 break-glass emergency procedures defined

**Key Files:**
- `deployment-guide.md` (this file)
- `monitoring-setup.md` (monitoring configuration)
- `incident-playbooks.md` (detailed runbooks)
- `production-checklist.md` (pre-deployment validation)

**System is fully documented and ready for safe, monitored production deployment.**
