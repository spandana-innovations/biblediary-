<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";

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

  const latest = $derived([...(data.index?.dates ?? [])].sort().at(-1) ?? null);
  const todayHref = $derived(latest ? `${base}/${latest.replaceAll("-", "/")}/` : `${base}/`);
  const nav = $derived([
    { href: todayHref, label: "Today's Readings", icon: icons.book },
    { href: `${base}/order-of-mass/`, label: "Order of Mass", icon: icons.church },
    { href: `${base}/hymns/`, label: "Popular Hymns", icon: icons.note },
    { href: `${base}/prayers/`, label: "Prayer Collection", icon: icons.beads },
    { href: `${base}/homily/`, label: "Homily Tips", icon: icons.quote },
    { href: `${base}/about/`, label: "About Us", icon: icons.info },
    { href: `${base}/more/`, label: "More Apps", icon: icons.grid }
  ]);
  const path = $derived($page.url.pathname);
  const isActive = (href: string) => href !== `${base}/` && path.startsWith(href);
</script>

<button class="theme-toggle" onclick={toggle} aria-label="Toggle light or dark theme">
  {dark ? "☀ Light" : "☾ Dark"}
</button>

<div class="shell">
  <aside class="sidebar">
    <a class="brand" href="{base}/"><span class="logo">God's Word</span></a>
    <nav>
      {#each nav as item}
        <a class="navlink" class:active={isActive(item.href)} href={item.href}>
          <span class="ic">{@html item.icon}</span><span>{item.label}</span>
        </a>
      {/each}
    </nav>
    <p class="side-foot">{data.index?.edition?.country} · {data.index?.edition?.translation}</p>
  </aside>

  <div class="app">
    {@render children()}
  </div>
</div>
