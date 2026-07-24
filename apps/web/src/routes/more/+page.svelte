<script lang="ts">
  import RedHeader from "$lib/RedHeader.svelte";
</script>

<svelte:head><title>More Apps</title></svelte:head>

<RedHeader title="More Apps" />

<div class="sheet">
  <div class="approw">
    <div class="badge" style="background:#f4dede;color:var(--brand)">SP</div>
    <div class="meta"><div class="t">St Paul's</div><div class="s">Website</div></div>
    <span class="circ-static" aria-hidden="true">↗</span>
  </div>
  <div class="approw">
    <div class="badge" style="background:linear-gradient(135deg,#c1272d,#7a0f13)">✝</div>
    <div class="meta"><div class="t">New Community Bible</div><div class="s">Available on: Android | iOS</div></div>
    <span class="circ-static" aria-hidden="true">⭳</span>
  </div>
</div>

<style>
  .circ-static {
    width: 40px; height: 40px; border-radius: 50%; background: var(--row);
    display: grid; place-items: center; color: var(--text); flex-shrink: 0;
  }
</style>
