import type { PageLoad } from "./$types";
import { getCalendar } from "$lib/api";

export const load: PageLoad = async ({ fetch }) => {
  // Loaded here rather than in the component so the prerendered page ships
  // already tinted — the grid never flashes monochrome then repaints.
  try {
    return { calendar: await getCalendar(fetch) };
  } catch {
    return { calendar: {} };
  }
};
