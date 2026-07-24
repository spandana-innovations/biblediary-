<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { onNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";
  import { seasonToken, seasonLabel } from "$lib/liturgical";
  import { todayISO, nearestDate } from "$lib/api";
  import Player from "$lib/Player.svelte";
  import CommandPalette from "$lib/CommandPalette.svelte";
  import SettingsPanel from "$lib/SettingsPanel.svelte";
  import Splash from "$lib/Splash.svelte";
  import MassTransition from "$lib/MassTransition.svelte";
  import Controls from "$lib/Controls.svelte";
  import { mass, showMassCurtain } from "$lib/massMode.svelte";
  import { loadSettings, settings } from "$lib/settings.svelte";

  let { data, children } = $props();

  onMount(loadSettings);

  // Cross-fade between pages via the View Transitions API (progressive; a no-op
  // where unsupported or when the user prefers reduced motion).
  onNavigate((navigation) => {
    if (!(document as Document & { startViewTransition?: unknown }).startViewTransition) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return new Promise((resolve) => {
      (document as Document & { startViewTransition: (cb: () => Promise<void>) => void }).startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  // Theme engine: the whole shell reflects the day being read.
  const dayData = $derived($page.data.day as { season?: string; liturgicalColor?: string; celebration?: string } | undefined);
  const season = $derived(dayData ? seasonToken(dayData.season, dayData.liturgicalColor, dayData.celebration) : "neutral");

  const today = $derived(nearestDate(data.index?.dates ?? [], todayISO()));
  const todayHref = $derived(today ? `${base}/${today.replaceAll("-", "/")}/` : `${base}/`);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fdate() {
    const d = new Date();
    return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Two navigation sets. Ministry mode puts the celebrant's own material in
   * reach — homily tips, reflections and his notes for the day; otherwise the
   * app leads with what a congregation wants.
   */
  const tabs = $derived(
    settings.ministryMode
      ? [
          { href: todayHref, label: "Readings", icon: icons.book, key: "readings" },
          { href: `${base}/homily/`, label: "Homily", icon: icons.quote, key: "homily" },
          { href: `${base}/mass/`, label: "Mass", icon: icons.cross, key: "mass" },
          { href: `${base}/reflections/`, label: "Reflect", icon: icons.candle, key: "reflections" },
          { href: `${base}/notes/`, label: "Notes", icon: icons.note_pen, key: "notes" }
        ]
      : [
          { href: todayHref, label: "Readings", icon: icons.book, key: "readings" },
          { href: `${base}/saint/`, label: "Saint", icon: icons.saint, key: "saint" },
          { href: `${base}/mass/`, label: "Mass", icon: icons.cross, key: "mass" },
          { href: `${base}/hymns/`, label: "Hymns", icon: icons.note, key: "hymns" },
          { href: `${base}/prayers/`, label: "Prayers", icon: icons.beads, key: "prayers" }
        ]
  );

  /** The rail carries the tab set plus everything else. */
  const nav = $derived([
    ...tabs.filter((t) => t.key !== "mass"),
    { href: `${base}/mass/`, label: "Mass Mode", icon: icons.cross, key: "mass" },
    { href: `${base}/order-of-mass/`, label: "Order of Mass", icon: icons.church, key: "order-of-mass" },
    ...(settings.ministryMode
      ? [
          { href: `${base}/saint/`, label: "Saint", icon: icons.saint, key: "saint" },
          { href: `${base}/hymns/`, label: "Hymns", icon: icons.note, key: "hymns" },
          { href: `${base}/prayers/`, label: "Prayers", icon: icons.beads, key: "prayers" }
        ]
      : []),
    { href: `${base}/calendar/`, label: "Calendar", icon: icons.calendar, key: "calendar" },
    { href: `${base}/search/`, label: "Search", icon: icons.search, key: "search" }
  ]);

  const path = $derived($page.url.pathname);
  const activeKey = $derived.by(() => {
    if (/\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return "readings";
    for (const k of ["mass", "saint", "order-of-mass", "ministry", "homily", "reflections", "notes", "hymns", "prayers", "calendar", "search", "about"]) {
      if (path.includes(`/${k}/`)) return k;
    }
    return "";
  });
</script>

<Splash />

<a class="skip" href="#main">Skip to readings</a>

<div class="missal" data-season={season}>
  <nav class="rail" aria-label="Primary">
    <a class="wordmark" href="{base}/"><span class="cross">✠</span><span class="wm">God's Word</span></a>
    {#each nav as item}
      <a class="navlink" class:active={activeKey === item.key} href={item.href}>
        <span class="ic">{@html item.icon}</span>{item.label}
      </a>
    {/each}
    <div class="rail-foot">
      <span class="fdate">{fdate()}{seasonLabel(season, dayData?.season) ? ` · ${seasonLabel(season, dayData?.season)}` : ""}</span>
      <span class="fed">{data.index?.edition?.country}{settings.ministryMode ? " · Ministry mode" : ""}</span>
    </div>
  </nav>

  <main class="content" id="main" tabindex="-1">
    {@render children()}
  </main>

  <!-- Mobile tab bar: Mass sits in the centre as a raised cross. -->
  <nav class="tabbar" aria-label="Sections">
    {#each tabs as t (t.key)}
      {#if t.key === "mass"}
        <a
          class="tab-mass" class:active={activeKey === "mass"} href={t.href} aria-label="Mass Mode"
          onclick={() => activeKey !== "mass" && showMassCurtain()}
        >
          <span class="mass-orb"><span class="ic">{@html icons.crossSolid}</span></span>
          <span class="ml">Mass</span>
        </a>
      {:else}
        <a class:active={activeKey === t.key} href={t.href}>
          <span class="ic">{@html t.icon}</span>{t.label}
        </a>
      {/if}
    {/each}
  </nav>

  <Player />
</div>

<CommandPalette />
<SettingsPanel />
<MassTransition />

<Controls />
