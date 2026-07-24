<script lang="ts">
  import RedHeader from "$lib/RedHeader.svelte";
  import { icons } from "$lib/icons";
  let { data } = $props();
  const cats = [
    { label: "Holy Mass", icon: icons.angel },
    { label: "Instru. Music", icon: icons.note },
    { label: "Mary & Jose.", icon: icons.mary },
    { label: "Others", icon: icons.notes }
  ];
  let sel = $state(1);
</script>

<svelte:head><title>Popular Hymns</title></svelte:head>

<RedHeader title="Popular Hymns">
  {#snippet children()}
    <div class="chips">
      {#each cats as c, i}
        <button class="cat" class:sel={i === sel} onclick={() => (sel = i)}>
          <span class="ic">{@html c.icon}</span><span>{@html c.label}</span>
        </button>
      {/each}
    </div>
  {/snippet}
</RedHeader>

<div class="sheet">
  <div class="list">
    {#each data.items as h}
      <div class="lrow">
        <span class="ic">{@html icons.note}</span>
        <div class="meta">
          <div class="t">{h.title}</div>
          <div class="s">{(h.composer as string) ?? "by St Paul's"}</div>
        </div>
        <button class="play" aria-label={`Play ${h.title}`}>▶</button>
      </div>
    {/each}
  </div>
</div>
