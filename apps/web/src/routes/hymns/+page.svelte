<script lang="ts">
  import { renderBody, groupByCategory, type CollectionItem } from "$lib/api";
  import { icons } from "$lib/icons";
  import { requestTrack, player } from "$lib/player.svelte";

  let { data } = $props();
  const groups = $derived(groupByCategory(data.items));
  let sel = $state(0);
  const current = $derived(groups[sel] ?? groups[0]);
  let open = $state<string | null>(null);

  function hasLyrics(h: CollectionItem) {
    return (h.body ?? "").trim().split("\n").length > 1;
  }
  function toggle(slug: string) {
    open = open === slug ? null : slug;
  }
  function playHymn(h: CollectionItem, e: Event) {
    e.stopPropagation();
    requestTrack({ title: h.title, subtitle: (h.composer as string) ?? "", src: h.audio });
  }
  const nowPlaying = $derived(player.track?.title ?? "");
</script>

<svelte:head>
  <title>Hymns — God's Word</title>
  <meta name="description" content="A collection of hymns for Holy Mass and devotion, with lyrics and audio." />
</svelte:head>

<div class="page-head">
  <p class="eyebrow">Sung Prayer</p>
  <h1>Hymns</h1>
</div>

{#if groups.length > 1}
  <div class="chips" style="padding: 0 clamp(20px,5vw,60px);">
    {#each groups as g, i}
      <button class="cat" class:sel={i === sel} onclick={() => (sel = i)}>{g.category}</button>
    {/each}
  </div>
{/if}

<div class="page-body wide">
  <ul class="hlist">
    {#each current?.items ?? [] as h (h.slug)}
      <li class="hitem" class:open={open === h.slug} class:playing={nowPlaying === h.title}>
        <button class="hrow" aria-expanded={open === h.slug} onclick={() => toggle(h.slug as string)}>
          <span class="hnum">{@html icons.note}</span>
          <span class="hmeta">
            <span class="ht">{h.title}</span>
            <span class="hs">{(h.composer as string) ?? ""}</span>
          </span>
          {#if h.audio}
            <span
              class="hplay" role="button" tabindex="0"
              aria-label={`Play ${h.title}`}
              onclick={(e) => playHymn(h, e)}
              onkeydown={(e) => e.key === "Enter" && playHymn(h, e)}
            >{@html icons.play}</span>
          {/if}
          {#if hasLyrics(h)}<span class="hchev">{@html icons.chevron}</span>{/if}
        </button>
        {#if open === h.slug && hasLyrics(h)}
          <div class="hlyrics">{@html renderBody(h.body)}</div>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .eyebrow { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; font-weight: 600; color: var(--season-ink); margin: 0 0 8px; }

  .hlist { list-style: none; margin: 6px 0 0; padding: 0; }
  .hitem { border-bottom: 1px solid var(--hairline); }
  .hrow {
    width: 100%; display: flex; align-items: center; gap: 16px; padding: 18px 2px;
    background: none; border: 0; cursor: pointer; text-align: left; color: inherit;
  }
  .hnum { color: var(--season-gold); display: grid; }
  .hnum :global(svg) { width: 20px; height: 20px; }
  .hmeta { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .ht { font-family: var(--font-body); font-weight: 620; font-size: 1.2rem; }
  .hs { font-family: var(--font-ui); font-size: 0.8rem; color: var(--muted); }
  .hitem.playing .ht { color: var(--season-ink); }
  .hplay {
    flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid var(--season-ink); color: var(--season-ink); background: transparent;
    display: grid; place-items: center; cursor: pointer;
  }
  .hplay :global(svg) { width: 16px; height: 16px; }
  .hplay:hover { background: var(--season-ink); color: var(--paper); }
  .hchev { color: var(--muted); display: grid; transition: transform 0.25s ease; }
  .hchev :global(svg) { width: 20px; height: 20px; }
  .hitem.open .hchev { transform: rotate(180deg); }

  .hlyrics {
    padding: 0 2px 26px 38px; max-width: var(--measure);
    font-family: var(--font-body); font-size: var(--text-reading); line-height: 1.7;
  }
  .hlyrics :global(p) { margin: 0 0 1em; white-space: pre-line; }
  .hlyrics :global(em) { color: var(--muted); }
</style>
