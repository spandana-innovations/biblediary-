<script lang="ts">
  import type { Snippet } from "svelte";
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";
  let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div class="rhead">
  <div class="bar">
    <a class="circ-btn back" href="{base}/" aria-label="Home">{@html icons.prev}</a>
    <h1>{title}</h1>
    <div class="actions">
      <button class="circ-btn" aria-label="Text size">{@html icons.textsize}</button>
      <button class="circ-btn" aria-label="Share">{@html icons.share}</button>
    </div>
  </div>
  {#if children}{@render children()}{/if}
</div>
