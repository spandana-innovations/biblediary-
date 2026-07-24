# God's Word / Daily Liturgy — Zero-Cost Rebuild Plan

Same feature set, new UI, free infrastructure, one codebase, website as a first-class product.

---

## 1. What the code actually told me

I read the Android source, the Gradle config, and all three SQL dumps. Four findings reshape the plan:

**The two-edition split already exists.** `app/build.gradle.kts` defines product flavours `godsword` (India → `com.stpauls.godsword` → `biblediary.in`) and `liturgy` (Ireland → `com.stpauls.dailyliturgy` → `liturgyforeachday.com`), each with its own icon set, app name, and signing key. Current version 2.0.20 (versionCode 30). You aren't inventing a two-flavour architecture — you're porting one.

**The API is tiny.** Eight endpoints, total:

| Endpoint | Purpose |
|---|---|
| `POST /getdata?year=&device_id=&need_updated=` | Bulk calendar for a year |
| `GET /updatedcaldata` | Delta sync since last fetch |
| `GET /hymnsSongs` | Hymns + categories |
| `GET /prayerCollection` | Prayers + categories |
| `GET /orderMassCollection` | Order of Mass |
| `GET /order_of_mass` | Legacy single-blob version |
| `GET /about_us` | Static text |
| `GET /setting` | Version + force-update flags |

Every one is a read. Nothing writes except the `device_id` ping. There is no user account, no sync, no UGC.

**The two editions differ in exactly one table.** Schema is identical (22 tables). Prayers (68/69), hymns (22), Order of Mass (4) are the same content. Only `tbl_calendar` differs — and only in Bible translation. Same date, 2026-04-05:

- **Ireland** — `Acts 10: 34, 37-43` · *"Peter addressed Cornelius and his household: 'You must have heard about the recent happenings…'"* → Jerusalem Bible
- **India** — `Acts of the Apostles 10:34a, 37–43` · *"In those days: Peter opened his mouth and said…"* → ESV-CE

So the shared/edition split is: **everything shared except the daily lectionary.**

**The content is astonishingly small.** Four years of daily readings — 1,464 days × 8 sections:

```
raw, with the Word-pasted HTML   17.3 MB
tags stripped                    10.8 MB
gzipped, cleaned                  3.6 MB   ← the entire corpus
```

The 50 MB dump is mostly the `history` table (74,840 device pings). Audio is 22 unique MP3s, ~95 MB.

---

## 2. The insight this leads to

**You do not have a web application. You have a book that gets a new page each day.**

No accounts, no writes, no per-user state, no real-time anything. 3.6 MB of text and 95 MB of audio, updated by a handful of editors.

Everything expensive about the current setup — the always-on PHP host, the MySQL server, the OAuth token tables, the device-tracking table — exists to serve content that could be a set of files on a CDN. That's why the free-infrastructure goal isn't a compromise here. **Static is genuinely the better architecture, and free is a side effect.**

Concretely: content lives in Git, a build step turns it into static JSON and static HTML, a CDN serves both. No server to run, patch, or get compromised. No database to back up. Rollback is a redeploy of the previous commit.

---

## 3. Recommended architecture

```
┌──────────────────────────────────────────────────────────┐
│  CONTENT REPO (Git)                                      │
│  content/shared/     prayers, hymns, order-of-mass       │
│  content/in/days/    2026-04-05.md  (ESV-CE)             │
│  content/ie/days/    2026-04-05.md  (Jerusalem Bible)    │
│  Edited via Decap CMS — a web UI that commits to Git     │
└────────────────────────┬─────────────────────────────────┘
                         │  git push
                         ▼
┌──────────────────────────────────────────────────────────┐
│  BUILD  (GitHub Actions, matrix: [in, ie])               │
│  → static site  (HTML per day, SEO-indexable)            │
│  → static API   (/api/v1/2026/04.json, index.json)       │
│  → search index (Pagefind)                               │
│  → service-worker precache manifest                      │
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌────────────────────────────┬─────────────────────────────┐
│  Cloudflare Pages ×2       │  Cloudflare R2              │
│  godsword.in  (India)      │  audio bucket, zero egress  │
│  dailyliturgy.ie (Ireland) │  MP3s served direct         │
└────────────────────────────┴─────────────────────────────┘
                         ▲
       ┌─────────────────┴──────────────────┐
       │                                    │
  Website = PWA                    Capacitor shell
  (installable, offline)           → Play Store, App Store
```

One codebase. The website *is* the app — which is exactly the New Community Bible model you said you liked.

### Framework

**SvelteKit with `adapter-static`**, or **Next.js with `output: 'export'`** if the team already knows React. Either gives you one repo producing: a static SEO'd site, an installable offline PWA, and a Capacitor-wrapped store build.

Why not the alternatives:

- **Flutter** — one codebase for Android/iOS, but Flutter Web renders to canvas. No SEO, no text selection, 2 MB+ initial load. It fails your "see everything through the website" requirement, so you'd need a second web codebase.
- **Keep native Kotlin + SwiftUI** — best audio and offline quality, but three codebases (Android, iOS, web) for a small team, and you rebuild the UI three times.
- **Astro** — excellent for the site, but you'd bolt a separate app onto it. Fine if the site and app diverge; unnecessary if they don't.

**Honest caveat:** background audio with lock-screen controls is genuinely better in native than in a webview. The Media Session API covers most of it and Capacitor plugins fill the gap, but if flawless background playback is a headline feature, budget time to prove this early — build an audio spike in week one before committing. Also, Apple's App Store guideline 4.2 rejects thin webview wrappers; a Capacitor build with offline content, push, and native audio normally passes, but it's a real review risk worth knowing about.

**Suggested hedge:** keep the existing Kotlin app shipping as-is while you build the web version. It works today. Retire it only once the PWA has proven itself.

---

## 4. The free stack, with verified limits

| Need | Service | Free allowance (verified July 2026) | Headroom |
|---|---|---|---|
| Site + JSON API | **Cloudflare Pages** | Unlimited bandwidth (fair use), 500 builds/mo, 25 MiB/file, ~20k files/deploy, 20-min build cap | Two editions ≈ 8k files each. Comfortable. |
| Audio | **Cloudflare R2** | 10 GB storage, 1M writes, 10M reads/mo, **£0 egress, permanently** | 95 MB today. See §5. |
| Build/CI | **GitHub Actions** | Unlimited for public repos; 2,000 min/mo private | Builds are seconds. |
| CMS | **Decap CMS** or **Pages CMS** | Free, open source, no server | Editors get a WYSIWYG; output is a Git commit. |
| Push | **Firebase Cloud Messaging** | Free, unmetered | Already in use — keep it. |
| Search | **Pagefind** | Free, builds at deploy time | Static index, no server. |
| Analytics | **Cloudflare Web Analytics** | Free, cookieless | Replaces the 74k-row `history` table entirely. |
| Error tracking | **Sentry** | 5k events/mo | Replaces Crashlytics if you want to consolidate. |

Two important constraints:

1. **Cloudflare's ToS prohibits serving large media files from the CDN proper.** That's precisely why audio goes in R2, not in the Pages bundle. Keep them separate.
2. **Cloudflare Pages free allows one custom domain per project** on some account configurations — verify before you rely on two. Worst case, the second edition runs on Netlify (100 GB/mo, ample for 3.6 MB of content).

---

## 5. The MP3 problem, sized properly

Today: **22 unique files, ~95 MB.** That fits R2's free tier nine times over. This is not currently a problem.

It becomes one only if you populate per-day audio. The schema has an `*_audio` column for all 8 sections × 1,464 days — 11,712 files if fully realised. At typical MP3 bitrates that's ~35 GB, well past the free 10 GB.

Three ways to stay free:

- **Encode for speech, not music.** Opus at 32 kbps mono is transparent for spoken word. A 3-minute reading becomes ~0.7 MB instead of ~3 MB.
- **Be selective.** Gospel + reflection only, rather than all eight sections: 1,464 × 2 × 0.7 MB ≈ **2 GB**. Comfortably free, and it's the audio people actually want.
- **Generate the rest with device text-to-speech.** Every phone has a speech engine. For sections without a recording, offer TTS playback — zero storage, zero bandwidth, works offline, and it solves the fact that only 6 days currently have any audio at all. Flag it clearly in the UI as synthesised.

If you ever do outgrow R2: the **Internet Archive** hosts audio free and unmetered for public-benefit collections, and **Backblaze B2** gives 10 GB free with free egress through the Cloudflare Bandwidth Alliance. Neither is needed at your current scale.

Also worth doing regardless: the 28 MP3s in the webroot are only 22 unique files — `Ave_Maria.mp3` and `Amazing_Grace_(2).mp3` are duplicated across day folders. Deduplicate by content hash on migration.

---

## 6. One codebase, two editions

```
apps/web/                  ← the single application
  src/lib/                 ← components, audio player, offline logic
  src/routes/
editions/
  in.config.ts             ← name, colours, R2 bucket, FCM project, links
  ie.config.ts
content/
  shared/                  ← prayers, hymns, order of mass, about
  in/days/
  ie/days/
```

The edition is a **build-time variable**, not a runtime branch. `EDITION=in pnpm build` produces the India site; a GitHub Actions matrix produces both from one push. Capacitor gets two `capacitor.config.ts` files with different bundle IDs — the same pattern your Gradle flavours already use.

Adding a third edition later (another country, another translation) becomes: one config file, one content directory, one line in the CI matrix.

**Do not fork the repo per edition.** Two repos means every bug gets fixed twice, and drift is guaranteed.

---

## 7. Content migration

The single biggest piece of work, and where the quality is won or lost.

The stored HTML is Word-paste wreckage. Real example from the Ireland database — every individual word wrapped separately:

```html
<span style="color:#231f20">Peter</span> <span style="color:#231f20">addressed</span>
<span style="color:#231f20">Cornelius</span> …
```

Plus `mso-fareast-font-family` declarations, hardcoded `Korinna BT` / `Optima LT Std` / `Trebuchet MS` fonts, and inline pixel sizes. This is why the current app can't do dark mode or font scaling properly — the content fights the theme.

Pipeline:

1. Parse the three dumps → reconcile `tbl_calendar` / `tbl_newcalendar` / `tbl_calendar_old` into one timeline per edition.
2. Strip all presentational markup. Keep only structure.
3. **Preserve the semantic colour coding** in Order of Mass and prayers — this is meaning, not decoration:
   - `#ba372a` / `#e03e2d` red → `.celebrant`
   - `fuchsia` → `.rubric` (stage directions: *"a brief silence"*, *"all bow"*)
   - `<strong>` → `.response` (what the congregation says)
   Map to CSS classes so the theme can restyle them for dark mode without losing the distinction.
4. Emit Markdown + YAML front-matter per day.
5. Diff-check a sample of 50 days rendered old vs new, reviewed by someone who knows the liturgy.

### Data-quality fixes to fold in

- **Hymn titles are filenames.** `hymns_song.title` = `'Saint_Joseph.mp3'`, `'I_WILL_TURN_MY_STEPS.mp3'`. This is visible in your own mockup — the hymns screen shows `I_Will_Turn_My_Steps_.mp3` repeated down the list. Needs real titles, and composer/arranger credits if you have them.
- **Duplicate rows** — `Help_Us_To_Live.mp3` is in `hymns_song` twice (ids 23, 24).
- **Typos in the designs** — "Acciamation" → Acclamation; "Psaiter Week" → Psalter Week; "May almighty God God have mercy" has a doubled word.
- `category_id` stored as `varchar` — becomes a proper relation in the new model.

---

## 8. Features worth adding

Beyond parity, ordered by value-per-effort:

1. **A real URL for every day.** `/2026/04/05` — shareable, bookmarkable, indexed by Google. A devotional site with 1,464 indexable pages of daily readings gets meaningful organic discovery, and WhatsApp link previews (enormous in India) suddenly work. This alone may justify the website.
2. **Liturgical colour theming.** The `colors` column already exists. Tint the UI green in Ordinary Time, violet in Lent, red for martyrs, rose on Gaudete. Free to build, deeply meaningful to the audience, and it makes the app feel alive across the year.
3. **Text-to-speech fallback** — see §5. Turns "6 days have audio" into "every day has audio."
4. **Offline by default.** Service worker precaches the current month; a "download this month" button covers travel and poor connectivity.
5. **Local daily reminder.** Currently reminders need FCM. A local notification at a user-chosen time needs no server at all, and works when push is blocked.
6. **Search across everything** — readings, prayers, hymns, Order of Mass. Pagefind, static, free.
7. **Share as an image card.** Generate a styled verse card for WhatsApp status and Instagram. High-reach, low-effort, on-brand.
8. **Bookmarks and reading streaks**, local-only, no account. Gentle, not gamified.
9. **Typography controls** — the designs already show the `Tt` affordance. Add serif/sans, line height, and a dyslexia-friendly option.
10. **Home-screen widget** — "Today's Gospel". Strong retention driver.
11. **ICS and RSS feeds** — free syndication into parish calendars and readers.
12. **Browsable archive** back to 2020. You already have the data.

### On the design

The cross-shaped home screen is a genuinely distinctive piece of identity — keep it as the app's signature. But it doesn't translate to a desktop browser, and the five-arm layout caps you at six destinations. Plan a responsive variant: the cross on mobile, a calmer grid or sidebar on wide screens. The dark mode in your mockups is good; make sure the migrated content actually supports it (see §7).

---

## 9. Phasing

| Phase | Work | Output |
|---|---|---|
| **0 — Prove the risks** (1 wk) | Audio spike in Capacitor: background playback, lock-screen controls, offline download. Confirm CF Pages custom-domain limits. | Go / no-go on web-first |
| **1 — Content pipeline** (2–3 wk) | SQL → clean Markdown. Both editions. Semantic class mapping. Liturgical review of a sample. | `content/` repo, verified |
| **2 — Static API + website** (3–4 wk) | SvelteKit build, both editions, on Cloudflare Pages. Day pages, prayers, hymns, Order of Mass, search. | **Live website — the milestone that unblocks everything** |
| **3 — PWA** (2 wk) | Service worker, offline, install prompt, local reminders, audio player against R2. | Installable app, no store needed |
| **4 — Store builds** (2–3 wk) | Capacitor shells, FCM, two flavours, store listings. | Play + App Store submissions |
| **5 — Editor workflow** (1 wk) | Decap CMS, editor guide, preview deploys. | Editors self-serve; no developer in the loop |
| **6 — Decommission** | Retire the PHP host and MySQL once traffic has moved. | Recurring cost → ~zero |

Phase 2 is the real milestone. At that point the content is safe, versioned, and publicly usable, and everything after is packaging.

---

## 10. What is genuinely not free

Infrastructure can be zero. Distribution cannot:

| Item | Cost |
|---|---|
| Apple Developer Program | **$99/year** — unavoidable for the App Store |
| Google Play registration | **$25 once** |
| Domains | ~₹1,000/yr each, ×2 editions — or £0 on `*.pages.dev` |
| Audio recording/editing | Whatever you choose to invest |

So: **roughly $99/year plus domains**, down from a shared-hosting bill plus the maintenance burden of a PHP app. Everything else on the list above stays at zero at your scale, and the scale headroom is large — Cloudflare's bandwidth is unmetered, and 3.6 MB of content served statically doesn't meaningfully consume anything.

---

## 11. Two things to deal with before anything else

**Secrets are loose in the archives you sent me.** Both Android zips contain `gods_word_2021.jks`, `ireland_gods_word_2021.jks`, `credentials.txt`, `credentialsIreland.txt`, and `private_key.pepk` — and `build.gradle.kts` has both keystore passwords in plaintext. A Play App Signing private key export in a zip that's been emailed around is a serious exposure: anyone holding it can sign builds that Android and Play will accept as yours.

Signing keys can't simply be rotated without breaking updates for existing installs, so the fix is: confirm whether Play App Signing is enrolled (if so, Google holds the real key and you can reset the *upload* key with Google's help), move all keystores out of the repo into CI secrets, purge them from Git history, and treat those archives as compromised. Worth doing this week, independent of the rebuild.

**Check the text licences before the website goes live.** This one could stop the project. The Jerusalem Bible (Ireland), ESV-CE (India), and the ICEL Roman Missal translation are all under copyright. St Pauls very likely holds permission — you're a Catholic publisher — but permission for *an app* is not automatically permission for *a freely crawlable public website with 1,464 indexable pages*. Publishing the full lectionary openly is a different act of distribution, and the rights holders (Darton Longman & Todd, Crossway, ICEL) draw that line deliberately.

Get it in writing before Phase 2 ships. If open web publication isn't covered, the architecture still works — you gate the readings behind the app and publish only prayers, hymns, and Order of Mass on the open web. But you want to know that *now*, not after building the SEO strategy around it.

---

## 12. Open questions

1. Is Play App Signing enrolled for both apps? Determines how bad the key exposure is.
2. Who authors the daily content, and in what tool today? The CMS must fit their existing habits or it won't get used.
3. Does the Ireland edition need Irish-language support?
4. Is the iOS app in the same state as Android? I only received Android source.
5. Is `liturgyforeachday.com` under your control, and is `biblediary.in` renewable?
6. How many active installs across both apps? Sets the urgency of migration and whether the store listings can be updated in place rather than relisted.
