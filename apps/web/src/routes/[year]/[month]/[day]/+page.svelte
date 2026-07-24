<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { renderBody } from "$lib/api";
  import { seasonToken, seasonLabel } from "$lib/liturgical";
  import { icons } from "$lib/icons";
  import { settings } from "$lib/settings.svelte";

  let { data } = $props();
  const day = $derived(data.day);
  const season = $derived(seasonToken(day.season, day.liturgicalColor, day.celebration));

  /** Homily tips are a priest-mode extra; everything else always shows. */
  const sections = $derived(
    settings.priestMode ? day.sections : day.sections.filter((s: { key: string }) => s.key !== "homily")
  );

  // Day navigation
  const dates = $derived((data.index?.dates ?? []) as string[]);
  const idx = $derived(dates.indexOf(day.date));
  const toHref = (d: string) => `${base}/${d.replaceAll("-", "/")}/`;
  const prevHref = $derived(idx > 0 ? toHref(dates[idx - 1]) : null);
  const nextHref = $derived(idx >= 0 && idx < dates.length - 1 ? toHref(dates[idx + 1]) : null);

  const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function parts(d: string) {
    const [y, m, dd] = d.split("-").map(Number);
    const wd = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
    return { weekday: WEEK[wd], line: `${WEEK[wd]}, ${dd} ${MON[m - 1]} ${y}` };
  }
  const eyebrow = $derived(
    `${parts(day.date).line}${day.psalterWeek ? ` · Psalter Week ${["I", "II", "III", "IV"][(day.psalterWeek - 1) % 4]}` : ""}`
  );

  // reading-time estimate
  const words = $derived(
    sections.reduce((n: number, s: { body: string }) => n + (s.body ?? "").split(/\s+/).length, 0)
  );
  const minutes = $derived(Math.max(1, Math.round(words / 180)));

  const heading = $derived(day.celebration ?? parts(day.date).line);
  const desc = $derived(
    `Readings for ${heading} (${parts(day.date).line}): first reading, responsorial psalm, gospel and reflection.`
  );
  const jsonLd = $derived(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: heading,
      datePublished: day.date,
      inLanguage: "en",
      isPartOf: { "@type": "Periodical", name: "God's Word — Daily Liturgy" },
      about: sections.map((s: { title: string }) => s.title),
      articleSection: season
    })
  );

  // drop-cap only on prose readings
  const DROPCAP = new Set(["first_reading", "second_reading", "gospel", "reflection"]);
  const hasDrop = (s: { key: string; body: string }) => DROPCAP.has(s.key) && /^[A-Za-z"“]/.test(s.body.trim());

  // scroll-spy for the section rail + reading progress
  let active = $state("");
  let progress = $state(0);
  onMount(() => {
    const els = [...document.querySelectorAll("[data-sec]")] as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) active = (e.target as HTMLElement).dataset.sec ?? "";
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));

    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      progress = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft" && prevHref) goto(prevHref);
      if (e.key === "ArrowRight" && nextHref) goto(nextHref);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  });

  function scrollTo(key: string) {
    const el = document.getElementById(`s-${key}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    active = key;
    history.replaceState(null, "", `#s-${key}`);
  }

  /** Jump to any date via the native picker. */
  function pickDate(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    if (!v) return;
    // Snap to the nearest day we actually hold.
    const exact = dates.includes(v) ? v : null;
    if (exact) return void goto(toHref(exact));
    const t = Date.parse(v);
    const near = [...dates].sort((a, b) => Math.abs(Date.parse(a) - t) - Math.abs(Date.parse(b) - t))[0];
    if (near) goto(toHref(near));
  }

  // per-section text-to-speech (honours the voice settings)
  let speaking = $state("");
  const plain = (md: string) => (md ?? "").replace(/<[^>]+>/g, " ").replace(/[*_#>`]/g, " ").replace(/\s+/g, " ").trim();
  function speak(s: { key: string; title: string; body: string }) {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) return;
    if (speaking === s.key) { synth.cancel(); speaking = ""; return; }
    const u = new SpeechSynthesisUtterance(`${s.title}. ${plain(s.body)}`);
    u.rate = settings.voiceRate;
    const v = synth.getVoices().find((x) => x.voiceURI === settings.voiceURI);
    if (v) u.voice = v;
    u.onend = () => (speaking = "");
    u.onerror = () => (speaking = "");
    synth.cancel();
    synth.speak(u);
    speaking = s.key;
  }
</script>

<svelte:head>
  <title>{heading} — Daily Readings, {parts(day.date).line}</title>
  <meta name="description" content={desc} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={`${heading} — Daily Readings`} />
  <meta property="og:description" content={desc} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={`${heading} — Daily Readings`} />
  <meta name="twitter:description" content={desc} />
  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<div class="progress" style="transform: scaleX({progress})" aria-hidden="true"></div>

<article>
  <!-- Intro block: what today is. -->
  <header class="hero">
    <div class="plate">
      <p class="eyebrow">{eyebrow}</p>
      <h1>{heading}</h1>
      <p class="meta">
        {#if season !== "neutral"}<span class="sea">{seasonLabel(season)}</span>{/if}
        <span class="dot">·</span><span>≈ {minutes} min</span>
        {#if settings.priestMode}<span class="dot">·</span><span class="pm">Priest mode</span>{/if}
      </p>
    </div>
  </header>

  <!-- Date selector sits below the intro block. Arrows only, so it stays on
       one line on narrow screens; the date itself opens the picker. -->
  <nav class="datebar" aria-label="Choose a day">
    {#if prevHref}
      <a class="arrow" href={prevHref} aria-label="Previous day">{@html icons.prev}</a>
    {:else}<span class="arrow off" aria-hidden="true">{@html icons.prev}</span>{/if}

    <label class="picker">
      {@html icons.calendar}
      <span class="pl">{parts(day.date).line}</span>
      <input type="date" value={day.date} onchange={pickDate} aria-label="Jump to a date" />
    </label>

    {#if nextHref}
      <a class="arrow" href={nextHref} aria-label="Next day">{@html icons.next}</a>
    {:else}<span class="arrow off" aria-hidden="true">{@html icons.next}</span>{/if}
  </nav>

  <div class="day">
    <div class="day-main reading">
      {#each sections as s, i (s.key)}
        <section id="s-{s.key}" data-sec={s.key} data-key={s.key}>
          {#if i > 0}<div class="leaf"><span class="g">❧</span></div>{/if}
          <div class="sec-top">
            <div>
              <p class="label">{#if s.key === "gospel"}<span class="xmark">✠ </span>{/if}{s.title}</p>
              {#if s.ref}<p class="ref">{s.ref}</p>{/if}
            </div>
            <!-- Sharing is disabled for now; read-aloud stays. -->
            <div class="sec-act">
              <button aria-label={speaking === s.key ? "Stop" : "Listen"} onclick={() => speak(s)}>
                {@html speaking === s.key ? icons.stop : icons.sound}
              </button>
            </div>
          </div>
          <div class="body" class:dropcap={hasDrop(s)} class:homily={s.key === "homily"}>{@html renderBody(s.body)}</div>
          {#if s.key === "reflection"}
            <p class="credit">— from the daily reflection</p>
          {/if}
        </section>
      {/each}
    </div>

    <aside class="day-rail" aria-label="Sections">
      {#each sections as s (s.key)}
        <button class:on={active === s.key} onclick={() => scrollTo(s.key)}>{s.title}</button>
      {/each}
    </aside>
  </div>
</article>

<style>
  .progress {
    position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 60;
    background: var(--season-ink); transform-origin: left; transform: scaleX(0);
    transition: transform 0.1s linear;
  }

  /* ---- book-plate hero ---- */
  .hero {
    background: linear-gradient(180deg, color-mix(in srgb, var(--season-deep) 12%, var(--season-wash)), var(--season-wash));
    padding: clamp(40px, 8vw, 92px) clamp(20px, 5vw, 60px) clamp(24px, 4vw, 40px);
  }
  .plate {
    max-width: 52rem; margin: 0 auto; position: relative;
    border: 1px solid color-mix(in srgb, var(--season-gold) 40%, transparent);
    padding: clamp(24px, 4vw, 44px);
  }
  .eyebrow {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.72rem;
    font-weight: 600; color: var(--season-gold); margin: 0 0 0.7rem;
  }
  .hero h1 {
    font-family: var(--font-display); font-weight: 560; font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1.04; letter-spacing: -0.02em; margin: 0; color: var(--ink); text-wrap: balance;
  }
  .meta {
    margin: 1rem 0 0; font-family: var(--font-ui); font-size: 0.85rem; color: var(--muted);
    display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;
  }
  .meta .sea { color: var(--season-ink); font-weight: 600; }
  .meta .pm { color: var(--season-gold); font-weight: 600; }
  .meta .dot { opacity: 0.5; }

  /* ---- date selector, below the intro ---- */
  .datebar {
    display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;
    max-width: 52rem; margin: 0 auto; padding: 18px clamp(20px, 5vw, 60px) 0;
  }
  .datebar .arrow, .picker {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 44px; border: 1px solid var(--hairline); border-radius: 999px;
    color: var(--season-ink); font-family: var(--font-ui); font-weight: 600;
  }
  .datebar .arrow { width: 44px; flex-shrink: 0; }
  .datebar .off { opacity: 0.3; }
  .datebar :global(svg) { width: 18px; height: 18px; }
  .picker {
    position: relative; cursor: pointer; color: var(--ink);
    padding: 0 18px; font-size: 0.88rem; letter-spacing: 0.01em; min-width: 0;
  }
  .picker .pl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .picker input {
    position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer;
    border: 0; padding: 0;
  }
  .picker:hover { border-color: var(--season-ink); }

  /* ---- reading layout ---- */
  .day {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, var(--measure)) minmax(0, 1fr);
    gap: 0 40px; max-width: 78rem; margin: 0 auto;
    padding: clamp(24px, 4vw, 48px) clamp(20px, 5vw, 40px) 100px;
  }
  .day-main { grid-column: 2; max-width: var(--measure); }
  .day-rail { grid-column: 3; position: sticky; top: 68px; align-self: start; display: grid; gap: 2px; padding-right: 4px; }
  .day-rail button {
    text-align: left; background: none; border: 0; border-left: 2px solid var(--hairline);
    padding: 6px 12px; cursor: pointer; color: var(--muted);
    font-family: var(--font-ui); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;
  }
  .day-rail button.on { color: var(--season-ink); border-left-color: var(--season-ink); }

  section { scroll-margin-top: 24px; }
  .sec-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .label {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem;
    font-weight: 600; color: var(--season-ink); margin: 0;
  }
  .label .xmark { color: var(--season-gold); }
  .ref { font-variant-caps: all-small-caps; letter-spacing: 0.04em; color: var(--muted); margin: 0.15rem 0 0; font-size: 1rem; }
  .sec-act { display: flex; gap: 6px; }
  .sec-act button {
    width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--hairline); background: none;
    color: var(--muted); display: grid; place-items: center; cursor: pointer; opacity: 0.6; transition: opacity 0.15s;
  }
  section:hover .sec-act button, .sec-act button:focus-visible { opacity: 1; }
  .sec-act button :global(svg) { width: 16px; height: 16px; }

  .body { margin-top: 0.9rem; font-size: var(--text-reading); line-height: var(--leading-reading); }
  .body :global(p) { margin: 0 0 1.05em; }
  .body :global(strong) { font-weight: 640; }
  .body.dropcap :global(p:first-of-type)::first-letter {
    font-family: var(--font-display); font-weight: 560; color: var(--season-ink);
    -webkit-initial-letter: 3; initial-letter: 3; float: left; line-height: 0.8;
    padding-right: 0.08em; margin-top: 0.05em;
  }
  /* homily tips (priest mode) read as a marginal note */
  .body.homily {
    border-left: 2px solid color-mix(in srgb, var(--season-gold) 55%, transparent);
    padding-left: 18px;
  }
  /* Psalm response set apart */
  section[data-key="responsorial_psalm"] .body :global(strong) {
    display: block; color: var(--season-ink); font-style: italic; font-weight: 500; margin-bottom: 0.4em;
  }
  .credit { text-align: right; font-style: italic; color: var(--muted); border-top: 1px solid var(--hairline); padding-top: 0.7rem; margin-top: 1.2rem; }

  @media (max-width: 1023px) {
    .day { grid-template-columns: 1fr; gap: 0; max-width: none; }
    .day-main { grid-column: 1; }
    .day-rail {
      grid-column: 1; order: -1; position: sticky; top: 0; z-index: 30; grid-auto-flow: column; justify-content: start;
      gap: 18px; overflow-x: auto; padding: 12px 0 14px; margin-bottom: 8px;
      background: color-mix(in srgb, var(--paper) 90%, var(--season-wash));
      border-bottom: 1px solid var(--hairline);
      /* Keep the strip clear of the floating controls in the top-right, and
         let it scroll fully rather than disappearing beneath them. */
      padding-right: 152px;
      scroll-padding-right: 152px;
      -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 150px), transparent calc(100% - 30px));
      mask-image: linear-gradient(to right, #000 calc(100% - 150px), transparent calc(100% - 30px));
    }
    .day-rail button { border-left: 0; border-bottom: 2px solid transparent; white-space: nowrap; padding: 4px 0; }
    .day-rail button.on { border-left: 0; border-bottom-color: var(--season-ink); }
  }
</style>
