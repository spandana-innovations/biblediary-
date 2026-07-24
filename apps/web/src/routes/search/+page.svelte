<script lang="ts">
  import RedHeader from "$lib/RedHeader.svelte";
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";
  import type { SearchItem } from "$lib/api";

  let { data } = $props();
  let q = $state("");

  const results = $derived.by(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [] as SearchItem[];
    return (data.items as SearchItem[])
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

<svelte:head><title>Search</title></svelte:head>

<RedHeader title="Search">
  {#snippet children()}
    <div class="searchbar">
      <span class="si">{@html icons.search}</span>
      <input
        type="search"
        placeholder="Search readings, prayers, hymns…"
        bind:value={q}
        autocomplete="off"
      />
    </div>
  {/snippet}
</RedHeader>

<div class="sheet">
  {#if q.trim() === ""}
    <p class="hint">Type to search across daily readings, prayers, hymns and the Order of Mass.</p>
  {:else if results.length === 0}
    <p class="hint">No matches for “{q}”.</p>
  {:else}
    <p class="count">{results.length} result{results.length === 1 ? "" : "s"}</p>
    <div class="list">
      {#each results as r}
        <a class="res" href={`${base}/${r.url}`}>
          <span class="badge">{r.type}</span>
          <span class="t">{r.title}</span>
          {#if r.sub}<span class="s">{r.sub}</span>{/if}
          <span class="snip">{snippet(r)}</span>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .searchbar {
    display: flex; align-items: center; gap: 10px; margin-top: 18px; position: relative; z-index: 2;
    background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 14px; padding: 10px 14px;
  }
  .searchbar .si { display: grid; color: #fff; opacity: 0.9; }
  .searchbar :global(svg) { width: 20px; height: 20px; }
  .searchbar input {
    flex: 1; border: 0; background: transparent; color: #fff; font: 500 1rem var(--font-body); outline: none;
  }
  .searchbar input::placeholder { color: rgba(255, 255, 255, 0.75); }
  .hint, .count { color: var(--muted); }
  .count { font-size: 0.85rem; margin: 0 0 12px; }
  .list { display: flex; flex-direction: column; gap: 12px; }
  .res {
    display: grid; gap: 3px; padding: 14px 16px; border-radius: 14px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--row) 45%, var(--sheet)), var(--row));
    border: 1px solid var(--hairline); box-shadow: var(--shadow-sm);
  }
  .res:hover { box-shadow: var(--shadow-md); }
  .res .badge {
    justify-self: start; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;
    color: var(--brand); background: color-mix(in srgb, var(--brand) 12%, transparent);
    padding: 2px 8px; border-radius: 999px;
  }
  .res .t { font-weight: 600; font-size: 1.05rem; }
  .res .s { color: var(--muted); font-size: 0.85rem; }
  .res .snip { color: var(--muted); font-size: 0.9rem; line-height: 1.5; }
</style>
