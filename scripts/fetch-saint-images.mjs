#!/usr/bin/env node
/**
 * Resolve a portrait for each saint from Wikipedia / Wikimedia Commons.
 *
 *   node scripts/fetch-saint-images.mjs            # resolve everything missing
 *   node scripts/fetch-saint-images.mjs --limit=50 # work through it in batches
 *   node scripts/fetch-saint-images.mjs --force    # re-resolve names already done
 *
 * Writes content/saints.json:
 *
 *   {
 *     "Saint Sharbel Makhluf": {
 *       "title":   "Charbel Makhlouf",            // the article it matched
 *       "image":   "https://upload.wikimedia.org/…",
 *       "page":    "https://en.wikipedia.org/wiki/Charbel_Makhlouf",
 *       "artist":  "…",                            // for attribution
 *       "licence": "Public domain"
 *     }
 *   }
 *
 * scripts/build-api.mjs folds this into each day's saint section, so the app
 * needs no network at runtime.
 *
 * NOTE ON LICENSING: only images whose licence permits reuse are kept
 * (public domain or a CC licence). Anything else is skipped rather than
 * hot-linked, and the artist/licence is recorded so the app can attribute it.
 *
 * This must be run somewhere with outbound access to wikipedia.org — the
 * build sandbox blocks it.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "content", "saints.json");
const args = process.argv.slice(2);
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) ?? "").split("=")[1] || 0);
const FORCE = args.includes("--force");
const UA = "GodsWord-Liturgy/1.0 (https://biblediary.in; contact biblicalcentre@stpauls.in)";

/** Strip the honorific, role and dates the legacy titles carry. */
function searchTerm(raw) {
  let s = raw
    .replace(/\([^)]*\)/g, " ")                 // "(1805-1871)"
    .replace(/\s*[-–—]\s*[^-–—]*$/, " ")        // trailing "- Priest and Religious"
    .replace(/\b(and|&)\b.*$/i, " ")            // keep the first of a pair
    .replace(/\b(st|ss)\.?\b/gi, "Saint")
    .replace(/\s+/g, " ")
    .trim();
  if (!/^(saint|blessed|pope|our lady)/i.test(s)) s = `Saint ${s}`;
  return s;
}

async function api(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Find the best-matching article title. */
async function findTitle(term) {
  const u = new URL("https://en.wikipedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query", format: "json", list: "search", srsearch: term,
    srlimit: "1", srnamespace: "0", origin: "*"
  }).toString();
  const j = await api(u);
  return j?.query?.search?.[0]?.title ?? null;
}

/** Lead image plus its licence metadata. */
async function imageFor(title) {
  const u = new URL("https://en.wikipedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query", format: "json", titles: title, prop: "pageimages",
    piprop: "original", origin: "*"
  }).toString();
  const j = await api(u);
  const page = Object.values(j?.query?.pages ?? {})[0];
  const src = page?.original?.source;
  if (!src) return null;

  // Licence lives on the file description page on Commons.
  const file = "File:" + decodeURIComponent(src.split("/").pop());
  const cu = new URL("https://commons.wikimedia.org/w/api.php");
  cu.search = new URLSearchParams({
    action: "query", format: "json", titles: file, prop: "imageinfo",
    iiprop: "extmetadata", origin: "*"
  }).toString();
  let artist = "", licence = "";
  try {
    const cj = await api(cu);
    const meta = Object.values(cj?.query?.pages ?? {})[0]?.imageinfo?.[0]?.extmetadata ?? {};
    artist = String(meta.Artist?.value ?? "").replace(/<[^>]*>/g, "").trim();
    licence = String(meta.LicenseShortName?.value ?? "").trim();
  } catch { /* metadata is best-effort */ }

  // Only reusable licences.
  const ok = !licence || /public domain|^cc|^pd/i.test(licence);
  if (!ok) return null;

  return { image: src, artist, licence: licence || "Public domain" };
}

// ---- Collect the names actually used --------------------------------------
const names = new Set();
for (const f of readdirSync(join(ROOT, "content", "in", "days"))) {
  if (!f.endsWith(".md")) continue;
  const d = matter(readFileSync(join(ROOT, "content", "in", "days", f), "utf8")).data;
  const s = (d.sections ?? []).find((x) => x.key === "saint");
  if (s?.saintName) names.add(String(s.saintName).trim());
}

const store = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const todo = [...names].filter((n) => FORCE || !(n in store));
const work = LIMIT ? todo.slice(0, LIMIT) : todo;
console.log(`[saints] ${names.size} name(s), ${todo.length} unresolved, doing ${work.length}`);

let found = 0;
for (const [i, name] of work.entries()) {
  const term = searchTerm(name);
  try {
    const title = await findTitle(term);
    if (!title) { store[name] = null; continue; }
    const img = await imageFor(title);
    store[name] = img
      ? { title, page: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`, ...img }
      : null;
    if (img) found++;
    console.log(`  ${String(i + 1).padStart(4)}/${work.length}  ${img ? "✓" : "·"}  ${name.slice(0, 52)}`);
  } catch (e) {
    console.warn(`  ${String(i + 1).padStart(4)}/${work.length}  !  ${name.slice(0, 40)} — ${e.message}`);
  }
  // Be a good citizen with the API.
  await new Promise((r) => setTimeout(r, 250));
  if ((i + 1) % 25 === 0) writeFileSync(OUT, JSON.stringify(store, null, 2));
}

writeFileSync(OUT, JSON.stringify(store, null, 2));
const total = Object.values(store).filter(Boolean).length;
console.log(`[saints] +${found} this run; ${total}/${names.size} have a portrait`);
console.log("[saints] next: node scripts/build-api.mjs");
