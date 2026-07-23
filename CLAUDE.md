# Bible Diary / "God's Word" — Project Brief

> Drop this in the repo root as `CLAUDE.md` (or `docs/PROJECT_BRIEF.md`) before starting work in Claude Code.
> Everything below was derived by inspecting `biblediary_in.zip` and `bettery1_biblediary_godsword.sql`. Anything marked **[VERIFY]** is inference, not confirmed fact.

---

## 1. What this is

A Catholic daily-liturgy platform, branded **"God's Word"**, serving:

- **Mobile apps** — Android and iOS (FCM topics in the DB are `android_godsword`, `ios_godsword`, `all_godsword`)
- **A REST API** — Laravel + Passport (OAuth2), consumed by the apps
- **An admin panel** — server-rendered Blade + AdminLTE/Bootstrap 3, CKEditor for rich content
- **Domain** — `biblediary.in`

Content model, per day: first reading, responsorial psalm, second reading, acclamation, gospel, reflection, saint of the day, intercessions, homily tips — each with a title, HTML body, and an optional MP3. Plus standalone sections for hymns, prayers, and the Order of Mass.

---

## 2. ⚠️ The critical gap: application source is missing

`biblediary_in.zip` is **only the public document root**. It contains no Laravel application code.

`biblediary.in/index.php` proves it:

```php
require '/home/bettery1/biblediary/core/vendor/autoload.php';
$app = require_once '/home/bettery1/biblediary/core/bootstrap/app.php';
```

The entire app — `app/`, `routes/`, `config/`, `database/`, `resources/views/`, `composer.json`, `.env` — lives one directory **above** the webroot at `/home/bettery1/biblediary/core/`, and is not in the zip.

**Nothing meaningful can be built or debugged until that directory is retrieved.** First action: pull `core/` off the cPanel host (SSH/SFTP/File Manager), excluding `vendor/` and `node_modules/`. Get `.env` separately and never commit it.

Note also: that absolute path is hardcoded. It breaks on any machine that isn't this shared host. Fixing it to a relative `__DIR__` path is a prerequisite for local dev.

---

## 3. Stack (as deployed)

| Layer | What's there | Concern |
|---|---|---|
| PHP | 7.4, pinned by cPanel handler in `.htaccess` | EOL since Nov 2022 |
| Framework | Laravel + Passport | Version unknown until `composer.json` is retrieved **[VERIFY]** |
| DB | MySQL 8.0.46 | Mixed engines and charsets — see below |
| Admin UI | AdminLTE-era Bootstrap 3, jQuery, CKEditor 4 (×2 copies) | CKEditor 4 is EOL; jQuery/BS3 both very old |
| Hosting | cPanel shared hosting, Let's Encrypt | No CI, no containers, no version control evident |

---

## 4. Database — 22 tables, ~50 MB dump

### Core content

| Table | Rows | Notes |
|---|---:|---|
| `tbl_calendar` | ~1,464 | **The live one.** One row per day, `2023-01-01` → `2026-12-31`. ~34 columns, wide and flat. |
| `tbl_newcalendar` | ~725 | Legacy, `2020-10-18` → `2022-12-31`. Has an extra `cal_id`. |
| `tbl_calendar_old` | ~395 | Legacy, overlapping `2023-12-10` → `2024-12-31`. MyISAM. |
| `prayer_category` / `prayer_collection` | 10 / 69 | Common Prayers, Holy Rosary, Marian, Litanies, Novenas, Way of the Cross, Divine Mercy, St Joseph, Healing, Various Occasions |
| `order_category` / `order_collection` / `order_mass` | 4 / 4 / 1 | Order of Mass with Eucharistic Prayers I–IV |
| `hymns_category` / `hymns_song` | 4 / 22 | Instrumental, Others, Holy Mass, Mary & Joseph |
| `tbl_aboutus`, `landing_page`, `setting` | 1 each | `setting` holds `android_app_version` = `22`, `ios_app_version` = `1.9`, plus force-update flags |

### Operational

| Table | Rows | Notes |
|---|---:|---|
| `history` | **~74,824** | `device_id` + `last_request`. MyISAM, unbounded growth, no retention policy. |
| `changes` | ~2,104 | Change log keyed by `ref_type` enum — almost certainly drives client-side cache invalidation **[VERIFY]** |
| `notification` | 36 | Push history. Last entry (2025-08-08): *"The app is currently under maintenance. Please re-download the app"* — worth asking what happened. |
| `users` | **1** | Single `admin@gmail.com` bcrypt account. No end-user accounts — the apps are anonymous, identified only by `device_id`. |
| `oauth_*` (5 tables) | few | Passport. 4 access tokens, 2 clients. |

### Schema problems to log now, fix later

- **Charset chaos.** Tables declared `latin1` while individual `longtext` columns are `utf8mb4`. Expect mojibake in any content with curly quotes or accents.
- **`category_id` is `varchar(255)`** in `hymns_song`, `prayer_collection`, `order_collection` — storing integer FKs as strings. No foreign key constraints anywhere.
- **`tbl_calendar.date` is `varchar(40)`**, and `created_at`/`updated_at` are `varchar(40)` too. Every date query is a string comparison.
- **MyISAM** on `changes`, `history`, `tbl_calendar_old` — no transactions, table-level locking.
- Three near-identical calendar tables with overlapping date ranges. Decide which is canonical, archive the rest.
- Body columns are Word-pasted HTML: `mso-*` styles, `Korinna BT` font declarations, hardcoded hex colours. Any redesign or dark mode will fight this.

---

## 5. Media — 18,934 files, 251 MB (and only ~40 matter)

| Directory | Files | Real content? |
|---|---:|---|
| `asset/` | **18,820** | ❌ Vendor libraries: CKEditor (×2 — 11,232 + 3,021 files), Ionicons, jQuery UI, moment, select2, Flot, morris.js… |
| `audiofiles/` | 37 | ✅ Per-calendar-day MP3s, foldered by `{cal_id}/{section}/` |
| `category_images/`, `hymns_images/` | 38 | ✅ Category icons |
| `prayerfiles/` | 22 | ✅ Hymn MP3s |

Two takeaways: (a) `asset/` should never enter version control — it belongs in a build step or CDN; (b) the audio library is far thinner than the schema implies. Only a handful of the 1,464 calendar days actually have audio, and the same few files (`Ave_Maria.mp3`, `Amazing_Grace_(2).mp3`) are duplicated across day folders. **[VERIFY]** whether audio was ever really populated or the feature was abandoned.

---

## 6. 🔴 Security — check these before anything else

1. **`audiofiles/1/intercessions_reading/666MAILER.php`** — a zero-byte PHP file with a mail-spam-script filename, sitting in a user-upload directory, dated 2024-01-25. This is the signature of a compromise. It's empty *now*, but treat the host as suspect: audit for other injected files, check for modified `index.php`, review access logs, rotate all credentials. Uploads directories must not execute PHP — add a `.htaccess` deny rule.
2. **Wide-open CORS** — `index.php` sets `Access-Control-Allow-Origin: *` unconditionally, on every route including admin.
3. **CKEditor sample scripts are web-reachable** — `asset/ckeditor/samples/old/assets/posteddata.php` and friends echo POST data back. Delete the whole `samples/` tree.
4. **PHP 7.4** — unpatched for 2½ years.
5. **`.DS_Store` in the docroot**, `robots.txt` disallows nothing, single shared admin account.

---

## 7. Suggested repo layout

```
biblediary/
├── CLAUDE.md                 ← this brief
├── core/                     ← Laravel app (RETRIEVE FIRST; .env gitignored)
├── public/                   ← docroot, minus vendor asset bloat
│   ├── index.php             ← fix hardcoded /home/bettery1/ path
│   └── uploads/ …            ← content media only
├── db/
│   ├── schema.sql            ← structure only
│   └── seed-sample.sql       ← ~30 days for local dev, not the 50 MB dump
└── docs/
    ├── api.md                ← reverse-engineered endpoint map
    └── data-model.md
```

`.gitignore`: `.env`, `vendor/`, `node_modules/`, `public/asset/`, `*.mp3`, `.DS_Store`, the full SQL dump.

---

## 8. Phased plan

**Phase 0 — Get the code (blocking)**
Retrieve `core/`. Read `composer.json` for the Laravel version, `routes/api.php` for the endpoint surface, `.env.example` for required config. Initialise git. Nothing else is possible before this.

**Phase 1 — Reproduce locally**
Docker or Laravel Sail with PHP 7.4 + MySQL 8. Import schema plus a trimmed seed. Make `index.php` path-relative. Success criterion: admin panel loads and one API endpoint returns real data.

**Phase 2 — Contain the security issues**
Audit for webshells, purge CKEditor samples, scope CORS, block PHP execution in upload paths, rotate credentials, add a second admin account with a real password.

**Phase 3 — Map the API**
Document every route the mobile apps call, with request/response shapes. Without the app source this is the only contract that exists — write it down before changing anything.

**Phase 4 — Data cleanup**
Normalise to `utf8mb4` throughout. `varchar` dates → proper `DATE`/`TIMESTAMP`. `category_id` → `INT` with FKs. Consolidate the three calendar tables. Add a retention policy for `history`. Every step behind a reversible migration.

**Phase 5 — Modernise (only once 0–4 are done)**
PHP 8.x, current Laravel, replace CKEditor 4, then decide on the frontend.

---

## 9. Working agreements for Claude Code

- **Read before writing.** This is a live app with real users; treat existing behaviour as the spec.
- **Never run destructive SQL against production.** All schema changes go through migrations, tested locally.
- **The provided dump is production data.** Anonymise `history.device_id` and the admin hash before sharing or committing anything derived from it.
- **Don't reformat the liturgical HTML.** The `mso-*` cruft is ugly but the colour coding is semantic — red for celebrant, fuchsia for rubrics, bold for congregational responses. Changing it changes meaning.
- **Ask rather than assume** on anything marked **[VERIFY]**.

---

## 10. Open questions for the owner

1. Can the `core/` directory and `.env` be retrieved? Without them this is a data-archaeology exercise, not a development project.
2. What happened in Aug 2025? The last push notification told users to re-download the app.
3. Do the Android/iOS app sources exist, and are they in scope?
4. What's the actual goal — keep it alive, modernise it, or rebuild it?
5. Is anyone still authoring daily content? `tbl_calendar` runs to Dec 2026, so someone loaded three years ahead.
6. Was the host ever cleaned after the `666MAILER.php` incident?
