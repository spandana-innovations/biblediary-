<script lang="ts">
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";
  import { getSearch, type SearchItem } from "$lib/api";

  let q = $state("");

  // The index is 2 MB. Loading it in `load` meant the prerendered page carried
  // the whole thing inline — a 2.3 MB HTML file for anyone who opened Search.
  // Fetch it on the first keystroke instead, as the ⌘K palette already does.
  let items: SearchItem[] = $state([]);
  let loaded = $state(false);
  let loading = $state(false);

  async function ensureLoaded() {
    if (loaded || loading) return;
    loading = true;
    try {
      items = await getSearch(fetch);
      loaded = true;
    } catch {
      /* offline, or the index hasn't been built */
    } finally {
      loading = false;
    }
  }

  const results = $derived.by(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [] as SearchItem[];
    return items
      .map((it) => ({ it, hay: `${it.title} ${it.sub} ${it.text}`.toLowerCase() }))
      .filter(({ hay }) => tokens.every((t) => hay.includes(t)))
      .slice(0, 60)
      .map(({ it }) => it);
  });

  function snippet(it: SearchItem): string {
    const first = q.toLowerCase().split(/\s+/).filter(Boolean)[0];
    const i = first ? it.text.toLowerCase().indexOf(first) : -1;
    if (i < 0) return it.text.slice(0, 120);
    const start = Math.max(0, i - 40);
    return (start > 0 ? "…" : "") + it.text.slice(start, start + 130) + "…";
  }
</script>

<svelte:head>
  <title>Search — God's Word</title>
  <meta name="description" content="Search across daily readings, prayers, hymns and the Order of Mass." />
</svelte:head>

<div class="page-head">
  <p class="eyebrow">Find</p>
  <h1>Search</h1>
  <div class="searchbar">
    <span class="si">{@html icons.search}</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="search" placeholder="Search readings, prayers, hymns…" bind:value={q}
      autocomplete="off" autofocus onfocus={ensureLoaded} oninput={ensureLoaded}
    />
    <kbd>⌘K</kbd>
  </div>
</div>

<div class="page-body wide">
  {#if q.trim() === ""}
    <p class="empty">
      <span class="e-ic">{@html icons.book}</span>
      Search across daily readings, prayers, hymns and the Order of Mass.
      <span class="e-sub">Tip: press <kbd>⌘K</kbd> anywhere to search in a flash.</span>
    </p>
  {:else if !loaded}
    <p class="empty">
      <span class="e-ic">{@html icons.search}</span>
      Loading the index…
    </p>
  {:else if results.length === 0}
    <p class="empty">
      <span class="e-ic">{@html icons.search}</span>
      No matches for “{q}”.
      <span class="e-sub">Try a different word, a saint’s name, or a scripture reference.</span>
    </p>
  {:else}
    <p class="count">{results.length} result{results.length === 1 ? "" : "s"}</p>
    <ul class="list">
      {#each results as r (r.url + r.title)}
        <li>
          <a class="res" href={`${base}/${r.url}`}>
            <span class="type">{r.type}</span>
            <span class="meta">
              <span class="t">{r.title}</span>
              <span class="snip">{snippet(r)}</span>
            </span>
            <span class="go">{@html icons.chevronRight}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .eyebrow { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; font-weight: 600; color: var(--season-ink); margin: 0 0 8px; }
  .searchbar {
    display: flex; align-items: center; gap: 12px; margin-top: 20px; max-width: 40rem;
    border: 1px solid var(--hairline); border-radius: 14px; padding: 12px 16px;
    background: color-mix(in srgb, var(--paper) 70%, var(--season-wash));
  }
  .searchbar .si { display: grid; color: var(--muted); }
  .searchbar :global(svg) { width: 20px; height: 20px; }
  .searchbar input { flex: 1; border: 0; background: transparent; color: var(--ink); font: 400 1.1rem var(--font-body); outline: none; }
  .searchbar input::placeholder { color: var(--muted); }
  kbd { font-family: var(--font-ui); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid var(--hairline); border-radius: 5px; padding: 2px 6px; color: var(--muted); }

  .count { color: var(--muted); font-family: var(--font-ui); font-size: 0.8rem; margin: 4px 0 14px; }
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .res { display: flex; align-items: center; gap: 16px; padding: 16px 2px; border-bottom: 1px solid var(--hairline); }
  .res .type { flex-shrink: 0; width: 76px; font-family: var(--font-ui); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: var(--season-ink); }
  .res .meta { flex: 1; min-width: 0; display: grid; gap: 3px; }
  .res .t { font-family: var(--font-body); font-weight: 620; font-size: 1.12rem; }
  .res .snip { color: var(--muted); font-size: 0.9rem; line-height: 1.5; }
  .res .go { color: var(--muted); display: grid; opacity: 0.5; }
  .res .go :global(svg) { width: 17px; height: 17px; }
  .res:hover .t { color: var(--season-ink); }

  .empty {
    display: grid; justify-items: center; text-align: center; gap: 10px; max-width: 30rem; margin: 8vh auto;
    color: var(--muted); font-family: var(--font-body); font-size: 1.05rem;
  }
  .e-ic { color: var(--season-gold); display: grid; }
  .e-ic :global(svg) { width: 34px; height: 34px; }
  .e-sub { font-family: var(--font-ui); font-size: 0.8rem; }
</style>
