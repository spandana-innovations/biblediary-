<script lang="ts">
  /**
   * Opening splash — the wordmark on a seasonal wash, shown briefly on first
   * paint. It inherits --season-* from the shell, so the colour of the splash
   * *is* the colour of the liturgical day. Skipped for reduced-motion users
   * and after the first view in a session.
   */
  import { onMount } from "svelte";
  import { ui } from "$lib/settings.svelte";

  let show = $state(false);
  let leaving = $state(false);

  onMount(() => {
    const seen = sessionStorage.getItem("godsword:splash");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      ui.splashDone = true;
      return;
    }
    show = true;
    sessionStorage.setItem("godsword:splash", "1");
    const t1 = setTimeout(() => (leaving = true), 1150);
    const t2 = setTimeout(() => {
      show = false;
      ui.splashDone = true;
    }, 1650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  });
</script>

{#if show}
  <div class="splash" class:leaving aria-hidden="true">
    <div class="mark">
      <!-- Placeholder mark: replace with the supplied logo asset. -->
      <span class="cross">✠</span>
      <span class="wm">God&rsquo;s Word</span>
      <span class="rule"></span>
      <span class="tag">Daily Liturgy</span>
    </div>
  </div>
{/if}

<style>
  .splash {
    position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
    background: linear-gradient(170deg, color-mix(in srgb, var(--season-deep) 22%, var(--season-wash)), var(--season-wash));
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .splash.leaving { opacity: 0; transform: scale(1.03); pointer-events: none; }
  .mark { display: grid; justify-items: center; gap: 10px; animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } }
  .cross { color: var(--season-gold); font-size: 2.6rem; line-height: 1; }
  .wm {
    font-family: var(--font-display); font-weight: 560; font-size: clamp(1.9rem, 7vw, 2.8rem);
    letter-spacing: 0.03em; color: var(--ink);
  }
  .rule { width: 46px; height: 1px; background: color-mix(in srgb, var(--season-gold) 65%, transparent); }
  .tag {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.22em;
    font-size: 0.66rem; color: var(--season-ink); font-weight: 600;
  }
</style>
