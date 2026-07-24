<script lang="ts">
  /**
   * Prayers — three levels, one page:
   *   tiles (categories) → list (prayers in a category) → fullscreen reader.
   * The reader is a real overlay so a prayer can be read at arm's length.
   */
  import { renderBody, groupByCategory, type CollectionItem } from "$lib/api";
  import { icons } from "$lib/icons";

  let { data } = $props();
  const groups = $derived(groupByCategory(data.items));

  let cat = $state<string | null>(null);
  let open = $state<CollectionItem | null>(null);

  const current = $derived(groups.find((g) => g.category === cat) ?? null);

  /** An icon per category, falling back to beads. */
  const ICON: Record<string, string> = {
    "Common Prayers": icons.beads,
    Marian: icons.mary,
    Litanies: icons.notes,
    "Holy Rosary": icons.beads,
    Novenas: icons.candle,
    "Way of the Cross": icons.cross,
    "Divine Mercy": icons.angel,
    Healing: icons.church
  };
  const iconFor = (c: string) => ICON[c] ?? icons.beads;

  const isLitany = (p: CollectionItem) => (p.category as string) === "Litanies";
  /**
   * Short devotional prayers read beautifully centred; longer or list-shaped
   * texts (mysteries, stations, chaplets) need a left edge to track along.
   */
  const isLong = (p: CollectionItem) =>
    (p.body ?? "").length > 380 || ((p.body ?? "").match(/\*\*/g)?.length ?? 0) >= 6;
  function litanyLines(body: string) {
    return body
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => ({ text: l.replace(/,$/, ""), kyrie: /have mercy/i.test(l) }));
  }

  function openPrayer(p: CollectionItem) {
    open = p;
    document.body.style.overflow = "hidden";
  }
  function closePrayer() {
    open = null;
    document.body.style.overflow = "";
  }

  $effect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePrayer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

<svelte:head>
  <title>Prayers — God's Word</title>
  <meta name="description" content="A treasury of Catholic prayers — the Our Father, Hail Mary, Marian prayers, litanies and devotions." />
</svelte:head>

<div class="page-head">
  <p class="eyebrow">A Treasury of Devotion</p>
  <h1>Prayers</h1>
  {#if cat}
    <button class="crumb" onclick={() => (cat = null)}>{@html icons.prev}<span>All categories</span></button>
  {/if}
</div>

<div class="page-body wide">
  {#if !cat}
    <!-- Level 1: large category tiles -->
    <ul class="tiles">
      {#each groups as g (g.category)}
        <li>
          <button class="tile" onclick={() => (cat = g.category)}>
            <span class="tile-ic">{@html iconFor(g.category)}</span>
            <span class="tile-t">{g.category}</span>
            <span class="tile-n">{g.items.length} {g.items.length === 1 ? "prayer" : "prayers"}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <!-- Level 2: prayers in the chosen category -->
    <ul class="plist">
      {#each current?.items ?? [] as p (p.slug)}
        <li>
          <button class="prow" onclick={() => openPrayer(p)}>
            <span class="prow-ic">{@html iconFor(cat)}</span>
            <span class="prow-t">{p.title}</span>
            <span class="prow-go">{@html icons.chevronRight}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<!-- Level 3: fullscreen reader -->
{#if open}
  <div class="reader" role="dialog" aria-modal="true" aria-label={open.title}>
    <button class="reader-x" onclick={closePrayer} aria-label="Close prayer">{@html icons.close}</button>
    <div class="reader-scroll">
      <article class="reader-body" class:litany={isLitany(open)} class:long={isLong(open)}>
        <p class="reader-cat">{open.category}</p>
        <h2>{open.title}</h2>
        {#if isLitany(open)}
          <div class="lit-cols">
            {#each litanyLines(open.body) as line}
              {#if line.kyrie}
                <p class="lit-kyrie">{line.text}</p>
              {:else}
                <p class="lit-line"><span>{line.text}</span><span class="resp">pray for us</span></p>
              {/if}
            {/each}
          </div>
        {:else}
          <div class="prayer-body">{@html renderBody(open.body)}</div>
        {/if}
        <p class="reader-end">✠</p>
      </article>
    </div>
  </div>
{/if}

<style>
  .crumb {
    display: inline-flex; align-items: center; gap: 7px; margin-top: 14px; cursor: pointer;
    background: none; border: 1px solid var(--hairline); border-radius: 999px; padding: 8px 16px;
    color: var(--season-ink); font-family: var(--font-ui); font-size: 0.72rem;
    text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;
  }
  .crumb :global(svg) { width: 15px; height: 15px; }

  /* ---- tiles ---- */
  .tiles {
    list-style: none; margin: 14px 0 0; padding: 0;
    display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  }
  .tile {
    width: 100%; min-height: 168px; cursor: pointer; text-align: left;
    display: grid; align-content: space-between; gap: 14px; padding: 22px;
    border: 1px solid var(--hairline); border-radius: 16px; color: inherit;
    background: linear-gradient(165deg, color-mix(in srgb, var(--season-ink) 7%, transparent), transparent);
    transition: border-color 0.18s ease, transform 0.18s ease;
  }
  .tile:hover { border-color: var(--season-ink); transform: translateY(-2px); }
  .tile-ic { color: var(--season-gold); display: grid; }
  .tile-ic :global(svg) { width: 30px; height: 30px; stroke-width: 1.4; }
  .tile-t { font-family: var(--font-display); font-weight: 560; font-size: 1.35rem; line-height: 1.15; letter-spacing: -0.01em; }
  .tile-n { font-family: var(--font-ui); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }

  /* ---- list ---- */
  .plist { list-style: none; margin: 14px 0 0; padding: 0; }
  .prow {
    width: 100%; display: flex; align-items: center; gap: 16px; padding: 18px 4px; cursor: pointer;
    background: none; border: 0; border-bottom: 1px solid var(--hairline); color: inherit; text-align: left;
  }
  .prow-ic { color: var(--season-gold); display: grid; flex-shrink: 0; }
  .prow-ic :global(svg) { width: 20px; height: 20px; }
  .prow-t { flex: 1; font-family: var(--font-body); font-weight: 600; font-size: 1.18rem; }
  .prow-go { color: var(--muted); display: grid; opacity: 0.5; }
  .prow-go :global(svg) { width: 17px; height: 17px; }
  .prow:hover .prow-t { color: var(--season-ink); }

  /* ---- fullscreen reader ---- */
  .reader {
    position: fixed; inset: 0; z-index: 120; background: var(--paper);
    animation: rise 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes rise { from { opacity: 0; transform: translateY(12px); } }
  .reader-x {
    position: fixed; top: 14px; right: 14px; z-index: 2;
    width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
    border: 1px solid var(--hairline); background: var(--paper); color: var(--ink);
    display: grid; place-items: center;
  }
  .reader-x :global(svg) { width: 20px; height: 20px; }
  .reader-scroll { height: 100dvh; overflow-y: auto; }
  .reader-body {
    max-width: 40rem; margin: 0 auto; padding: clamp(56px, 12vh, 110px) clamp(22px, 6vw, 40px) 90px;
    text-align: center;
  }
  .reader-cat {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.68rem;
    font-weight: 600; color: var(--season-ink); margin: 0 0 12px;
  }
  .reader-body h2 {
    font-family: var(--font-display); font-weight: 560; font-size: clamp(1.9rem, 5.5vw, 2.8rem);
    letter-spacing: -0.015em; margin: 0 0 1.6rem; text-wrap: balance;
  }
  /* Longer / list-shaped prayers get a left edge to read along. */
  .reader-body.long { text-align: left; }
  .reader-body.long h2, .reader-body.long .reader-cat, .reader-body.long .reader-end { text-align: center; }
  .reader-body.long :global(em:only-child) { display: block; text-align: center; }

  .prayer-body { font-family: var(--font-body); font-size: var(--text-reading); line-height: 1.9; }
  .prayer-body :global(p) { margin: 0 0 1.1em; white-space: pre-line; }
  .prayer-body :global(strong) { color: var(--season-ink); font-weight: 640; }
  .prayer-body :global(em) { color: var(--muted); }
  .reader-end { color: var(--season-gold); font-size: 1.4rem; margin: 2.4rem 0 0; }

  /* litany inside the reader */
  .reader-body.litany { text-align: left; }
  .reader-body.litany h2, .reader-body.litany .reader-cat { text-align: center; }
  .lit-cols { columns: 2; column-gap: 40px; font-family: var(--font-body); }
  @media (max-width: 620px) { .lit-cols { columns: 1; } }
  .lit-kyrie { break-inside: avoid; text-align: center; color: var(--season-ink); font-style: italic; margin: 0 0 0.8em; column-span: all; }
  .lit-line {
    break-inside: avoid; display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
    margin: 0 0 0.5em; border-bottom: 1px dotted var(--hairline); padding-bottom: 0.4em;
  }
  .lit-line .resp {
    font-family: var(--font-ui); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--season-ink); white-space: nowrap; opacity: 0.75;
  }
</style>
