<script lang="ts">
  /** The day's reflection — a ministry-mode surface. */
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { renderBody, getDay, todayISO, nearestDate, type Day, type Section } from "$lib/api";
  import { seasonToken } from "$lib/liturgical";
  import { icons } from "$lib/icons";
  import DayPicker from "$lib/DayPicker.svelte";
  import { settings } from "$lib/settings.svelte";

  let { data } = $props();
  let day = $state<Day | null>(data.day);
  let loading = $state(false);
  const dates = $derived((data.index?.dates ?? []) as string[]);
  const season = $derived(day ? seasonToken(day.season, day.liturgicalColor, day.celebration) : "neutral");

  onMount(() => {
    const want = nearestDate(data.index?.dates ?? [], todayISO());
    if (want && want !== data.day?.date) load(want);
  });

  async function load(target: string) {
    if (loading) return;
    loading = true;
    try { day = await getDay(fetch, target); } catch { /* keep current */ } finally { loading = false; }
  }

  const reflection = $derived(((day?.sections ?? []) as Section[]).find((s) => s.key === "reflection") ?? null);
  const gospel = $derived(((day?.sections ?? []) as Section[]).find((s) => s.key === "gospel") ?? null);
</script>

<svelte:head>
  <title>Reflections — God's Word</title>
  <meta name="description" content="The reflection on the readings of the day." />
</svelte:head>

<div class="page-head" data-season={season}>
  <p class="eyebrow">Ministry</p>
  <h1>Reflections</h1>
  {#if day?.celebration}<p class="sub">{day.celebration}</p>{/if}
</div>

<div class="page-body">
  <DayPicker date={day?.date} {dates} disabled={loading} onpick={load} />

  {#if !settings.ministryMode}
    <p class="hint">Ministry mode is off — turn it on in Settings to keep this in your tab bar.</p>
  {/if}

  {#if gospel?.ref}
    <a class="gospel-ref" href="{base}/{(day?.date ?? '').replaceAll('-', '/')}/#s-gospel">
      {@html icons.book}<span>Gospel — {gospel.ref}</span>
    </a>
  {/if}

  {#if reflection}
    <div class="prose reading">{@html renderBody(reflection.body)}</div>
  {:else}
    <p class="empty">
      <span class="e-ic">{@html icons.candle}</span>
      No reflection is recorded for this day.
    </p>
  {/if}
</div>

<style>
  .hint { color: var(--muted); font-family: var(--font-ui); font-size: 0.78rem; margin: 0 0 18px; }
  .gospel-ref {
    display: inline-flex; align-items: center; gap: 9px; margin: 0 0 22px;
    border: 1px solid var(--hairline); border-radius: 999px; padding: 9px 16px;
    color: var(--season-ink); font-family: var(--font-ui); font-size: 0.76rem;
    text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;
  }
  .gospel-ref :global(svg) { width: 16px; height: 16px; }
  .gospel-ref:hover { border-color: var(--season-ink); }
  .prose { font-size: var(--text-reading); line-height: var(--leading-reading); max-width: var(--measure); }
  .prose :global(p) { margin: 0 0 1.05em; }
  .empty {
    display: grid; justify-items: center; gap: 10px; text-align: center;
    color: var(--muted); font-style: italic; margin: 8vh auto; max-width: 26rem;
  }
  .e-ic { color: var(--season-gold); display: grid; }
  .e-ic :global(svg) { width: 32px; height: 32px; }
</style>
