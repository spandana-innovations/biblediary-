<script lang="ts">
  /**
   * A brief seasonal curtain shown while entering Mass Mode, so the switch
   * feels like stepping into the liturgy rather than a page load. Triggered by
   * the tab-bar cross; skipped for reduced-motion users.
   */
  import { massEnter } from "$lib/massMode.svelte";
</script>

{#if massEnter.showing}
  <div class="mt" aria-hidden="true">
    <div class="mt-mark">
      <span class="mt-logo"></span>
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

  .mt-mark { display: grid; justify-items: center; gap: 22px; animation: mt-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
  @keyframes mt-rise { from { opacity: 0; transform: translateY(10px) scale(0.94); } }

  /* The house mark as a mask rather than an image: it takes its colour from
     the background, so it sits on the seasonal curtain instead of on a white
     plate of its own. */
  .mt-logo {
    width: clamp(150px, 44vw, 230px); aspect-ratio: 503 / 560;
    background: color-mix(in srgb, var(--paper) 94%, #fff);
    -webkit-mask-image: url("/logo-mark.png"); mask-image: url("/logo-mark.png");
    -webkit-mask-size: contain; mask-size: contain;
    -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
    -webkit-mask-position: center; mask-position: center;
  }
  .mt-t {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.3em;
    /* indent by one tracking step so the letter-spacing doesn't push the word
       visually right of the mark it sits under */
    text-indent: 0.3em;
    font-size: clamp(1.05rem, 4.4vw, 1.5rem); font-weight: 700;
    color: color-mix(in srgb, var(--season-gold) 70%, #fff);
  }
  @media (prefers-reduced-motion: reduce) { .mt { display: none; } }
</style>
