<script lang="ts">
  import { album } from "../../lib/stores/album.svelte";

  interface Props {
    onBorrar: () => void;
  }

  const { onBorrar }: Props = $props();

  const visible = $derived(album.seleccionActiva && album.seleccionadas > 0);
</script>

{#if visible}
  <div
    class="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 px-4 py-3 shadow-lg backdrop-blur-md"
    role="region"
    aria-label="Acciones de selección"
  >
    <div class="mx-auto flex max-w-6xl items-center gap-3">
      <button type="button" class="btn btn-ghost btn-sm" onclick={() => album.cancelarSeleccion()}>
        Cancelar
      </button>

      <span class="text-sm font-semibold">
        {album.seleccionadas}
        {album.seleccionadas === 1 ? "seleccionada" : "seleccionadas"}
      </span>

      <button
        type="button"
        class="btn btn-peligro btn-sm ml-auto"
        disabled={album.borrando}
        onclick={onBorrar}
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path
            d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
            stroke-linecap="round"
            stroke-linejoin="round"></path>
        </svg>
        Borrar
      </button>
    </div>
  </div>
{/if}
