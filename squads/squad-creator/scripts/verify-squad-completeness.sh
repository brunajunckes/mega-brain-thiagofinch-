#!/bin/bash
# verify-squad-completeness.sh
# Verifica completude estrutural de um squad antes de declarar "criado"
#
# Usage: ./verify-squad-completeness.sh <squad-name> [--strict]
# Example: ./verify-squad-completeness.sh theme
# Example: ./verify-squad-completeness.sh theme --strict
#
# Modes:
#   default: Contextual (lifecycle tasks são WARNING para squads operacionais)
#   --strict: Todos os checks são BLOCKING
#
# Exit codes:
#   0 = PASS (all blocking checks passed)
#   1 = FAIL (blocking issues found)

set -e

SQUAD=$1
STRICT_MODE=false

if [ "$2" = "--strict" ]; then
  STRICT_MODE=true
fi

ROOT="squads/$SQUAD"

if [ -z "$SQUAD" ]; then
  echo "Usage: $0 <squad-name> [--strict]"
  echo "Example: $0 theme"
  echo "Example: $0 theme --strict"
  exit 1
fi

if [ ! -d "$ROOT" ]; then
  echo "ERROR: Squad directory not found: $ROOT"
  exit 1
fi

echo "========================================"
echo "Squad Structural Completeness Check"
echo "Squad: $SQUAD"
echo "Path: $ROOT"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Helper function
check_pass() {
  echo "  [PASS] $1"
}

check_fail() {
  echo "  [FAIL] $1"
  ERRORS=$((ERRORS+1))
}

check_warn() {
  echo "  [WARN] $1"
  WARNINGS=$((WARNINGS+1))
}

# ============================================
# 1. CONFIG FILE CHECKS
# ============================================
echo "1. Config File Checks"
echo "--------------------"

# SC-001: config.yaml exists
if [ -f "$ROOT/config.yaml" ]; then
  check_pass "config.yaml exists"
else
  check_fail "config.yaml does not exist"
fi

# SC-001b: NOT squad.yaml
if [ -f "$ROOT/squad.yaml" ]; then
  check_fail "squad.yaml exists (should be config.yaml)"
else
  check_pass "No squad.yaml (correct)"
fi

# SC-002: entry_agent present
if grep -q "entry_agent:" "$ROOT/config.yaml" 2>/dev/null; then
  ENTRY_AGENT=$(grep "entry_agent:" "$ROOT/config.yaml" | head -1 | sed 's/.*entry_agent:[[:space:]]*//' | tr -d '"' | tr -d "'")
  check_pass "entry_agent defined: $ENTRY_AGENT"
else
  check_fail "entry_agent not defined in config.yaml"
  ENTRY_AGENT=""
fi

# SC-003: tested field present
if grep -q "tested:" "$ROOT/config.yaml" 2>/dev/null; then
  check_pass "tested field present"
else
  check_fail "tested field missing in config.yaml"
fi

# SC-003b: version field present
if grep -q "version:" "$ROOT/config.yaml" 2>/dev/null; then
  VERSION=$(grep "version:" "$ROOT/config.yaml" | head -1 | sed 's/.*version:[[:space:]]*//' | tr -d '"' | tr -d "'")
  check_pass "version defined: $VERSION"
else
  check_fail "version not defined in config.yaml"
fi

echo ""

# ============================================
# 2. ENTRY AGENT CHECKS
# ============================================
echo "2. Entry Agent Checks"
echo "--------------------"

if [ -n "$ENTRY_AGENT" ]; then
  AGENT_FILE="$ROOT/agents/$ENTRY_AGENT.md"

  # Agent file exists
  if [ -f "$AGENT_FILE" ]; then
    check_pass "Entry agent file exists: $AGENT_FILE"

    # SC-004: activation-instructions present
    if grep -q "activation-instructions:" "$AGENT_FILE" 2>/dev/null; then
      check_pass "activation-instructions block present"
    else
      check_fail "activation-instructions block MISSING in entry agent"
    fi

    # Commands section present
    if grep -q "commands:" "$AGENT_FILE" 2>/dev/null; then
      check_pass "commands section present"
    else
      check_warn "commands section not found (may be named differently)"
    fi

    # *help command present
    if grep -q "\*help" "$AGENT_FILE" 2>/dev/null; then
      check_pass "*help command present"
    else
      check_warn "*help command not found"
    fi
  else
    check_fail "Entry agent file does not exist: $AGENT_FILE"
  fi
else
  check_fail "Cannot check entry agent (entry_agent not defined)"
fi

echo ""

# ============================================
# 3. DOCUMENTATION CHECKS
# ============================================
echo "3. Documentation Checks"
echo "----------------------"

# SC-005: README.md
if [ -f "$ROOT/README.md" ]; then
  check_pass "README.md exists"
else
  check_fail "README.md does not exist"
fi

# SC-006: CHANGELOG.md
if [ -f "$ROOT/CHANGELOG.md" ]; then
  check_pass "CHANGELOG.md exists"
else
  check_fail "CHANGELOG.md does not exist"
fi

# SC-007: ARCHITECTURE.md
if [ -f "$ROOT/ARCHITECTURE.md" ]; then
  check_pass "ARCHITECTURE.md exists"
else
  check_fail "ARCHITECTURE.md does not exist"
fi

echo ""

# ============================================
# 4. LIFECYCLE TASKS CHECKS (CONTEXTUAL)
# ============================================
echo "4. Lifecycle Tasks Checks"
echo "------------------------"

# Detect squad type (operational vs expert)
IS_OPERATIONAL=false

# Check for operational indicators in config
if grep -qi "operational\|utility\|simple\|tool" "$ROOT/config.yaml" 2>/dev/null; then
  IS_OPERATIONAL=true
fi

# Check agent line counts (operational squads have lighter agents)
AGENT_LINES=0
for agent in "$ROOT/agents/"*.md; do
  if [ -f "$agent" ]; then
    lines=$(wc -l < "$agent")
    AGENT_LINES=$((AGENT_LINES + lines))
  fi
done
AGENT_COUNT=$(ls -1 "$ROOT/agents/"*.md 2>/dev/null | wc -l)
if [ "$AGENT_COUNT" -gt 0 ]; then
  AVG_LINES=$((AGENT_LINES / AGENT_COUNT))
  if [ "$AVG_LINES" -lt 300 ]; then
    IS_OPERATIONAL=true
  fi
fi

if [ "$IS_OPERATIONAL" = true ] && [ "$STRICT_MODE" = false ]; then
  echo "  [INFO] Detected: OPERATIONAL squad (lifecycle tasks are OPTIONAL)"
else
  echo "  [INFO] Detected: EXPERT/PIPELINE squad (lifecycle tasks RECOMMENDED)"
fi

# Check for create task
HAS_CREATE=false
for f in "$ROOT/tasks/create-"*.md "$ROOT/tasks/wf-create-"*.yaml "$ROOT/workflows/wf-create-"*.yaml; do
  if [ -f "$f" ] 2>/dev/null; then
    HAS_CREATE=true
    break
  fi
done

if [ "$HAS_CREATE" = true ]; then
  check_pass "Create task/workflow exists"
else
  check_warn "No create-* task found (may be named differently)"
fi

# SC-008: update task (CONTEXTUAL)
HAS_UPDATE=false
for f in "$ROOT/tasks/update-"*.md "$ROOT/tasks/wf-update-"*.yaml "$ROOT/workflows/wf-update-"*.yaml; do
  if [ -f "$f" ] 2>/dev/null; then
    HAS_UPDATE=true
    break
  fi
done

if [ "$HAS_UPDATE" = true ]; then
  check_pass "Update task/workflow exists"
else
  if [ "$IS_OPERATIONAL" = true ] && [ "$STRICT_MODE" = false ]; then
    echo "  [SKIP] No update-* task (optional for operational squads)"
  else
    check_warn "No update-* task found (recommended for brownfield)"
  fi
fi

# SC-009: delete task (CONTEXTUAL)
HAS_DELETE=false
for f in "$ROOT/tasks/delete-"*.md "$ROOT/tasks/wf-delete-"*.yaml "$ROOT/workflows/wf-delete-"*.yaml; do
  if [ -f "$f" ] 2>/dev/null; then
    HAS_DELETE=true
    break
  fi
done

if [ "$HAS_DELETE" = true ]; then
  check_pass "Delete task/workflow exists"
else
  if [ "$IS_OPERATIONAL" = true ] && [ "$STRICT_MODE" = false ]; then
    echo "  [SKIP] No delete-* task (optional for operational squads)"
  else
    check_warn "No delete-* task found (recommended for cleanup)"
  fi
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "========================================"
echo "SUMMARY"
echo "========================================"
echo ""
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "RESULT: PASS"
  echo ""
  echo "Squad '$SQUAD' is structurally complete."
  exit 0
else
  echo "RESULT: FAIL"
  echo ""
  echo "Squad '$SQUAD' is INCOMPLETE. Fix $ERRORS error(s) before declaring 'created'."
  exit 1
fi
