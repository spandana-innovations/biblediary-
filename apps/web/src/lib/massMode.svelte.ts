/**
 * Mass Mode — a focused, screen-awake reading surface for use during the
 * liturgy: larger type, chrome tucked away, and a screen wake-lock so the
 * device doesn't dim mid-prayer. Toggling sets data-mass on <html> which the
 * stylesheet keys off.
 */
export const mass = $state({ active: false });

let lock: WakeLockSentinel | null = null;

async function acquire() {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request(t: string): Promise<WakeLockSentinel> } }).wakeLock;
    lock = wl ? await wl.request("screen") : null;
  } catch {
    lock = null;
  }
}

function release() {
  lock?.release?.().catch(() => {});
  lock = null;
}

function onVisible() {
  if (mass.active && document.visibilityState === "visible") acquire();
}

export async function toggleMass() {
  mass.active = !mass.active;
  const root = document.documentElement;
  if (mass.active) {
    root.setAttribute("data-mass", "on");
    await acquire();
    document.addEventListener("visibilitychange", onVisible);
  } else {
    root.removeAttribute("data-mass");
    release();
    document.removeEventListener("visibilitychange", onVisible);
  }
}
