<script lang="ts">
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";
  import { todayISO, nearestDate } from "$lib/api";

  let { data } = $props();
  const dates = $derived((data.index?.dates ?? []) as string[]);
  const available = $derived(new Set(dates));
  const today = todayISO();

  // Open on the month of the nearest available date (so it has content).
  const startISO = nearestDate((data.index?.dates ?? []) as string[], today) ?? today;
  let year = $state(Number(startISO.slice(0, 4)));
  let month = $state(Number(startISO.slice(5, 7)) - 1); // 0-indexed

  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DOW = ["S", "M", "T", "W", "T", "F", "S"];

  const cells = $derived.by(() => {
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < first; i++) out.push(null);
    for (let d = 1; d <= count; d++) out.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    return out;
  });
  const hasThisMonth = $derived(cells.some((c) => c && available.has(c)));

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    month = m; year = y;
  }
  const href = (iso: string) => `${base}/${iso.replaceAll("-", "/")}/`;
  const monthsWithContent = $derived([...new Set(dates.map((d) => d.slice(0, 7)))].sort());
</script>

<svelte:head>
  <title>Calendar — God's Word</title>
  <meta name="description" content="Browse the liturgical calendar and jump to any day's readings." />
</svelte:head>

<div class="page-head">
  <p class="eyebrow">The Liturgical Year</p>
  <div class="monthbar">
    <button class="mnav" onclick={() => shift(-1)} aria-label="Previous month">{@html icons.prev}</button>
    <h1>{MON[month]} {year}</h1>
    <button class="mnav" onclick={() => shift(1)} aria-label="Next month">{@html icons.next}</button>
  </div>
</div>

<div class="page-body wide">
  <div class="grid dow">
    {#each DOW as d, i}<span class="dowc">{d}<span class="sr">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]}</span></span>{/each}
  </div>
  <div class="grid">
    {#each cells as iso}
      {#if iso === null}
        <span class="cell empty"></span>
      {:else if available.has(iso)}
        <a class="cell has" class:today={iso === today} href={href(iso)} aria-label={`Readings for ${iso}`}>{Number(iso.slice(8))}</a>
      {:else}
        <span class="cell off" class:today={iso === today}>{Number(iso.slice(8))}</span>
      {/if}
    {/each}
  </div>

  {#if !hasThisMonth}
    <p class="none">No readings loaded for {MON[month]} {year} yet.</p>
  {/if}

  {#if monthsWithContent.length}
    <h2 class="jump-h">Jump to a month with readings</h2>
    <div class="jump">
      {#each monthsWithContent as ym}
        <button
          class="chip" class:active={ym === `${year}-${String(month + 1).padStart(2, "0")}`}
          onclick={() => { year = Number(ym.slice(0, 4)); month = Number(ym.slice(5, 7)) - 1; }}
        >{MON[Number(ym.slice(5, 7)) - 1]} {ym.slice(0, 4)}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .eyebrow { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; font-weight: 600; color: var(--season-ink); margin: 0 0 12px; }
  .monthbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; max-width: 30rem; }
  .monthbar h1 { font-family: var(--font-display); font-weight: 560; font-size: clamp(1.6rem, 4vw, 2.3rem); letter-spacing: -0.01em; margin: 0; text-align: center; }
  .mnav { width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--hairline); background: transparent; color: var(--season-ink); display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
  .mnav :global(svg) { width: 20px; height: 20px; }

  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; max-width: 34rem; }
  .dow { margin: 20px 0 6px; }
  .dowc { text-align: center; color: var(--muted); font-family: var(--font-ui); font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .cell { aspect-ratio: 1; display: grid; place-items: center; border-radius: 10px; font-size: 0.98rem; font-family: var(--font-body); font-variant-numeric: tabular-nums; }
  .cell.off { color: var(--muted); opacity: 0.5; }
  .cell.has { color: var(--season-ink); font-weight: 640; border: 1px solid color-mix(in srgb, var(--season-ink) 26%, transparent); background: color-mix(in srgb, var(--season-ink) 7%, transparent); }
  .cell.has:hover { background: var(--season-ink); color: var(--paper); }
  .cell.today { outline: 2px solid var(--season-gold); outline-offset: 1px; }

  .none { color: var(--muted); font-style: italic; margin: 18px 0 0; max-width: 34rem; text-align: center; }
  .jump-h { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem; font-weight: 600; color: var(--muted); margin: 40px 0 12px; }
  .jump { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { border: 1px solid var(--hairline); background: transparent; color: var(--ink); border-radius: 999px; padding: 8px 14px; font-family: var(--font-ui); font-size: 0.8rem; cursor: pointer; }
  .chip:hover, .chip.active { border-color: var(--season-ink); color: var(--season-ink); }
</style>
