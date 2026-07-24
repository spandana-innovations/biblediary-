# Deploying to Cloudflare

The build defaults to the **India** edition at a **root** base path when no env
vars are set — exactly what a Cloudflare root domain serves (not the
`/biblediary-/` subpath GitHub Pages forces). **Do not set `BASE_PATH`** on
Cloudflare, or assets 404.

## Option 0 — GitHub Action → Cloudflare (current setup)

`.github/workflows/deploy.yml` builds the site and runs `wrangler deploy` on
every push to `main`. This is fully automatic once two **repository secrets**
are added (GitHub → repo **Settings → Secrets and variables → Actions → New
repository secret**):

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → **My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → right sidebar **Account ID** |

The Worker `name` in `wrangler.jsonc` is `biblediary`, so the deploy updates the
existing Worker in place. Trigger a run by pushing to `main`, or from the
**Actions** tab → *Deploy to Cloudflare* → **Run workflow**. This replaces the
need for the dashboard-side Git build in Option A (leave that disconnected to
avoid double deploys).

## Option A — Worker with static assets (`*.workers.dev`)

`wrangler.jsonc` at the repo root configures an **assets-only Worker** (no
server code) that serves `apps/web/build`. In the Worker's
**Settings → Builds** (Git-connected Workers Builds):

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | *(blank — repo root)* |

`wrangler deploy` reads `wrangler.jsonc` and uploads the built assets.
`not_found_handling: "404-page"` serves the generated `404.html` for unknown
paths. The Worker `name` must match the existing Worker (`biblediary`) so it
updates in place rather than creating a new one.

> The default "Hello World" Worker means the build/deploy wasn't wired to this
> repo yet — set the build + deploy commands above and redeploy.

## Option B — Cloudflare Pages (`*.pages.dev`)

The build defaults to the India edition at a root base path when no env vars are
set — which is exactly what Cloudflare Pages serves.

## Cloudflare Pages build settings (dashboard)

| Setting | Value |
|---|---|
| Production branch | `claude/new-session-7dcvwk` (until this work merges to `main`) |
| Framework preset | None |
| Build command | `pnpm build` |
| Build output directory | `apps/web/build` |
| Root directory | *(leave blank — repo root)* |

- pnpm is auto-detected from `pnpm-lock.yaml`; the version comes from
  `packageManager` in `package.json`. Node is pinned to 22 via `.nvmrc`.
- No environment variables are required for the India edition at root.
  For a second project serving the **Ireland** edition, set
  `EDITION=ie` and `VITE_EDITION=ie`.
- `pnpm.onlyBuiltDependencies` in `package.json` pre-approves esbuild's build
  script so installs are non-interactive in CI.

## Audio (R2) — later

Per-section audio is served from the URL in each edition's config
(`editions/in.json` → `audioBaseUrl`), which `scripts/build-api.mjs` bakes into
the API as absolute URLs. When audio is added, point `audioBaseUrl` at the R2
bucket's public URL (or a custom domain in front of R2). No Worker binding is
needed — the site is static and links the files directly. R2's zero egress is
why audio lives there rather than in the Pages bundle (REBUILD_PLAN §5).
