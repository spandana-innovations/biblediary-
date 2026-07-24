#!/usr/bin/env bash
# Subset + instance the self-hosted variable fonts (REDESIGN — perf).
#
# The Google-hosted variable fonts ship a full weight axis (200–900) plus an
# optical-size axis, which the app doesn't need. We pin the optical size and
# clamp the weight range to what the stylesheet uses, keep all OpenType layout
# features (small-caps, ligatures, kerning), and restrict to Latin + the
# liturgical punctuation we render. Result: ~385KB → ~150KB.
#
# Requires: pip install fonttools brotli
# Run from the repo root:  bash scripts/subset-fonts.sh
set -euo pipefail

DIR="apps/web/static/fonts"
TMP="$(mktemp -d)"
# Latin + extensions, general punctuation, letterlike (℣ ℟), math (≈),
# ligatures, and dingbats (✠ ❧). pyftsubset keeps only glyphs the font has.
U="U+0000-024F,U+0300-036F,U+2000-206F,U+2070-209F,U+20A0-20BF,U+2100-214F,U+2200-22FF,U+2700-27BF,U+FB00-FB4F"

inst() { # $1=basename  $2..=instancer axis args (e.g. opsz=48 wght=400:650)
  local name="$1"; shift
  python3 -m fontTools.varLib.instancer "$DIR/$name.woff2" "$@" -o "$TMP/$name.ttf" >/dev/null
  pyftsubset "$TMP/$name.ttf" --output-file="$DIR/$name.woff2" \
    --flavor=woff2 --layout-features='*' --unicodes="$U"
  echo "  $name.woff2 -> $(($(stat -c%s "$DIR/$name.woff2")/1024)) KB"
}

echo "Subsetting fonts…"
inst fraunces          opsz=48 wght=400:650
inst newsreader        opsz=18 wght=400:700
inst newsreader-italic opsz=18 wght=400:700
inst inter             wght=400:700
rm -rf "$TMP"
echo "Done."
