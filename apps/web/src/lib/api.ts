import { marked } from "marked";

/**
 * Thin typed access to the static JSON API produced by scripts/build-api.mjs.
 * Pages fetch it during prerender (SvelteKit serves static assets to the
 * prerenderer), so the site and the PWA/service-worker share one source.
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

/** Render an authored markdown body to HTML, preserving inline semantic spans. */
export function renderBody(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export async function getIndex(fetchFn: typeof fetch): Promise<ApiIndex> {
  const res = await fetchFn("/api/v1/index.json");
  if (!res.ok) throw new Error(`index.json ${res.status}`);
  return res.json();
}

export async function getDay(fetchFn: typeof fetch, date: string): Promise<Day> {
  const res = await fetchFn(`/api/v1/days/${date}.json`);
  if (!res.ok) throw new Error(`day ${date} ${res.status}`);
  return res.json();
}
