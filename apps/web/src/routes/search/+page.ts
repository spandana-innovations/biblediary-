import type { PageLoad } from "./$types";
import { getSearch } from "$lib/api";

export const load: PageLoad = async ({ fetch }) => ({ items: await getSearch(fetch) });
