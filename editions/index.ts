import type { EditionConfig } from "./types";
import inConfig from "./in.json";
import ieConfig from "./ie.json";

/**
 * Single source of truth for edition data lives in the JSON files so the
 * dependency-free Node build script (scripts/build-api.mjs) and the SvelteKit
 * app can both read it. This module adds types on top.
 */
export const editions = {
  in: inConfig as EditionConfig,
  ie: ieConfig as EditionConfig
} satisfies Record<string, EditionConfig>;

export type EditionId = keyof typeof editions;

/** Resolve the edition being built. Defaults to `in` when EDITION is unset. */
export function activeEditionId(): EditionId {
  const raw = (import.meta.env?.VITE_EDITION ?? "in") as string;
  if (raw !== "in" && raw !== "ie") {
    throw new Error(`Unknown EDITION "${raw}" (expected "in" or "ie")`);
  }
  return raw;
}

export function getEdition(id: EditionId): EditionConfig {
  return editions[id];
}

export type { EditionConfig };
