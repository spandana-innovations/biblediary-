import type { PageLoad } from "./$types";
import { getIndex, getDay, todayISO, nearestDate } from "$lib/api";

export const load: PageLoad = async ({ fetch }) => {
  const index = await getIndex(fetch);
  const date = nearestDate(index.dates ?? [], todayISO());
  const day = date ? await getDay(fetch, date) : null;
  return { day, index };
};
