import adapter from "@sveltejs/adapter-static";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Which days get prerendered.
 *
 * Prerendering all 1,096 days produced a 124 MB build: 69 MB of HTML for an
 * archive almost nobody opens, and every deploy had to upload it. We prerender
 * a year around today instead — everything a reader or a search engine is
 * plausibly after — and let the rest render on the client from the day JSON,
 * which ships either way. Set PRERENDER_ALL=1 to restore the full sweep.
 */
const BACK_DAYS = Number(process.env.PRERENDER_BACK_DAYS ?? 60);
const AHEAD_DAYS = Number(process.env.PRERENDER_AHEAD_DAYS ?? 305);

function dayEntries() {
  let dates = [];
  try {
    const manifest = JSON.parse(
      readFileSync(new URL("./static/api/v1/manifest.json", import.meta.url), "utf8")
    );
    dates = manifest.dates ?? [];
  } catch {
    // API not built yet (a bare `vite build`). Nothing to enumerate; the
    // crawler still can't reach day pages, so the build simply has no days.
    return [];
  }
  if (process.env.PRERENDER_ALL === "1") return dates.map(toEntry);

  const now = Date.now();
  const lo = now - BACK_DAYS * 86_400_000;
  const hi = now + AHEAD_DAYS * 86_400_000;
  const inWindow = dates.filter((d) => {
    const t = Date.parse(d);
    return t >= lo && t <= hi;
  });
  // A build run long after the last authored day would otherwise prerender
  // nothing at all; keep the tail so the site still has static day pages.
  const chosen = inWindow.length ? inWindow : dates.slice(-90);
  return chosen.map(toEntry);
}

const toEntry = (d) => `/${d.replaceAll("-", "/")}`;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // Static hosting on Cloudflare Pages (REBUILD_PLAN §3).
    adapter: adapter({
      fallback: "404.html"
    }),
    // Set BASE_PATH=/biblediary- in CI for GitHub project Pages; empty locally.
    paths: {
      base: process.env.BASE_PATH || ""
    },
    alias: {
      $editions: fileURLToPath(new URL("../../editions", import.meta.url))
    },
    prerender: {
      // Fail loudly on broken internal links so a bad build can't ship.
      handleHttpError: "fail",
      // Crawling is off because a day page links to the next and previous day:
      // one entry drags in the whole 1,096-day chain. "*" still covers every
      // route that takes no parameters.
      crawl: false,
      entries: ["*", ...dayEntries()]
    }
  }
};

export default config;
