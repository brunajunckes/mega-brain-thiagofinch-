#!/usr/bin/env bash
# terminal-history-recover.sh — Recovery tool after server crash or session loss
# Shows the last known state of all terminals before the crash.
# Usage:
#   terminal-history-recover.sh             — show last snapshot of each terminal
#   terminal-history-recover.sh --all       — show all terminals with last commands
#   terminal-history-recover.sh --restore N — restore terminal N (cd + replay cmds)

HISTORY_DIR="/srv/aiox/.claude/terminal-history"

print_header() {
  echo "========================================"
  echo "  AIOX Terminal Recovery Tool"
  echo "========================================"
  echo ""
}

# ── Get the most recent file per PTS/session ─────────────────────────────────
get_latest_per_terminal() {
  # Group by PTS prefix, keep newest per group
  declare -A seen
  while IFS= read -r fpath; do
    local fname
    fname=$(basename "$fpath")
    # Extract pts portion: terminal-pts1-abc123.log → pts1
    local pts
    pts=$(echo "$fname" | sed 's/^terminal-//' | sed 's/-[^-]*\.log$//')
    if [ -z "${seen[$pts]+x}" ]; then
      seen[$pts]="$fpath"
      echo "$fpath"
    fi
  done < <(find "$HISTORY_DIR" -name "terminal-*.log" -printf "%T@ %p\n" 2>/dev/null | sort -rn | awk '{print $2}')
}

show_recovery_summary() {
  if [ ! -d "$HISTORY_DIR" ] || [ -z "$(ls -A "$HISTORY_DIR" 2>/dev/null)" ]; then
    echo "No saved sessions found. Terminal history has not been set up yet."
    echo ""
    echo "To enable terminal history, add to ~/.bashrc:"
    echo "  source /srv/aiox/.claude/terminal-history/bashrc-integration.sh"
    return 1
  fi

  echo "Last known terminal states before crash/disconnect:"
  echo ""

  local idx=0
  local -a FILES=()

  while IFS= read -r fpath; do
    idx=$((idx + 1))
    FILES+=("$fpath")

    local fname
    fname=$(basename "$fpath")

    local saved
    saved=$(grep "^# saved:" "$fpath" 2>/dev/null | head -1 | sed 's/# saved:[[:space:]]*//')
    local start
    start=$(grep "^# start:" "$fpath" 2>/dev/null | head -1 | sed 's/# start:[[:space:]]*//')
    local cwd
    cwd=$(grep "^# cwd:" "$fpath" 2>/dev/null | head -1 | sed 's/# cwd:[[:space:]]*//')
    local pts
    pts=$(grep "^# pts:" "$fpath" 2>/dev/null | head -1 | sed 's/# pts:[[:space:]]*//')

    # Get last 5 commands from history section
    local last_cmds
    last_cmds=$(awk '/^## COMMAND HISTORY/{found=1; next} found && /^[[:space:]]*[0-9]/{print} /^## (TMUX|SCREEN|END)/{if(found) exit}' "$fpath" 2>/dev/null | tail -5 | sed 's/^[[:space:]]*[0-9]*[[:space:]]*/  - /')

    echo "  Terminal $idx: $fname"
    echo "  PTS:     ${pts:-unknown}"
    echo "  Started: ${start:-unknown}"
    echo "  Saved:   ${saved:-unknown}"
    echo "  Last Dir: ${cwd:-unknown}"
    echo "  Last Commands:"
    echo "${last_cmds:-    (none recorded)}"
    echo ""
  done < <(get_latest_per_terminal)

  # Export for --restore
  for i in "${!FILES[@]}"; do
    export "RECOVERY_FILE_$((i+1))=${FILES[$i]}"
  done

  if [ $idx -gt 0 ]; then
    echo "Recovery options:"
    echo "  $0 --restore N    — cd to last directory of terminal N"
    echo "  $0 --all          — show full history of all terminals"
    echo ""
    echo "Example: $0 --restore 1"
  fi
}

restore_terminal() {
  local n="$1"
  local varname="RECOVERY_FILE_${n}"
  local fpath="${!varname}"

  # If env var not set (called directly), compute it
  if [ -z "$fpath" ]; then
    local idx=0
    while IFS= read -r f; do
      idx=$((idx + 1))
      [ "$idx" = "$n" ] && fpath="$f" && break
    done < <(get_latest_per_terminal)
  fi

  if [ -z "$fpath" ] || [ ! -f "$fpath" ]; then
    echo "Terminal $n not found. Run without arguments to list available terminals."
    exit 1
  fi

  local cwd
  cwd=$(grep "^# cwd:" "$fpath" 2>/dev/null | head -1 | sed 's/# cwd:[[:space:]]*//')
  local last_cmds
  last_cmds=$(awk '/^## COMMAND HISTORY/{found=1; next} found && /^[[:space:]]*[0-9]/{print} /^## (TMUX|SCREEN|END)/{if(found) exit}' "$fpath" 2>/dev/null | tail -20 | sed 's/^[[:space:]]*[0-9]*[[:space:]]*//')

  echo "========================================"
  echo "  Restoring Terminal $n"
  echo "========================================"
  echo ""
  echo "Last working directory: ${cwd:-unknown}"
  echo ""
  echo "Last 20 commands:"
  echo "$last_cmds" | nl -ba
  echo ""

  if [ -n "$cwd" ] && [ -d "$cwd" ]; then
    echo "To restore: cd '$cwd'"
    echo ""
    echo "Run this command to navigate to last directory:"
    echo "  cd '$cwd'"
  elif [ -n "$cwd" ]; then
    echo "Note: last directory '$cwd' no longer exists."
  fi

  echo ""
  echo "Full session file: $fpath"
}

show_all() {
  while IFS= read -r fpath; do
    echo "========================================"
    echo "  $(basename "$fpath")"
    echo "========================================"
    grep "^#" "$fpath" | head -7
    echo ""
    echo "Last 15 commands:"
    awk '/^## COMMAND HISTORY/{found=1; next} found && /^[[:space:]]*[0-9]/{print} /^## (TMUX|SCREEN|END)/{if(found) exit}' "$fpath" | tail -15 | sed 's/^[[:space:]]*[0-9]*[[:space:]]*/  /'
    echo ""
  done < <(get_latest_per_terminal)
}

# ── Main ──────────────────────────────────────────────────────────────────────
print_header

case "${1:-}" in
  --restore)
    if [ -z "$2" ]; then
      echo "Usage: $0 --restore <N>"
      echo "Run without arguments first to see terminal numbers."
      exit 1
    fi
    restore_terminal "$2"
    ;;
  --all)
    show_all
    ;;
  "")
    show_recovery_summary
    ;;
  *)
    echo "Unknown option: $1"
    echo "Usage: $0 [--all | --restore N]"
    exit 1
    ;;
esac
