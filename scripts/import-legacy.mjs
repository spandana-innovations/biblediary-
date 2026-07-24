#!/usr/bin/env node
/**
 * Import the legacy production content into content/<edition>/days/*.md.
 *
 * Reads a mysqldump directly — no MySQL server required — and writes one
 * Markdown file per day in the shape scripts/build-api.mjs expects.
 *
 *   node scripts/import-legacy.mjs dump.sql
 *   node scripts/import-legacy.mjs dump.sql.gz --no-clobber
 *   node scripts/import-legacy.mjs dump.sql --edition=ie --table=tbl_newcalendar
 *
 * Run the fullest dump first, then any others with --no-clobber to fill gaps.
 * Nothing is written until the whole dump parses, so a failed run leaves the
 * existing content intact.
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
  console.error("Usage: node scripts/import-legacy.mjs <dump.sql[.gz]> [--edition=in] [--table=tbl_calendar] [--no-clobber]");
  process.exit(1);
}

// ---- Column → section mapping ---------------------------------------------
// The live schema uses inconsistent prefixes (`accl_reading_`, `homely_tip`),
// so each section names its own columns rather than deriving them.
const SECTIONS = [
  { key: "first_reading", title: "First Reading", t: "first_reading_title", d: "first_reading_desc", a: "first_reading_audio" },
  { key: "responsorial_psalm", title: "Responsorial Psalm", t: "responsorial_psalm_title", d: "responsorial_psalm_desc", a: "responsorial_psalm_audio" },
  { key: "second_reading", title: "Second Reading", t: "second_reading_title", d: "second_reading_desc", a: "second_reading_audio" },
  { key: "acclamation", title: "Gospel Acclamation", t: "accl_reading_title", d: "accl_reading_desc", a: "accl_reading_audio" },
  { key: "gospel", title: "Gospel", t: "gospel_reading_title", d: "gospel_reading_desc", a: "gospel_reading_audio" },
  { key: "homily", title: "Homily Tip", t: "homely_tip_title", d: "homely_tips", a: null },
  { key: "reflection", title: "Reflection", t: "reflection_reading_title", d: "reflection_reading_desc", a: "reflection_reading_audio" },
  { key: "saint", title: "Saint of the Day", t: "saintofthe_day_title", d: "saintofthe_day_desc", a: "saintofthe_day_audio" },
  { key: "intercessions", title: "Intercessions", t: "intercessions_reading_title", d: "intercessions_reading_desc", a: "intercessions_reading_audio" }
];

/** `colors` is a numeric code; rows may list alternatives ("2,4"). */
const COLOUR_CODE = { 1: "red", 2: "green", 3: "violet", 4: "white", 5: "rose" };

// ---- Minimal SQL dump reader ----------------------------------------------
function* splitRows(payload) {
  let cur = [], buf = "", inStr = false, esc = false, depth = 0;
  for (let i = 0; i < payload.length; i++) {
    const c = payload[i];
    if (esc) { buf += c; esc = false; continue; }
    if (inStr) {
      if (c === "\\") { buf += c; esc = true; continue; }
      if (c === "'") { inStr = false; continue; }
      buf += c; continue;
    }
    if (c === "'") { inStr = true; continue; }
    if (c === "(") { if (depth++ === 0) { cur = []; buf = ""; continue; } }
    if (c === ")") { if (--depth === 0) { cur.push(buf); yield cur; buf = ""; continue; } }
    if (c === "," && depth === 1) { cur.push(buf); buf = ""; continue; }
    if (depth === 1) buf += c;
  }
}

const unesc = (s) =>
  s === "NULL" ? null
    : s.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
       .replace(/\\0/g, "").replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");

console.log(`[import] reading ${dumpPath}`);
const rawBuf = readFileSync(dumpPath);
const sql = (rawBuf[0] === 0x1f && rawBuf[1] === 0x8b ? gunzipSync(rawBuf) : rawBuf).toString("utf8");

// Backticks are required, not optional: `tbl_calendar` is a prefix of
// `tbl_calendar_old`, and a loose pattern silently pulls in the archive table.
const create = sql.match(new RegExp("CREATE TABLE `" + TABLE + "`\\s*\\(([\\s\\S]*?)\\n\\)\\s*ENGINE", "i"));
if (!create) { console.error(`[import] no CREATE TABLE for ${TABLE}`); process.exit(1); }
const columns = [...create[1].matchAll(/^\s*`([^`]+)`\s+/gm)].map((m) => m[1]);
console.log(`[import] ${TABLE}: ${columns.length} columns`);

const idx = Object.fromEntries(columns.map((c, i) => [c, i]));
const records = [];
for (const m of sql.matchAll(new RegExp("INSERT INTO `" + TABLE + "`[^V]*VALUES\\s*([\\s\\S]*?);\\s*(?:\\n|$)", "gi"))) {
  for (const raw of splitRows(m[1])) {
    if (raw.length < columns.length) continue;
    records.push(raw.map((v) => unesc(v.trim())));
  }
}
console.log(`[import] parsed ${records.length} row(s)`);
if (!records.length) { console.error("[import] no rows — nothing written"); process.exit(1); }

// ---- HTML → Markdown-ish, preserving liturgical meaning --------------------
/**
 * The bodies are editor HTML accumulated over years. Crucially, the inline
 * colours are NOT semantic: every swatch in the TinyMCE palette has been used
 * for the same handful of labels. Meaning lives in the LABEL TEXT, so that is
 * what we key on — colour is discarded as editorial noise.
 */
const LABELS = [
  { re: /^celebrant\s*:?$/i, cls: "celebrant" },
  { re: /^(response|reponse|resopnse|resonse|esponse|respose)\s*:?$/i, cls: "resp-label" },
  { re: /^(narrator|jesus|crowd|pilate|peter|disciples|voice|reader|all)\s*:?$/i, cls: "speaker" },
  { re: /^(reflection|life\s+messages?|the\s+context|the\s+parable|context|application)\s*:?$/i, cls: "subhead" }
];

// HTML4 named entities, latin-1 range plus the punctuation the editors used.
const ENTS = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", sbquo: "‚", bdquo: "„",
  mdash: "—", ndash: "–", hellip: "…", bull: "•", middot: "·", dagger: "†",
  laquo: "«", raquo: "»", lsaquo: "‹", rsaquo: "›", prime: "′", Prime: "″",
  deg: "°", plusmn: "±", frac12: "½", frac14: "¼", times: "×", divide: "÷",
  copy: "©", reg: "®", trade: "™", sect: "§", para: "¶", not: "¬", shy: "",
  iexcl: "¡", iquest: "¿", cent: "¢", pound: "£", euro: "€", yen: "¥", curren: "¤",
  aacute: "á", agrave: "à", acirc: "â", auml: "ä", atilde: "ã", aring: "å", aelig: "æ",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë",
  iacute: "í", igrave: "ì", icirc: "î", iuml: "ï",
  oacute: "ó", ograve: "ò", ocirc: "ô", ouml: "ö", otilde: "õ", oslash: "ø",
  uacute: "ú", ugrave: "ù", ucirc: "û", uuml: "ü",
  ntilde: "ñ", ccedil: "ç", yacute: "ý", yuml: "ÿ", szlig: "ß", thorn: "þ", eth: "ð",
  Aacute: "Á", Agrave: "À", Acirc: "Â", Auml: "Ä", Atilde: "Ã", Aring: "Å", AElig: "Æ",
  Eacute: "É", Egrave: "È", Ecirc: "Ê", Euml: "Ë",
  Iacute: "Í", Igrave: "Ì", Icirc: "Î", Iuml: "Ï",
  Oacute: "Ó", Ograve: "Ò", Ocirc: "Ô", Ouml: "Ö", Otilde: "Õ", Oslash: "Ø",
  Uacute: "Ú", Ugrave: "Ù", Ucirc: "Û", Uuml: "Ü",
  Ntilde: "Ñ", Ccedil: "Ç", macr: "¯", uml: "¨", acute: "´", cedil: "¸", sup1: "¹",
  sup2: "²", sup3: "³", ordf: "ª", ordm: "º", micro: "µ", brvbar: "¦", raquo2: "»"
};

/**
 * Bytes of UTF-8 text that were once read as latin-1 come back as "Ã©", "â€™"
 * or "ï¬" (a mangled ﬁ ligature). Round-tripping through latin-1 restores
 * them; we only keep the result if it introduces no replacement characters.
 */
function repairPass(s) {
  // Repair each mangled run on its own. Converting the whole string would
  // destroy the characters that are already correctly encoded, and a single
  // replacement character anywhere would then veto the entire repair.
  return s.replace(/[\u00C0-\u00FF][\u0080-\u00BF]{1,3}/g, (run) => {
    try {
      const fixed = Buffer.from(run, "latin1").toString("utf8");
      return fixed.includes("\uFFFD") ? run : fixed;
    } catch {
      return run;
    }
  });
}

/**
 * Some rows are mangled twice over: an fl ligature survives as "&iuml;&not;"
 * followed by a re-encoded "\u00C2". Unwrapping one layer exposes the next,
 * so iterate to a fixed point (bounded, so it cannot spin).
 */
function repairMojibake(s) {
  let out = s;
  for (let i = 0; i < 4; i++) {
    const next = repairPass(out);
    if (next === out) break;
    out = next;
  }
  return out;
}

const decode = (s) => {
  let out = s
    .replace(/&#(\d+);?/g, (_m, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);?/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z][a-z0-9]*);?/gi, (m, name) => (name in ENTS ? ENTS[name] : m));
  out = repairMojibake(out);
  // Ligatures and control characters break the YAML block scalars we emit.
  out = out.replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl").replace(/ﬀ/g, "ff");
  // Strip C0 and C1 control characters. Anything left in \u0080-\u009F after
  // mojibake repair is a fragment of a broken sequence, never real text,
  // and it makes the YAML block scalars we emit unparseable.
  // A few rows lost the ligature's trailing byte before it reached us, so
  // the run can no longer be decoded. Map the remnant to its letters.
  out = out.replace(/\u00EF\u00AC([\u0080-\u009F]?)/g, (_m, b) =>
    b === "\u0082" ? "fl" : b === "\u0080" ? "ff" : "fi");
  out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  return out;
};

function clean(html) {
  if (!html) return "";
  let s = html;

  // Coloured spans: keep the label semantics, drop the colour.
  s = s.replace(/<span[^>]*color\s*:[^>]*>([\s\S]*?)<\/span>/gi, (_m, inner) => {
    const text = decode(inner.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    const hit = LABELS.find((l) => l.re.test(text.replace(/[:\s]+$/, "")));
    return hit ? `<span class="${hit.cls}">${inner}</span>` : inner;
  });

  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, i) => {
    const inner = i.trim();
    return inner ? `**${inner}**` : "";
  });
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, i) => {
    const inner = i.trim();
    return inner ? `*${inner}*` : "";
  });
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|h[1-6]|li)\s*>/gi, "\n\n");
  s = s.replace(/<li\b[^>]*>/gi, "- ");

  // Drop every remaining tag except the semantic spans built above.
  s = s.replace(/<span(?![^>]*class=")[^>]*>/gi, "");
  s = s.replace(/<(?!\/?span\b)[^>]*>/gi, "");

  s = decode(s);
  // Collapse the artefacts of nested markup.
  s = s.replace(/\*\*\s*\*\*/g, "").replace(/\*\s*\*/g, "");
  s = s.replace(/[ \t]+/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

/**
 * Content safety gate.
 *
 * The legacy database contains injected webshell code (Leaf PHPMailer was
 * found in tbl_calendar_old). Import must never carry that into the app, so
 * any body matching these signatures is dropped and reported rather than
 * written. This is a backstop, not a substitute for cleaning the source.
 */
// Only signals that cannot occur in ordinary English prose. Bare `system(`
// and `exec(` are deliberately absent — "the legal system (mishpat)" is a real
// sentence in one of the homily tips.
const MALWARE = [
  /<\?php|<\?=/i,
  /\$_(?:POST|GET|REQUEST|COOKIE|SERVER|FILES)\s*\[/,
  /\b(?:eval|base64_decode|gzinflate|gzuncompress|str_rot13|shell_exec|passthru|proc_open|popen|create_function)\s*\(/i,
  /\bleaf(?:Clear|Trim|Mailer)\b|\bsession_write_close\b|\bmove_uploaded_file\b/i,
  /\[-(?:email|emailuser|emaildomain|randomstring|randomletters|randomnumber|randommd5|time)-\]/i,
  /\b(?:stripslashes|urldecode|file_get_contents|fwrite|fopen)\s*\(\s*\$/i
];
const quarantined = [];
function isSafe(body, date, key) {
  const hit = MALWARE.find((re) => re.test(body));
  if (!hit) return true;
  quarantined.push({ date, key, pattern: String(hit) });
  return false;
}

const yaml = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const indent = (s, n = 6) => s.split("\n").map((l) => (l.trim() ? " ".repeat(n) + l : "")).join("\n");

function isoDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

/** "17th Week in Ordinary Time" → "Ordinary Time"; "5th Week of Lent" → "Lent". */
function seasonOf(title) {
  const t = (title ?? "").trim();
  if (!t) return null;
  const m = t.match(/\b(?:in|of)\s+(.+)$/i);
  const s = (m ? m[1] : t).trim();
  if (/ordinary/i.test(s)) return "Ordinary Time";
  if (/lent/i.test(s)) return "Lent";
  if (/advent/i.test(s)) return "Advent";
  if (/easter/i.test(s)) return "Easter";
  if (/christmas/i.test(s)) return "Christmas";
  if (/holy\s*week|passion/i.test(s)) return "Holy Week";
  // Solemnities and feasts put their own name here rather than a season
  // ("THE HOLY TRINITY – Solemnity"). Return nothing so the liturgical colour
  // drives the theme instead of an unrecognised season token.
  return null;
}

// ---- Build in memory, then write ------------------------------------------
const out = [];
let skippedEmpty = 0, skippedDate = 0;
for (const r of records) {
  const get = (c) => (c && idx[c] !== undefined ? r[idx[c]] : null);
  const date = isoDate(get("date"));
  if (!date) { skippedDate++; continue; }

  const sections = [];
  for (const s of SECTIONS) {
    const body = clean(get(s.d) ?? "");
    if (!body) continue;
    if (!isSafe(body, date, s.key)) continue;
    let ref = (get(s.t) ?? "").trim();
    if (ref === "NULL" || !ref) ref = "";
    const audio = (get(s.a) ?? "").trim();
    const sec = { key: s.key, title: s.title, ref: ref || null, audio: audio || null, body };
    // The saint's own name lives in the section title column.
    if (s.key === "saint" && ref) sec.saintName = ref;
    sections.push(sec);
  }
  if (!sections.length) { skippedEmpty++; continue; }

  const seasonTitle = (get("saint_title") ?? "").trim();
  const season = seasonOf(seasonTitle);
  const celebration = clean(get("msg_day") ?? "").split("\n")[0].replace(/\*+/g, "").trim();
  const codes = String(get("colors") ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  const colour = codes.length ? COLOUR_CODE[codes[0]] ?? null : null;
  const psalter = parseInt(get("plstr_week") ?? "", 10);

  const fm = [
    "---",
    `date: ${yaml(date)}`,
    `edition: ${EDITION}`,
    season ? `season: ${yaml(season)}` : null,
    seasonTitle ? `week: ${yaml(seasonTitle)}` : null,
    colour ? `liturgicalColor: ${yaml(colour)}` : null,
    celebration ? `celebration: ${yaml(celebration)}` : null,
    Number.isFinite(psalter) && psalter > 0 ? `psalterWeek: ${psalter}` : null,
    "sections:"
  ].filter(Boolean);

  for (const s of sections) {
    fm.push(`  - key: ${s.key}`);
    fm.push(`    title: ${s.title}`);
    if (s.saintName) fm.push(`    saintName: ${yaml(s.saintName)}`);
    fm.push(`    ref: ${s.ref ? yaml(s.ref) : "null"}`);
    fm.push(`    audio: ${s.audio ? yaml(s.audio) : "null"}`);
    fm.push(`    body: |`);
    fm.push(indent(s.body));
  }
  fm.push("---", "");
  out.push({ date, text: fm.join("\n") });
}

// Later rows for the same date win (dumps are ordered oldest-first).
const byDate = new Map();
for (const o of out) byDate.set(o.date, o.text);

const dir = join(ROOT, "content", EDITION, "days");
mkdirSync(dir, { recursive: true });
let written = 0, kept = 0;
for (const [date, text] of byDate) {
  const path = join(dir, `${date}.md`);
  if (NO_CLOBBER && existsSync(path)) { kept++; continue; }
  writeFileSync(path, text);
  written++;
}

console.log(
  `[import] wrote ${written} day file(s)` +
  (kept ? `, kept ${kept} existing` : "") +
  ` — skipped ${skippedEmpty} empty, ${skippedDate} undated`
);
if (quarantined.length) {
  console.warn(`\n[import] ⚠  QUARANTINED ${quarantined.length} section(s) matching malware signatures:`);
  for (const q of quarantined.slice(0, 20)) console.warn(`   ${q.date}  ${q.key}  ${q.pattern}`);
  if (quarantined.length > 20) console.warn(`   … and ${quarantined.length - 20} more`);
  console.warn("   These were NOT written. The source database needs cleaning — see docs/security-hardening.md\n");
}
console.log("[import] next: node scripts/build-api.mjs && pnpm --filter web build");
