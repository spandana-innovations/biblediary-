<script lang="ts">
  /**
   * Mass Mode — the liturgy of the day, in order, for use during Mass.
   * Only the readings appear (no reflection/intercessions chrome), everything
   * is expanded by default, the screen is kept awake, and the whole surface is
   * tinted by the liturgical season. Priest mode adds the homily tip.
   */
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { renderBody, todayISO, nearestDate, getDay, type Day, type Section } from "$lib/api";
  import { seasonToken, seasonLabel } from "$lib/liturgical";
  import { icons } from "$lib/icons";
  import { settings } from "$lib/settings.svelte";
  import { enterMass, exitMass } from "$lib/massMode.svelte";

  let { data } = $props();

  // Prerendered with the build-time day; correct to the device's today on mount.
  let day = $state<Day | null>(data.day);
  onMount(() => {
    const want = nearestDate(data.index?.dates ?? [], todayISO());
    if (want && want !== data.day?.date) getDay(fetch, want).then((d) => (day = d)).catch(() => {});
  });

  // Step a day either way without leaving Mass Mode.
  const dates = $derived((data.index?.dates ?? []) as string[]);
  const at = $derived(day ? dates.indexOf(day.date) : -1);
  const isToday = $derived(day?.date === todayISO());
  let loading = $state(false);

  async function load(target: string | undefined) {
    if (!target || loading) return;
    loading = true;
    try {
      day = await getDay(fetch, target);
      collapsed = {};
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* leave the current day in place */
    } finally {
      loading = false;
    }
  }
  const step = (delta: number) => load(dates[at + delta]);
  const goToday = () => load(nearestDate(dates, todayISO()) ?? undefined);

  const season = $derived(day ? seasonToken(day.season, day.liturgicalColor, day.celebration) : "neutral");

  /** Mass Mode shows the liturgy proper, in celebration order. */
  const ORDER = ["first_reading", "responsorial_psalm", "second_reading", "acclamation", "gospel", "homily"];
  const sections = $derived.by(() => {
    const all = (day?.sections ?? []) as Section[];
    const wanted = all.filter((s) => ORDER.includes(s.key));
    // Homily tips are a priest-mode extra.
    const visible = settings.priestMode ? wanted : wanted.filter((s) => s.key !== "homily");
    return visible.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  });

  // Everything expanded by default; collapsing is per-section and remembered
  // only for this visit.
  let collapsed = $state<Record<string, boolean>>({});
  const toggle = (k: string) => (collapsed[k] = !collapsed[k]);

  // Screen stays awake for the whole time Mass Mode is on screen.
  onMount(() => {
    enterMass();
    return () => exitMass();
  });

  const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function dateLine(d?: string) {
    if (!d) return "";
    const [y, m, dd] = d.split("-").map(Number);
    return `${WEEK[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]}, ${dd} ${MON[m - 1]} ${y}`;
  }
</script>

<svelte:head>
  <title>Mass Mode — God's Word</title>
  <meta name="description" content="The readings of today's Mass, in order, for use during the liturgy." />
</svelte:head>

<div class="massmode" data-season={season}>
  {#if !day}
    <p class="mm-empty">No readings are loaded for today yet.</p>
  {:else}
    <header class="mm-head">
      <span class="mm-cross">{@html icons.cross}</span>
      <p class="mm-eyebrow">{dateLine(day.date)}</p>
      <h1>{day.celebration ?? dateLine(day.date)}</h1>
      <!-- Season label flanked by a day stepper. -->
      <div class="mm-season">
        <button
          class="mm-step" onclick={() => step(-1)} disabled={at <= 0 || loading}
          aria-label="Previous day">{@html icons.minus}</button>

        <span class="mm-tag">{season !== "neutral" ? seasonLabel(season) : "Today’s Mass"}</span>

        <button
          class="mm-step" onclick={() => step(1)} disabled={at < 0 || at >= dates.length - 1 || loading}
          aria-label="Next day">{@html icons.plus}</button>
      </div>

      {#if settings.priestMode}<p class="mm-priest">Priest mode</p>{/if}
      {#if day && !isToday}
        <p class="mm-notday">
          Not today’s liturgy
          <button onclick={goToday} disabled={loading}>Back to today</button>
        </p>
      {/if}
    </header>

    <div class="mm-flow">
      {#each sections as s (s.key)}
        <section class="mv" class:closed={collapsed[s.key]}>
          <div class="mv-head">
            <div class="mv-t">
              <p class="mv-label">{#if s.key === "gospel"}<span class="x">✠ </span>{/if}{s.title}</p>
              {#if s.ref}<p class="mv-ref">{s.ref}</p>{/if}
            </div>
            <button
              class="mv-toggle"
              aria-expanded={!collapsed[s.key]}
              aria-label={collapsed[s.key] ? `Expand ${s.title}` : `Collapse ${s.title}`}
              onclick={() => toggle(s.key)}
            >{@html collapsed[s.key] ? icons.plus : icons.minus}</button>
          </div>
          {#if !collapsed[s.key]}
            <div class="mv-body reading" class:homily={s.key === "homily"}>{@html renderBody(s.body)}</div>
          {/if}
        </section>
      {/each}
      <p class="mm-end">✠</p>
      <a class="mm-full" href="{base}/{day.date.replaceAll('-', '/')}/">Full readings, reflection &amp; prayers →</a>
    </div>
  {/if}
</div>

<style>
  .massmode {
    min-height: 100dvh;
    background: linear-gradient(180deg, color-mix(in srgb, var(--season-deep) 10%, var(--season-wash)), var(--season-wash));
  }
  .mm-empty { text-align: center; color: var(--muted); padding: 20vh 20px; font-style: italic; }

  /* Extra head room on narrow screens so the cross clears the floating controls. */
  .mm-head {
    text-align: center; padding: clamp(64px, 14vw, 76px) clamp(20px, 5vw, 48px) clamp(20px, 4vw, 34px);
    max-width: 46rem; margin: 0 auto;
  }
  @media (min-width: 1024px) { .mm-head { padding-top: clamp(28px, 6vw, 56px); } }
  .mm-cross { display: grid; place-items: center; color: var(--season-gold); margin-bottom: 12px; }
  .mm-cross :global(svg) { width: 30px; height: 30px; stroke-width: 1.4; }
  .mm-eyebrow {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.7rem;
    font-weight: 600; color: var(--season-gold); margin: 0 0 10px;
  }
  .mm-head h1 {
    font-family: var(--font-display); font-weight: 560; font-size: clamp(1.8rem, 5vw, 3rem);
    line-height: 1.06; letter-spacing: -0.02em; margin: 0; text-wrap: balance;
  }
  .mm-season { display: flex; gap: 10px; justify-content: center; align-items: center; margin: 16px 0 0; }
  .mm-tag {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.68rem;
    font-weight: 600; color: var(--season-ink); border: 1px solid var(--hairline);
    border-radius: 999px; padding: 7px 15px;
  }
  .mm-step {
    width: 34px; height: 34px; border-radius: 50%; cursor: pointer; flex-shrink: 0;
    border: 1px solid var(--hairline); background: transparent; color: var(--season-ink);
    display: grid; place-items: center;
  }
  .mm-step :global(svg) { width: 18px; height: 18px; }
  .mm-step:hover:not(:disabled) { background: var(--season-ink); color: var(--paper); }
  .mm-step:disabled { opacity: 0.28; cursor: default; }

  .mm-priest {
    margin: 10px 0 0; font-family: var(--font-ui); text-transform: uppercase;
    letter-spacing: 0.1em; font-size: 0.64rem; font-weight: 600; color: var(--season-gold);
  }
  .mm-notday {
    margin: 12px 0 0; display: inline-flex; flex-wrap: wrap; gap: 10px; align-items: center;
    justify-content: center; font-family: var(--font-ui); font-size: 0.7rem; color: var(--muted);
  }
  .mm-notday button {
    border: 1px solid var(--hairline); background: transparent; color: var(--season-ink);
    border-radius: 999px; padding: 5px 12px; cursor: pointer;
    font-family: var(--font-ui); font-size: 0.64rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .mm-notday button:hover { border-color: var(--season-ink); }

  .mm-flow { max-width: 44rem; margin: 0 auto; padding: 0 clamp(20px, 5vw, 48px) 120px; }

  .mv { border-top: 1px solid var(--hairline); padding: 26px 0 4px; }
  .mv-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
  .mv-label {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.76rem;
    font-weight: 600; color: var(--season-ink); margin: 0;
  }
  .mv-label .x { color: var(--season-gold); }
  .mv-ref { font-variant-caps: all-small-caps; letter-spacing: 0.04em; color: var(--muted); margin: 0.2rem 0 0; font-size: 1.05rem; }

  /* Large circular collapse control, themed to the season. */
  .mv-toggle {
    flex-shrink: 0; width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
    border: 1.5px solid color-mix(in srgb, var(--season-ink) 45%, transparent);
    background: transparent; color: var(--season-ink); display: grid; place-items: center;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .mv-toggle :global(svg) { width: 24px; height: 24px; stroke-width: 1.8; }
  .mv-toggle:hover { background: var(--season-ink); color: var(--paper); }

  .mv-body {
    margin-top: 1rem; font-size: var(--text-reading); line-height: var(--leading-reading);
    animation: open 0.22s ease;
  }
  @keyframes open { from { opacity: 0; transform: translateY(-4px); } }
  .mv-body :global(p) { margin: 0 0 1.05em; }
  .mv-body :global(strong) { font-weight: 640; }
  /* psalm response set apart */
  .mv-body :global(p) > :global(strong):only-child {
    display: block; color: var(--season-ink); font-style: italic; font-weight: 560;
  }
  .mv-body.homily {
    border-left: 2px solid color-mix(in srgb, var(--season-gold) 55%, transparent);
    padding-left: 18px; color: color-mix(in srgb, var(--ink) 88%, var(--paper));
  }

  .mm-end { text-align: center; color: var(--season-gold); font-size: 1.5rem; margin: 46px 0 20px; }
  .mm-full {
    display: block; text-align: center; font-family: var(--font-ui); font-size: 0.74rem;
    text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: var(--season-ink);
  }

  /* Mass Mode reads large by default, on top of the user's size preference. */
  .massmode { --text-reading: calc(clamp(1.25rem, 1.05rem + 0.8vw, 1.5rem) * var(--font-scale)); }
</style>
