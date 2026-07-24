/**
 * An "edition" is a build-time variable, not a runtime branch (see REBUILD_PLAN §6).
 * `EDITION=in pnpm build` produces the India site; the CI matrix produces both.
 *
 * The two editions share everything (prayers, hymns, Order of Mass) and differ in
 * exactly one place: the daily lectionary in `content/<edition>/days/`, which uses a
 * different Bible translation per country.
 */
export interface EditionConfig {
  /** Short id — must match the directory under content/ and the CI matrix entry. */
  id: "in" | "ie";
  /** Human name shown in the UI. */
  name: string;
  /** Country served, for metadata / hreflang. */
  country: string;
  /** Canonical production origin, no trailing slash. */
  origin: string;
  /** Bible translation used for the daily readings, for attribution/licensing notices. */
  translation: string;
  /** Capacitor / store bundle id — mirrors the existing Gradle product flavours. */
  bundleId: string;
  /** BCP-47 primary locale. */
  locale: string;
  /** Public base URL of the audio bucket (Cloudflare R2), no trailing slash. */
  audioBaseUrl: string;
  /** Firebase Cloud Messaging project id for push. */
  fcmProject: string;
  /** Brand theme seed; liturgical colours override this per-season at runtime. */
  theme: {
    /** Brand accent used outside liturgical seasons. */
    accent: string;
  };
}
