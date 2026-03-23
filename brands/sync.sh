#!/usr/bin/env bash
# brands/sync.sh — Sync brand assets to public/ and validate consistency
# Usage: bash brands/sync.sh [--validate-only]
set -e

BRAND_SRC="/srv/aiox/brands"
PUBLIC_DEST="/srv/aiox/projects/first/hubme-landing/public/brand"
ERRORS=0

log()  { echo "[sync] $*"; }
warn() { echo "[WARN] $*" >&2; ERRORS=$((ERRORS+1)); }
ok()   { echo "[OK]   $*"; }

# ── 1. Sync all brand directories ──────────────────────────────────────────
if [[ "$1" != "--validate-only" ]]; then
  log "Syncing brand assets to public/ ..."
  for brand_dir in "$BRAND_SRC"/*/; do
    brand_name=$(basename "$brand_dir")
    dest="$PUBLIC_DEST/$brand_name"
    mkdir -p "$dest"
    rsync -a --delete \
      --exclude='*.sh' \
      --exclude='*.md' \
      --exclude='.git' \
      "$brand_dir" "$dest/"
    ok "Synced $brand_name → $dest"
  done
fi

# ── 2. Validate logo consistency across all HTML pages ─────────────────────
log "Validating logo consistency ..."

for brand_dir in "$BRAND_SRC"/*/; do
  brand_name=$(basename "$brand_dir")
  html_files=("$brand_dir"*.html)

  for f in "${html_files[@]}"; do
    [[ -f "$f" ]] || continue
    filename=$(basename "$f")
    # index.html is the hub landing (hero page) — no nav logo required
    [[ "$filename" == "index.html" ]] && continue

    # Check: nav logo must have a hub-mark SVG (viewBox="0 0 80 80")
    if ! grep -q 'viewBox="0 0 80 80"' "$f"; then
      warn "$brand_name/$filename — missing canonical hub mark (viewBox=\"0 0 80 80\")"
    fi

    # Check: wordmark must have .ai in cyan span
    if ! grep -qE '(\.ai|<span.*>\.ai</span>)' "$f"; then
      warn "$brand_name/$filename — missing .ai accent span in wordmark"
    fi

    # Check: nav must link back to index.html (not href="#")
    if grep -qE 'nav-logo.*href="#"' "$f" || grep -qE 'href="#">hubme' "$f"; then
      warn "$brand_name/$filename — nav logo links to # instead of index.html"
    fi

    # Check: no inline gradient ID conflicts (all IDs should be page-unique)
    dupes=$(grep -oE 'id="[^"]+"' "$f" | sort | uniq -d)
    if [[ -n "$dupes" ]]; then
      warn "$brand_name/$filename — duplicate SVG/HTML IDs: $dupes"
    fi
  done
done

# ── 3. Report ───────────────────────────────────────────────────────────────
echo ""
if [[ $ERRORS -eq 0 ]]; then
  ok "All checks passed. Brand hub is consistent."
  exit 0
else
  echo "[FAIL] $ERRORS issue(s) found. Fix them before deploying."
  exit 1
fi
