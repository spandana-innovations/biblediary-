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
  <div class="playerbar" role="region" aria-label="Now playing">
    <button class="pb-play" onclick={togglePlay} aria-label={player.playing ? "Pause" : "Play"}>
      {@html player.playing ? icons.pause : icons.play}
    </button>
    <div class="pb-meta">
      <div class="pb-title">{player.track.title}</div>
      <div class="pb-sub">{player.track.subtitle ?? ""}</div>
    </div>
    <div class="pb-scrub">
      <span class="pb-t">{fmt(player.current)}</span>
      <input
        type="range" min="0" max={player.duration || 0} value={player.current}
        oninput={scrub} aria-label="Seek"
      />
      <span class="pb-t">{fmt(player.duration)}</span>
    </div>
    <button class="pb-close" onclick={closePlayer} aria-label="Close player">{@html icons.close}</button>
  </div>
{/if}

<style>
  .playerbar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 45;
    display: flex; align-items: center; gap: 14px;
    padding: 10px clamp(14px, 4vw, 28px);
    background: color-mix(in srgb, var(--paper) 82%, var(--season-wash));
    border-top: 1px solid var(--hairline);
    backdrop-filter: blur(12px);
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
  @media (max-width: 1023px) { .playerbar { bottom: 60px; } }
  .pb-play {
    flex-shrink: 0; width: 46px; height: 46px; border-radius: 50%;
    border: 0; background: var(--season-ink); color: var(--paper);
    display: grid; place-items: center; cursor: pointer;
  }
  .pb-play :global(svg) { width: 20px; height: 20px; }
  .pb-meta { min-width: 0; flex-shrink: 0; width: clamp(120px, 22vw, 220px); }
  .pb-title { font-family: var(--font-body); font-weight: 620; font-size: 1.02rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pb-sub { font-family: var(--font-ui); font-size: 0.74rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pb-scrub { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pb-t { font-family: var(--font-ui); font-size: 0.68rem; color: var(--muted); font-variant-numeric: tabular-nums; }
  .pb-scrub input {
    flex: 1; min-width: 40px; accent-color: var(--season-ink); height: 3px;
  }
  .pb-close { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--hairline); background: transparent; color: var(--muted); display: grid; place-items: center; cursor: pointer; }
  .pb-close :global(svg) { width: 16px; height: 16px; }
  @media (max-width: 640px) { .pb-scrub .pb-t { display: none; } .pb-meta { width: auto; flex: 1; } .pb-scrub { display: none; } }
</style>
