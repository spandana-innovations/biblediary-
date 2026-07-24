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
  import VerseCard from "$lib/VerseCard.svelte";
  import CommandPalette from "$lib/CommandPalette.svelte";
  import SettingsPanel from "$lib/SettingsPanel.svelte";
  import Splash from "$lib/Splash.svelte";
  import { openPalette } from "$lib/palette.svelte";
  import { mass } from "$lib/massMode.svelte";
  import { loadSettings, openSettings, settings, cycleTheme, isDark } from "$lib/settings.svelte";

  let { data, children } = $props();
  let dark = $state(false);

  onMount(() => {
    loadSettings();
    dark = isDark();
  });
  function toggleTheme() {
    cycleTheme();
    dark = isDark();
  }

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

  const nav = $derived([
    { href: todayHref, label: "Readings", icon: icons.book, key: "readings" },
    { href: `${base}/mass/`, label: "Mass", icon: icons.cross, key: "mass" },
    { href: `${base}/saint/`, label: "Saint", icon: icons.saint, key: "saint" },
    { href: `${base}/order-of-mass/`, label: "Order of Mass", icon: icons.church, key: "order-of-mass" },
    { href: `${base}/hymns/`, label: "Hymns", icon: icons.note, key: "hymns" },
    { href: `${base}/prayers/`, label: "Prayers", icon: icons.beads, key: "prayers" },
    { href: `${base}/calendar/`, label: "Calendar", icon: icons.calendar, key: "calendar" },
    { href: `${base}/search/`, label: "Search", icon: icons.search, key: "search" }
  ]);

  const path = $derived($page.url.pathname);
  const activeKey = $derived.by(() => {
    if (/\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return "readings";
    for (const k of ["mass", "saint", "order-of-mass", "homily", "hymns", "prayers", "calendar", "search", "about"]) {
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
      <span class="fdate">{fdate()}{season !== "neutral" ? ` · ${seasonLabel(season)}` : ""}</span>
      <span class="fed">{data.index?.edition?.country}{settings.priestMode ? " · Priest mode" : ""}</span>
    </div>
  </nav>

  <main class="content" id="main" tabindex="-1">
    {@render children()}
  </main>

  <!-- Mobile tab bar: Mass sits in the centre as a wide cross button. -->
  <nav class="tabbar" aria-label="Sections">
    <a class:active={activeKey === "readings"} href={todayHref}>
      <span class="ic">{@html icons.book}</span>Readings
    </a>
    <a class:active={activeKey === "saint"} href="{base}/saint/">
      <span class="ic">{@html icons.saint}</span>Saint
    </a>
    <a class="tab-mass" class:active={activeKey === "mass"} href="{base}/mass/" aria-label="Mass Mode">
      <span class="mass-orb"><span class="ic">{@html icons.crossSolid}</span></span>
      <span class="ml">Mass</span>
    </a>
    <a class:active={activeKey === "hymns"} href="{base}/hymns/">
      <span class="ic">{@html icons.note}</span>Hymns
    </a>
    <a class:active={activeKey === "prayers"} href="{base}/prayers/">
      <span class="ic">{@html icons.beads}</span>Prayers
    </a>
  </nav>

  <Player />
</div>

<CommandPalette />
<VerseCard />
<SettingsPanel />

<div class="controls">
  <button onclick={openPalette} aria-label="Search (⌘K)">{@html icons.search}</button>
  <button onclick={toggleTheme} aria-label="Toggle Compline (night) mode">{@html dark ? icons.sun : icons.moon}</button>
  <button onclick={openSettings} aria-label="Settings">{@html icons.cog}</button>
</div>
