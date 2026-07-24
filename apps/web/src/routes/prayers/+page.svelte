<script lang="ts">
  import { renderBody, groupByCategory, type CollectionItem } from "$lib/api";

  let { data } = $props();
  const groups = $derived(groupByCategory(data.items));
  let sel = $state(0);
  const current = $derived(groups[sel] ?? groups[0]);

  const isLitany = (p: CollectionItem) => (p.category as string) === "Litanies";
  // A litany body is a list of invocations (one per line); the shared response
  // is "pray for us" (or the Kyrie lines, kept whole).
  function litanyLines(body: string) {
    return body
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => ({ text: l.replace(/,$/, ""), kyrie: /have mercy/i.test(l) }));
  }
</script>

<svelte:head>
  <title>Prayers — God's Word</title>
  <meta name="description" content="A treasury of Catholic prayers — the Our Father, Hail Mary, Marian prayers, litanies and devotions." />
</svelte:head>

<div class="page-head">
  <p class="eyebrow">A Treasury of Devotion</p>
  <h1>Prayers</h1>
</div>

{#if groups.length > 1}
  <div class="chips" style="padding: 0 clamp(20px,5vw,60px);">
    {#each groups as g, i}
      <button class="cat" class:sel={i === sel} onclick={() => (sel = i)}>{g.category}</button>
    {/each}
  </div>
{/if}

<div class="prayerbook">
  {#each current?.items ?? [] as p, i (p.slug)}
    <article class="prayer" class:litany={isLitany(p)}>
      {#if i > 0}<div class="leaf"><span class="g">❧</span></div>{/if}
      <h2>{p.title}</h2>
      {#if isLitany(p)}
        <div class="lit-cols">
          {#each litanyLines(p.body) as line}
            {#if line.kyrie}
              <p class="lit-kyrie">{line.text}</p>
            {:else}
              <p class="lit-line"><span>{line.text}</span><span class="resp">pray for us</span></p>
            {/if}
          {/each}
        </div>
      {:else}
        <div class="prayer-body">{@html renderBody(p.body)}</div>
      {/if}
    </article>
  {/each}
</div>

<style>
  .eyebrow { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; font-weight: 600; color: var(--season-ink); margin: 0 0 8px; }

  .prayerbook { max-width: 44rem; margin: 0 auto; padding: 14px clamp(20px, 5vw, 60px) 100px; }
  .prayer { text-align: center; }
  .prayer h2 { font-family: var(--font-display); font-weight: 560; font-size: clamp(1.5rem, 3.4vw, 2.1rem); letter-spacing: -0.01em; margin: 1.2rem 0 1rem; }
  .prayer-body { font-family: var(--font-body); font-size: var(--text-reading); line-height: 1.85; }
  .prayer-body :global(p) { margin: 0 0 1em; white-space: pre-line; }
  .prayer-body :global(strong) { color: var(--season-ink); font-weight: 640; }
  .prayer-body :global(em) { color: var(--muted); }

  /* litany — two columns of invocations that share a response */
  .prayer.litany { text-align: left; }
  .prayer.litany h2 { text-align: center; }
  .lit-cols { columns: 2; column-gap: 40px; font-family: var(--font-body); }
  @media (max-width: 620px) { .lit-cols { columns: 1; } }
  .lit-kyrie { break-inside: avoid; text-align: center; color: var(--season-ink); font-style: italic; margin: 0 0 0.8em; column-span: all; }
  .lit-line {
    break-inside: avoid; display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
    margin: 0 0 0.5em; border-bottom: 1px dotted var(--hairline); padding-bottom: 0.4em;
  }
  .lit-line .resp { font-family: var(--font-ui); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--season-ink); white-space: nowrap; opacity: 0.75; }
</style>
