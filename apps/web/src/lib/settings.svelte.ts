/**
 * Global user settings, persisted to localStorage and applied to <html> so
 * CSS can key off them. Everything here is device-local; nothing is sent
 * anywhere (there is no account system yet — see `signedIn`).
 */
export type ThemeMode = "auto" | "light" | "dark";

export interface Settings {
  /** Reading text scale multiplier. */
  fontScale: number;
  /** Ministry mode surfaces homily tips, reflections and notes, and
   *  re-optimises Mass Mode for the celebrant. */
  ministryMode: boolean;
  /** Interleave the Ordinary of the Mass — the fixed prayers and responses —
   *  into Mass Mode at the points where they are actually said. */
  massPrayers: boolean;
  theme: ThemeMode;
  /** Speech synthesis rate for Listen. */
  voiceRate: number;
  /** Preferred SpeechSynthesis voice URI ("" = system default). */
  voiceURI: string;
}

export const FONT_STEPS = [
  { label: "S", scale: 0.92 },
  { label: "M", scale: 1 },
  { label: "L", scale: 1.14 },
  { label: "XL", scale: 1.3 }
];

const DEFAULTS: Settings = {
  fontScale: 1,
  ministryMode: false,
  massPrayers: true,
  theme: "auto",
  voiceRate: 1,
  voiceURI: ""
};

export const settings = $state<Settings>({ ...DEFAULTS });

/** UI state (not persisted). */
export const ui = $state({ settingsOpen: false, splashDone: false });
export const openSettings = () => (ui.settingsOpen = true);
export const closeSettings = () => (ui.settingsOpen = false);

const KEY = "godsword:settings";

/** Read persisted settings and apply them to the document. Call once on mount. */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Settings> & { priestMode?: boolean };
      // "Priest mode" was renamed to "Ministry mode"; carry the old value over.
      if (saved.ministryMode === undefined && saved.priestMode !== undefined) {
        saved.ministryMode = saved.priestMode;
      }
      delete saved.priestMode;
      Object.assign(settings, { ...DEFAULTS, ...saved });
    }
    else {
      // Migrate the older standalone theme key.
      const legacy = localStorage.getItem("theme");
      if (legacy === "dark" || legacy === "light") settings.theme = legacy;
    }
  } catch {
    /* corrupt or unavailable storage — fall back to defaults */
  }
  apply();
}

function apply() {
  const root = document.documentElement;
  root.style.setProperty("--font-scale", String(settings.fontScale));
  root.setAttribute("data-theme", settings.theme === "auto" ? "" : settings.theme);
  if (settings.theme === "auto") root.removeAttribute("data-theme");
  root.toggleAttribute("data-ministry", settings.ministryMode);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* private mode / quota — settings simply won't survive a reload */
  }
}

/** Mutate a setting, then apply + persist. */
export function set<K extends keyof Settings>(key: K, value: Settings[K]) {
  settings[key] = value;
  apply();
  persist();
}

export const setFontScale = (s: number) => set("fontScale", s);
export const setMinistryMode = (v: boolean) => set("ministryMode", v);
export const setTheme = (t: ThemeMode) => set("theme", t);
export function cycleTheme() {
  setTheme(settings.theme === "dark" ? "light" : "dark");
}

/** True when the effective theme is dark (accounting for "auto"). */
export function isDark(): boolean {
  if (settings.theme === "dark") return true;
  if (settings.theme === "light") return false;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
}
