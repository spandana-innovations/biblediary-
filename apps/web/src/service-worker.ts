/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

/**
 * Offline service worker (REDESIGN phase 5).
 * Precaches the app shell + prerendered pages on install, and the JSON API's
 * manifest on activate, so the missal opens and reads even without a network.
 * Strategy: cache-first for same-origin GETs, with a network fallback that
 * refreshes the cache; navigations fall back to the cached shell / 404 page.
 */
import { build, files, prerendered, version } from "$service-worker";

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `godsword-${version}`;

// Everything the build knows about up front.
const PRECACHE = [...build, ...files, ...prerendered];

sw.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE);
      // Best-effort: pull the API manifest and precache every JSON endpoint.
      try {
        const res = await fetch("/api/v1/manifest.json");
        if (res.ok) {
          const { files: apiFiles } = (await res.json()) as { files: string[] };
          await cache.addAll(apiFiles);
        }
      } catch {
        /* offline at install — endpoints fill in lazily */
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
        if (url.pathname.startsWith("/api/")) {
          fetch(req).then((r) => r.ok && cache.put(req, r.clone())).catch(() => {});
        }
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res.ok && (url.pathname.startsWith("/api/") || res.type === "basic")) {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch {
        if (req.mode === "navigate") {
          return (await cache.match("/")) ?? (await cache.match("/404.html")) ?? Response.error();
        }
        return Response.error();
      }
    })()
  );
});
