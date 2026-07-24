import type { LayoutLoad } from "./$types";
import { getIndex } from "$lib/api";

// Fully static site (REBUILD_PLAN §3).
export const prerender = true;
export const trailingSlash = "always";

export const load: LayoutLoad = async ({ fetch }) => {
  const index = await getIndex(fetch);
  return { index };
};
