/**
 * Persistent audio player — a single <audio> element lives in the layout
 * (see Player.svelte) so playback survives navigation. This module holds the
 * reactive state and the imperative controls; the component syncs to it.
 */
export interface Track {
  title: string;
  subtitle?: string;
  src: string | null;
}

export const player = $state({
  track: null as Track | null,
  playing: false,
  current: 0,
  duration: 0,
  /** bumped whenever a new track is requested, so the component reloads src */
  token: 0
});

/** Request a track. Returns false if the track has no audio yet. */
export function requestTrack(track: Track): boolean {
  if (!track.src) return false;
  player.track = track;
  player.playing = true;
  player.current = 0;
  player.duration = 0;
  player.token++;
  return true;
}

export function togglePlay() {
  if (!player.track) return;
  player.playing = !player.playing;
}

export function closePlayer() {
  player.track = null;
  player.playing = false;
  player.token++;
}
