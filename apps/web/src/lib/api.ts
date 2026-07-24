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

/** Render an authored markdown body to HTML, preserving inline semantic spans. */
export function renderBody(md: string): string {
  return marked.parse(md ?? "", { async: false }) as string;
}

async function getJson<T>(fetchFn: typeof fetch, path: string): Promise<T> {
  const res = await fetchFn(`${base}/api/v1/${path}`);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

export const getIndex = (f: typeof fetch) => getJson<ApiIndex>(f, "index.json");
export const getDay = (f: typeof fetch, date: string) => getJson<Day>(f, `days/${date}.json`);
export const getCollection = (f: typeof fetch, name: string) =>
  getJson<{ items: CollectionItem[] }>(f, `${name}.json`).then((r) => r.items);
