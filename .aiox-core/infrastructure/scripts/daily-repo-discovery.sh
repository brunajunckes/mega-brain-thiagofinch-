#!/bin/bash

# Daily Repository Discovery Worker
# Runs once per day to identify new adoption candidates
# Updates adoption queue automatically

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AIOX_ROOT="$(dirname $(dirname $(dirname $SCRIPT_DIR)))"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE="${AIOX_ROOT}/.aiox-core/logs/daily-repo-discovery-${TIMESTAMP}.log"

echo "🔍 Daily Repository Discovery Worker" | tee "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "================================" | tee -a "$LOG_FILE"

# Create logs directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

# Run analyzer worker
echo "" | tee -a "$LOG_FILE"
echo "📊 Analyzing repositories..." | tee -a "$LOG_FILE"
cd "$AIOX_ROOT"
node "$SCRIPT_DIR/repo-analyzer-worker.js" 2>&1 | tee -a "$LOG_FILE"

# Run token-efficient analyzer
echo "" | tee -a "$LOG_FILE"
echo "🚀 Generating token-efficient strategy..." | tee -a "$LOG_FILE"
node "$SCRIPT_DIR/token-efficient-analyzer.js" 2>&1 | tee -a "$LOG_FILE"

# Check for new high-priority repos
echo "" | tee -a "$LOG_FILE"
echo "📋 Checking adoption queue..." | tee -a "$LOG_FILE"

if [ -f "${AIOX_ROOT}/docs/research/repo-analysis-queue.json" ]; then
  HIGH_PRIORITY=$(grep -c '"recommendation":"HIGH_PRIORITY"' "${AIOX_ROOT}/docs/research/repo-analysis-queue.json" 2>/dev/null || echo "0")
  echo "✅ High-priority repos found: $HIGH_PRIORITY" | tee -a "$LOG_FILE"

  # Generate summary report
  SUMMARY_FILE="${AIOX_ROOT}/docs/research/daily-discovery-${TIMESTAMP}.md"
  {
    echo "# Daily Repository Discovery Report"
    echo ""
    echo "**Date:** $(date)"
    echo "**High-Priority Repos:** $HIGH_PRIORITY"
    echo ""
    echo "## Queue Status"
    echo '```json'
    cat "${AIOX_ROOT}/docs/research/repo-analysis-queue.json"
    echo '```'
  } > "$SUMMARY_FILE"

  echo "📄 Report saved to: $SUMMARY_FILE" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "✅ Daily discovery complete" | tee -a "$LOG_FILE"
echo "Completed: $(date)" | tee -a "$LOG_FILE"
echo "Log: $LOG_FILE"

# Exit successfully
exit 0
