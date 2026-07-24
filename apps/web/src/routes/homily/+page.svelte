<script lang="ts">
  import RedHeader from "$lib/RedHeader.svelte";
  const reflections = [
    {
      ref: "Matthew 25: 31-46",
      badge: "Reflection: 1",
      body: `The purpose of today's Gospel passage is to tell us what we must do in order to be saved; how we should live while awaiting the final and glorious coming of the Lord, and how we should be actively and concretely helping those who are in need, like feeding the hungry, clothing the naked etc. St Mother Teresa of Kolkata made this text the basis of her world mission to serve the poorest of the poor. Whatever we do on account of brotherly love is for us the key to heaven.`,
      author: "Fr (Dr) George Kaitholil, SSP"
    },
    {
      ref: "Reflection: 2",
      badge: null,
      body: `The passage emphasizes the importance of living a life of service and of the gravity of neglecting the needy with whom Jesus identifies himself. Even for the smallest good deed, we shall be rewarded.`,
      author: null
    }
  ];
</script>

<svelte:head><title>Homily Tips</title></svelte:head>

<RedHeader title="Homily Tips">
  {#snippet children()}
    <div class="hero">
      <h2>Today's Homily Tip</h2>
      <span class="date-chip">Today's reflection on the Gospel</span>
    </div>
  {/snippet}
</RedHeader>

<div class="sheet">
  {#each reflections as r}
    <div class="refl">
      <div class="ref">{r.ref}</div>
      {#if r.badge}<span class="refl-badge">{r.badge}</span>{/if}
      <p class="body-txt">{r.body}</p>
      {#if r.author}<p class="refl-author">{r.author}</p>{/if}
    </div>
  {/each}
</div>

<style>
  .hero {
    margin-top: 16px; border-radius: 22px; padding: 24px; text-align: center; color: #fff;
    background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative; z-index: 2;
  }
  .hero h2 { font: 600 1.6rem/1 var(--font-body); margin: 0 0 8px; }
  .hero .date-chip { font-size: 0.9rem; opacity: 0.9; }
  .refl { border-bottom: 1px solid var(--hairline); padding-bottom: 20px; margin-bottom: 20px; }
  .refl:last-child { border: 0; margin-bottom: 0; }
  .ref { font: 600 1.3rem var(--font-body); margin-bottom: 10px; }
  .refl-badge { display: inline-block; background: var(--brand); color: #fff; border-radius: 999px; padding: 7px 16px; font-weight: 600; font-size: 0.9rem; margin-bottom: 12px; }
  .refl-author { font-style: italic; color: var(--muted); margin-top: 8px; }
</style>
