<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";
  import { seasonToken, seasonLabel } from "$lib/liturgical";
  import { todayISO, nearestDate } from "$lib/api";

  let { data, children } = $props();
  let dark = $state(false);

  onMount(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
      dark = saved === "dark";
    } else {
      dark = matchMedia("(prefers-color-scheme: dark)").matches;
    }
  });
  function toggle() {
    dark = !dark;
    const t = dark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  }

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
    { href: todayHref, label: "Today", icon: icons.book, key: "today" },
    { href: `${base}/order-of-mass/`, label: "Order of Mass", icon: icons.church, key: "order-of-mass" },
    { href: `${base}/homily/`, label: "Homily", icon: icons.quote, key: "homily" },
    { href: `${base}/hymns/`, label: "Hymns", icon: icons.note, key: "hymns" },
    { href: `${base}/prayers/`, label: "Prayers", icon: icons.beads, key: "prayers" },
    { href: `${base}/calendar/`, label: "Calendar", icon: icons.calendar, key: "calendar" },
    { href: `${base}/search/`, label: "Search", icon: icons.search, key: "search" },
    { href: `${base}/about/`, label: "About", icon: icons.info, key: "about" }
  ]);
  const tabs = $derived([
    { href: todayHref, label: "Today", icon: icons.book, key: "today" },
    { href: `${base}/order-of-mass/`, label: "Mass", icon: icons.church, key: "order-of-mass" },
    { href: `${base}/hymns/`, label: "Hymns", icon: icons.note, key: "hymns" },
    { href: `${base}/prayers/`, label: "Prayers", icon: icons.beads, key: "prayers" },
    { href: `${base}/calendar/`, label: "Calendar", icon: icons.calendar, key: "calendar" }
  ]);

  const path = $derived($page.url.pathname);
  const activeKey = $derived.by(() => {
    if (/\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return "today";
    for (const k of ["order-of-mass", "homily", "hymns", "prayers", "calendar", "search", "about"]) {
      if (path.includes(`/${k}/`)) return k;
    }
    return "";
  });
</script>

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
      <span class="fed">{data.index?.edition?.country} · {data.index?.edition?.translation}</span>
    </div>
  </nav>

  <main class="content">
    {@render children()}
  </main>

  <nav class="tabbar" aria-label="Sections">
    {#each tabs as t}
      <a class:active={activeKey === t.key} href={t.href}><span class="ic">{@html t.icon}</span>{t.label}</a>
    {/each}
  </nav>
</div>

<div class="controls">
  <button onclick={toggle} aria-label="Toggle Compline (night) mode">{@html dark ? icons.sun : icons.moon}</button>
</div>
