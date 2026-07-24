<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { todayISO, nearestDate } from "$lib/api";

  let { data } = $props();
  const target = $derived.by(() => {
    const d = nearestDate(data.index?.dates ?? [], todayISO());
    return d ? `${base}/${d.replaceAll("-", "/")}/` : `${base}/calendar/`;
  });
  onMount(() => goto(target, { replaceState: true }));
</script>

<svelte:head><title>God's Word — Daily Readings</title></svelte:head>

<div class="opening">
  <span class="cross">✠</span>
  <p>Opening today's readings…</p>
  <a href={target}>Continue</a>
</div>

<style>
  .opening { min-height: 60vh; display: grid; place-items: center; align-content: center; gap: 10px; text-align: center; color: var(--muted); }
  .cross { color: var(--season-gold); font-size: 2rem; }
  .opening a { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem; color: var(--season-ink); }
</style>
