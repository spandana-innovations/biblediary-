# Content pipeline

Daily content lives as Markdown-with-front-matter under `content/<edition>/days/`
and is compiled to a static JSON API by `scripts/build-api.mjs`.

## Filling the calendar from the live site

The production database already holds the real content — `tbl_calendar` has
roughly **1,464 days (2023-01-01 → 2026-12-31)**. That is the source of truth,
not anything written by hand here.

`scripts/import-legacy.mjs` reads the mysqldump directly (no MySQL server
needed) and writes one `.md` per day:

```bash
node scripts/import-legacy.mjs bettery1_biblediary_godsword.sql
node scripts/build-api.mjs
pnpm --filter web build
```

Options:

| Flag | Default | Meaning |
|---|---|---|
| `--edition=in` | `in` | which edition folder to write into |
| `--table=tbl_calendar` | `tbl_calendar` | source table (`tbl_newcalendar` for the 2020–22 archive) |
| `--no-clobber` | off | keep any day file that already exists |

The importer:

- reads the column list from the dump's `CREATE TABLE`, so it survives column
  reordering;
- maps `<name>_title` / `<name>_description` / `<name>_audio` triples onto the
  nine app sections (first reading → intercessions, including homily tips);
- converts the Word-pasted HTML to Markdown **while preserving the semantic
  colour coding** (REBUILD_PLAN §7) — legacy red becomes
  `<span class="celebrant">`, fuchsia becomes `<span class="rubric">`, and bold
  stays bold for the people's responses;
- decodes HTML entities and normalises the `varchar` dates to `YYYY-MM-DD`.

Nothing is written until the whole dump parses, so a failed run leaves the
existing content untouched.

## Scripture licensing

**The sample days in this repo are not the production text.** They use the
[World English Bible](https://worldenglish.bible/), which is public domain, so
that the app can be developed and demonstrated without redistributing a
copyrighted translation.

The edition's own approved translation is copyrighted and may only be published
under the permission granted to ST PAULS. It must come from the production
database via the importer above — it must never be typed in by hand, generated,
or copied from a third-party site. Running the importer overwrites the sample
text with the real thing.

For the same reason the translation name is not displayed anywhere in the UI.

## Section keys

| Key | Section | Notes |
|---|---|---|
| `first_reading` | First Reading | drop cap |
| `responsorial_psalm` | Responsorial Psalm | leading `**bold**` line is set apart as the response |
| `second_reading` | Second Reading | Sundays and solemnities |
| `acclamation` | Gospel Acclamation | |
| `gospel` | Gospel | marked ✠ |
| `homily` | Homily Tip | **priest mode only** |
| `reflection` | Reflection | drop cap |
| `saint` | Saint of the Day | drives `/saint/`; see below |
| `intercessions` | Intercessions | celebrant / rubric / response markup |

Mass Mode (`/mass/`) shows only the liturgy proper — first reading through
gospel, plus the homily tip when priest mode is on.

### Saint dossier fields

The `saint` section accepts optional extras, passed straight through to the API
and rendered by `/saint/`:

```yaml
  - key: saint
    title: Saint of the Day
    saintName: "Saint Sharbel Makhlūf"
    saintYears: "1828 – 1898"
    saintFeast: "24 July"
    saintPatronage: "Lebanon; the sick"
    saintImage: "https://…/sharbel.jpg"   # optional
```

Without `saintImage` the page draws a typographic medallion from the saint's
initial, so it never shows a broken frame. Images should be licensed for reuse
(Wikimedia Commons public-domain artwork is the usual source) and served from
the media bucket rather than hotlinked.
