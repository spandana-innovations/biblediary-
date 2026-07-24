<script lang="ts">
  import RedHeader from "$lib/RedHeader.svelte";
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

<svelte:head><title>Calendar</title></svelte:head>

<RedHeader title="Calendar">
  {#snippet children()}
    <div class="monthbar">
      <button class="mnav" onclick={() => shift(-1)} aria-label="Previous month">{@html icons.prev}</button>
      <span class="ml">{MON[month]} {year}</span>
      <button class="mnav" onclick={() => shift(1)} aria-label="Next month">{@html icons.next}</button>
    </div>
  {/snippet}
</RedHeader>

<div class="sheet">
  <div class="grid dow">
    {#each DOW as d}<span class="dowc">{d}</span>{/each}
  </div>
  <div class="grid">
    {#each cells as iso}
      {#if iso === null}
        <span class="cell empty"></span>
      {:else if available.has(iso)}
        <a class="cell has" class:today={iso === today} href={href(iso)}>{Number(iso.slice(8))}</a>
      {:else}
        <span class="cell off" class:today={iso === today}>{Number(iso.slice(8))}</span>
      {/if}
    {/each}
  </div>

  {#if monthsWithContent.length}
    <h2 class="sec-h">Jump to</h2>
    <div class="jump">
      {#each monthsWithContent as ym}
        <button
          class="chip"
          onclick={() => { year = Number(ym.slice(0, 4)); month = Number(ym.slice(5, 7)) - 1; }}
        >{MON[Number(ym.slice(5, 7)) - 1]} {ym.slice(0, 4)}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .monthbar {
    display: flex; align-items: center; justify-content: space-between; margin-top: 18px;
    position: relative; z-index: 2;
  }
  .ml { font: 700 1.25rem var(--font-display); letter-spacing: -0.01em; }
  .mnav {
    width: 38px; height: 38px; border-radius: 50%; border: 0; cursor: pointer;
    background: rgba(255, 255, 255, 0.16); color: #fff; display: grid; place-items: center;
  }
  .mnav :global(svg) { width: 20px; height: 20px; }
  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .dow { margin-bottom: 6px; }
  .dowc { text-align: center; color: var(--muted); font-size: 0.78rem; font-weight: 600; }
  .cell {
    aspect-ratio: 1; display: grid; place-items: center; border-radius: 12px;
    font-size: 0.98rem; font-variant-numeric: tabular-nums;
  }
  .cell.off { color: var(--muted); opacity: 0.55; }
  .cell.has {
    background: linear-gradient(180deg, color-mix(in srgb, var(--brand) 12%, var(--sheet)), color-mix(in srgb, var(--brand) 8%, var(--sheet)));
    color: var(--brand); font-weight: 600; border: 1px solid color-mix(in srgb, var(--brand) 22%, transparent);
  }
  .cell.has:hover { box-shadow: var(--shadow-md); }
  .cell.today { outline: 2px solid var(--brand); outline-offset: 1px; }
  .jump { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    border: 1px solid var(--hairline); background: var(--row); color: var(--text);
    border-radius: 999px; padding: 8px 14px; font: 600 0.9rem var(--font-body); cursor: pointer;
  }
  .chip:hover { border-color: var(--brand); color: var(--brand); }
</style>
