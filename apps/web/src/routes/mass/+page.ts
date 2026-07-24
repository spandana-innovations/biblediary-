import type { PageLoad } from "./$types";
import { getIndex, getDay, todayISO, nearestDate } from "$lib/api";

/**
 * Mass Mode always opens on today's liturgy (or the nearest day we hold), so
 * the page is prerendered against the build-time "today" and then corrected
 * client-side if the device date has moved on.
 */
export const load: PageLoad = async ({ fetch }) => {
  const index = await getIndex(fetch);
  const date = nearestDate(index.dates ?? [], todayISO());
  const day = date ? await getDay(fetch, date) : null;
  return { day, index };
};
