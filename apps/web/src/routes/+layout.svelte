<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";

  let { children } = $props();
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
</script>

<button class="theme-toggle" onclick={toggle} aria-label="Toggle light or dark theme">
  {dark ? "☀ Light" : "☾ Dark"}
</button>

<div class="app">
  {@render children()}
</div>
