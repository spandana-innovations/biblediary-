/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

/**
 * Offline service worker.
 *
 * Precaching is deliberately narrow. An earlier version pulled the entire JSON
 * API on install — 1,138 files, 38 MB — so opening the app once on mobile data
 * downloaded the whole 2023–2026 archive before showing a word. Now install
 * takes the shell plus a fortnight of readings (~1 MB); everything else is
 * cached as it is read, and a month can be pulled down deliberately from
 * Settings.
 *
 * Runtime strategy: cache-first for same-origin GETs with background
 * revalidation for the API, network fallback that fills the cache, and the
 * cached shell for navigations when offline.
 */
import { base, build, files, prerendered, version } from "$service-worker";

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `godsword-${version}`;

/** Days either side of today taken on install. Two weeks of liturgy is ~1 MB. */
const WINDOW_DAYS = 7;

/** `/2026/07/25/` — a prerendered day page, ~60 KB of HTML each. */
const DAY_PAGE = /\/\d{4}\/\d{2}\/\d{2}\/?$/;

/**
 * The shell is the code, the assets and the pages that aren't days. Day pages
 * are excluded deliberately: a few hundred are prerendered, and taking them all
 * would put 13 MB of HTML back into the install we just removed. They cache as
 * they're visited, and the SPA fallback renders any uncached day from its JSON.
 */
const SHELL = [
  ...build,
  // `files` is everything under static/, and the generated JSON API lives
  // there — so including it wholesale precached all 1,096 days regardless of
  // what the manifest said. The API is cached from the manifest below.
  ...files.filter((f) => !f.includes("/api/")),
  // Prerendering records each page's fetched dependencies here too, so this
  // list carries a day's JSON for every day page as well as the page itself.
  ...prerendered.filter((p) => !DAY_PAGE.test(p) && !p.includes("/api/")),
  // The adapter's fallback page isn't in any of those lists, and it's what an
  // offline navigation to an unvisited day has to be served.
  `${base}/404.html`
];

const api = (path: string) => `${base}${path}`;
const dayUrl = (date: string) => `${base}/api/v1/days/${date}.json`;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The dates within ±WINDOW_DAYS of today, intersected with what exists. */
function windowDates(dates: string[]): string[] {
  const now = Date.parse(todayISO());
  const span = WINDOW_DAYS * 86_400_000;
  const near = dates.filter((d) => Math.abs(Date.parse(d) - now) <= span);
  if (near.length) return near;
  // The archive may not cover today at all (a stale build, or a date far past
  // the last authored day). Fall back to the closest run of days that exists.
  const sorted = [...dates].sort((a, b) => Math.abs(Date.parse(a) - now) - Math.abs(Date.parse(b) - now));
  return sorted.slice(0, WINDOW_DAYS * 2 + 1);
}

/**
 * Cache a list of URLs without letting one failure abort the batch.
 * `cache.addAll` is all-or-nothing; a single 404 would leave the app with no
 * offline copy at all.
 */
async function cacheEach(cache: Cache, urls: string[]) {
  await Promise.all(
    urls.map(async (u) => {
      try {
        const res = await fetch(u);
        if (res.ok) await cache.put(u, res);
      } catch {
        /* skip — it will be cached on first read instead */
      }
    })
  );
}

async function readManifest(): Promise<{ core: string[]; dates: string[] } | null> {
  try {
    const res = await fetch(api("/api/v1/manifest.json"));
    if (!res.ok) return null;
    const m = (await res.json()) as { core?: string[]; dates?: string[] };
    return { core: m.core ?? [], dates: m.dates ?? [] };
  } catch {
    return null;
  }
}

sw.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cacheEach(cache, SHELL);
      const m = await readManifest();
      if (m) {
        await cacheEach(cache, [api("/api/v1/manifest.json"), ...m.core.map((p) => api(p))]);
        await cacheEach(cache, windowDates(m.dates).map(dayUrl));
      }
      await sw.skipWaiting();
    })()
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await sw.clients.claim();
    })()
  );
});

sw.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // let cross-origin (audio/R2) pass through

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) {
        // Revalidate JSON in the background so content stays fresh.
        if (url.pathname.includes("/api/")) {
          fetch(req).then((r) => r.ok && cache.put(req, r.clone())).catch(() => {});
        }
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res.ok && (url.pathname.includes("/api/") || res.type === "basic")) {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch {
        if (req.mode === "navigate") {
          // 404.html first: it is the adapter's SPA fallback, so the client
          // router reads the real URL and renders that day. The home page
          // would hydrate as the home page whatever address it was served at.
          return (
            (await cache.match(`${base}/404.html`)) ??
            (await cache.match(`${base}/`)) ??
            Response.error()
          );
        }
        return Response.error();
      }
    })()
  );
});

// ---- On-demand offline ----------------------------------------------------
// Settings asks for a month by posting { type: "cache-month", month: "2026-07" }
// and gets progress back on the same port, so the button can show real counts
// instead of an indeterminate spinner.
sw.addEventListener("message", (event) => {
  const data = event.data as { type?: string; month?: string } | null;
  if (!data?.type) return;
  const reply = (msg: unknown) => {
    const port = event.ports?.[0];
    if (port) port.postMessage(msg);
    else event.source?.postMessage?.(msg as never);
  };

  if (data.type === "skip-waiting") {
    sw.skipWaiting();
    return;
  }

  if (data.type === "cache-month" && data.month) {
    const month = data.month;
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const m = await readManifest();
        const dates = (m?.dates ?? []).filter((d) => d.startsWith(month));
        if (!dates.length) {
          reply({ type: "month-done", month, total: 0, cached: 0 });
          return;
        }
        let done = 0;
        for (const d of dates) {
          const u = dayUrl(d);
          try {
            if (!(await cache.match(u))) {
              const res = await fetch(u);
              if (res.ok) await cache.put(u, res);
            }
          } catch {
            /* leave it uncached */
          }
          done++;
          reply({ type: "month-progress", month, total: dates.length, cached: done });
        }
        reply({ type: "month-done", month, total: dates.length, cached: done });
      })()
    );
  }

  if (data.type === "clear-cache") {
    event.waitUntil(
      (async () => {
        for (const key of await caches.keys()) await caches.delete(key);
        reply({ type: "cache-cleared" });
      })()
    );
  }
});
