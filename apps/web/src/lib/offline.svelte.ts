/**
 * Talks to the service worker about offline storage.
 *
 * The worker only precaches the shell and a fortnight of readings, so anyone
 * who wants a whole month on a plane has to ask for it. This wraps that
 * request in a MessageChannel and exposes the progress as runes.
 */

export type OfflineState = {
  supported: boolean;
  busy: boolean;
  month: string | null;
  total: number;
  cached: number;
  message: string;
};

export const offline = $state<OfflineState>({
  supported: false,
  busy: false,
  month: null,
  total: 0,
  cached: 0,
  message: ""
});

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  offline.supported = true;
}

/** The month a "download" button should offer, as YYYY-MM. */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(ym: string): string {
  const MON = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${MON[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
}

async function ready(): Promise<ServiceWorker | null> {
  if (!offline.supported) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.active;
  } catch {
    return null;
  }
}

export async function downloadMonth(ym: string): Promise<void> {
  if (offline.busy) return;
  const worker = await ready();
  if (!worker) {
    offline.message = "Offline storage isn’t available in this browser.";
    return;
  }

  offline.busy = true;
  offline.month = ym;
  offline.total = 0;
  offline.cached = 0;
  offline.message = "Preparing…";

  await new Promise<void>((resolve) => {
    const chan = new MessageChannel();
    // A worker that never answers must not leave the button spinning forever.
    const timer = setTimeout(() => {
      offline.message = "That took too long — try again on a better connection.";
      finish();
    }, 120_000);

    function finish() {
      clearTimeout(timer);
      chan.port1.onmessage = null;
      chan.port1.close();
      offline.busy = false;
      resolve();
    }

    chan.port1.onmessage = (e) => {
      const m = e.data as { type: string; total?: number; cached?: number };
      if (m.type === "month-progress") {
        offline.total = m.total ?? 0;
        offline.cached = m.cached ?? 0;
        offline.message = `Saved ${offline.cached} of ${offline.total} days…`;
      } else if (m.type === "month-done") {
        offline.total = m.total ?? 0;
        offline.cached = m.cached ?? 0;
        offline.message = m.total
          ? `${monthLabel(ym)} is available offline.`
          : `No readings are published for ${monthLabel(ym)}.`;
        finish();
      }
    };

    worker.postMessage({ type: "cache-month", month: ym }, [chan.port2]);
  });
}

export async function clearOffline(): Promise<void> {
  const worker = await ready();
  if (!worker) return;
  offline.busy = true;
  await new Promise<void>((resolve) => {
    const chan = new MessageChannel();
    const timer = setTimeout(resolve, 15_000);
    chan.port1.onmessage = () => {
      clearTimeout(timer);
      resolve();
    };
    worker.postMessage({ type: "clear-cache" }, [chan.port2]);
  });
  offline.busy = false;
  offline.month = null;
  offline.total = 0;
  offline.cached = 0;
  offline.message = "Offline copies removed.";
}
