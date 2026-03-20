#!/bin/bash

##############################################################################
# AIOX YouTube Pipeline - Complete Extraction & Analysis
#
# Executes full pipeline:
# 1. Download transcripts from YouTube
# 2. Extract capabilities
# 3. Sync to mind clone (optional)
# 4. Generate reports
#
# Usage:
#   ./workers/run-full-pipeline.sh @oalanicolas
#   ./workers/run-full-pipeline.sh @oalanicolas --sync-clone
#   ./workers/run-full-pipeline.sh @oalanicolas ./my-transcripts pt
#
##############################################################################

set -e  # Exit on error

# ============================================================================
# FUNCTIONS
# ============================================================================

show_help() {
  echo "
AIOX YouTube Pipeline - Complete Extraction

Usage: ./workers/run-full-pipeline.sh <channel> [transcript-dir] [lang] [options]

Arguments:
  channel       YouTube channel (@name format)
  transcript-dir  Directory to save transcripts (default: ./data/transcripts)
  lang          Language code (default: pt for Portuguese)

Options:
  --sync-clone  Also update mind clone memory with new patterns
  --verbose     Show detailed output
  -h, --help    Show this help

Examples:
  ./workers/run-full-pipeline.sh @oalanicolas
  ./workers/run-full-pipeline.sh @oalanicolas ./my-transcripts pt --sync-clone
  ./workers/run-full-pipeline.sh @another_channel ./out en --verbose

Output:
  - Transcripts in $TRANSCRIPT_DIR/
  - CAPABILITIES-MAP.md (report)
  - CAPABILITIES-MAP.json (data)
  - INDEX.json (metadata)
  "
}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_section() {
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════════════════════════"
}

log_success() {
  echo "✅ $1"
}

log_warning() {
  echo "⚠️  $1"
}

log_error() {
  echo "❌ $1"
}

# ============================================================================
# DEFAULTS & ARGS
# ============================================================================

CHANNEL=${1:-"@oalanicolas"}
TRANSCRIPT_DIR=${2:-"./data/transcripts"}
LANGUAGE=${3:-"pt"}
SYNC_CLONE=false
VERBOSE=false

# Parse optional flags
for arg in "$@"; do
  case $arg in
    --sync-clone) SYNC_CLONE=true ;;
    --verbose) VERBOSE=true ;;
    -h|--help) show_help; exit 0 ;;
  esac
done

# ============================================================================
# PIPELINE EXECUTION
# ============================================================================

main() {
  local START_TIME=$(date +%s)

  log_section "AIOX YouTube Pipeline - Starting"

  log "Channel: $CHANNEL"
  log "Transcripts Dir: $TRANSCRIPT_DIR"
  log "Language: $LANGUAGE"
  log "Sync Clone: $SYNC_CLONE"
  echo ""

  # Step 1: Extract transcripts
  log_section "STEP 1: Extracting Transcripts"

  if [ ! -d "$TRANSCRIPT_DIR" ]; then
    log "Creating directory: $TRANSCRIPT_DIR"
    mkdir -p "$TRANSCRIPT_DIR"
  fi

  log "Running: youtube-transcript-extractor-v2.js"

  if node workers/youtube-transcript-extractor-v2.js "$CHANNEL" "$TRANSCRIPT_DIR" "$LANGUAGE"; then
    log_success "Transcripts extracted"
  else
    log_error "Failed to extract transcripts"
    exit 1
  fi

  # Check if transcripts were downloaded
  if [ ! -f "$TRANSCRIPT_DIR/INDEX.json" ]; then
    log_warning "No transcripts found. Aborting."
    exit 1
  fi

  TRANSCRIPT_COUNT=$(grep -c '".json"' "$TRANSCRIPT_DIR/INDEX.json" 2>/dev/null || echo "0")
  log "Found $TRANSCRIPT_COUNT transcript(s)"
  echo ""

  # Step 2: Extract capabilities
  log_section "STEP 2: Extracting Capabilities"

  CAPABILITIES_FILE="CAPABILITIES-MAP.md"
  CAPABILITIES_JSON="CAPABILITIES-MAP.json"

  log "Running: extract-capabilities.js"

  if node workers/extract-capabilities.js "$TRANSCRIPT_DIR" "$CAPABILITIES_FILE"; then
    log_success "Capabilities extracted"

    if [ -f "$CAPABILITIES_JSON" ]; then
      log_success "JSON report generated"

      # Show stats
      echo ""
      echo "Report Statistics:"
      jq -r '
        "  Videos: \(.filesAnalyzed) | " +
        "Capabilities: \(.capabilities | length) | " +
        "Functions: \(.functions | length) | " +
        "Use Cases: \(.useCases | length) | " +
        "Domains: \(.domains | length)"
      ' "$CAPABILITIES_JSON"
    fi
  else
    log_error "Failed to extract capabilities"
    exit 1
  fi

  echo ""

  # Step 3: Optional - Sync to mind clone
  if [ "$SYNC_CLONE" = true ]; then
    log_section "STEP 3: Syncing to Mind Clone"

    if [ -f "workers/sync-transcript-to-clone.js" ]; then
      log "Running: sync-transcript-to-clone.js"

      if node workers/sync-transcript-to-clone.js "$TRANSCRIPT_DIR"; then
        log_success "Mind clone synchronized"
      else
        log_warning "Could not sync to mind clone (may not exist)"
      fi
    else
      log_warning "sync-transcript-to-clone.js not found"
    fi

    echo ""
  fi

  # Step 4: Generate summary
  log_section "STEP 4: Summary"

  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  log "Pipeline completed in ${DURATION}s"
  echo ""
  echo "Generated Files:"
  echo "  📄 $CAPABILITIES_FILE (Human readable)"
  echo "  📊 $CAPABILITIES_JSON (Structured data)"
  echo "  📋 $TRANSCRIPT_DIR/INDEX.json (Metadata)"
  echo ""

  if [ -f "$CAPABILITIES_FILE" ]; then
    echo "Top 5 Capabilities:"
    grep "^| " "$CAPABILITIES_FILE" | head -6 | tail -5 | awk '{print "  " $0}'
  fi

  echo ""
  log_success "Pipeline completed successfully!"

  # Optional: show capabilities preview
  if [ "$VERBOSE" = true ] && [ -f "$CAPABILITIES_FILE" ]; then
    echo ""
    echo "Capabilities Preview (first 30 lines):"
    echo "─────────────────────────────────────"
    head -30 "$CAPABILITIES_FILE"
  fi

  return 0
}

# ============================================================================
# EXECUTE
# ============================================================================

# Verify Node.js is available
if ! command -v node &> /dev/null; then
  log_error "Node.js not found. Please install Node.js 18+"
  exit 1
fi

# Change to AIOX root if not already there
if [ ! -f "workers/youtube-transcript-extractor-v2.js" ]; then
  if [ -f "../workers/youtube-transcript-extractor-v2.js" ]; then
    cd ..
  else
    log_error "Workers directory not found. Run from /srv/aiox/"
    exit 1
  fi
fi

# Run main pipeline
main

exit $?
