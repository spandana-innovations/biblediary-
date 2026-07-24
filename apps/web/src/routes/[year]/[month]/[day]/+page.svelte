<script lang="ts">
  import { base } from "$app/paths";
  import { renderBody } from "$lib/api";
  import { seasonToken } from "$lib/liturgical";

  let { data } = $props();
  const day = $derived(data.day);
  const season = $derived(seasonToken(day.season, day.liturgicalColor));

  let sel = $state(0);
  const section = $derived(day.sections[sel] ?? day.sections[0]);
  const html = $derived(renderBody(section?.body ?? ""));
  const dropcap = $derived(!/^\s*<(span|strong|em)/i.test(section?.body ?? ""));

  const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function pretty(d: string): string {
    const [y, m, dd] = d.split("-").map(Number);
    const wd = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
    return `${WEEK[wd]}, ${dd} ${MON[m - 1]} ${y}`;
  }
</script>

<svelte:head>
  <title>{day.celebration ?? day.date} — {data.index?.edition?.name}</title>
  <meta name="description" content={`${day.celebration ?? day.date}: readings, psalm, gospel and reflection.`} />
</svelte:head>

<article data-season={season}>
  <div class="rhead">
    <div class="bar">
      <a class="circ-btn" href="{base}/" aria-label="Home">‹</a>
    </div>
    <div class="datepill">
      <span class="d">{pretty(day.date)}</span>
    </div>
    {#if day.celebration}<div class="ltitle">{day.celebration}</div>{/if}
    <div class="lsub">
      {#if day.season}<span>{day.season}</span> · {/if}
      {#if day.psalterWeek}Psalter Week {day.psalterWeek} · {/if}
      <span>{day.translation}</span>
    </div>
    <div class="tabs">
      {#each day.sections as s, i}
        <button class="tab" class:sel={i === sel} onclick={() => (sel = i)}>{s.title}</button>
      {/each}
    </div>
  </div>

  <div class="sheet">
    <div class="ref-row">
      <div class="ref">{section?.ref ?? section?.title}</div>
      <div class="mini-actions">
        {#if section?.audio}<audio controls preload="none" src={section.audio}></audio>{/if}
      </div>
    </div>
    <div class="liturgy body-txt" class:dropcap>{@html html}</div>
  </div>
</article>

<style>
  article { display: flex; flex-direction: column; flex: 1; }
  .datepill {
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px; padding: 12px; margin: 14px 0 16px; position: relative; z-index: 2;
  }
  .datepill .d { font: 600 1.12rem var(--font-body); }
  .ltitle { font: 600 1.9rem/1.05 var(--font-serif); margin: 2px 0 6px; position: relative; z-index: 2; }
  .lsub { color: rgba(255, 255, 255, 0.86); font-size: 0.95rem; position: relative; z-index: 2; }
  .tabs { display: flex; gap: 10px; margin-top: 18px; overflow-x: auto; position: relative; z-index: 2; padding-bottom: 2px; }
  .tabs::-webkit-scrollbar { height: 0; }
  /* On wider screens the section chips wrap instead of scrolling horizontally. */
  @media (min-width: 640px) {
    .tabs { flex-wrap: wrap; overflow-x: visible; }
  }
  .tab {
    flex: 0 0 auto; border: 1px solid rgba(255, 255, 255, 0.5); background: transparent; color: #fff;
    border-radius: 999px; padding: 0.6rem 1.15rem; font: 600 0.94rem var(--font-body); cursor: pointer; white-space: nowrap;
  }
  .tab.sel { background: var(--sheet); color: var(--text); border-color: transparent; }
  .ref-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .ref { font: 600 1.3rem/1.2 var(--font-body); }
  .mini-actions audio { height: 34px; }
  .dropcap :global(p:first-child)::first-letter {
    font-family: var(--font-serif); font-size: 3.2rem; line-height: 0.8; float: left; padding: 4px 8px 0 0; font-weight: 600;
  }
</style>
