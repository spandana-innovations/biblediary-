/**
 * Per-day ministry notes.
 *
 * Stored on the device against the liturgical date, so a celebrant can jot
 * what he means to say and have it to hand in Mass Mode. There is no account
 * system yet; when sign-in lands these sync rather than change shape, which is
 * why the payload is already a dated record rather than a blob.
 */
const KEY = "godsword:notes";

type Store = Record<string, { text: string; updated: string }>;

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode or quota — the note simply won't persist */
  }
}

export function getNote(date: string): string {
  if (typeof localStorage === "undefined") return "";
  return read()[date]?.text ?? "";
}

export function setNote(date: string, text: string) {
  if (typeof localStorage === "undefined") return;
  const store = read();
  const trimmed = text.trim();
  if (trimmed) store[date] = { text, updated: new Date().toISOString() };
  else delete store[date];
  write(store);
}

/** Dates that carry a note, most recent first. */
export function datesWithNotes(): string[] {
  if (typeof localStorage === "undefined") return [];
  return Object.keys(read()).sort().reverse();
}

export function noteCount(): number {
  return datesWithNotes().length;
}
