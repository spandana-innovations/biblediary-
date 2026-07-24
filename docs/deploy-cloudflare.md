# Deploying to Cloudflare Pages

The build defaults to the **India** edition at a **root** base path when no env
vars are set — which is exactly what Cloudflare Pages serves (a domain root, not
the `/biblediary-/` subpath GitHub Pages forces). So the Pages project needs
almost no configuration.

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
