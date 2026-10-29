<script lang="ts">
  import Modal from "../ui/Modal.svelte";
  import { album } from "../../lib/stores/album.svelte";

  interface Props {
    ids: string[];
    onCerrar: () => void;
    onConfirmar: () => void;
  }

  const { ids, onCerrar, onConfirmar }: Props = $props();

  const abierto = $derived(ids.length > 0);
  const titulo = $derived(
    ids.length === 1 ? "¿Eliminar esta foto?" : `¿Eliminar ${ids.length} fotos?`,
  );
  const detalle = $derived(
    ids.length === 1
      ? "La foto se eliminará del álbum para siempre. Esta acción no se puede deshacer."
      : "Las fotos se eliminarán del álbum para siempre. Esta acción no se puede deshacer.",
  );
</script>

<Modal
  {abierto}
  {titulo}
  descripcion={detalle}
  cerrable={!album.borrando}
  onCerrar={onCerrar}
>
  {#snippet children()}
    {#if album.borrando}
      <p class="text-sm text-suave" role="status">Eliminando… no cierres esta ventana.</p>
    {/if}
  {/snippet}

  {#snippet acciones()}
    <button type="button" class="btn btn-sec" disabled={album.borrando} onclick={onCerrar}>
      Cancelar
    </button>
    <button type="button" class="btn btn-peligro" disabled={album.borrando} onclick={onConfirmar}>
      {album.borrando ? "Eliminando…" : "Sí, eliminar"}
    </button>
  {/snippet}
</Modal>
