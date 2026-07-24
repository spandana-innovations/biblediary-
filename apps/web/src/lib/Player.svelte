<script lang="ts">
  import { player, togglePlay, closePlayer } from "$lib/player.svelte";
  import { icons } from "$lib/icons";

  let audio: HTMLAudioElement | null = $state(null);

  // Load a new track whenever token changes.
  let loadedToken = -1;
  $effect(() => {
    if (!audio) return;
    if (player.token === loadedToken) return;
    loadedToken = player.token;
    if (player.track?.src) {
      audio.src = player.track.src;
      audio.load();
      audio.play().catch(() => (player.playing = false));
      setMeta();
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
  });

  // Reflect play/pause state onto the element.
  $effect(() => {
    if (!audio || !player.track) return;
    if (player.playing) audio.play().catch(() => (player.playing = false));
    else audio.pause();
  });

  function setMeta() {
    if (!("mediaSession" in navigator) || !player.track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: player.track.title,
      artist: player.track.subtitle ?? "God's Word",
      album: "God's Word — Hymns"
    });
    navigator.mediaSession.setActionHandler("play", () => (player.playing = true));
    navigator.mediaSession.setActionHandler("pause", () => (player.playing = false));
  }

  function fmt(t: number) {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  function scrub(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (audio) audio.currentTime = v;
  }
</script>

<audio
  bind:this={audio}
  ontimeupdate={() => audio && (player.current = audio.currentTime)}
  onloadedmetadata={() => audio && (player.duration = audio.duration)}
  onended={() => (player.playing = false)}
  onplay={() => (player.playing = true)}
  onpause={() => audio && !audio.ended && (player.playing = false)}
></audio>

{#if player.track}
  {@const pct = player.duration ? (player.current / player.duration) * 100 : 0}
  <div class="playerbar" role="region" aria-label="Now playing">
    <!-- hairline progress along the top edge of the bar -->
    <div class="pb-line" style="transform: scaleX({pct / 100})" aria-hidden="true"></div>

    <button class="pb-play" onclick={togglePlay} aria-label={player.playing ? "Pause" : "Play"}>
      {@html player.playing ? icons.pause : icons.play}
    </button>

    <div class="pb-meta">
      <div class="pb-title">{player.track.title}</div>
      <div class="pb-sub">
        <span class="pb-note">{@html icons.note}</span>{player.track.subtitle ?? "God’s Word"}
      </div>
    </div>

    <div class="pb-scrub">
      <span class="pb-t">{fmt(player.current)}</span>
      <input
        type="range" min="0" max={player.duration || 0} value={player.current}
        style="--pct: {pct}%"
        oninput={scrub} aria-label="Seek"
      />
      <span class="pb-t">{fmt(player.duration)}</span>
    </div>

    <button class="pb-close" onclick={closePlayer} aria-label="Close player">{@html icons.close}</button>
  </div>
{/if}

<style>
  /* Themed to the missal: paper ground, seasonal ink, hairline rules. */
  .playerbar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 45;
    display: flex; align-items: center; gap: 16px;
    padding: 12px clamp(14px, 4vw, 32px);
    background: color-mix(in srgb, var(--paper) 88%, var(--season-wash));
    border-top: 1px solid var(--hairline);
    backdrop-filter: blur(14px);
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
    animation: pb-rise 0.26s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes pb-rise { from { transform: translateY(100%); } }
  @media (max-width: 1023px) { .playerbar { bottom: 68px; } }

  .pb-line {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--season-ink); transform-origin: left; transform: scaleX(0);
    transition: transform 0.2s linear;
  }

  .pb-play {
    flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%;
    border: 1px solid var(--season-ink); background: var(--season-ink); color: var(--paper);
    display: grid; place-items: center; cursor: pointer;
    transition: transform 0.15s ease;
  }
  .pb-play:hover { transform: scale(1.05); }
  .pb-play :global(svg) { width: 19px; height: 19px; }

  .pb-meta { min-width: 0; flex-shrink: 0; width: clamp(130px, 22vw, 240px); display: grid; gap: 2px; }
  .pb-title {
    font-family: var(--font-body); font-weight: 620; font-size: 1.05rem;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pb-sub {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font-ui); font-size: 0.72rem; color: var(--muted);
    letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pb-note { display: grid; color: var(--season-gold); flex-shrink: 0; }
  .pb-note :global(svg) { width: 13px; height: 13px; }

  .pb-scrub { flex: 1; display: flex; align-items: center; gap: 12px; min-width: 0; }
  .pb-t {
    font-family: var(--font-ui); font-size: 0.68rem; color: var(--muted);
    font-variant-numeric: tabular-nums; letter-spacing: 0.03em;
  }

  /* Slim seasonal track with a gold playhead. */
  .pb-scrub input {
    flex: 1; min-width: 40px; height: 20px; cursor: pointer;
    -webkit-appearance: none; appearance: none; background: transparent;
  }
  .pb-scrub input::-webkit-slider-runnable-track {
    height: 3px; border-radius: 2px;
    background: linear-gradient(to right, var(--season-ink) var(--pct, 0%), var(--hairline) var(--pct, 0%));
  }
  .pb-scrub input::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none; margin-top: -5px;
    width: 13px; height: 13px; border-radius: 50%;
    background: var(--season-gold); border: 2px solid var(--paper);
  }
  .pb-scrub input::-moz-range-track { height: 3px; border-radius: 2px; background: var(--hairline); }
  .pb-scrub input::-moz-range-progress { height: 3px; border-radius: 2px; background: var(--season-ink); }
  .pb-scrub input::-moz-range-thumb {
    width: 13px; height: 13px; border-radius: 50%;
    background: var(--season-gold); border: 2px solid var(--paper);
  }

  .pb-close {
    flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid var(--hairline); background: transparent; color: var(--muted);
    display: grid; place-items: center; cursor: pointer;
  }
  .pb-close:hover { color: var(--ink); border-color: var(--season-ink); }
  .pb-close :global(svg) { width: 16px; height: 16px; }

  @media (max-width: 700px) {
    .pb-scrub { display: none; }
    .pb-meta { width: auto; flex: 1; }
  }
</style>
