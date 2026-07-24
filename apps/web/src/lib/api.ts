import { marked } from "marked";
import { base } from "$app/paths";

/**
 * Typed access to the static JSON API produced by scripts/build-api.mjs.
 * Paths are prefixed with the SvelteKit base so the app works under a project
 * subpath on GitHub Pages (e.g. /biblediary-/).
 */
export interface Section {
  key: string;
  title: string;
  ref: string | null;
  audio: string | null;
  body: string;
}

export interface Day {
  date: string;
  edition: string;
  translation: string;
  season: string | null;
  liturgicalColor: string | null;
  celebration: string | null;
  psalterWeek: number | null;
  sections: Section[];
}

export interface ApiIndex {
  edition: {
    id: string;
    name: string;
    country: string;
    translation: string;
    locale: string;
    accent: string | null;
  };
  months: string[];
  dates: string[];
  days: number;
  setting: { forceUpdate: boolean };
}

export interface CollectionItem {
  title: string;
  slug?: string;
  category?: string;
  order?: number;
  audio: string | null;
  body: string;
  [k: string]: unknown;
}

/**
 * Tags the renderer is allowed to emit. Everything else is stripped.
 *
 * Bodies come from a database that has carried injected code before, and they
 * are rendered with {@html}, so this is a hard boundary rather than a tidy-up:
 * import sanitises, and this sanitises again at the point of injection.
 */
const ALLOWED = /^<\/?(?:p|br|em|strong|blockquote|ul|ol|li|h[1-6]|hr)(?:\s*\/)?>$/i;
const ALLOWED_SPAN = /^<span class="(?:celebrant|rubric|resp-label|speaker|subhead)">$/;

function sanitize(html: string): string {
  return html.replace(/<[^>]*>/g, (tag) => {
    if (ALLOWED.test(tag)) return tag;
    if (ALLOWED_SPAN.test(tag) || tag === "</span>") return tag;
    return "";
  });
}

/** Render an authored markdown body to HTML, preserving inline semantic spans. */
export function renderBody(md: string): string {
  return sanitize(marked.parse(md ?? "", { async: false }) as string);
}

/** Local calendar date as YYYY-MM-DD (runtime "today"). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The available date closest to `target` (exact match wins), or null if none. */
export function nearestDate(dates: string[], target: string): string | null {
  if (!dates.length) return null;
  if (dates.includes(target)) return target;
  const t = Date.parse(target);
  return [...dates].sort((a, b) => Math.abs(Date.parse(a) - t) - Math.abs(Date.parse(b) - t))[0];
}

async function getJson<T>(fetchFn: typeof fetch, path: string): Promise<T> {
  const res = await fetchFn(`${base}/api/v1/${path}`);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

export interface SearchItem {
  type: string;
  title: string;
  sub: string;
  text: string;
  url: string;
}

/** Group collection items by their `category`, preserving first-seen order. */
export function groupByCategory(items: CollectionItem[]): { category: string; items: CollectionItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, CollectionItem[]>();
  for (const it of items) {
    const cat = (it.category as string) || "Other";
    if (!map.has(cat)) { map.set(cat, []); order.push(cat); }
    map.get(cat)!.push(it);
  }
  return order.map((category) => ({ category, items: map.get(category)! }));
}

export interface SaintEntry {
  date: string;
  name: string;
  image: string | null;
  blurb: string;
}
export const getSaints = (f: typeof fetch) =>
  getJson<{ items: SaintEntry[] }>(f, "saints.json").then((r) => r.items);

export const getIndex = (f: typeof fetch) => getJson<ApiIndex>(f, "index.json");
export const getSearch = (f: typeof fetch) => getJson<{ items: SearchItem[] }>(f, "search.json").then((r) => r.items);
export const getDay = (f: typeof fetch, date: string) => getJson<Day>(f, `days/${date}.json`);
export const getCollection = (f: typeof fetch, name: string) =>
  getJson<{ items: CollectionItem[] }>(f, `${name}.json`).then((r) => r.items);
