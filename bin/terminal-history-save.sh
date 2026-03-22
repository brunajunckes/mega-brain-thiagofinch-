#!/usr/bin/env bash
# terminal-history-save.sh — Persists history for all active terminal sessions
# Usage: called by PROMPT_COMMAND, trap EXIT, or cron
# Output: /srv/aiox/.claude/terminal-history/terminal-{PTS_ID}-{TIMESTAMP}.log

HISTORY_DIR="/srv/aiox/.claude/terminal-history"
MAX_AGE_DAYS=7
SESSION_ID="${AIOX_TERMINAL_SESSION_ID:-unknown}"
PTS_ID="${AIOX_TERMINAL_PTS:-unknown}"
START_TIME="${AIOX_TERMINAL_START:-$(date -Iseconds)}"
NOW=$(date -Iseconds)
NOW_EPOCH=$(date +%s)
HOSTNAME=$(hostname -s 2>/dev/null || echo "server")

# ── Ensure directory exists ───────────────────────────────────────────────────
mkdir -p "$HISTORY_DIR"

# ── Build filename ────────────────────────────────────────────────────────────
# Format: terminal-pts{N}-{EPOCH}.log so each session gets a unique, sortable file
FNAME="terminal-${PTS_ID}-${SESSION_ID}.log"
FPATH="$HISTORY_DIR/$FNAME"

# ── Capture current working directory ────────────────────────────────────────
CWD=$(pwd 2>/dev/null || echo "unknown")

# ── Write/update the session file ────────────────────────────────────────────
{
  echo "# AIOX Terminal History — Session Snapshot"
  echo "# host:       $HOSTNAME"
  echo "# pts:        $PTS_ID"
  echo "# session_id: $SESSION_ID"
  echo "# start:      $START_TIME"
  echo "# saved:      $NOW"
  echo "# cwd:        $CWD"
  echo "# ---"
  echo ""
  echo "## COMMAND HISTORY (last 500 entries)"
  echo ""
  # Write bash in-memory history to temp so HISTFILE path doesn't matter
  history 2>/dev/null | tail -500 || true
  echo ""
  echo "## RECENT SHELL OUTPUT (scrollback not available in non-interactive snapshot)"
  echo "# Note: full scrollback capture requires tmux/screen pane dump (see below)"
  echo ""
} > "$FPATH"

# ── If inside tmux: dump pane scrollback ─────────────────────────────────────
if [ -n "$TMUX" ]; then
  PANE=$(tmux display-message -p "#{pane_id}" 2>/dev/null || echo "")
  if [ -n "$PANE" ]; then
    echo "## TMUX PANE SCROLLBACK (last 500 lines — pane $PANE)" >> "$FPATH"
    tmux capture-pane -p -S -500 -t "$PANE" 2>/dev/null >> "$FPATH" || true
    echo "" >> "$FPATH"
  fi
fi

# ── If inside GNU screen: note it ────────────────────────────────────────────
if [ -n "$STY" ]; then
  echo "## SCREEN SESSION: $STY" >> "$FPATH"
  echo "# Use 'screen -X hardcopy /tmp/screen-hardcopy.txt' to get pane content" >> "$FPATH"
  echo "" >> "$FPATH"
fi

echo "## END OF SNAPSHOT — $NOW" >> "$FPATH"

# ── Auto-cleanup: remove files older than MAX_AGE_DAYS ───────────────────────
find "$HISTORY_DIR" -name "terminal-*.log" -mtime "+${MAX_AGE_DAYS}" -delete 2>/dev/null || true

exit 0
