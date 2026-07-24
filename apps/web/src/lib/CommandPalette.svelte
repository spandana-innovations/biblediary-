<script lang="ts">
  import { onMount, tick } from "svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { getSearch, type SearchItem } from "$lib/api";
  import { icons } from "$lib/icons";
  import { palette, openPalette, closePalette } from "$lib/palette.svelte";

  let items: SearchItem[] = $state([]);
  let loaded = $state(false);
  let q = $state("");
  let sel = $state(0);
  let input: HTMLInputElement | null = $state(null);

  const results = $derived.by(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items.slice(0, 8);
    const terms = query.split(/\s+/);
    const scored = items
      .map((it) => {
        const hay = `${it.title} ${it.sub} ${it.text}`.toLowerCase();
        let score = 0;
        for (const t of terms) {
          const i = hay.indexOf(t);
          if (i < 0) return null;
          score += i < it.title.toLowerCase().length ? 3 : 1;
        }
        return { it, score };
      })
      .filter(Boolean) as { it: SearchItem; score: number }[];
    return scored.sort((a, b) => b.score - a.score).slice(0, 12).map((s) => s.it);
  });

  async function ensureLoaded() {
    if (loaded) return;
    try {
      items = await getSearch(fetch);
      loaded = true;
    } catch {
      /* offline / not built */
    }
  }

  async function open() {
    openPalette();
    await ensureLoaded();
    await tick();
    input?.focus();
  }

  function snippet(it: SearchItem) {
    const query = q.trim().toLowerCase();
    if (!query) return it.sub;
    const i = it.text.toLowerCase().indexOf(query.split(/\s+/)[0]);
    if (i < 0) return it.sub;
    return "…" + it.text.slice(Math.max(0, i - 24), i + 60).trim() + "…";
  }

  function choose(it: SearchItem) {
    closePalette();
    q = "";
    goto(`${base}/${it.url}`);
  }

  function onKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.open ? closePalette() : open();
      return;
    }
    if (!palette.open) return;
    if (e.key === "Escape") closePalette();
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); }
    else if (e.key === "Enter" && results[sel]) { e.preventDefault(); choose(results[sel]); }
  }

  $effect(() => { q; sel = 0; });

  onMount(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Allow other components (nav "Search") to open us.
  $effect(() => {
    if (palette.open && !loaded) ensureLoaded().then(() => tick()).then(() => input?.focus());
  });
</script>

{#if palette.open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="pal-scrim" onclick={closePalette} role="presentation">
    <div class="pal" role="dialog" aria-modal="true" aria-label="Search" tabindex="-1" onclick={(e) => e.stopPropagation()}>
      <div class="pal-in">
        <span class="pal-ic">{@html icons.search}</span>
        <input
          bind:this={input} bind:value={q}
          placeholder="Search readings, prayers, hymns…"
          aria-label="Search" autocomplete="off" spellcheck="false"
        />
        <kbd>esc</kbd>
      </div>
      <ul class="pal-list">
        {#each results as it, i (it.url + it.title)}
          <li>
            <button class:sel={i === sel} onclick={() => choose(it)} onmouseenter={() => (sel = i)}>
              <span class="pal-type">{it.type}</span>
              <span class="pal-meta">
                <span class="pal-title">{it.title}</span>
                <span class="pal-sub">{snippet(it)}</span>
              </span>
              <span class="pal-go">{@html icons.chevronRight}</span>
            </button>
          </li>
        {:else}
          <li class="pal-empty">{loaded ? "Nothing found." : "Loading…"}</li>
        {/each}
      </ul>
      <div class="pal-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
        <span><kbd>↵</kbd> to open</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .pal-scrim {
    position: fixed; inset: 0; z-index: 100; background: color-mix(in srgb, var(--ink) 32%, transparent);
    backdrop-filter: blur(3px); display: grid; align-items: start; justify-items: center; padding: 12vh 16px 16px;
    animation: fade 0.15s ease;
  }
  @keyframes fade { from { opacity: 0; } }
  .pal {
    width: min(600px, 100%); background: var(--paper); border: 1px solid var(--hairline);
    border-radius: 16px; box-shadow: 0 24px 60px -20px color-mix(in srgb, var(--ink) 55%, transparent);
    overflow: hidden;
  }
  .pal-in { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--hairline); }
  .pal-ic { color: var(--muted); display: grid; }
  .pal-ic :global(svg) { width: 20px; height: 20px; }
  .pal-in input {
    flex: 1; border: 0; background: none; outline: none; color: var(--ink);
    font-family: var(--font-body); font-size: 1.15rem;
  }
  kbd {
    font-family: var(--font-ui); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em;
    border: 1px solid var(--hairline); border-radius: 5px; padding: 2px 6px; color: var(--muted);
  }
  .pal-list { list-style: none; margin: 0; padding: 6px; max-height: 52vh; overflow-y: auto; }
  .pal-list > li > button {
    width: 100%; display: flex; align-items: center; gap: 14px; text-align: left;
    padding: 11px 12px; border: 0; background: none; border-radius: 10px; cursor: pointer; color: inherit;
  }
  .pal-list > li > button.sel { background: color-mix(in srgb, var(--season-ink) 13%, transparent); }
  .pal-type {
    flex-shrink: 0; width: 68px; font-family: var(--font-ui); font-size: 0.6rem; text-transform: uppercase;
    letter-spacing: 0.08em; font-weight: 600; color: var(--season-ink);
  }
  .pal-meta { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .pal-title { font-family: var(--font-body); font-weight: 620; font-size: 1.02rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pal-sub { font-family: var(--font-ui); font-size: 0.76rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pal-go { color: var(--muted); display: grid; opacity: 0.6; }
  .pal-go :global(svg) { width: 16px; height: 16px; }
  .pal-empty { padding: 26px; text-align: center; color: var(--muted); font-family: var(--font-ui); font-size: 0.85rem; }
  .pal-foot { display: flex; gap: 16px; padding: 10px 18px; border-top: 1px solid var(--hairline); }
  .pal-foot span { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-ui); font-size: 0.68rem; color: var(--muted); }
</style>
