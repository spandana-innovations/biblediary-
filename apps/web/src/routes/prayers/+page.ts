import type { PageLoad } from "./$types";
import { getCollection } from "$lib/api";

export const load: PageLoad = async ({ fetch }) => ({
  items: await getCollection(fetch, "prayers")
});
