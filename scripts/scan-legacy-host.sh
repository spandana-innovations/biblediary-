#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Webshell / backdoor scan for the legacy cPanel host.
#
# Context: audiofiles/1/intercessions_reading/666MAILER.php — a zero-byte PHP
# file with a mail-spam-script name, sitting in a user-upload directory, dated
# 2024-01-25 (CLAUDE.md §6). That is the signature of a compromise. It was
# empty when the zip was taken, but an empty dropper usually means either the
# payload was already fetched and removed, or the upload failed part-way. Treat
# the host as suspect until this comes back clean.
#
# THIS SCRIPT ONLY REPORTS. It never deletes. Review the output, then use
# --quarantine to move (not delete) confirmed-bad files so you keep evidence.
#
# Usage, on the host over SSH:
#   bash scan-legacy-host.sh /home/bettery1
#   bash scan-legacy-host.sh /home/bettery1 --quarantine
# ---------------------------------------------------------------------------
set -uo pipefail

ROOT="${1:-$HOME}"
QUARANTINE=0
[[ "${2:-}" == "--quarantine" ]] && QUARANTINE=1
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${HOME}/webshell-scan-${STAMP}.txt"
QDIR="${HOME}/quarantine-${STAMP}"

log() { echo "$@" | tee -a "$OUT"; }
hr()  { log "-----------------------------------------------------------------"; }

log "Webshell scan — $(date)"
log "Root: $ROOT"
hr

# --- 1. PHP anywhere it should never be ------------------------------------
# Upload directories must never contain executable code. These are the paths
# the app writes to.
log ""
log "[1] Executable code in upload directories (CRITICAL if any output)"
for d in audiofiles prayerfiles category_images hymns_images uploads; do
  [[ -d "$ROOT/$d" ]] || continue
  find "$ROOT/$d" -type f \( -iname '*.php*' -o -iname '*.phtml' -o -iname '*.pht' \
    -o -iname '*.cgi' -o -iname '*.pl' -o -iname '*.py' -o -iname '*.sh' \) \
    -printf '  %TY-%Tm-%Td %10s  %p\n' 2>/dev/null | tee -a "$OUT"
done
log "  (clean if nothing above)"

# --- 2. Known webshell filenames -------------------------------------------
hr
log "[2] Known webshell / mailer filenames"
find "$ROOT" -type f -iregex '.*\(666\|mailer\|c99\|r57\|wso\|b374k\|alfa\|indoxploit\|shell\|backdoor\|bypass\|adminer\|filesman\|priv8\).*\.\(php\|phtml\|pht\)$' \
  -printf '  %TY-%Tm-%Td %10s  %p\n' 2>/dev/null | tee -a "$OUT"
log "  (clean if nothing above)"

# --- 3. Obfuscation / execution patterns -----------------------------------
hr
log "[3] PHP files containing obfuscation or command-execution patterns"
find "$ROOT" -type f \( -iname '*.php' -o -iname '*.phtml' \) -print0 2>/dev/null |
  xargs -0 -r grep -lEI \
    "eval[[:space:]]*\([[:space:]]*(base64_decode|gzinflate|gzuncompress|str_rot13|strrev)|preg_replace[[:space:]]*\(.*/e|assert[[:space:]]*\([[:space:]]*\\\$_|create_function[[:space:]]*\(|shell_exec|passthru[[:space:]]*\(|popen[[:space:]]*\(|proc_open[[:space:]]*\(|\\\$_(POST|GET|REQUEST|COOKIE)[[:space:]]*\[[^]]*\][[:space:]]*\(|move_uploaded_file|FilesMan|WSOsetcookie" \
    2>/dev/null | sed 's/^/  /' | tee -a "$OUT"
log "  (clean if nothing above)"

# --- 4. Zero-byte and recently-modified PHP --------------------------------
hr
log "[4] Zero-byte PHP files (dropper signature — 666MAILER.php was one)"
find "$ROOT" -type f -iname '*.php' -size 0 -printf '  %TY-%Tm-%Td  %p\n' 2>/dev/null | tee -a "$OUT"
log "  (clean if nothing above)"

log ""
log "[5] PHP modified in the last 90 days (review each — should only be deploys)"
find "$ROOT" -type f -iname '*.php' -mtime -90 -printf '  %TY-%Tm-%Td %10s  %p\n' 2>/dev/null |
  sort -r | head -50 | tee -a "$OUT"

# --- 6. Persistence mechanisms ---------------------------------------------
hr
log "[6] Scheduled tasks (a common re-infection path)"
crontab -l 2>/dev/null | sed 's/^/  /' | tee -a "$OUT" || log "  (no crontab)"

log ""
log "[7] .htaccess files that enable PHP or rewrite oddly"
find "$ROOT" -name '.htaccess' -print0 2>/dev/null |
  xargs -0 -r grep -lEI "AddType.*php|AddHandler.*php|php_value.*auto_prepend|SetHandler.*php" 2>/dev/null |
  sed 's/^/  /' | tee -a "$OUT"
log "  (clean if nothing above)"

# --- 8. Leftover vendor sample scripts (CLAUDE.md §6.3) --------------------
hr
log "[8] Web-reachable CKEditor sample scripts (should be deleted outright)"
find "$ROOT" -path '*ckeditor*' \( -path '*samples*' -o -name 'posteddata.php' \) -print 2>/dev/null |
  head -20 | sed 's/^/  /' | tee -a "$OUT"
log "  (clean if nothing above)"

# --- 9. Optional quarantine -------------------------------------------------
if [[ $QUARANTINE -eq 1 ]]; then
  hr
  log "[9] QUARANTINE — moving executable files out of upload directories"
  mkdir -p "$QDIR"
  for d in audiofiles prayerfiles category_images hymns_images uploads; do
    [[ -d "$ROOT/$d" ]] || continue
    while IFS= read -r f; do
      rel="${f#"$ROOT"/}"
      mkdir -p "$QDIR/$(dirname "$rel")"
      mv "$f" "$QDIR/$rel" && log "  quarantined: $rel"
    done < <(find "$ROOT/$d" -type f \( -iname '*.php*' -o -iname '*.phtml' -o -iname '*.pht' -o -iname '*.cgi' \) 2>/dev/null)
  done
  log "  Files moved to: $QDIR (nothing deleted)"
fi

hr
log ""
log "Report written to: $OUT"
log ""
log "If sections 1-4 produced ANY output, treat the host as compromised:"
log "  1. Take a full backup (files + DB) before changing anything."
log "  2. Rotate every credential: cPanel, DB, FTP/SSH, app admin, API keys."
log "  3. Add the upload hardening in docs/security-hardening.md."
log "  4. Check raw access logs around each file's timestamp to find the entry point."
log "  5. Prefer rebuilding the host over cleaning it — you can never be sure"
log "     you found everything."
