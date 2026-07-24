<script lang="ts">
  const reflections = [
    {
      ref: "Matthew 25: 31–46",
      badge: "Reflection I",
      body: `The purpose of today's Gospel passage is to tell us what we must do in order to be saved; how we should live while awaiting the final and glorious coming of the Lord, and how we should be actively and concretely helping those who are in need, like feeding the hungry, clothing the naked etc. St Mother Teresa of Kolkata made this text the basis of her world mission to serve the poorest of the poor. Whatever we do on account of brotherly love is for us the key to heaven.`,
      author: "Fr (Dr) George Kaitholil, SSP"
    },
    {
      ref: "Reflection II",
      badge: null,
      body: `The passage emphasizes the importance of living a life of service and of the gravity of neglecting the needy with whom Jesus identifies himself. Even for the smallest good deed, we shall be rewarded.`,
      author: null
    }
  ];
</script>

<svelte:head>
  <title>Homily Tips — God's Word</title>
  <meta name="description" content="Reflections and homily tips on the Gospel of the day." />
</svelte:head>

<div class="page-head">
  <p class="eyebrow">For Preachers &amp; Prayer</p>
  <h1>Homily Tips</h1>
  <p class="lede">A reflection on the Gospel of the day, to nourish preaching and personal prayer.</p>
</div>

<div class="page-body">
  {#each reflections as r, i}
    <article class="refl">
      {#if i > 0}<div class="leaf"><span class="g">❧</span></div>{/if}
      {#if r.badge}<p class="refl-badge">{r.badge}</p>{/if}
      <p class="ref">{r.ref}</p>
      <p class="refl-body" class:dropcap={i === 0}>{r.body}</p>
      {#if r.author}<p class="refl-author">— {r.author}</p>{/if}
    </article>
  {/each}
</div>

<style>
  .eyebrow { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; font-weight: 600; color: var(--season-ink); margin: 0 0 8px; }
  .lede { color: var(--muted); font-family: var(--font-body); font-size: 1.05rem; margin: 8px 0 0; }
  .refl { margin-bottom: 8px; }
  .refl-badge { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.68rem; font-weight: 600; color: var(--season-gold); margin: 0 0 6px; }
  .ref { font-variant-caps: all-small-caps; letter-spacing: 0.04em; color: var(--season-ink); font-size: 1.05rem; margin: 0 0 0.8rem; }
  .refl-body { font-family: var(--font-body); font-size: var(--text-reading); line-height: var(--leading-reading); margin: 0; }
  .refl-body.dropcap::first-letter {
    font-family: var(--font-display); font-weight: 560; color: var(--season-ink);
    -webkit-initial-letter: 3; initial-letter: 3; float: left; line-height: 0.8; padding-right: 0.08em; margin-top: 0.05em;
  }
  .refl-author { font-style: italic; color: var(--muted); margin-top: 0.9rem; }
</style>
