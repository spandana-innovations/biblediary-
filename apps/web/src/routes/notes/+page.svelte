<script lang="ts">
  /**
   * Notes for the day — what the celebrant means to say, kept to hand.
   *
   * Saved on the device against the liturgical date. There is no account yet,
   * so nothing leaves the phone; when sign-in lands these sync rather than
   * change shape.
   */
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { getDay, todayISO, nearestDate, type Day, type Section } from "$lib/api";
  import { seasonToken } from "$lib/liturgical";
  import { icons } from "$lib/icons";
  import DayPicker from "$lib/DayPicker.svelte";
  import { getNote, setNote, datesWithNotes } from "$lib/notes.svelte";
  import { settings } from "$lib/settings.svelte";

  let { data } = $props();
  let day = $state<Day | null>(data.day);
  let loading = $state(false);
  let text = $state("");
  let saved = $state(false);
  let others = $state<string[]>([]);

  const dates = $derived((data.index?.dates ?? []) as string[]);
  const season = $derived(day ? seasonToken(day.season, day.liturgicalColor, day.celebration) : "neutral");
  const gospel = $derived(((day?.sections ?? []) as Section[]).find((s) => s.key === "gospel") ?? null);

  onMount(() => {
    const want = nearestDate(data.index?.dates ?? [], todayISO());
    if (want && want !== data.day?.date) load(want);
    else if (data.day) text = getNote(data.day.date);
    others = datesWithNotes();
  });

  async function load(target: string) {
    if (loading) return;
    loading = true;
    try {
      day = await getDay(fetch, target);
      text = getNote(target);
      saved = false;
    } catch {
      /* keep current */
    } finally {
      loading = false;
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  function onInput() {
    if (!day) return;
    saved = false;
    if (timer) clearTimeout(timer);
    const date = day.date;
    const value = text;
    timer = setTimeout(() => {
      setNote(date, value);
      others = datesWithNotes();
      saved = true;
    }, 500);
  }

  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const short = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    return `${dd} ${MON[m - 1]} ${y}`;
  };
</script>

<svelte:head>
  <title>Notes — God's Word</title>
  <meta name="description" content="Your own notes for the day's liturgy, kept on this device." />
</svelte:head>

<div class="page-head" data-season={season}>
  <p class="eyebrow">Ministry</p>
  <h1>Notes for the Day</h1>
  {#if day?.celebration}<p class="sub">{day.celebration}</p>{/if}
</div>

<div class="page-body">
  <DayPicker date={day?.date} {dates} disabled={loading} onpick={load} />

  {#if !settings.ministryMode}
    <p class="hint">Ministry mode is off — turn it on in Settings to keep this in your tab bar.</p>
  {/if}

  {#if gospel?.ref}
    <a class="ref-chip" href="{base}/{(day?.date ?? '').replaceAll('-', '/')}/#s-gospel">
      {@html icons.book}<span>Gospel — {gospel.ref}</span>
    </a>
  {/if}

  <label class="note-wrap">
    <span class="sr">Notes for {day?.date}</span>
    <textarea
      bind:value={text}
      oninput={onInput}
      rows="14"
      placeholder="What you mean to say — an opening image, the one point, a name to remember…"
    ></textarea>
  </label>

  <p class="status" aria-live="polite">
    {#if saved}
      {@html icons.candle}<span>Saved on this device</span>
    {:else if text.trim()}
      <span class="dim">Typing…</span>
    {:else}
      <span class="dim">Notes are saved on this device only.</span>
    {/if}
  </p>

  {#if others.length}
    <h2 class="others-h">Days with notes</h2>
    <ul class="others">
      {#each others.slice(0, 24) as d (d)}
        <li>
          <button class:on={d === day?.date} onclick={() => load(d)}>{short(d)}</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .hint { color: var(--muted); font-family: var(--font-ui); font-size: 0.78rem; margin: 0 0 18px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

  .ref-chip {
    display: inline-flex; align-items: center; gap: 9px; margin: 0 0 18px;
    border: 1px solid var(--hairline); border-radius: 999px; padding: 9px 16px;
    color: var(--season-ink); font-family: var(--font-ui); font-size: 0.76rem;
    text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;
  }
  .ref-chip :global(svg) { width: 16px; height: 16px; }

  .note-wrap { display: block; }
  textarea {
    width: 100%; resize: vertical; min-height: 44vh;
    padding: 20px 22px; border-radius: 14px;
    border: 1px solid var(--hairline);
    background: color-mix(in srgb, var(--paper) 70%, var(--season-wash));
    color: var(--ink);
    font-family: var(--font-body); font-size: var(--text-reading); line-height: 1.7;
  }
  textarea:focus-visible { outline: 2px solid var(--season-ink); outline-offset: 1px; border-color: transparent; }
  textarea::placeholder { color: var(--muted); font-style: italic; }

  .status {
    display: flex; align-items: center; gap: 7px; margin: 12px 0 0;
    font-family: var(--font-ui); font-size: 0.72rem; color: var(--season-ink);
  }
  .status :global(svg) { width: 14px; height: 14px; }
  .status .dim { color: var(--muted); }

  .others-h {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.68rem; font-weight: 600; color: var(--muted); margin: 34px 0 12px;
  }
  .others { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .others button {
    border: 1px solid var(--hairline); background: transparent; color: var(--ink);
    border-radius: 999px; padding: 7px 14px; cursor: pointer;
    font-family: var(--font-ui); font-size: 0.74rem;
  }
  .others button:hover { border-color: var(--season-ink); color: var(--season-ink); }
  .others button.on { background: var(--season-ink); color: var(--paper); border-color: var(--season-ink); }
</style>
