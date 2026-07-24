/**
 * Line-based icon set (outline strokes, uniform weight) as HTML strings.
 * All use currentColor + stroke so they inherit theme colours cleanly.
 */
const s = (body: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

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
  moon: s(`<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>`)
};
