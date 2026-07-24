<script lang="ts">
  import type { Snippet } from "svelte";
  import { base } from "$app/paths";
  let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div class="rhead">
  <div class="bar">
    <a class="circ-btn" href="{base}/" aria-label="Home">‹</a>
    <h1>{title}</h1>
    <div class="actions">
      <button class="circ-btn" aria-label="Text size" style="font-weight:700">T</button>
      <button class="circ-btn" aria-label="Share">↗</button>
    </div>
  </div>
  {#if children}{@render children()}{/if}
</div>
