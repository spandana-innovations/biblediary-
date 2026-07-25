/**
 * Line-based icon set (outline strokes, uniform weight) as HTML strings.
 * All use currentColor + stroke so they inherit theme colours cleanly.
 */
const s = (body: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

/** Solid counterpart, for marks that need weight at small sizes. */
const f = (body: string) => `<svg viewBox="0 0 24 24" fill="currentColor">${body}</svg>`;

export const icons = {
  book: s(`<path d="M12 6.5C10.5 5.3 8 4.7 5.5 4.7c-.6 0-1 .4-1 1v12c0 .6.4 1 1 1 2.5 0 5 .6 6.5 1.8"/><path d="M12 6.5C13.5 5.3 16 4.7 18.5 4.7c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1-2.5 0-5 .6-6.5 1.8"/><path d="M12 6.5v14"/>`),
  angel: s(`<circle cx="12" cy="5.5" r="1.8"/><path d="M12 8c-2 0-3.2 1.6-3.2 3.7V16h6.4v-4.3C15.2 9.6 14 8 12 8z"/><path d="M8.8 11.5C6 11.5 4 13.4 3 15.5c3 .2 5-.8 5.8-2M15.2 11.5c2.8 0 4.8 1.9 5.8 4-3 .2-5-.8-5.8-2"/>`),
  church: s(`<path d="M12 3v4M10 5h4"/><path d="M12 7l6 3.5V21H6V10.5L12 7z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>`),
  note: s(`<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>`),
  mary: s(`<path d="M12 3.5c-2.6 0-4.5 1.9-4.5 4.6 0 3.6 4.5 12.4 4.5 12.4s4.5-8.8 4.5-12.4c0-2.7-1.9-4.6-4.5-4.6z"/><circle cx="12" cy="8" r="1.8"/>`),
  notes: s(`<path d="M4 7h16M4 12h11M4 17h16"/><circle cx="19" cy="11.5" r="2"/>`),
  beads: s(`<circle cx="12" cy="5" r="1.6"/><circle cx="7" cy="8" r="1.6"/><circle cx="17" cy="8" r="1.6"/><circle cx="6" cy="14" r="1.6"/><circle cx="18" cy="14" r="1.6"/><path d="M12 18v3M10.5 21h3"/>`),
  quote: s(`<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.4A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8z"/>`),
  info: s(`<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>`),
  play: s(`<path d="M8 5.5v13l11-6.5-11-6.5z"/>`),
  share: s(`<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.3M8.2 13.2l7.6 4.3"/>`),
  textsize: s(`<path d="M4 7V5h9v2M8.5 5v13M6.5 18h4"/><path d="M14 12v-1h6v1M16.5 11v7M15 18h3"/>`),
  chevron: s(`<path d="M6 9l6 6 6-6"/>`),
  prev: s(`<path d="M15 6l-6 6 6 6"/>`),
  next: s(`<path d="M9 6l6 6-6 6"/>`),
  calendar: s(`<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>`),
  search: s(`<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>`),
  sound: s(`<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"/>`),
  stop: s(`<rect x="6" y="6" width="12" height="12" rx="2.5"/>`),
  sun: s(`<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6"/>`),
  moon: s(`<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>`),
  pause: s(`<rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/>`),
  close: s(`<path d="M6 6l12 12M18 6L6 18"/>`),
  download: s(`<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>`),
  expand: s(`<path d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4"/>`),
  candle: s(`<path d="M12 3c1.2 1 1.2 2.4 0 3.4C10.8 5.4 10.8 4 12 3z"/><rect x="9.5" y="8" width="5" height="12" rx="1"/><path d="M8 20h8"/>`),
  chevronRight: s(`<path d="M9 6l6 6-6 6"/>`),
  command: s(`<path d="M9 9V7.5A2.5 2.5 0 1 0 6.5 10H9zm0 0v6m0-6h6M9 15v1.5A2.5 2.5 0 1 1 6.5 14H9zm6 0v1.5a2.5 2.5 0 1 0 2.5-2.5H15zm0 0V9m0 0h1.5A2.5 2.5 0 1 0 14 6.5V9z"/>`),
  /** Latin cross, outline — used in the rail and inline. */
  cross: s(`<path d="M12 3v18M6.5 8.5h11"/>`),
  /**
   * Latin cross, solid with rounded terminals — the Mass mark. Filled so it
   * holds its weight inside the raised tab-bar orb at 24px.
   */
  /**
   * The house device — the flame standing on the open book — drawn as an icon
   * rather than sampled from the logo, because "God's Word" set in blackletter
   * is unreadable at 30px. Solid, so it carries weight inside the tab-bar orb,
   * and on currentColor so the orb's own colour shows through the flame.
   */
  flameBook: (() =>
    `<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">` +
    // flame, hollowed so the orb colour reads as the inner light
    `<path d="M12 1.9c3.3 3.6 4.9 6.2 4.9 8.4a4.9 4.9 0 1 1-9.8 0c0-2.2 1.6-4.8 4.9-8.4zm0 4.6c-1.7 2.2-2.5 3.6-2.5 4.8a2.5 2.5 0 0 0 5 0c0-1.2-.8-2.6-2.5-4.8z"/>` +
    // the open book beneath it
    `<path d="M11.2 16.6C9.1 15.4 6.4 14.8 3.6 14.8c-.6 0-1 .4-1 1v3.4c0 .5.4 1 1 1 2.8 0 5.5.6 7.6 1.8zm1.6 0c2.1-1.2 4.8-1.8 7.6-1.8.6 0 1 .4 1 1v3.4c0 .5-.4 1-1 1-2.8 0-5.5.6-7.6 1.8z"/>`+
    `</svg>`)(),

  crossSolid: f(
    // Latin proportions: crossbar raised to ~1/3, upper arm 5 units to a
    // 12-unit stem, so it reads as a cross and never as a plus sign.
    `<path d="M10.5 3.5A1.5 1.5 0 0 1 13.5 3.5L13.5 7L16.5 7A1.5 1.5 0 0 1 16.5 10L13.5 10L13.5 20.5A1.5 1.5 0 0 1 10.5 20.5L10.5 10L7.5 10A1.5 1.5 0 0 1 7.5 7L10.5 7Z"/>`
  ),
  /** Haloed figure — Saint of the Day. */
  saint: s(`<circle cx="12" cy="9.5" r="3"/><path d="M7.5 5.2a6 6 0 0 1 9 0"/><path d="M5.5 20.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/>`),
  cog: s(`<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 18.3a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.53 14a1.7 1.7 0 0 0-1.56-1.03H2.9a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.55 7.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.92 3.6 1.7 1.7 0 0 0 9.95 2.04V2a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88v.05a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z"/>`),
  plus: s(`<path d="M12 7v10M7 12h10"/>`),
  minus: s(`<path d="M7 12h10"/>`),
  textsizeSm: s(`<path d="M4 8V6h8v2M8 6v12M6 18h4"/>`),
  /** Vertical ellipsis — the collapsed controls menu. */
  more: s(`<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>`),
  note_pen: s(`<path d="M11 4H5.5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V13"/><path d="M18.4 3.6a1.9 1.9 0 0 1 2.7 2.7L13.5 14 10 15l1-3.5z"/>`)
};
