<script lang="ts">
  /**
   * A brief seasonal curtain shown while entering Mass Mode, so the switch
   * feels like stepping into the liturgy rather than a page load. Triggered by
   * the tab-bar cross; skipped for reduced-motion users.
   */
  import { massEnter } from "$lib/massMode.svelte";
  import { icons } from "$lib/icons";
</script>

{#if massEnter.showing}
  <div class="mt" aria-hidden="true">
    <div class="mt-mark">
      <span class="mt-cross">{@html icons.crossSolid}</span>
      <span class="mt-t">Mass Mode</span>
    </div>
  </div>
{/if}

<style>
  .mt {
    position: fixed; inset: 0; z-index: 190; display: grid; place-items: center;
    background: linear-gradient(170deg,
      color-mix(in srgb, var(--season-deep) 92%, #000),
      var(--season-ink));
    animation: mt-in 0.18s ease, mt-out 0.34s ease 0.62s forwards;
  }
  @keyframes mt-in { from { opacity: 0; } }
  @keyframes mt-out { to { opacity: 0; } }

  .mt-mark { display: grid; justify-items: center; gap: 16px; animation: mt-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
  @keyframes mt-rise { from { opacity: 0; transform: translateY(10px) scale(0.94); } }
  .mt-cross { display: grid; color: color-mix(in srgb, var(--paper) 92%, #fff); }
  .mt-cross :global(svg) { width: 56px; height: 56px; }
  .mt-t {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.26em;
    font-size: 0.76rem; font-weight: 700;
    color: color-mix(in srgb, var(--season-gold) 70%, #fff);
  }
  @media (prefers-reduced-motion: reduce) { .mt { display: none; } }
</style>
