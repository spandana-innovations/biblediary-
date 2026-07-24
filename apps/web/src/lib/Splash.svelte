<script lang="ts">
  /**
   * Opening splash — the logo on a seasonal wash. It inherits --season-* from
   * the shell, so the colour of the splash *is* the colour of the liturgical
   * day. Shown once a session, and skipped for reduced-motion users.
   */
  import { onMount } from "svelte";
  import { base } from "$app/paths";
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
    const t1 = setTimeout(() => (leaving = true), 1250);
    const t2 = setTimeout(() => {
      show = false;
      ui.splashDone = true;
    }, 1750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  });
</script>

{#if show}
  <div class="splash" class:leaving aria-hidden="true">
    <div class="mark">
      <img src="{base}/icon-512.png" alt="" width="150" height="150" />
      <span class="rule"></span>
      <span class="tag">Daily Liturgy</span>
    </div>
  </div>
{/if}

<style>
  .splash {
    position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
    background: linear-gradient(170deg, color-mix(in srgb, var(--season-deep) 24%, var(--season-wash)), var(--season-wash));
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .splash.leaving { opacity: 0; transform: scale(1.04); pointer-events: none; }
  .mark { display: grid; justify-items: center; gap: 16px; animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
  @keyframes rise { from { opacity: 0; transform: translateY(12px) scale(0.97); } }
  .mark img {
    width: clamp(120px, 34vw, 168px); height: auto; border-radius: 26px;
    box-shadow: 0 18px 40px -14px color-mix(in srgb, var(--season-deep) 60%, transparent);
  }
  .rule { width: 46px; height: 1px; background: color-mix(in srgb, var(--season-gold) 65%, transparent); }
  .tag {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.22em;
    font-size: 0.66rem; color: var(--season-ink); font-weight: 600;
  }
</style>
