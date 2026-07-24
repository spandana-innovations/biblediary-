<script lang="ts">
  /** Shared day stepper: arrows plus a native date picker that snaps to a held day. */
  import { icons } from "$lib/icons";

  let {
    date,
    dates,
    disabled = false,
    onpick
  }: {
    date: string | undefined;
    dates: string[];
    disabled?: boolean;
    onpick: (d: string) => void;
  } = $props();

  const at = $derived(date ? dates.indexOf(date) : -1);

  const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function line(d?: string) {
    if (!d) return "";
    const [y, m, dd] = d.split("-").map(Number);
    return `${WEEK[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]}, ${dd} ${MON[m - 1]} ${y}`;
  }

  const step = (delta: number) => {
    const t = dates[at + delta];
    if (t) onpick(t);
  };
  function pick(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    if (!v) return;
    if (dates.includes(v)) return onpick(v);
    const t = Date.parse(v);
    const near = [...dates].sort((a, b) => Math.abs(Date.parse(a) - t) - Math.abs(Date.parse(b) - t))[0];
    if (near) onpick(near);
  }
</script>

<nav class="datebar" aria-label="Choose a day">
  <button class="arrow" onclick={() => step(-1)} disabled={at <= 0 || disabled} aria-label="Previous day">
    {@html icons.prev}
  </button>
  <label class="picker">
    {@html icons.calendar}
    <span class="pl">{line(date)}</span>
    <input type="date" value={date ?? ""} onchange={pick} aria-label="Jump to a date" />
  </label>
  <button class="arrow" onclick={() => step(1)} disabled={at < 0 || at >= dates.length - 1 || disabled} aria-label="Next day">
    {@html icons.next}
  </button>
</nav>

<style>
  .datebar { display: flex; align-items: center; gap: 10px; margin: 0 0 22px; flex-wrap: nowrap; }
  .arrow, .picker {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 42px; border: 1px solid var(--hairline); border-radius: 999px;
    background: transparent; color: var(--season-ink);
    font-family: var(--font-ui); font-weight: 600; cursor: pointer;
  }
  .arrow { width: 42px; flex-shrink: 0; }
  .arrow:disabled { opacity: 0.3; cursor: default; }
  :global(.datebar svg) { width: 17px; height: 17px; }
  .picker {
    position: relative; color: var(--ink); padding: 0 16px;
    font-size: 0.85rem; min-width: 0; flex: 0 1 auto;
  }
  .pl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .picker input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; border: 0; padding: 0; }
  .picker:hover { border-color: var(--season-ink); }
</style>
