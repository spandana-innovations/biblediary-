<script lang="ts">
  /**
   * Saint of the Day. The portrait comes from the day's `saintImage` field
   * when the content provides one; otherwise we draw a typographic medallion
   * from the saint's initial so the page never shows a broken frame.
   */
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import {
    renderBody, todayISO, nearestDate, getDay, getSaints,
    type Day, type Section, type SaintEntry
  } from "$lib/api";
  import { seasonToken } from "$lib/liturgical";
  import { icons } from "$lib/icons";

  let { data } = $props();

  let day = $state<Day | null>(data.day);
  onMount(() => {
    const want = nearestDate(data.index?.dates ?? [], todayISO());
    if (want && want !== data.day?.date) getDay(fetch, want).then((d) => (day = d)).catch(() => {});
  });

  // ---- find a saint ----
  let q = $state("");
  let all: SaintEntry[] = $state([]);
  // Reactive: the "Loading…" line has to flip to "No saint matching…" once the
  // index arrives, and a plain `let` never notifies.
  let loadedAll = $state(false);

  async function ensureIndex() {
    if (loadedAll) return;
    try {
      all = await getSaints(fetch);
      loadedAll = true;
    } catch {
      /* index not built yet */
    }
  }
  function onSearchInput() {
    ensureIndex();
  }

  const hits = $derived.by(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [] as SaintEntry[];
    const seen = new Set<string>();
    return all
      .filter((s) => {
        if (!s.name.toLowerCase().includes(term)) return false;
        const k = s.name.toLowerCase();
        if (seen.has(k)) return false;   // the same saint recurs across years
        seen.add(k);
        return true;
      })
      .slice(0, 24);
  });

  async function openSaint(entry: SaintEntry) {
    q = "";
    try {
      day = await getDay(fetch, entry.date);
      imgFailed = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* keep current */
    }
  }


  const season = $derived(day ? seasonToken(day.season, day.liturgicalColor, day.celebration) : "neutral");
  const saint = $derived(((day?.sections ?? []) as Section[]).find((s) => s.key === "saint") ?? null);

  /** Content may supply a portrait + dossier fields alongside the body. */
  const meta = $derived((saint ?? {}) as Section & {
    saintName?: string;
    saintImage?: string;
    saintCredit?: string;
    saintSource?: string;
    saintYears?: string;
    saintPatronage?: string;
    saintFeast?: string;
  });

  const name = $derived(meta.saintName ?? saint?.ref ?? "Saint of the Day");
  const initial = $derived((name.replace(/^(St|Saint|Bl|Blessed)\.?\s+/i, "")[0] ?? "✠").toUpperCase());
  let imgFailed = $state(false);

  const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const shortDate = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    return `${dd} ${MON[m - 1].slice(0, 3)} ${y}`;
  };
  function dateLine(d?: string) {
    if (!d) return "";
    const [y, m, dd] = d.split("-").map(Number);
    return `${WEEK[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]}, ${dd} ${MON[m - 1]} ${y}`;
  }
</script>

<svelte:head>
  <title>Saint of the Day — God's Word</title>
  <meta name="description" content="The saint commemorated today, with their life and patronage." />
</svelte:head>

<div class="saintpage" data-season={season}>
  <div class="page-head">
    <p class="eyebrow">Saint of the Day</p>
    <h1>{name}</h1>
    <p class="sub">{dateLine(day?.date)}</p>

    <div class="finder">
      <span class="f-ic">{@html icons.search}</span>
      <input
        type="search" bind:value={q} oninput={onSearchInput}
        onfocus={ensureIndex}
        placeholder="Find a saint…" aria-label="Find a saint"
      />
      {#if q}<button class="f-x" onclick={() => (q = "")} aria-label="Clear">{@html icons.close}</button>{/if}
    </div>

    {#if q.trim().length >= 2}
      {#if hits.length}
        <ul class="hits">
          {#each hits as h (h.name + h.date)}
            <li>
              <button onclick={() => openSaint(h)}>
                <span class="h-name">{h.name}</span>
                <span class="h-date">{shortDate(h.date)}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-hits">{loadedAll ? `No saint matching “${q}”.` : "Loading…"}</p>
      {/if}
    {/if}
  </div>

  <div class="page-body">
    {#if !saint}
      <p class="empty">
        <span class="e-ic">{@html icons.saint}</span>
        No saint is recorded for today.
        <span class="e-sub">Feasts and memorials appear here as the calendar fills in.</span>
      </p>
    {:else}
      <figure class="portrait">
        {#if meta.saintImage && !imgFailed}
          <img src={meta.saintImage} alt={name} loading="lazy" onerror={() => (imgFailed = true)} />
        {:else}
          <div class="medallion" aria-hidden="true"><span>{initial}</span></div>
        {/if}
        {#if meta.saintYears}<figcaption>{meta.saintYears}</figcaption>{/if}
        {#if meta.saintImage && !imgFailed && meta.saintCredit}
          <figcaption class="credit">
            {#if meta.saintSource}
              <a href={meta.saintSource} target="_blank" rel="noopener noreferrer">{meta.saintCredit}</a>
            {:else}{meta.saintCredit}{/if}
          </figcaption>
        {/if}
      </figure>

      {#if meta.saintPatronage || meta.saintFeast}
        <dl class="dossier">
          {#if meta.saintFeast}<div><dt>Feast</dt><dd>{meta.saintFeast}</dd></div>{/if}
          {#if meta.saintPatronage}<div><dt>Patron of</dt><dd>{meta.saintPatronage}</dd></div>{/if}
        </dl>
      {/if}

      <div class="life reading">{@html renderBody(saint.body)}</div>

      <div class="leaf"><span class="g">❧</span></div>
      <a class="more" href="{base}/{day?.date.replaceAll('-', '/')}/">Today’s readings →</a>
    {/if}
  </div>
</div>

<style>
  .eyebrow { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; font-weight: 600; color: var(--season-ink); margin: 0 0 8px; }
  .sub { font-family: var(--font-ui); font-size: 0.82rem; color: var(--muted); margin: 8px 0 0; }

  .finder {
    display: flex; align-items: center; gap: 10px; margin: 20px 0 0; max-width: 26rem;
    border: 1px solid var(--hairline); border-radius: 999px; padding: 9px 16px;
    background: color-mix(in srgb, var(--paper) 70%, var(--season-wash));
  }
  .f-ic { display: grid; color: var(--muted); flex-shrink: 0; }
  .f-ic :global(svg) { width: 17px; height: 17px; }
  .finder input {
    flex: 1; min-width: 0; border: 0; background: transparent; outline: none;
    color: var(--ink); font-family: var(--font-body); font-size: 0.98rem;
  }
  .finder input::placeholder { color: var(--muted); }
  .f-x { border: 0; background: none; color: var(--muted); cursor: pointer; display: grid; padding: 0; }
  .f-x :global(svg) { width: 15px; height: 15px; }

  .hits { list-style: none; margin: 10px 0 0; padding: 0; max-width: 30rem; max-height: 46vh; overflow-y: auto; }
  .hits button {
    width: 100%; display: flex; align-items: baseline; justify-content: space-between; gap: 14px;
    background: none; border: 0; border-bottom: 1px solid var(--hairline);
    padding: 11px 2px; cursor: pointer; text-align: left; color: inherit;
  }
  .h-name { font-family: var(--font-body); font-size: 1.02rem; min-width: 0; }
  .h-date {
    font-family: var(--font-ui); font-size: 0.68rem; color: var(--muted);
    white-space: nowrap; letter-spacing: 0.04em;
  }
  .hits button:hover .h-name { color: var(--season-ink); }
  .no-hits { margin: 12px 0 0; color: var(--muted); font-family: var(--font-ui); font-size: 0.82rem; }

  .portrait { margin: 26px 0 30px; display: grid; justify-items: center; gap: 12px; }
  .portrait img {
    width: min(280px, 62vw); aspect-ratio: 3 / 4; object-fit: cover; border-radius: 4px;
    border: 1px solid color-mix(in srgb, var(--season-gold) 45%, transparent);
    padding: 8px; background: var(--paper);
  }
  .medallion {
    width: min(220px, 52vw); aspect-ratio: 1; border-radius: 50%;
    display: grid; place-items: center;
    background: linear-gradient(160deg, color-mix(in srgb, var(--season-deep) 18%, var(--season-wash)), var(--season-wash));
    border: 1px solid color-mix(in srgb, var(--season-gold) 50%, transparent);
  }
  .medallion span {
    font-family: var(--font-display); font-weight: 560; font-size: clamp(3.5rem, 14vw, 5.5rem);
    color: var(--season-ink); line-height: 1;
  }
  .portrait figcaption { font-family: var(--font-ui); font-size: 0.76rem; color: var(--muted); letter-spacing: 0.04em; }
  .portrait .credit { font-size: 0.66rem; opacity: 0.75; max-width: 24rem; text-align: center; line-height: 1.4; }
  .portrait .credit a { text-decoration: underline; text-underline-offset: 2px; }

  .dossier {
    display: grid; gap: 14px; margin: 0 0 28px; padding: 18px 0;
    border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline);
  }
  .dossier dt { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.64rem; font-weight: 600; color: var(--muted); }
  .dossier dd { margin: 3px 0 0; font-family: var(--font-body); font-size: 1.05rem; }

  .life { font-size: var(--text-reading); line-height: var(--leading-reading); }
  .life :global(p) { margin: 0 0 1.05em; }
  .life :global(p:first-of-type)::first-letter {
    font-family: var(--font-display); font-weight: 560; color: var(--season-ink);
    -webkit-initial-letter: 3; initial-letter: 3; float: left; line-height: 0.8; padding-right: 0.08em; margin-top: 0.05em;
  }

  .more {
    display: block; text-align: center; font-family: var(--font-ui); font-size: 0.74rem;
    text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: var(--season-ink); margin-top: 10px;
  }
  .empty {
    display: grid; justify-items: center; text-align: center; gap: 10px; max-width: 30rem; margin: 8vh auto;
    color: var(--muted); font-family: var(--font-body); font-size: 1.05rem;
  }
  .e-ic { color: var(--season-gold); display: grid; }
  .e-ic :global(svg) { width: 34px; height: 34px; }
  .e-sub { font-family: var(--font-ui); font-size: 0.8rem; }
</style>
