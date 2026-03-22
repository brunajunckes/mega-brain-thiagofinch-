#!/usr/bin/env bash
# terminal-history-cron.sh — Cron safety net: snapshots ALL active pts sessions
# Runs every 1 minute via cron. Creates/updates one file per active pts.
# This catches history for terminals that don't have PROMPT_COMMAND set.

HISTORY_DIR="/srv/aiox/.claude/terminal-history"
MAX_AGE_DAYS=7
NOW=$(date -Iseconds)
HOSTNAME=$(hostname -s 2>/dev/null || echo "server")

mkdir -p "$HISTORY_DIR"

# ── Iterate over all active pts sessions ─────────────────────────────────────
for pts_path in /proc/*/fd; do
  pid=$(echo "$pts_path" | cut -d'/' -f3)
  [ -d "$pts_path" ] || continue

  # Get the controlling terminal for this process
  stat_file="/proc/$pid/stat"
  [ -f "$stat_file" ] || continue

  # Only consider shell processes
  comm=$(cat "/proc/$pid/comm" 2>/dev/null || echo "")
  case "$comm" in
    bash|zsh|sh|fish|dash) : ;;  # continue
    *) continue ;;
  esac

  # Get tty
  tty_path=$(readlink "/proc/$pid/fd/0" 2>/dev/null || echo "")
  case "$tty_path" in
    /dev/pts/*) : ;;  # only pts, not tty
    *) continue ;;
  esac

  pts_num=$(basename "$tty_path")
  fname="terminal-pts${pts_num}-cron.log"
  fpath="$HISTORY_DIR/$fname"

  # Get environment from process
  env_raw=$(tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null || echo "")
  cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || echo "unknown")
  hist_file=$(echo "$env_raw" | grep "^HISTFILE=" | cut -d= -f2-)
  aiox_session=$(echo "$env_raw" | grep "^AIOX_TERMINAL_SESSION_ID=" | cut -d= -f2-)
  aiox_start=$(echo "$env_raw" | grep "^AIOX_TERMINAL_START=" | cut -d= -f2-)

  # Read actual bash history file if available
  history_content=""
  if [ -n "$hist_file" ] && [ -f "$hist_file" ]; then
    history_content=$(tail -500 "$hist_file" 2>/dev/null || echo "")
  else
    # Fallback: try default locations
    for hf in "/root/.bash_history" "/home/$(id -nu "$pid" 2>/dev/null)/.bash_history"; do
      if [ -f "$hf" ]; then
        history_content=$(tail -500 "$hf" 2>/dev/null || echo "")
        break
      fi
    done
  fi

  # Get tmux pane content if the process is in a tmux pane
  tmux_pane=""
  if echo "$env_raw" | grep -q "^TMUX="; then
    # Get pane id associated with this pid (best effort)
    pane_id=$(tmux list-panes -a -F "#{pane_id} #{pane_pid}" 2>/dev/null | awk -v PID="$pid" '$2==PID{print $1}')
    if [ -n "$pane_id" ]; then
      tmux_pane=$(tmux capture-pane -p -S -500 -t "$pane_id" 2>/dev/null || echo "")
    fi
  fi

  # Write snapshot
  {
    echo "# AIOX Terminal History — Cron Snapshot"
    echo "# host:       $HOSTNAME"
    echo "# pts:        pts$pts_num"
    echo "# pid:        $pid"
    echo "# shell:      $comm"
    echo "# session_id: ${aiox_session:-cron-snapshot}"
    echo "# start:      ${aiox_start:-unknown}"
    echo "# saved:      $NOW"
    echo "# cwd:        $cwd"
    [ -n "$hist_file" ] && echo "# histfile:   $hist_file"
    echo "# ---"
    echo ""
    echo "## COMMAND HISTORY (last 500 from HISTFILE)"
    echo ""
    if [ -n "$history_content" ]; then
      echo "$history_content" | tail -500
    else
      echo "(no history file found for pid $pid)"
    fi
    echo ""
    if [ -n "$tmux_pane" ]; then
      echo "## TMUX PANE SCROLLBACK (last 500 lines)"
      echo "$tmux_pane"
      echo ""
    fi
    echo "## END OF CRON SNAPSHOT — $NOW"
  } > "$fpath"

done

# ── Cleanup old files ─────────────────────────────────────────────────────────
find "$HISTORY_DIR" -name "terminal-*.log" -mtime "+${MAX_AGE_DAYS}" -delete 2>/dev/null || true

exit 0
