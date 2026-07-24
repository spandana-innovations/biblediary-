/**
 * Maps a day's liturgical season/colour to the `data-season` attribute that
 * app.css themes from (REBUILD_PLAN §8.2). Kept deliberately small — the colour
 * data already exists in the source, this just normalises it.
 */
export type Season =
  | "advent"
  | "christmas"
  | "lent"
  | "easter"
  | "ordinary"
  | "gaudete"
  | "laetare"
  | "feast"
  | "martyr";

/** Normalise free-text season/colour from the content into a theme token. */
export function seasonToken(season?: string | null, color?: string | null): Season {
  const s = (season ?? "").toLowerCase();
  if (s.includes("advent")) return "advent";
  if (s.includes("christmas")) return "christmas";
  if (s.includes("lent")) return "lent";
  if (s.includes("easter")) return "easter";

  const c = (color ?? "").toLowerCase();
  if (c === "red") return "feast";
  if (c === "rose") return "gaudete";
  if (c === "violet" || c === "purple") return "lent";

  return "ordinary";
}
