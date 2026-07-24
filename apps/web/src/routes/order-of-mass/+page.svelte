<script lang="ts">
  import RedHeader from "$lib/RedHeader.svelte";
  import { renderBody } from "$lib/api";
  import { icons } from "$lib/icons";
  let { data } = $props();
  const prayers = ["Eucharistic Prayer I", "Eucharistic Prayer II", "Eucharistic Prayer III", "Eucharistic Prayer IV"];
  let sel = $state(0);
</script>

<svelte:head><title>Order of Mass</title></svelte:head>

<RedHeader title="Order of Mass">
  {#snippet children()}
    <div class="chips">
      {#each prayers as p, i}
        <button class="cat" class:sel={i === sel} onclick={() => (sel = i)}>
          <span class="ic">{@html icons.church}</span><span>Mass with<br />{p}</span>
        </button>
      {/each}
    </div>
  {/snippet}
</RedHeader>

<div class="sheet liturgy">
  {#each data.items as item}
    <h2 class="sec-h">{item.title}</h2>
    <div class="body-txt">{@html renderBody(item.body)}</div>
  {/each}
</div>

<style>
  .chips .cat span:last-child { line-height: 1.25; }
</style>
