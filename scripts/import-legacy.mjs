#!/usr/bin/env node
/**
 * Import the legacy production content into content/<edition>/days/*.md.
 *
 * The live site's daily content lives in `tbl_calendar` (~1,464 rows,
 * 2023-01-01 → 2026-12-31) inside `bettery1_biblediary_godsword.sql`. This
 * reads that dump directly — no MySQL server required — and writes one
 * Markdown file per day in the shape scripts/build-api.mjs expects.
 *
 *   node scripts/import-legacy.mjs path/to/bettery1_biblediary_godsword.sql
 *   node scripts/import-legacy.mjs dump.sql --edition=ie --table=tbl_newcalendar
 *
 * Existing files are overwritten unless --no-clobber is passed. Nothing is
 * written until the whole dump parses, so a failed run leaves content intact.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dumpPath = args.find((a) => !a.startsWith("--"));
const opt = (name, dflt) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : dflt;
};
const EDITION = opt("edition", "in");
const TABLE = opt("table", "tbl_calendar");
const NO_CLOBBER = args.includes("--no-clobber");

if (!dumpPath) {
  console.error(`Usage: node scripts/import-legacy.mjs <dump.sql> [--edition=in] [--table=tbl_calendar] [--no-clobber]`);
  process.exit(1);
}

// ---- Column → section mapping ---------------------------------------------
// Legacy columns are `<name>_title` / `<name>_description` / `<name>_audio`.
// Order here is the order sections appear in the app.
const SECTIONS = [
  { key: "first_reading", col: "first_reading", title: "First Reading" },
  { key: "responsorial_psalm", col: "responsorial_psalm", title: "Responsorial Psalm" },
  { key: "second_reading", col: "second_reading", title: "Second Reading" },
  { key: "acclamation", col: "acclamation", title: "Gospel Acclamation" },
  { key: "gospel", col: "gospel", title: "Gospel" },
  { key: "homily", col: "homily_tips", title: "Homily Tip" },
  { key: "reflection", col: "reflection", title: "Reflection" },
  { key: "saint", col: "saint", title: "Saint of the Day" },
  { key: "intercessions", col: "intercessions", title: "Intercessions" }
];

// ---- Minimal SQL dump reader ----------------------------------------------
/** Split a mysqldump VALUES payload into rows of raw column strings. */
function splitRows(payload) {
  const rows = [];
  let cur = [];
  let buf = "";
  let inStr = false;
  let esc = false;
  let depth = 0;

  for (let i = 0; i < payload.length; i++) {
    const c = payload[i];
    if (esc) { buf += c; esc = false; continue; }
    if (inStr) {
      if (c === "\\") { buf += c; esc = true; continue; }
      if (c === "'") { inStr = false; continue; }
      buf += c;
      continue;
    }
    if (c === "'") { inStr = true; continue; }
    if (c === "(") { if (depth++ === 0) { cur = []; buf = ""; continue; } }
    if (c === ")") {
      if (--depth === 0) { cur.push(buf); rows.push(cur); buf = ""; continue; }
    }
    if (c === "," && depth === 1) { cur.push(buf); buf = ""; continue; }
    if (depth === 1) buf += c;
  }
  return rows;
}

/** Undo mysqldump escaping. */
const unesc = (s) =>
  s === "NULL"
    ? null
    : s
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\0/g, "")
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");

console.log(`[import] reading ${dumpPath}`);
// Dumps are usually handed over gzipped — SQL compresses roughly 10:1.
const raw = readFileSync(dumpPath);
const sql = (raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw).toString("utf8");

// Column order comes from the CREATE TABLE block.
const createRe = new RegExp("CREATE TABLE `?" + TABLE + "`?\\s*\\(([\\s\\S]*?)\\n\\)\\s*ENGINE", "i");
const create = sql.match(createRe);
if (!create) {
  console.error(`[import] could not find CREATE TABLE for ${TABLE} in the dump`);
  process.exit(1);
}
const columns = [...create[1].matchAll(/^\s*`([^`]+)`\s+/gm)].map((m) => m[1]);
console.log(`[import] ${TABLE} has ${columns.length} columns`);

// Gather every INSERT for the table.
const insertRe = new RegExp("INSERT INTO `?" + TABLE + "`?[^V]*VALUES\\s*([\\s\\S]*?);\\s*(?:\\n|$)", "gi");
const records = [];
for (const m of sql.matchAll(insertRe)) {
  for (const raw of splitRows(m[1])) {
    const rec = {};
    columns.forEach((c, i) => (rec[c] = raw[i] === undefined ? null : unesc(raw[i].trim())));
    records.push(rec);
  }
}
console.log(`[import] parsed ${records.length} row(s)`);
if (!records.length) {
  console.error("[import] no rows found — nothing written");
  process.exit(1);
}

// ---- HTML → Markdown-ish ---------------------------------------------------
/**
 * The legacy bodies are Word-pasted HTML. We keep the semantic colour coding
 * (REBUILD_PLAN §7: red = celebrant, fuchsia = rubric, bold = the people's
 * response) and drop the mso-* noise.
 */
function clean(html) {
  if (!html) return "";
  let s = html;

  // Semantic spans, detected by the legacy inline colours.
  s = s.replace(/<span[^>]*color:\s*#?(ba372a|e03e2d|c00000|ff0000|red)[^>]*>([\s\S]*?)<\/span>/gi,
    (_m, _c, inner) => `<span class="celebrant">${inner}</span>`);
  s = s.replace(/<span[^>]*color:\s*#?(ff00ff|e0e|magenta|purple|7030a0)[^>]*>([\s\S]*?)<\/span>/gi,
    (_m, _c, inner) => `<span class="rubric">${inner}</span>`);

  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `**${inner.trim()}**`);
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `*${inner.trim()}*`);
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p\s*>/gi, "\n\n");
  // Drop every remaining tag except the two semantic spans we just built.
  s = s.replace(/<(?!\/?span\b)[^>]+>/gi, "");
  s = s.replace(/<span(?![^>]*class="(?:celebrant|rubric)")[^>]*>/gi, "").replace(/<\/span>/gi, (m, off, str) => {
    // keep closers that match a kept opener; cheap balance check
    return str.slice(0, off).includes('<span class="') ? "</span>" : "";
  });

  const ents = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”", "&mdash;": "—", "&ndash;": "–", "&hellip;": "…" };
  s = s.replace(/&[a-z#0-9]+;/gi, (e) => ents[e.toLowerCase()] ?? e);

  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const yaml = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const indent = (s, n = 6) => s.split("\n").map((l) => (l.trim() ? " ".repeat(n) + l : "")).join("\n");

// Legacy `date` is varchar; normalise the common shapes to YYYY-MM-DD.
function isoDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/); // DD-MM-YYYY
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return null;
}

const COLOURS = { green: "green", violet: "violet", purple: "violet", red: "red", white: "white", rose: "rose", gold: "white", black: "violet" };

// ---- Build files in memory, then write -------------------------------------
const out = [];
let skipped = 0;
for (const r of records) {
  const date = isoDate(r.date ?? r.cal_date ?? r.calendar_date);
  if (!date) { skipped++; continue; }

  const sections = [];
  for (const s of SECTIONS) {
    const body = clean(r[`${s.col}_description`] ?? r[`${s.col}_desc`] ?? r[s.col] ?? "");
    if (!body) continue;
    const ref = (r[`${s.col}_title`] ?? "").trim();
    const audio = (r[`${s.col}_audio`] ?? "").trim();
    sections.push({ key: s.key, title: s.title, ref: ref || null, audio: audio || null, body });
  }
  if (!sections.length) { skipped++; continue; }

  const fm = [
    "---",
    `date: ${yaml(date)}`,
    `edition: ${EDITION}`,
    r.season ? `season: ${yaml(r.season)}` : null,
    r.color || r.colour ? `liturgicalColor: ${yaml(COLOURS[String(r.color ?? r.colour).toLowerCase()] ?? r.color ?? r.colour)}` : null,
    r.title || r.celebration ? `celebration: ${yaml((r.celebration ?? r.title).trim())}` : null,
    r.psalter_week ? `psalterWeek: ${Number(r.psalter_week) || 1}` : null,
    "sections:"
  ].filter(Boolean);

  for (const s of sections) {
    fm.push(`  - key: ${s.key}`);
    fm.push(`    title: ${s.title}`);
    fm.push(`    ref: ${s.ref ? yaml(s.ref) : "null"}`);
    fm.push(`    audio: ${s.audio ? yaml(s.audio) : "null"}`);
    fm.push(`    body: |`);
    fm.push(indent(s.body));
  }
  fm.push("---", "");
  out.push({ date, text: fm.join("\n") });
}

const dir = join(ROOT, "content", EDITION, "days");
mkdirSync(dir, { recursive: true });
let written = 0;
for (const { date, text } of out) {
  const path = join(dir, `${date}.md`);
  if (NO_CLOBBER && existsSync(path)) continue;
  writeFileSync(path, text);
  written++;
}

console.log(`[import] wrote ${written} day file(s) to content/${EDITION}/days (${skipped} row(s) skipped)`);
console.log(`[import] next: node scripts/build-api.mjs && pnpm --filter web build`);
