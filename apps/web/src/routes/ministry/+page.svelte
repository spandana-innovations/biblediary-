<script lang="ts">
  /**
   * Ministry — what "Prayers" becomes in priest mode. Three blocks in order:
   * Homily Tips (with its own date selector), Reflections, then the prayer
   * collection exactly as before.
   */
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import {
    renderBody, groupByCategory, getDay, todayISO, nearestDate,
    type Day, type Section, type CollectionItem
  } from "$lib/api";
  import { icons } from "$lib/icons";
  import { settings } from "$lib/settings.svelte";

  let { data } = $props();

  // ---- day-scoped blocks (homily + reflection) ----
  let day = $state<Day | null>(data.day);
  let loading = $state(false);
  const dates = $derived((data.index?.dates ?? []) as string[]);
  const at = $derived(day ? dates.indexOf(day.date) : -1);

  onMount(() => {
    const want = nearestDate(data.index?.dates ?? [], todayISO());
    if (want && want !== data.day?.date) getDay(fetch, want).then((d) => (day = d)).catch(() => {});
  });

  async function load(target: string | undefined) {
    if (!target || loading) return;
    loading = true;
    try { day = await getDay(fetch, target); } catch { /* keep current */ } finally { loading = false; }
  }
  const step = (d: number) => load(dates[at + d]);
  function pickDate(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    if (!v) return;
    if (dates.includes(v)) return void load(v);
    const t = Date.parse(v);
    load([...dates].sort((a, b) => Math.abs(Date.parse(a) - t) - Math.abs(Date.parse(b) - t))[0]);
  }

  const sectionOf = (k: string) => ((day?.sections ?? []) as Section[]).find((s) => s.key === k) ?? null;
  const homily = $derived(sectionOf("homily"));
  const reflection = $derived(sectionOf("reflection"));

  const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function dateLine(d?: string) {
    if (!d) return "";
    const [y, m, dd] = d.split("-").map(Number);
    return `${WEEK[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]}, ${dd} ${MON[m - 1]} ${y}`;
  }

  // ---- prayers block ----
  const groups = $derived(groupByCategory(data.prayers));

  /** Landing shows three blocks; picking one opens its own flow. */
  let view = $state<"home" | "homily" | "reflection" | "prayers">("home");
  let cat = $state<string | null>(null);
  function back() {
    if (view === "prayers" && cat) cat = null;
    else view = "home";
  }
  let open = $state<CollectionItem | null>(null);
  const current = $derived(groups.find((g) => g.category === cat) ?? null);

  const ICON: Record<string, string> = {
    "Common Prayers": icons.beads, Marian: icons.mary, Litanies: icons.notes,
    "Holy Rosary": icons.beads, Novenas: icons.candle, "Way of the Cross": icons.cross,
    "Divine Mercy": icons.angel, Healing: icons.church
  };
  const iconFor = (c: string) => ICON[c] ?? icons.beads;
  const isLitany = (p: CollectionItem) => (p.category as string) === "Litanies";
  const isLong = (p: CollectionItem) =>
    (p.body ?? "").length > 380 || ((p.body ?? "").match(/\*\*/g)?.length ?? 0) >= 6;
  function litanyLines(body: string) {
    return body.split("\n").map((l) => l.trim()).filter(Boolean)
      .map((l) => ({ text: l.replace(/,$/, ""), kyrie: /have mercy/i.test(l) }));
  }
  function openPrayer(p: CollectionItem) { open = p; document.body.style.overflow = "hidden"; }
  function closePrayer() { open = null; document.body.style.overflow = ""; }
  $effect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePrayer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

<svelte:head>
  <title>Ministry — God's Word</title>
  <meta name="description" content="Homily tips, reflections and the prayer collection." />
</svelte:head>

<div class="page-head">
  <p class="eyebrow">For Those Who Preach &amp; Lead</p>
  <h1>Ministry</h1>
  {#if !settings.priestMode}
    <p class="note">Priest mode is off — turn it on in Settings to keep this section.</p>
  {/if}
  {#if view !== "home"}
    <button class="crumb" onclick={back}>{@html icons.prev}<span>{view === "prayers" && cat ? "All categories" : "Ministry"}</span></button>
  {/if}
</div>

<div class="page-body wide">
  {#if view === "home"}
    <!-- Landing: three blocks -->
    <ul class="tiles">
      <li>
        <button class="tile" onclick={() => (view = "homily")}>
          <span class="tile-ic">{@html icons.quote}</span>
          <span class="tile-t">Homily Tips</span>
          <span class="tile-n">For the day’s Gospel</span>
        </button>
      </li>
      <li>
        <button class="tile" onclick={() => (view = "reflection")}>
          <span class="tile-ic">{@html icons.book}</span>
          <span class="tile-t">Reflections</span>
          <span class="tile-n">Daily commentary</span>
        </button>
      </li>
      <li>
        <button class="tile" onclick={() => (view = "prayers")}>
          <span class="tile-ic">{@html icons.beads}</span>
          <span class="tile-t">Prayers</span>
          <span class="tile-n">{data.prayers.length} in {groups.length} categories</span>
        </button>
      </li>
    </ul>
  {/if}

  {#if view === "homily"}
  <!-- 1. Homily tips, with its own date selector -->
  <section class="block">
    <header class="bh">
      <span class="bh-ic">{@html icons.quote}</span>
      <h2>Homily Tips</h2>
    </header>

    <nav class="datebar" aria-label="Choose a day">
      <button class="arrow" onclick={() => step(-1)} disabled={at <= 0 || loading} aria-label="Previous day">{@html icons.prev}</button>
      <label class="picker">
        {@html icons.calendar}
        <span class="pl">{dateLine(day?.date)}</span>
        <input type="date" value={day?.date ?? ""} onchange={pickDate} aria-label="Jump to a date" />
      </label>
      <button class="arrow" onclick={() => step(1)} disabled={at < 0 || at >= dates.length - 1 || loading} aria-label="Next day">{@html icons.next}</button>
    </nav>

    {#if homily}
      {#if homily.ref}<p class="ref">{homily.ref}</p>{/if}
      <div class="prose reading">{@html renderBody(homily.body)}</div>
    {:else}
      <p class="empty">No homily tip recorded for this day.</p>
    {/if}
  </section>
  {/if}

  {#if view === "reflection"}
  <!-- 2. Reflection for the same day -->
  <section class="block">
    <header class="bh">
      <span class="bh-ic">{@html icons.book}</span>
      <h2>Reflection</h2>
    </header>

    <nav class="datebar" aria-label="Choose a day">
      <button class="arrow" onclick={() => step(-1)} disabled={at <= 0 || loading} aria-label="Previous day">{@html icons.prev}</button>
      <label class="picker">
        {@html icons.calendar}
        <span class="pl">{dateLine(day?.date)}</span>
        <input type="date" value={day?.date ?? ""} onchange={pickDate} aria-label="Jump to a date" />
      </label>
      <button class="arrow" onclick={() => step(1)} disabled={at < 0 || at >= dates.length - 1 || loading} aria-label="Next day">{@html icons.next}</button>
    </nav>

    {#if reflection}
      <div class="prose reading">{@html renderBody(reflection.body)}</div>
    {:else}
      <p class="empty">No reflection recorded for this day.</p>
    {/if}
    <a class="more" href="{base}/{(day?.date ?? '').replaceAll('-', '/')}/">Full readings for this day →</a>
  </section>
  {/if}

  {#if view === "prayers"}
  <!-- 3. Prayers, as on the Prayers page -->
  <section class="block">
    <header class="bh">
      <span class="bh-ic">{@html icons.beads}</span>
      <h2>{cat ?? "Prayers"}</h2>
    </header>

    {#if !cat}
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
  </section>
  {/if}
</div>

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
              {#if line.kyrie}<p class="lit-kyrie">{line.text}</p>
              {:else}<p class="lit-line"><span>{line.text}</span><span class="resp">pray for us</span></p>{/if}
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
  .note { color: var(--muted); font-family: var(--font-ui); font-size: 0.8rem; margin-top: 10px; }

  .block { margin: 10px 0; }
  .bh { display: flex; align-items: center; gap: 12px; margin: 0 0 16px; }
  .bh-ic { display: grid; color: var(--season-gold); }
  .bh-ic :global(svg) { width: 22px; height: 22px; }
  .bh h2 {
    font-family: var(--font-display); font-weight: 560; font-size: clamp(1.4rem, 3.2vw, 1.9rem);
    letter-spacing: -0.01em; margin: 0; flex: 1;
  }

  .datebar { display: flex; align-items: center; gap: 10px; margin: 0 0 18px; flex-wrap: nowrap; }
  .datebar .arrow, .picker {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 42px; border: 1px solid var(--hairline); border-radius: 999px;
    background: transparent; color: var(--season-ink); font-family: var(--font-ui); font-weight: 600; cursor: pointer;
  }
  .datebar .arrow { width: 42px; flex-shrink: 0; }
  .datebar .arrow:disabled { opacity: 0.3; cursor: default; }
  .datebar :global(svg) { width: 17px; height: 17px; }
  .picker { position: relative; color: var(--ink); padding: 0 16px; font-size: 0.85rem; min-width: 0; }
  .picker .pl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .picker input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; border: 0; padding: 0; }

  .ref { font-variant-caps: all-small-caps; letter-spacing: 0.04em; color: var(--season-ink); margin: 0 0 0.7rem; font-size: 1.02rem; }
  .prose { font-size: var(--text-reading); line-height: var(--leading-reading); max-width: var(--measure); }
  .prose :global(p) { margin: 0 0 1.05em; }
  .empty { color: var(--muted); font-style: italic; }
  .more {
    display: inline-block; margin-top: 1rem; font-family: var(--font-ui); font-size: 0.72rem;
    text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: var(--season-ink);
  }

  .crumb {
    display: inline-flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0;
    background: none; border: 1px solid var(--hairline); border-radius: 999px; padding: 7px 14px;
    color: var(--season-ink); font-family: var(--font-ui); font-size: 0.68rem;
    text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;
  }
  .crumb :global(svg) { width: 14px; height: 14px; }

  .tiles { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 640px) { .tiles { gap: 14px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); } }
  .tile {
    width: 100%; min-height: 148px; cursor: pointer; text-align: left;
    display: grid; align-content: space-between; gap: 12px; padding: 18px;
    border: 1px solid var(--hairline); border-radius: 16px; color: inherit;
    background: linear-gradient(165deg, color-mix(in srgb, var(--season-ink) 7%, transparent), transparent);
    transition: border-color 0.18s ease, transform 0.18s ease;
  }
  .tile:hover { border-color: var(--season-ink); transform: translateY(-2px); }
  .tile-ic { color: var(--season-gold); display: grid; }
  .tile-ic :global(svg) { width: 26px; height: 26px; stroke-width: 1.4; }
  .tile-t { font-family: var(--font-display); font-weight: 560; font-size: clamp(1.05rem, 3.6vw, 1.35rem); line-height: 1.15; letter-spacing: -0.01em; }
  .tile-n { font-family: var(--font-ui); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }

  .plist { list-style: none; margin: 0; padding: 0; }
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

  .reader { position: fixed; inset: 0; z-index: 120; background: var(--paper); animation: rise 0.24s cubic-bezier(0.22, 1, 0.36, 1); }
  @keyframes rise { from { opacity: 0; transform: translateY(12px); } }
  .reader-x {
    position: fixed; top: 14px; right: 14px; z-index: 2; width: 46px; height: 46px; border-radius: 50%;
    cursor: pointer; border: 1px solid var(--hairline); background: var(--paper); color: var(--ink);
    display: grid; place-items: center;
  }
  .reader-x :global(svg) { width: 20px; height: 20px; }
  .reader-scroll { height: 100dvh; overflow-y: auto; }
  .reader-body { max-width: 40rem; margin: 0 auto; padding: clamp(56px, 12vh, 110px) clamp(22px, 6vw, 40px) 90px; text-align: center; }
  .reader-cat { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.68rem; font-weight: 600; color: var(--season-ink); margin: 0 0 12px; }
  .reader-body h2 { font-family: var(--font-display); font-weight: 560; font-size: clamp(1.9rem, 5.5vw, 2.8rem); letter-spacing: -0.015em; margin: 0 0 1.6rem; text-wrap: balance; }
  .reader-body.long, .reader-body.litany { text-align: left; }
  .reader-body.long h2, .reader-body.long .reader-cat, .reader-body.long .reader-end,
  .reader-body.litany h2, .reader-body.litany .reader-cat { text-align: center; }
  .prayer-body { font-family: var(--font-body); font-size: var(--text-reading); line-height: 1.9; }
  .prayer-body :global(p) { margin: 0 0 1.1em; white-space: pre-line; }
  .prayer-body :global(strong) { color: var(--season-ink); font-weight: 640; }
  .reader-end { color: var(--season-gold); font-size: 1.4rem; margin: 2.4rem 0 0; }
  .lit-cols { columns: 2; column-gap: 40px; font-family: var(--font-body); }
  @media (max-width: 620px) { .lit-cols { columns: 1; } }
  .lit-kyrie { break-inside: avoid; text-align: center; color: var(--season-ink); font-style: italic; margin: 0 0 0.8em; column-span: all; }
  .lit-line { break-inside: avoid; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 0 0 0.5em; border-bottom: 1px dotted var(--hairline); padding-bottom: 0.4em; }
  .lit-line .resp { font-family: var(--font-ui); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--season-ink); white-space: nowrap; opacity: 0.75; }
</style>
