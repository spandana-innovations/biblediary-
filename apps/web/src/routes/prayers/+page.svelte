<script lang="ts">
  import RedHeader from "$lib/RedHeader.svelte";
  import { renderBody } from "$lib/api";
  import { icons } from "$lib/icons";
  let { data } = $props();
  const cats = [
    { label: "Common", icon: icons.beads },
    { label: "Holy Rosary", icon: icons.beads },
    { label: "Marian", icon: icons.mary },
    { label: "Litanies", icon: icons.notes }
  ];
  let sel = $state(0);
  let open = $state<number | null>(0);
</script>

<svelte:head><title>Prayer Collection</title></svelte:head>

<RedHeader title="Prayer Collection">
  {#snippet children()}
    <div class="chips">
      {#each cats as c, i}
        <button class="cat" class:sel={i === sel} onclick={() => (sel = i)}>
          <span class="ic">{@html c.icon}</span><span>{c.label}</span>
        </button>
      {/each}
    </div>
  {/snippet}
</RedHeader>

<div class="sheet">
  <div class="acc">
    {#each data.items as p, i}
      <div class="arow" class:open={open === i}>
        <button aria-expanded={open === i} onclick={() => (open = open === i ? null : i)}>
          <span>{p.title}</span><span class="chev">{@html icons.chevron}</span>
        </button>
        {#if open === i}
          <div class="panel liturgy">{@html renderBody(p.body)}</div>
        {/if}
      </div>
    {/each}
  </div>
</div>
