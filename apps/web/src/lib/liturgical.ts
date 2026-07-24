/**
 * Maps a day's season/colour (and celebration) to a `data-season` token that
 * the liturgical colour engine themes from (REDESIGN §3.2). Non-day pages use
 * "neutral" (ivory + gold).
 */
export type Season =
  | "ordinary"
  | "advent"
  | "lent"
  | "easter"
  | "christmas"
  | "passion"
  | "rose"
  | "marian"
  | "neutral";

export function seasonToken(season?: string | null, color?: string | null, celebration?: string | null): Season {
  const s = (season ?? "").toLowerCase();
  const c = (color ?? "").toLowerCase();
  const t = (celebration ?? "").toLowerCase();

  if (/(assumption|immaculate|our lady|blessed virgin|marian|annunciation|nativity of the b|visitation|queenship)/.test(t)) return "marian";
  if (s.includes("advent")) return "advent";
  if (s.includes("lent")) return "lent";
  if (s.includes("christmas")) return "christmas";
  if (s.includes("easter")) return "easter";
  if (c === "rose") return "rose";
  if (c === "red" || /(palm|passion|pentecost|martyr|good friday|holy cross|triumph)/.test(t)) return "passion";
  if (c === "violet" || c === "purple") return "lent";
  return "ordinary";
}

/** Human label for the season, for small-caps metadata. */
export function seasonLabel(tok: Season): string {
  const map: Record<Season, string> = {
    ordinary: "Ordinary Time",
    advent: "Advent",
    lent: "Lent",
    easter: "Eastertide",
    christmas: "Christmastide",
    passion: "Passiontide",
    rose: "Gaudete",
    marian: "Marian Feast",
    neutral: ""
  };
  return map[tok];
}
