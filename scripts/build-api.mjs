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
 *   api/v1/days/<YYYY>-<MM>-<DD>.json  → one day
 *   api/v1/calendar.json               → date → season/colour/celebration, for the month grid
 *   api/v1/prayers.json                → prayerCollection
 *   api/v1/hymns.json                  → hymnsSongs
 *   api/v1/order-of-mass.json          → orderMassCollection
 *   api/v1/manifest.json               → core endpoints + day list for the service worker
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
  // Minified: nothing reads these by eye, and the indentation was a fifth of
  // the API's size on disk. Pretty-print with API_PRETTY=1 when debugging.
  writeFileSync(full, JSON.stringify(obj, null, process.env.API_PRETTY ? 2 : 0));
  return relPath;
}

// Saint portraits resolved offline by scripts/fetch-saint-images.mjs. Folded
// in here so the app never has to reach Wikimedia at runtime.
let saintImages = {};
try {
  saintImages = JSON.parse(readFileSync(join(ROOT, "content", "saints.json"), "utf8"));
} catch {
  /* not resolved yet — the Saint page falls back to a typographic medallion */
}

// Start from an empty directory. Without this, files the build stopped
// emitting — the old per-month bundles, days dropped from the content set —
// survived in place and shipped forever.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

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
    // Section extras (saintName, saintImage, saintYears, saintFeast,
    // saintPatronage, …) are passed straight through so the Saint page can
    // render a dossier without a second content type.
    sections: (doc.data.sections ?? []).map(({ key, title, ref, audio, body, ...rest }) => {
      const section = {
        ...rest,
        key,
        title,
        ref: ref ?? null,
        audio: audioUrl(audio ?? null),
        body: (body ?? "").trim()
      };
      const art = key === "saint" && rest.saintName ? saintImages[String(rest.saintName).trim()] : null;
      if (art?.image) {
        section.saintImage = art.image;
        section.saintCredit = [art.artist, art.licence].filter(Boolean).join(" · ");
        section.saintSource = art.page ?? null;
      }
      return section;
    })
  };
  emitted.push(write(`days/${date}.json`, day));
  const [y, m] = date.split("-");
  const key = `${y}/${m}`;
  if (!months.has(key)) months.set(key, []);
  months.get(key).push(day);
}
// Month bundles used to be emitted here. Nothing ever requested them and they
// duplicated every day's body, so they cost 13 MB of the API for nothing.
// `months` is still tracked because index.json advertises the range.

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
  // Index the opening of each section rather than the whole thing: enough to
  // match on, at a twentieth of the weight.
  const text = (d.sections ?? [])
    .map((s) => `${s.title} ${s.ref ?? ""} ${strip(s.body ?? "").slice(0, 220)}`)
    .join(" ");
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

// ---- Saints index ---------------------------------------------------------
// Drives the "find a saint" search, so the Saint page can look one up without
// pulling every day's JSON.
const saints = [];
for (const doc of dayDocs) {
  const s = (doc.data.sections ?? []).find((x) => x.key === "saint");
  const name = (s?.saintName ?? "").toString().trim();
  if (!name) continue;
  const art = saintImages[name];
  saints.push({
    date: String(doc.data.date),
    name,
    image: art?.image ?? null,
    blurb: strip(s.body ?? "").slice(0, 160)
  });
}
emitted.push(write("saints.json", { items: saints }));

// ---- Calendar ribbon ------------------------------------------------------
// One compact row per day so the month grid can tint each cell by its
// liturgical colour without fetching 30 day files. Kept deliberately tiny —
// the whole three-year range is ~90 KB, small enough to precache.
const calendar = {};
for (const doc of dayDocs) {
  const d = doc.data;
  calendar[String(d.date)] = {
    s: d.season ?? null,
    c: d.liturgicalColor ?? null,
    t: d.celebration ?? null
  };
}
emitted.push(write("calendar.json", { days: calendar }));

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

// The manifest is split rather than flat because the service worker used to
// `addAll` the whole thing: 1,138 files and 38 MB pulled down on first visit,
// most of it archive nobody had asked for. `core` is the handful of small
// endpoints worth having before the network drops; days are named, not listed
// as URLs, so the worker can fetch a window around today and a month on demand.
const dayPaths = new Set(dayDocs.map((d) => `days/${String(d.data.date)}.json`));
const core = emitted.filter((p) => !dayPaths.has(p) && p !== "search.json").map((p) => `/api/v1/${p}`).sort();
write("manifest.json", {
  core,
  search: "/api/v1/search.json",
  dates: dayDocs.map((d) => String(d.data.date))
});

console.log(
  `[build-api] EDITION=${EDITION} → ${dayDocs.length} day(s), ` +
    `${months.size} month(s), ${emitted.length + 1} file(s) in ${relative(ROOT, OUT)}`
);
