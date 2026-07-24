<script lang="ts">
  import { card, closeCard } from "$lib/verseCard.svelte";
  import { icons } from "$lib/icons";

  // Seasonal palette for the exported image (mirrors the CSS engine).
  const PALETTE: Record<string, { accent: string; deep: string }> = {
    ordinary: { accent: "#2e6b4f", deep: "#1c3a2c" },
    advent: { accent: "#5b3a80", deep: "#2e1e42" },
    lent: { accent: "#5b3a80", deep: "#2e1e42" },
    easter: { accent: "#8a6d28", deep: "#3d2f14" },
    christmas: { accent: "#8a6d28", deep: "#3d2f14" },
    passion: { accent: "#9e2b25", deep: "#4a100c" },
    rose: { accent: "#b0596a", deep: "#5c2b33" },
    marian: { accent: "#3e5c8f", deep: "#1d2c47" },
    neutral: { accent: "#8a6d28", deep: "#3d2f14" }
  };
  const PAPER = "#fdfcf9", INK = "#241f1a", GOLD = "#b08d3e";

  let canvas: HTMLCanvasElement | null = $state(null);
  let busy = $state(false);

  function excerpt(t: string, max = 300) {
    const s = t.replace(/\s+/g, " ").trim();
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "), cut.lastIndexOf(", "));
    return (stop > 120 ? cut.slice(0, stop + 1) : cut) + "…";
  }

  function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
    const words = text.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        y += lh;
        line = w;
      } else line = test;
    }
    if (line) ctx.fillText(line, x, y);
    return y;
  }

  async function draw() {
    const c = canvas;
    const d = card.data;
    if (!c || !d) return;
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    const ctx = c.getContext("2d")!;
    const W = 1080, H = 1350;
    c.width = W; c.height = H;
    const pal = PALETTE[d.season] ?? PALETTE.neutral;

    // background
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    // top season band
    const grad = ctx.createLinearGradient(0, 0, 0, 260);
    grad.addColorStop(0, pal.deep);
    grad.addColorStop(1, pal.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 12);
    // gold frame
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    const M = 120;
    // eyebrow (date)
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = pal.accent;
    ctx.font = "600 26px InterVar, sans-serif";
    ctx.fillText(d.dateLine.toUpperCase(), M, 210);
    // reference
    ctx.fillStyle = INK;
    ctx.font = "600 40px Fraunces, serif";
    ctx.fillText(d.ref || d.title, M, 280);

    // verse body
    ctx.fillStyle = INK;
    ctx.font = "400 52px Newsreader, serif";
    let y = 420;
    y = wrap(ctx, excerpt(d.text), M, y, W - M * 2, 74);

    // divider leaf
    ctx.fillStyle = GOLD;
    ctx.font = "400 44px Fraunces, serif";
    ctx.fillText("❧", M, Math.min(y + 120, H - 220));

    // footer
    ctx.fillStyle = pal.accent;
    ctx.font = "600 26px InterVar, sans-serif";
    ctx.fillText("✠  GOD’S WORD", M, H - 150);
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.55;
    ctx.font = "400 24px InterVar, sans-serif";
    ctx.fillText("Daily liturgy · biblediary", M, H - 112);
    ctx.globalAlpha = 1;
  }

  // Redraw whenever a card is opened.
  $effect(() => {
    if (card.data && canvas) draw();
  });

  function filename() {
    return `gods-word-${(card.data?.ref || card.data?.title || "verse").replace(/[^\w]+/g, "-").toLowerCase()}.png`;
  }

  async function share() {
    if (!canvas) return;
    busy = true;
    try {
      const blob: Blob | null = await new Promise((res) => canvas!.toBlob(res, "image/png"));
      if (!blob) return;
      const file = new File([blob], filename(), { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "God's Word", text: card.data?.ref });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename();
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      /* user cancelled */
    } finally {
      busy = false;
    }
  }
</script>

{#if card.data}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="vc-scrim" role="presentation" onclick={closeCard}>
    <div class="vc" role="dialog" aria-modal="true" aria-label="Share verse card" tabindex="-1" onclick={(e) => e.stopPropagation()}>
      <canvas bind:this={canvas} class="vc-canvas"></canvas>
      <div class="vc-actions">
        <button class="vc-share" onclick={share} disabled={busy}>{@html icons.download}<span>{busy ? "Preparing…" : "Save / Share image"}</span></button>
        <button class="vc-close" onclick={closeCard} aria-label="Close">{@html icons.close}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .vc-scrim {
    position: fixed; inset: 0; z-index: 100; background: color-mix(in srgb, var(--ink) 55%, transparent);
    backdrop-filter: blur(4px); display: grid; place-items: center; padding: 20px;
    animation: fade 0.15s ease;
  }
  @keyframes fade { from { opacity: 0; } }
  .vc { display: grid; gap: 14px; justify-items: center; max-width: 100%; }
  .vc-canvas {
    width: min(360px, 82vw); height: auto; aspect-ratio: 1080 / 1350;
    border-radius: 8px; box-shadow: 0 24px 60px -20px rgba(0,0,0,0.6); background: var(--paper);
  }
  .vc-actions { display: flex; gap: 10px; align-items: center; }
  .vc-share {
    display: inline-flex; align-items: center; gap: 9px; cursor: pointer;
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.74rem; font-weight: 600;
    padding: 12px 22px; border-radius: 999px; border: 0; background: var(--paper); color: var(--ink);
  }
  .vc-share :global(svg) { width: 17px; height: 17px; }
  .vc-share:disabled { opacity: 0.6; }
  .vc-close {
    width: 44px; height: 44px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--paper) 40%, transparent);
    background: transparent; color: var(--paper); display: grid; place-items: center; cursor: pointer;
  }
  .vc-close :global(svg) { width: 18px; height: 18px; }
</style>
