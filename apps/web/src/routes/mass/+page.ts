import type { PageLoad } from "./$types";
import { getIndex, getDay, getCollection, todayISO, nearestDate } from "$lib/api";

/**
 * Mass Mode always opens on today's liturgy (or the nearest day we hold), so
 * the page is prerendered against the build-time "today" and then corrected
 * client-side if the device date has moved on.
 */
export const load: PageLoad = async ({ fetch }) => {
  const index = await getIndex(fetch);
  const date = nearestDate(index.dates ?? [], todayISO());
  const day = date ? await getDay(fetch, date) : null;
  // The Ordinary — the fixed prayers and responses — so Mass Mode can lay the
  // whole liturgy out in sequence rather than the propers alone. Small enough
  // (a few KB) to load unconditionally, even when the setting is off.
  const ordinary = await getCollection(fetch, "order-of-mass").catch(() => []);
  return { day, index, ordinary };
};
