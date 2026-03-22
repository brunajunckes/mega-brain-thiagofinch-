#!/usr/bin/env bash
# terminal-history-view.sh — Browse and inspect saved terminal session logs
# Usage:
#   terminal-history-view.sh             — list all sessions (newest first)
#   terminal-history-view.sh <filename>  — view specific session file
#   terminal-history-view.sh --today     — list sessions from today only
#   terminal-history-view.sh --last      — open the most recent session

HISTORY_DIR="/srv/aiox/.claude/terminal-history"

# ── Helpers ───────────────────────────────────────────────────────────────────
print_header() {
  echo "========================================"
  echo "  AIOX Terminal History Browser"
  echo "========================================"
  echo ""
}

list_sessions() {
  local filter="$1"  # optional: today
  local today
  today=$(date +%Y-%m-%d)

  if [ ! -d "$HISTORY_DIR" ] || [ -z "$(ls -A "$HISTORY_DIR" 2>/dev/null)" ]; then
    echo "No saved sessions found in $HISTORY_DIR"
    echo "Sessions are saved automatically when you open a terminal."
    return 1
  fi

  echo "Saved terminal sessions:"
  echo ""
  printf "%-4s  %-40s  %-20s  %-8s  %s\n" "NUM" "FILE" "SAVED" "SIZE" "LAST COMMAND"
  printf "%-4s  %-40s  %-20s  %-8s  %s\n" "---" "----" "-----" "----" "------------"

  local idx=0
  while IFS= read -r fpath; do
    local fname
    fname=$(basename "$fpath")

    # Filter by today if requested
    if [ "$filter" = "today" ]; then
      local fdate
      fdate=$(stat -c %y "$fpath" 2>/dev/null | cut -d' ' -f1)
      [ "$fdate" = "$today" ] || continue
    fi

    local saved
    saved=$(stat -c %y "$fpath" 2>/dev/null | cut -d'.' -f1 | sed 's/ /T/')
    local size
    size=$(du -sh "$fpath" 2>/dev/null | cut -f1)

    # Extract last meaningful command from history section
    local last_cmd
    last_cmd=$(grep -A1 "^## COMMAND HISTORY" "$fpath" 2>/dev/null | tail -1 || true)
    if [ -z "$last_cmd" ]; then
      # Fallback: get last non-comment non-empty line before the pane section
      last_cmd=$(awk '/^## COMMAND HISTORY/{found=1; next} found && /^[0-9]/{line=$0} /^## (TMUX|SCREEN|END)/{if(found) exit} END{print line}' "$fpath" 2>/dev/null | sed 's/^[[:space:]]*[0-9]*[[:space:]]*//')
    fi
    last_cmd="${last_cmd:0:40}"

    # Extract cwd from header
    local cwd
    cwd=$(grep "^# cwd:" "$fpath" 2>/dev/null | head -1 | sed 's/# cwd:[[:space:]]*//')

    idx=$((idx + 1))
    printf "%-4s  %-40s  %-20s  %-8s  %s\n" "$idx" "$fname" "$saved" "$size" "${cwd:-?}"
  done < <(find "$HISTORY_DIR" -name "terminal-*.log" -printf "%T@ %p\n" 2>/dev/null | sort -rn | awk '{print $2}')

  echo ""
  echo "Total: $idx session(s) in $HISTORY_DIR"
}

view_session() {
  local target="$1"
  local fpath

  if [ -f "$target" ]; then
    fpath="$target"
  elif [ -f "$HISTORY_DIR/$target" ]; then
    fpath="$HISTORY_DIR/$target"
  else
    echo "File not found: $target"
    echo "Run without arguments to list available sessions."
    exit 1
  fi

  echo "========================================"
  echo "  Session: $(basename "$fpath")"
  echo "========================================"
  echo ""

  # Print metadata header
  echo "--- METADATA ---"
  grep "^#" "$fpath" | head -10

  echo ""
  echo "--- LAST 30 COMMANDS ---"
  awk '/^## COMMAND HISTORY/{found=1; next} found && /^[[:space:]]*[0-9]/{print} /^## (TMUX|SCREEN|END)/{if(found) exit}' "$fpath" | tail -30

  echo ""
  echo "--- LAST 50 LINES OF PANE OUTPUT ---"
  awk '/^## TMUX PANE SCROLLBACK/{found=1; next} found && !/^#/{print} /^## END/{if(found) exit}' "$fpath" | tail -50

  echo ""
  echo "(full file: $fpath)"
}

open_last() {
  local last
  last=$(find "$HISTORY_DIR" -name "terminal-*.log" -printf "%T@ %p\n" 2>/dev/null | sort -rn | head -1 | awk '{print $2}')
  if [ -z "$last" ]; then
    echo "No saved sessions found."
    exit 1
  fi
  view_session "$last"
}

# ── Main ──────────────────────────────────────────────────────────────────────
print_header

case "${1:-}" in
  --today)
    list_sessions today
    ;;
  --last)
    open_last
    ;;
  "")
    list_sessions
    ;;
  *)
    view_session "$1"
    ;;
esac
