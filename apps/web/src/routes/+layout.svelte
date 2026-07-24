<script lang="ts">
  import "../app.css";
  let { data, children } = $props();
</script>

<svelte:head>
  <title>{data.index.edition.name}</title>
</svelte:head>

<div class="shell" style="--accent: {data.index.edition.accent ?? 'var(--season)'}">
  <header>
    <a class="brand" href="/">{data.index.edition.name}</a>
    <span class="edition">{data.index.edition.country} · {data.index.edition.translation}</span>
  </header>

  <main>
    {@render children()}
  </main>

  <footer>
    <p>{data.index.edition.name} — daily Catholic liturgy.</p>
  </footer>
</div>

<style>
  .shell {
    max-width: 42rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 4rem;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--accent);
  }
  .brand {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
    text-decoration: none;
  }
  .edition {
    color: var(--muted);
    font-size: 0.85rem;
  }
  footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 0.85rem;
  }
</style>
