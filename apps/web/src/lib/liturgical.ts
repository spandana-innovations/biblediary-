/**
 * Maps a day's season/colour (and celebration) to a `data-season` token that
 * the liturgical colour engine themes from (REDESIGN §3.2). Non-day pages use
 * "neutral" (ivory + gold).
 *
 * The token drives COLOUR only. It is not the day's name: All Souls falls in
 * Ordinary Time but is vested in violet, so it themes violet while still being
 * labelled "Ordinary Time". Use `seasonLabel(token, day.season)` for text.
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
  | "violet"
  | "white"
  | "neutral";

export function seasonToken(season?: string | null, color?: string | null, celebration?: string | null): Season {
  const s = (season ?? "").toLowerCase();
  const c = (color ?? "").toLowerCase();
  const t = (celebration ?? "").toLowerCase();

  if (/(assumption|immaculate|our lady|blessed virgin|marian|annunciation|nativity of the b|visitation|queenship)/.test(t)) return "marian";
  if (c === "rose") return "rose";
  if (c === "red" || /(palm|passion|pentecost|martyr|good friday|holy cross|triumph)/.test(t)) return "passion";

  // A named season wins over the colour, so ordinary weeks stay green.
  if (s.includes("advent")) return "advent";
  if (s.includes("lent") || s.includes("holy week")) return "lent";
  if (s.includes("christmas")) return "christmas";
  if (s.includes("easter")) return "easter";

  // No season named (a solemnity): the vesture colour carries the theme.
  if (c === "violet" || c === "purple") return "violet";
  if (c === "white" || c === "gold") return "white";
  if (s.includes("ordinary") || c === "green") return "ordinary";
  return "ordinary";
}

const LABELS: Record<Season, string> = {
  ordinary: "Ordinary Time",
  advent: "Advent",
  lent: "Lent",
  easter: "Eastertide",
  christmas: "Christmastide",
  passion: "Passiontide",
  rose: "Gaudete",
  marian: "Marian Feast",
  violet: "",
  white: "",
  neutral: ""
};

/**
 * Human label for the season. Prefers the day's own season text, because the
 * token is a colour decision and may not name the season at all.
 */
export function seasonLabel(tok: Season, season?: string | null): string {
  const s = (season ?? "").trim();
  if (s) return s;
  return LABELS[tok];
}

/**
 * What a swatch of this colour means — for legends, where the day's own season
 * text is the wrong answer. A red memorial in July still reads "Ordinary Time"
 * as its season, which would give a calendar legend three identical entries.
 */
const SWATCHES: Record<Season, string> = {
  ordinary: "Ordinary Time",
  advent: "Advent",
  lent: "Lent",
  easter: "Eastertide",
  christmas: "Christmastide",
  passion: "Martyrs & Passion",
  rose: "Gaudete / Laetare",
  marian: "Our Lady",
  violet: "Penitential",
  white: "Feasts & Solemnities",
  neutral: "Feasts & Solemnities"
};

export function swatchLabel(tok: Season): string {
  return SWATCHES[tok];
}
