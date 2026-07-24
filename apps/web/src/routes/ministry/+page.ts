import type { PageLoad } from "./$types";
import { getIndex, getDay, getCollection, todayISO, nearestDate } from "$lib/api";

export const load: PageLoad = async ({ fetch }) => {
  const index = await getIndex(fetch);
  const date = nearestDate(index.dates ?? [], todayISO());
  const [day, prayers] = await Promise.all([
    date ? getDay(fetch, date) : Promise.resolve(null),
    getCollection(fetch, "prayers")
  ]);
  return { day, prayers, index };
};
