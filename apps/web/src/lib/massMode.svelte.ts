/**
 * Mass Mode screen wake-lock. The route itself owns the layout; this module
 * just keeps the device awake for as long as Mass Mode is on screen and
 * re-acquires the lock when the tab becomes visible again (browsers drop it
 * whenever the page is hidden).
 */
export const mass = $state({ active: false });

let lock: WakeLockSentinel | null = null;

async function acquire() {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request(t: string): Promise<WakeLockSentinel> } }).wakeLock;
    lock = wl ? await wl.request("screen") : null;
  } catch {
    lock = null; // denied, unsupported, or not a secure context
  }
}

function release() {
  lock?.release?.().catch(() => {});
  lock = null;
}

function onVisible() {
  if (mass.active && document.visibilityState === "visible") acquire();
}

export async function enterMass() {
  if (mass.active) return;
  mass.active = true;
  document.documentElement.setAttribute("data-mass", "on");
  document.addEventListener("visibilitychange", onVisible);
  await acquire();
}

export function exitMass() {
  if (!mass.active) return;
  mass.active = false;
  document.documentElement.removeAttribute("data-mass");
  document.removeEventListener("visibilitychange", onVisible);
  release();
}

export const toggleMass = () => (mass.active ? exitMass() : enterMass());
