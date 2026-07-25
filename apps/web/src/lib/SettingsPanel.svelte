<script lang="ts">
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { icons } from "$lib/icons";
  import {
    settings, ui, closeSettings, FONT_STEPS,
    setFontScale, setMinistryMode, setTheme, set
  } from "$lib/settings.svelte";
  import { offline, downloadMonth, clearOffline, currentMonth, monthLabel } from "$lib/offline.svelte";

  const thisMonth = currentMonth();

  let voices: SpeechSynthesisVoice[] = $state([]);

  onMount(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices?.() ?? [];
      voices = all.filter((v) => v.lang.startsWith("en"));
    };
    load();
    window.speechSynthesis?.addEventListener?.("voiceschanged", load);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSettings();
    window.addEventListener("keydown", onKey);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", load);
      window.removeEventListener("keydown", onKey);
    };
  });

  function preview() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance("The word of the Lord. Thanks be to God.");
    u.rate = settings.voiceRate;
    const v = voices.find((x) => x.voiceURI === settings.voiceURI);
    if (v) u.voice = v;
    synth.speak(u);
  }
</script>

{#if ui.settingsOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="set-scrim" role="presentation" onclick={closeSettings}>
    <aside
      class="set" role="dialog" aria-modal="true" aria-label="Settings" tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <header class="set-head">
        <h2>Settings</h2>
        <button class="set-x" onclick={closeSettings} aria-label="Close settings">{@html icons.close}</button>
      </header>

      <div class="set-body">
        <!-- Reading -->
        <section class="grp">
          <h3>Reading</h3>

          <div class="row">
            <div class="lbl"><span>Text size</span><span class="hint">Applies to all readings and prayers</span></div>
            <div class="segs" role="group" aria-label="Text size">
              {#each FONT_STEPS as f}
                <button
                  class:on={Math.abs(settings.fontScale - f.scale) < 0.01}
                  onclick={() => setFontScale(f.scale)}
                  aria-pressed={Math.abs(settings.fontScale - f.scale) < 0.01}
                >{f.label}</button>
              {/each}
            </div>
          </div>

          <div class="row">
            <div class="lbl"><span>Appearance</span><span class="hint">Compline is a warm night theme</span></div>
            <div class="segs" role="group" aria-label="Appearance">
              <button class:on={settings.theme === "auto"} onclick={() => setTheme("auto")}>Auto</button>
              <button class:on={settings.theme === "light"} onclick={() => setTheme("light")}>Day</button>
              <button class:on={settings.theme === "dark"} onclick={() => setTheme("dark")}>Compline</button>
            </div>
          </div>
        </section>

        <!-- Ministry -->
        <section class="grp">
          <h3>Ministry</h3>
          <div class="row">
            <div class="lbl">
              <span>Ministry mode</span>
              <span class="hint">Adds homily tips to the readings and to Mass Mode</span>
            </div>
            <button
              class="switch" class:on={settings.ministryMode}
              role="switch" aria-checked={settings.ministryMode}
              aria-label="Ministry mode"
              onclick={() => setMinistryMode(!settings.ministryMode)}
            ><span class="knob"></span></button>
          </div>
        </section>

        <!-- Voice -->
        <section class="grp">
          <h3>Voice</h3>
          <div class="row col">
            <div class="lbl"><span>Speaking rate</span><span class="hint">{settings.voiceRate.toFixed(2)}×</span></div>
            <input
              type="range" min="0.6" max="1.6" step="0.05" value={settings.voiceRate}
              oninput={(e) => set("voiceRate", Number((e.target as HTMLInputElement).value))}
              aria-label="Speaking rate"
            />
          </div>
          {#if voices.length}
            <div class="row col">
              <div class="lbl"><span>Voice</span></div>
              <select
                value={settings.voiceURI}
                onchange={(e) => set("voiceURI", (e.target as HTMLSelectElement).value)}
                aria-label="Voice"
              >
                <option value="">System default</option>
                {#each voices as v}<option value={v.voiceURI}>{v.name}</option>{/each}
              </select>
            </div>
          {/if}
          <button class="ghost" onclick={preview}>{@html icons.sound}<span>Preview voice</span></button>
        </section>

        <!-- Offline -->
        {#if offline.supported}
          <section class="grp">
            <h3>Offline</h3>
            <div class="row">
              <div class="lbl">
                <span>Save {monthLabel(thisMonth)}</span>
                <span class="hint">
                  Today and the fortnight around it are already saved. Add a whole month
                  for travel — about a megabyte.
                </span>
              </div>
              <button class="ghost sm" disabled={offline.busy} onclick={() => downloadMonth(thisMonth)}>
                {offline.busy ? "Saving…" : "Save"}
              </button>
            </div>

            {#if offline.busy && offline.total}
              <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={offline.total} aria-valuenow={offline.cached}>
                <span style="width: {(offline.cached / offline.total) * 100}%"></span>
              </div>
            {/if}
            {#if offline.message}<p class="note">{offline.message}</p>{/if}

            <button class="ghost sm quiet" disabled={offline.busy} onclick={clearOffline}>
              Remove offline copies
            </button>
          </section>
        {/if}

        <!-- Account -->
        <section class="grp">
          <h3>Account</h3>
          <div class="row">
            <div class="lbl"><span>Sign in</span><span class="hint">Sync your settings across devices</span></div>
            <button class="ghost sm" disabled>Coming soon</button>
          </div>
        </section>

        <!-- Legal -->
        <section class="grp">
          <h3>About</h3>
          <nav class="links">
            <a href="{base}/about/" onclick={closeSettings}>About God's Word</a>
            <a href="{base}/privacy/" onclick={closeSettings}>Privacy Policy</a>
            <a href="{base}/terms/" onclick={closeSettings}>Terms of Use</a>
            <a href="{base}/licences/" onclick={closeSettings}>Licences &amp; Credits</a>
          </nav>
        </section>
      </div>
    </aside>
  </div>
{/if}

<style>
  .set-scrim {
    position: fixed; inset: 0; z-index: 110; background: color-mix(in srgb, var(--ink) 42%, transparent);
    backdrop-filter: blur(3px); display: flex; justify-content: flex-end;
    animation: fade 0.16s ease;
  }
  @keyframes fade { from { opacity: 0; } }
  .set {
    width: min(420px, 100%); background: var(--paper); height: 100dvh; overflow-y: auto;
    border-left: 1px solid var(--hairline); box-shadow: -20px 0 60px -24px color-mix(in srgb, var(--ink) 60%, transparent);
    animation: slide 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes slide { from { transform: translateX(24px); opacity: 0.6; } }
  .set-head {
    position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between;
    padding: 20px 22px 14px; background: var(--paper); border-bottom: 1px solid var(--hairline);
  }
  .set-head h2 { font-family: var(--font-display); font-weight: 560; font-size: 1.5rem; margin: 0; }
  .set-x { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--hairline); background: none; color: var(--muted); display: grid; place-items: center; cursor: pointer; }
  .set-x :global(svg) { width: 17px; height: 17px; }

  .set-body { padding: 6px 22px 40px; }
  .grp { padding: 18px 0; border-bottom: 1px solid var(--hairline); }
  .grp:last-child { border-bottom: 0; }
  .grp h3 {
    font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.66rem;
    font-weight: 600; color: var(--season-ink); margin: 0 0 14px;
  }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
  .row:last-child { margin-bottom: 0; }
  .row.col { display: grid; gap: 8px; }
  .lbl { display: grid; gap: 2px; min-width: 0; }
  .lbl > span:first-child { font-family: var(--font-body); font-size: 1.02rem; font-weight: 560; }
  .hint { font-family: var(--font-ui); font-size: 0.74rem; color: var(--muted); line-height: 1.35; }

  .segs { display: flex; gap: 0; border: 1px solid var(--hairline); border-radius: 999px; overflow: hidden; flex-shrink: 0; }
  .segs button {
    border: 0; background: none; cursor: pointer; color: var(--muted);
    font-family: var(--font-ui); font-size: 0.76rem; font-weight: 600; padding: 9px 14px; min-width: 44px;
  }
  .segs button.on { background: var(--season-ink); color: var(--paper); }

  .switch {
    flex-shrink: 0; width: 52px; height: 30px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--hairline); background: color-mix(in srgb, var(--ink) 8%, transparent);
    position: relative; transition: background 0.18s ease;
  }
  .switch .knob {
    position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%;
    background: var(--paper); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.18s ease;
  }
  .switch.on { background: var(--season-ink); border-color: var(--season-ink); }
  .switch.on .knob { transform: translateX(22px); }

  input[type="range"] { width: 100%; accent-color: var(--season-ink); }
  select {
    width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--hairline);
    background: var(--paper); color: var(--ink); font-family: var(--font-ui); font-size: 0.9rem;
  }
  .ghost {
    display: inline-flex; align-items: center; gap: 9px; cursor: pointer; margin-top: 12px;
    border: 1px solid var(--hairline); background: none; color: var(--season-ink);
    border-radius: 999px; padding: 10px 18px;
    font-family: var(--font-ui); font-size: 0.76rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
  }
  .ghost :global(svg) { width: 16px; height: 16px; }
  .ghost.sm { margin: 0; padding: 8px 14px; }
  .ghost:disabled { opacity: 0.5; cursor: default; }
  .ghost.quiet { margin-top: 14px; color: var(--muted); }

  .bar {
    height: 4px; border-radius: 999px; margin: 14px 0 0;
    background: color-mix(in srgb, var(--ink) 10%, transparent); overflow: hidden;
  }
  .bar span { display: block; height: 100%; background: var(--season-ink); transition: width 0.2s ease; }
  .note { font-family: var(--font-ui); font-size: 0.76rem; color: var(--muted); margin: 10px 0 0; }

  .links { display: grid; gap: 2px; }
  .links a {
    padding: 11px 0; border-bottom: 1px solid var(--hairline);
    font-family: var(--font-body); font-size: 1rem;
  }
  .links a:last-child { border-bottom: 0; }
  .links a:hover { color: var(--season-ink); }
</style>
