import type { PageLoad } from "./$types";
import { getDay } from "$lib/api";

export const load: PageLoad = async ({ params, fetch }) => {
  const date = `${params.year}-${params.month}-${params.day}`;
  const day = await getDay(fetch, date);
  return { day };
};
