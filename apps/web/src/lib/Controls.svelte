<script lang="ts">
  /**
   * The floating controls, collapsed behind a single button.
   *
   * Tapping it springs the actions downward in sequence — search, text size,
   * night mode, settings — and tapping it again draws them back up. Collapsed
   * by default so it stops competing with the reading surface.
   */
  import { onMount } from "svelte";
  import { icons } from "$lib/icons";
  import { openPalette } from "$lib/palette.svelte";
  import {
    openSettings, settings, cycleTheme, isDark, setFontScale, FONT_STEPS
  } from "$lib/settings.svelte";

  let open = $state(false);
  let dark = $state(false);
  let root: HTMLDivElement | null = $state(null);

  onMount(() => {
    dark = isDark();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (open = false);
    const onClick = (e: MouseEvent) => {
      if (open && root && !root.contains(e.target as Node)) open = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClick);
    };
  });

  /** Current step label, so the button reads as a size control. */
  const sizeLabel = $derived(
    FONT_STEPS.find((f) => Math.abs(settings.fontScale - f.scale) < 0.01)?.label ?? "M"
  );
  function nextSize() {
    const i = FONT_STEPS.findIndex((f) => Math.abs(settings.fontScale - f.scale) < 0.01);
    setFontScale(FONT_STEPS[(i + 1) % FONT_STEPS.length].scale);
  }
  function toggleTheme() {
    cycleTheme();
    dark = isDark();
  }

  // Ordered top-to-bottom as they spring open.
  const actions = $derived([
    { key: "search", label: "Search", icon: icons.search, run: () => openPalette() },
    { key: "size", label: `Text size — ${sizeLabel}`, icon: icons.textsize, run: nextSize, badge: sizeLabel },
    { key: "theme", label: "Night mode", icon: dark ? icons.sun : icons.moon, run: toggleTheme },
    { key: "settings", label: "Settings", icon: icons.cog, run: () => openSettings() }
  ]);
</script>

<div class="controls" bind:this={root}>
  <button
    class="ctl-toggle" class:open
    onclick={() => (open = !open)}
    aria-expanded={open}
    aria-label={open ? "Hide controls" : "Show controls"}
  >{@html open ? icons.close : icons.more}</button>

  {#if open}
    <div class="ctl-stack">
      {#each actions as a, i (a.key)}
        <button
          class="ctl-item"
          style="--delay: {i * 45}ms"
          onclick={() => { a.run(); if (a.key !== "size") open = false; }}
          aria-label={a.label}
          title={a.label}
        >
          {@html a.icon}
          {#if a.badge}<span class="ctl-badge">{a.badge}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .controls {
    position: fixed; z-index: 50;
    /* Installed to the Home Screen, iOS puts the page behind the status bar
       and the Dynamic Island. A flat 14px left the toggle half under the
       clock; the inset is 0 in a normal browser tab, so this costs nothing
       there. */
    top: calc(14px + env(safe-area-inset-top, 0px));
    right: max(14px, env(safe-area-inset-right, 0px));
    display: grid; justify-items: center; gap: 8px;
  }
  .ctl-toggle, .ctl-item {
    width: 42px; height: 42px; border-radius: 50%; cursor: pointer;
    border: 1px solid var(--hairline);
    background: color-mix(in srgb, var(--paper) 86%, var(--season-wash));
    color: var(--ink); display: grid; place-items: center;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 14px -6px color-mix(in srgb, var(--season-deep) 40%, transparent);
  }
  .ctl-toggle :global(svg), .ctl-item :global(svg) { width: 18px; height: 18px; }
  .ctl-toggle.open { background: var(--season-ink); color: var(--paper); border-color: var(--season-ink); }

  .ctl-stack { display: grid; justify-items: center; gap: 8px; }
  .ctl-item {
    position: relative;
    animation: spring 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    animation-delay: var(--delay);
  }
  /* Overshoot on the way down, so the stack lands with a little weight. */
  @keyframes spring {
    from { opacity: 0; transform: translateY(-14px) scale(0.8); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ctl-item:hover { border-color: var(--season-ink); color: var(--season-ink); }
  .ctl-badge {
    position: absolute; right: -3px; bottom: -3px;
    min-width: 17px; height: 17px; padding: 0 3px; border-radius: 9px;
    background: var(--season-ink); color: var(--paper);
    font-family: var(--font-ui); font-size: 0.55rem; font-weight: 700;
    display: grid; place-items: center; letter-spacing: 0.02em;
  }

  @media (prefers-reduced-motion: reduce) {
    .ctl-item { animation: none; }
  }
  @media print { .controls { display: none; } }
</style>
