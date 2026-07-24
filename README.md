# God's Word / Daily Liturgy

A static, edition-aware daily-liturgy platform. One codebase produces two
editions — **God's Word** (India, ESV-CE) and **Daily Liturgy** (Ireland,
Jerusalem Bible) — as SEO-indexable static sites plus a read-only JSON API,
deployable to free infrastructure.

This is the scaffold for the architecture in [`REBUILD_PLAN.md`](./REBUILD_PLAN.md).
See [`CLAUDE.md`](./CLAUDE.md) for the background on the legacy system.

## Layout

```
editions/            Build-time edition config (data in *.json, typed in index.ts)
content/
  shared/            Prayers, hymns, Order of Mass — identical across editions
  in/days/           India daily lectionary (ESV-CE)
  ie/days/           Ireland daily lectionary (Jerusalem Bible)
scripts/build-api.mjs  content/ → static JSON API (apps/web/static/api/v1)
apps/web/            SvelteKit app (adapter-static): day pages, PWA-ready
.github/workflows/   CI matrix — one push builds both editions
```

The edition is a **build-time variable**, not a runtime branch. `content/shared/`
is common; only the daily lectionary differs, and only in Bible translation.

## Develop

```bash
pnpm install

# Build the India edition (site + JSON API)
EDITION=in VITE_EDITION=in pnpm build      # → apps/web/build/

# Ireland edition
EDITION=ie VITE_EDITION=ie pnpm build

# Dev server (regenerates the API, then serves)
EDITION=in VITE_EDITION=in pnpm dev
```

`EDITION` drives the content/API build; `VITE_EDITION` drives the SvelteKit
build. CI sets both from the `[in, ie]` matrix.

## Content model

Each day is a Markdown file with YAML front-matter under `content/<edition>/days/`.
Front-matter carries day metadata (`date`, `season`, `liturgicalColor`,
`celebration`, `psalterWeek`) and a `sections` list; each section has a `key`,
`title`, `ref`, optional `audio` (a path resolved against the edition's R2
bucket), and a Markdown `body`.

Presentational markup from the legacy Word-pasted HTML is **not** carried over.
Meaning is preserved via three semantic classes (see
`content/shared/order-of-mass/`), themed in `apps/web/src/app.css`:

| Class | Meaning | Legacy source |
|---|---|---|
| `.celebrant` | The priest's parts | red `#ba372a` / `#e03e2d` |
| `.rubric` | Stage directions (*"a brief silence"*) | fuchsia |
| `**bold**` → `<strong>` | The congregation's response | `<strong>` |

## Static API

`scripts/build-api.mjs` emits a read-only JSON API mirroring the eight legacy
endpoints (all reads):

| File | Legacy equivalent |
|---|---|
| `api/v1/index.json` | `setting` + available months/dates |
| `api/v1/days/<YYYY>/<MM>.json` | bulk `getdata` for a month |
| `api/v1/days/<YYYY>-<MM>-<DD>.json` | one day |
| `api/v1/prayers.json` | `prayerCollection` |
| `api/v1/hymns.json` | `hymnsSongs` |
| `api/v1/order-of-mass.json` | `orderMassCollection` |
| `api/v1/manifest.json` | service-worker precache list |

## Not yet wired

This scaffold stops at Phase 2 groundwork. Still to do: the SQL→Markdown
content migration (`REBUILD_PLAN` §7), audio in R2, service worker / PWA
(§Phase 3), Capacitor store shells (§Phase 4), Decap CMS (§Phase 5), and the
Cloudflare Pages deploy step in `.github/workflows/build.yml`.
