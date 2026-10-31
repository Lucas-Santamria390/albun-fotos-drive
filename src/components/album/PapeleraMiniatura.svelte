<script lang="ts">
  import { album } from "../../lib/stores/album.svelte";
  import type { Foto } from "../../lib/tipos";

  interface Props { foto: Foto }
  const { foto }: Props = $props();
  let url = $state("");
  let fallo = $state(false);

  $effect(() => {
    album.fotoUrl(foto.id).then((valor) => (url = valor)).catch(() => (fallo = true));
  });
</script>

{#if url}
  <img src={url} alt={foto.name || "Foto eliminada"} class="h-full w-full object-cover" />
{:else if fallo}
  <span class="grid h-full place-items-center px-1 text-center text-[0.65rem] text-suave">No disponible</span>
{:else}
  <span class="anim-shimmer block h-full w-full" aria-hidden="true"></span>
{/if}
