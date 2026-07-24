<script lang="ts">
  import { renderBody } from "$lib/api";
  import { seasonToken } from "$lib/liturgical";

  let { data } = $props();
  const day = $derived(data.day);
  const season = $derived(seasonToken(day.season, day.liturgicalColor));
</script>

<svelte:head>
  <title>{day.celebration ?? day.date} — {data.index.edition.name}</title>
  <meta
    name="description"
    content={`${day.celebration ?? day.date}: readings, psalm, gospel and reflection.`}
  />
</svelte:head>

<article data-season={season}>
  <header class="day-head">
    <p class="date">{day.date}</p>
    {#if day.celebration}<h1>{day.celebration}</h1>{/if}
    <p class="meta">
      {#if day.season}<span>{day.season}</span>{/if}
      {#if day.psalterWeek}<span>Psalter Week {day.psalterWeek}</span>{/if}
      <span>{day.translation}</span>
    </p>
  </header>

  {#each day.sections as section}
    <section class="liturgy">
      <h2>{section.title}</h2>
      {#if section.ref}<p class="ref">{section.ref}</p>{/if}
      {#if section.audio}
        <audio controls preload="none" src={section.audio}></audio>
      {/if}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- content is trusted, editor-authored -->
      {@html renderBody(section.body)}
    </section>
  {/each}
</article>

<p class="back"><a href="/">← All days</a></p>

<style>
  .day-head {
    border-left: 4px solid var(--season);
    padding-left: 0.9rem;
    margin-bottom: 1.5rem;
  }
  .date {
    color: var(--muted);
    margin: 0;
    font-size: 0.9rem;
  }
  h1 {
    margin: 0.2rem 0;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    color: var(--season);
    font-size: 0.85rem;
    margin: 0;
  }
  section {
    margin: 1.75rem 0;
  }
  h2 {
    font-size: 1.15rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.25rem;
  }
  .ref {
    color: var(--muted);
    font-style: italic;
    margin-top: -0.25rem;
  }
  audio {
    width: 100%;
    margin: 0.5rem 0;
  }
  .back {
    margin-top: 2.5rem;
  }
</style>
