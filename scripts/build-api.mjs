#!/usr/bin/env node
/**
 * Content → static JSON API (REBUILD_PLAN §3).
 *
 * Reads Markdown-with-front-matter from content/ and emits a read-only JSON API
 * into apps/web/static/api/v1/, which adapter-static then ships alongside the
 * site. The edition is a build-time variable:  EDITION=ie node scripts/build-api.mjs
 *
 * Output map (mirrors the eight legacy endpoints, all reads):
 *   api/v1/index.json                 → setting + about + available months (getdata index)
 *   api/v1/days/<YYYY>/<MM>.json       → all days in a month (bulk getdata)
 *   api/v1/days/<YYYY>-<MM>-<DD>.json  → one day
 *   api/v1/prayers.json                → prayerCollection
 *   api/v1/hymns.json                  → hymnsSongs
 *   api/v1/order-of-mass.json          → orderMassCollection
 *   api/v1/manifest.json               → flat file list for the service-worker precache
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EDITION = process.env.EDITION ?? "in";
if (EDITION !== "in" && EDITION !== "ie") {
  console.error(`Unknown EDITION "${EDITION}" (expected "in" or "ie")`);
  process.exit(1);
}

const edition = JSON.parse(readFileSync(join(ROOT, "editions", `${EDITION}.json`), "utf8"));
const OUT = join(ROOT, "apps", "web", "static", "api", "v1");

/** Recursively collect *.md files under a directory (empty if it doesn't exist). */
function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

function readDoc(file) {
  const { data, content } = matter(readFileSync(file, "utf8"));
  return { data, body: content.trim(), file };
}

/** Turn a possibly-null audio path into an absolute R2 URL. */
function audioUrl(path) {
  return path ? `${edition.audioBaseUrl}/${path.replace(/^\/+/, "")}` : null;
}

function write(relPath, obj) {
  const full = join(OUT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(obj, null, 2));
  return relPath;
}

const emitted = [];

// ---- Days -----------------------------------------------------------------
const dayDocs = walk(join(ROOT, "content", EDITION, "days"))
  .map(readDoc)
  .filter((d) => d.data?.date)
  .sort((a, b) => String(a.data.date).localeCompare(String(b.data.date)));

const months = new Map(); // "YYYY/MM" -> day[]
for (const doc of dayDocs) {
  const date = String(doc.data.date);
  const day = {
    date,
    edition: EDITION,
    translation: doc.data.translation ?? edition.translation,
    season: doc.data.season ?? null,
    liturgicalColor: doc.data.liturgicalColor ?? null,
    celebration: doc.data.celebration ?? null,
    psalterWeek: doc.data.psalterWeek ?? null,
    sections: (doc.data.sections ?? []).map((s) => ({
      key: s.key,
      title: s.title,
      ref: s.ref ?? null,
      audio: audioUrl(s.audio ?? null),
      body: (s.body ?? "").trim()
    }))
  };
  emitted.push(write(`days/${date}.json`, day));
  const [y, m] = date.split("-");
  const key = `${y}/${m}`;
  if (!months.has(key)) months.set(key, []);
  months.get(key).push(day);
}
for (const [key, days] of months) emitted.push(write(`days/${key}.json`, { month: key, days }));

// ---- Shared collections ---------------------------------------------------
function collection(subdir) {
  return walk(join(ROOT, "content", "shared", subdir))
    .map(readDoc)
    .map((d) => ({
      ...d.data,
      audio: audioUrl(d.data.audio ?? null),
      body: d.body
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

const prayers = collection("prayers");
const hymns = collection("hymns");
const orderOfMass = collection("order-of-mass");
emitted.push(write("prayers.json", { items: prayers }));
emitted.push(write("hymns.json", { items: hymns }));
emitted.push(write("order-of-mass.json", { items: orderOfMass }));

// ---- Search index ---------------------------------------------------------
const strip = (s) => (s ?? "").replace(/<[^>]+>/g, " ").replace(/[*_#>`]/g, " ").replace(/\s+/g, " ").trim();
const searchItems = [];
for (const doc of dayDocs) {
  const d = doc.data;
  const text = (d.sections ?? []).map((s) => `${s.title} ${s.ref ?? ""} ${s.body ?? ""}`).join(" ");
  searchItems.push({
    type: "Reading",
    title: d.celebration ?? String(d.date),
    sub: String(d.date),
    text: strip(text),
    url: `${String(d.date).replaceAll("-", "/")}/`
  });
}
for (const p of prayers) searchItems.push({ type: "Prayer", title: p.title, sub: p.category ?? "", text: strip(p.body), url: "prayers/" });
for (const h of hymns) searchItems.push({ type: "Hymn", title: h.title, sub: h.composer ?? "", text: h.title, url: "hymns/" });
for (const o of orderOfMass) searchItems.push({ type: "Order of Mass", title: o.title, sub: "", text: strip(o.body), url: "order-of-mass/" });
emitted.push(write("search.json", { items: searchItems }));

// ---- Index + manifest -----------------------------------------------------
emitted.push(
  write("index.json", {
    edition: {
      id: edition.id,
      name: edition.name,
      country: edition.country,
      translation: edition.translation,
      locale: edition.locale,
      accent: edition.theme?.accent ?? null
    },
    months: [...months.keys()].sort(),
    dates: dayDocs.map((d) => String(d.data.date)),
    days: dayDocs.length,
    // Mirrors the legacy /setting endpoint; wire real values in at release time.
    setting: { forceUpdate: false }
  })
);

const manifest = emitted.map((p) => `/api/v1/${p}`).sort();
write("manifest.json", { files: manifest });

console.log(
  `[build-api] EDITION=${EDITION} → ${dayDocs.length} day(s), ` +
    `${months.size} month(s), ${emitted.length + 1} file(s) in ${relative(ROOT, OUT)}`
);
