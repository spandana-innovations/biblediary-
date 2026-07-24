<script lang="ts">
  import { base } from "$app/paths";
  let { data } = $props();

  // Center disc opens the most recent available day.
  const latest = $derived([...(data.index?.dates ?? [])].sort().at(-1) ?? null);
  const dayHref = $derived(latest ? `${base}/${latest.replaceAll("-", "/")}/` : `${base}/`);
</script>

<svelte:head><title>{data.index?.edition?.name ?? "God's Word"}</title></svelte:head>

<div class="home">
  <svg viewBox="0 0 400 780" role="img" aria-label="God's Word — home">
    <defs>
      <linearGradient id="petalG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d1332f" />
        <stop offset="1" stop-color="#a5161b" />
      </linearGradient>
      <path id="arcMore" d="M 108 372 A 96 96 0 0 0 176 452" fill="none" />
      <path id="arcAbout" d="M 224 452 A 96 96 0 0 0 292 372" fill="none" />
    </defs>

    <g transform="translate(16,20)" opacity="0.16">
      <path d="M200,318 Q128,190 200,66 Q272,190 200,318 Z" fill="#7a1114" />
      <path d="M200,318 Q128,540 200,720 Q272,540 200,318 Z" fill="#7a1114" />
      <path d="M200,318 Q118,244 34,318 Q118,392 200,318 Z" fill="#7a1114" />
      <path d="M200,318 Q282,244 366,318 Q282,392 200,318 Z" fill="#7a1114" />
    </g>

    <a href="{base}/order-of-mass/" class="hit" aria-label="Order of the Mass">
      <path class="petal" d="M200,318 Q128,190 200,66 Q272,190 200,318 Z" fill="url(#petalG)" />
      <text class="arm-label" x="200" y="150" font-size="26">ORDER</text>
      <text class="arm-label sub" x="200" y="178" font-size="16">OF THE</text>
      <text class="arm-label sub" x="200" y="200" font-size="16">MASS</text>
    </a>
    <a href="{base}/homily/" class="hit" aria-label="Homily Tips">
      <path class="petal" d="M200,318 Q128,540 200,720 Q272,540 200,318 Z" fill="url(#petalG)" />
      <text class="arm-label" x="200" y="606" font-size="26">HOMILY</text>
      <text class="arm-label sub" x="200" y="634" font-size="16">TIPS</text>
    </a>
    <a href="{base}/hymns/" class="hit" aria-label="Popular Hymns">
      <path class="petal" d="M200,318 Q118,244 34,318 Q118,392 200,318 Z" fill="url(#petalG)" />
      <text class="arm-label sub" x="78" y="310" font-size="13">POPULAR</text>
      <text class="arm-label" x="78" y="337" font-size="18">HYMNS</text>
    </a>
    <a href="{base}/prayers/" class="hit" aria-label="Prayer Collection">
      <path class="petal" d="M200,318 Q282,244 366,318 Q282,392 200,318 Z" fill="url(#petalG)" />
      <text class="arm-label" x="322" y="310" font-size="18">PRAYER</text>
      <text class="arm-label sub" x="322" y="337" font-size="11">COLLECTION</text>
    </a>

    <circle cx="200" cy="352" r="96" fill="#2b2b2f" />
    <a href="{base}/more/" aria-label="More Apps">
      <text class="arc-label"><textPath href="#arcMore" startOffset="6%">MORE APPS</textPath></text>
    </a>
    <a href="{base}/about/" aria-label="About Us">
      <text class="arc-label"><textPath href="#arcAbout" startOffset="6%">ABOUT US</textPath></text>
    </a>

    <a href={dayHref} class="hit" aria-label="Today's readings">
      <circle cx="200" cy="318" r="83" fill="#ffffff" />
      <text class="logo-script" x="200" y="309" font-size="41">God's</text>
      <text class="logo-script" x="200" y="351" font-size="41">Word</text>
    </a>
  </svg>
</div>

<style>
  .home { flex: 1; display: grid; place-items: center; padding: 40px 8px 8px; background: var(--home-bg); }
  svg { width: 100%; height: auto; max-height: 78vh; }
  .arm-label { fill: #fff; font-family: var(--font-body); font-weight: 700; text-anchor: middle; }
  .arm-label.sub { font-weight: 600; }
  .arc-label { fill: rgba(255, 255, 255, 0.72); font: 600 12px var(--font-body); letter-spacing: 1.5px; }
  .logo-script { fill: var(--brand); font-family: var(--font-script); font-style: italic; text-anchor: middle; }
  .hit { cursor: pointer; }
  .hit:hover .petal { filter: brightness(1.08); }
  a { -webkit-tap-highlight-color: transparent; }
</style>
