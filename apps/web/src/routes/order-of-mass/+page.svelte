<script lang="ts">
  import { renderBody } from "$lib/api";
  import { icons } from "$lib/icons";
  import { mass, toggleMass } from "$lib/massMode.svelte";
  import { onMount } from "svelte";

  let { data } = $props();
  const items = $derived(data.items);

  // Movement scroll-spy (mirrors the day view's reading rail).
  let active = $state("");
  onMount(() => {
    active = String(items[0]?.slug ?? "");
    const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-mv]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) active = (e.target as HTMLElement).dataset.mv ?? active;
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  });
  function jump(slug: string | undefined) {
    if (slug) document.getElementById(`mv-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
</script>

<svelte:head>
  <title>Order of Mass — God's Word</title>
  <meta name="description" content="The Order of Mass — the Roman Rite set for celebration, with the parts of the priest and the people." />
</svelte:head>

<div class="ordo">
  <header class="ohead">
    <p class="eyebrow">The Roman Missal</p>
    <h1>Order of Mass</h1>
    <p class="lede">The Mass unfolds as a dialogue — the celebrant’s words in <span class="ck">red</span>, the people’s response set in <strong>bold</strong>, the rubrics in <em>italic</em>. Enter Mass Mode to keep the screen awake and the type large.</p>
    <button class="massbtn" class:on={mass.active} onclick={toggleMass}>
      {@html icons.candle}<span>{mass.active ? "Exit Mass Mode" : "Mass Mode"}</span>
    </button>
  </header>

  <div class="ordo-grid">
    <div class="ordo-flow reading">
      {#each items as item (item.slug)}
        <section id="mv-{item.slug}" data-mv={item.slug} class="movement">
          <div class="mv-num">{String(item.order ?? "").padStart(2, "0")}</div>
          <h2>{item.title}</h2>
          <div class="dialogue">{@html renderBody(item.body)}</div>
        </section>
      {/each}
      <p class="ordo-end">✠</p>
    </div>

    <nav class="ordo-rail" aria-label="Movements">
      {#each items as item (item.slug)}
        <button class:active={active === item.slug} onclick={() => jump(item.slug)}>{item.title}</button>
      {/each}
    </nav>
  </div>
</div>

<style>
  .ordo { min-width: 0; }
  .ohead { padding: clamp(30px, 6vw, 60px) clamp(20px, 5vw, 60px) 0; max-width: 46rem; }
  .eyebrow { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; font-weight: 600; color: var(--season-ink); margin: 0 0 10px; }
  .ohead h1 { font-family: var(--font-display); font-weight: 560; font-size: clamp(2rem, 5vw, 3rem); letter-spacing: -0.015em; margin: 0 0 14px; }
  .lede { font-family: var(--font-body); color: var(--muted); font-size: 1.05rem; line-height: 1.6; margin: 0 0 20px; max-width: 40rem; }
  .lede .ck { color: var(--brand-red); font-weight: 600; }
  .massbtn {
    display: inline-flex; align-items: center; gap: 9px; cursor: pointer;
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem; font-weight: 600;
    padding: 10px 18px; border-radius: 999px; border: 1px solid var(--season-ink); color: var(--season-ink); background: transparent;
  }
  .massbtn :global(svg) { width: 17px; height: 17px; }
  .massbtn.on { background: var(--season-ink); color: var(--paper); }

  .ordo-grid { display: grid; grid-template-columns: minmax(0, 1fr); }
  @media (min-width: 1080px) {
    .ordo-grid { grid-template-columns: minmax(0, 1fr) 210px; gap: 40px; align-items: start; }
  }
  .ordo-flow { padding: 20px clamp(20px, 5vw, 60px) 120px; max-width: 42rem; }

  .movement { padding-top: 40px; position: relative; }
  .mv-num { font-family: var(--font-ui); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.14em; color: var(--season-gold); }
  .movement h2 { font-family: var(--font-display); font-weight: 560; font-size: clamp(1.4rem, 3vw, 1.9rem); letter-spacing: -0.01em; margin: 2px 0 18px; }

  /* dialogue typesetting */
  .dialogue :global(p) { margin: 0 0 0.85em; max-width: var(--measure); }
  /* celebrant (priest) — red, with a versicle mark */
  .dialogue :global(.celebrant) { display: block; color: var(--brand-red); position: relative; padding-left: 1.5em; margin: 0 0 0.5em; }
  .dialogue :global(.celebrant)::before { content: "℣"; position: absolute; left: 0; color: var(--brand-red); opacity: 0.7; font-weight: 600; }
  /* congregation response (**bold**) — set apart, response mark, season ink */
  .dialogue :global(p) > :global(strong):only-child {
    display: block; color: var(--season-ink); font-weight: 640; padding-left: 1.5em; position: relative; margin: 0 0 0.5em;
  }
  .dialogue :global(p) > :global(strong):only-child::before { content: "℟"; position: absolute; left: 0; opacity: 0.7; }
  /* rubric (stage direction) — quiet italic, offset */
  .dialogue :global(.rubric) { display: block; font-style: italic; color: var(--muted); font-size: 0.95rem; margin: 0.4em 0 0.8em; }

  .ordo-end { text-align: center; color: var(--season-gold); font-size: 1.4rem; margin: 60px 0 0; }

  .ordo-rail { display: none; }
  @media (min-width: 1080px) {
    .ordo-rail { display: grid; gap: 2px; position: sticky; top: 30px; padding-top: 82px; }
    .ordo-rail button {
      text-align: left; background: none; border: 0; cursor: pointer;
      font-family: var(--font-ui); font-size: 0.74rem; letter-spacing: 0.02em;
      color: var(--muted); padding: 7px 0 7px 14px; border-left: 2px solid var(--hairline); line-height: 1.35;
    }
    .ordo-rail button.active { color: var(--season-ink); border-left-color: var(--season-ink); font-weight: 600; }
  }
</style>
