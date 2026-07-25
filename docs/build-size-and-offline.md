# Build size and offline behaviour

Two things used to be quietly expensive: the size of the deployed build, and
how much a first-time visitor downloaded before reading a word. Both are now
bounded deliberately. This note records the levers so they aren't undone by
accident.

## Where it started

| | Before | After |
|---|---:|---:|
| Deployed build | 124 MB | 32 MB |
| JSON API | 38 MB | 17 MB |
| `/search/` page weight | 2.3 MB | 28 KB |
| Service-worker install | ~38 MB, 1,138 files | 2.9 MB, 112 files |
| Prerendered day pages | 1,096 | ~220 |

## The API (`scripts/build-api.mjs`)

- **Month bundles are gone.** `days/<YYYY>/<MM>.json` duplicated every day's
  body and nothing in the app ever fetched one. That alone was 13 MB.
- **The search index stores openings, not bodies.** Each section contributes
  its title, reference and first 220 characters. 11 MB → 2.3 MB, with no
  noticeable loss in what matches.
- **Output is minified.** Set `API_PRETTY=1` to get indented JSON when
  debugging.
- **The output directory is emptied first.** Without that, files the build
  stopped emitting survived in place and shipped forever — which is exactly how
  the dead month bundles lingered.
- **`calendar.json`** is new: one compact row per day (season, colour,
  celebration) so the month grid can tint every cell without fetching thirty day
  files. ~92 KB for the whole three-year range.
- **`manifest.json` is split** into `core` (a handful of small endpoints),
  `search`, and `dates`. It is no longer a flat list of everything, because a
  flat list is what the service worker used to swallow whole.

## Prerendering (`apps/web/svelte.config.js`)

Day pages are prerendered for a window around today — 60 days back, 305 days
forward — instead of all 1,096. Tune with `PRERENDER_BACK_DAYS` /
`PRERENDER_AHEAD_DAYS`, or set `PRERENDER_ALL=1` to restore the full sweep.

`prerender.crawl` is **off**. A day page links to the next and previous day, so
crawling from any single entry drags in the whole chain and defeats the window.
`entries: ["*", …]` still covers every route that takes no parameters.

Days outside the window are not missing — they render on the client from their
JSON via the adapter's `404.html` fallback, which Cloudflare serves for unknown
paths (`not_found_handling: "404-page"` in `wrangler.jsonc`). Verified: a
non-prerendered day loads with the correct title, readings and season colour.
The one cost is the HTTP status: those pages are served as 404, so they are not
worth indexing. If archive SEO becomes a requirement, widen the window rather
than reaching for a redirect rule.

## The service worker (`apps/web/src/service-worker.ts`)

Install now takes the shell plus a fortnight of readings. Three separate things
were pulling the whole archive in, and all three had to be cut:

1. `cache.addAll(manifest.files)` — the obvious one, 38 MB in a single call.
2. **`files` from `$service-worker` is everything under `static/`,** and the
   generated API lives there. Filtering `manifest` alone did nothing until this
   was filtered too; it was still caching all 1,096 day files.
3. **`prerendered` includes each page's fetched dependencies,** so every
   prerendered day page contributed its day JSON as well as its HTML.

Beyond that:

- Precaching uses a per-URL loop, not `cache.addAll`. `addAll` is
  all-or-nothing, so one 404 would leave a visitor with no offline copy at all.
- The offline navigation fallback is `404.html` **before** `/`. It is the SPA
  fallback, so the client router reads the real URL; the home page would
  hydrate as the home page whatever address it was served at.
- `message` handlers: `cache-month` (used by Settings → Offline, replies with
  progress on the MessageChannel port), `clear-cache`, `skip-waiting`.

`WINDOW_DAYS` in the worker controls the install window. Raising it raises
first-visit cost roughly linearly — about 14 KB per day.

## Calendar tinting (`apps/web/src/routes/calendar/+page.svelte`)

Each cell carries its own `data-season`, so `--season-ink` inside the cell is
that day's liturgical colour rather than the page's. The legend collapses
tokens that share a vesture colour, and labels them by what the colour means
(`swatchLabel`) rather than by the day's season text — a red martyr's memorial
in July still has "Ordinary Time" as its season, which would otherwise give the
legend three identical entries.

Day markers are Sundays, computed from the date, plus the handful of days with
an explicit "– Solemnity"/"– Feast" suffix or an all-caps celebration. The
legacy content isn't ranked — only eight of 1,096 days carry a rank — so any
looser text match marks every weekday of Eastertide.
