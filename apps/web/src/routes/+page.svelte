<script lang="ts">
  let { data } = $props();

  // /2026/04/05/ style URLs — shareable, indexable (REBUILD_PLAN §8.1).
  const dayHref = (date: string) => `/${date.replaceAll("-", "/")}/`;
  const dates = $derived([...data.index.dates].sort().reverse());
</script>

<h1>Daily Readings</h1>
<p class="lede">
  {data.index.days} day{data.index.days === 1 ? "" : "s"} available.
</p>

<ul class="days">
  {#each dates as date}
    <li><a href={dayHref(date)}>{date}</a></li>
  {/each}
</ul>

<style>
  h1 {
    margin-bottom: 0.25rem;
  }
  .lede {
    color: var(--muted);
    margin-top: 0;
  }
  .days {
    list-style: none;
    padding: 0;
  }
  .days li {
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--border);
  }
</style>
