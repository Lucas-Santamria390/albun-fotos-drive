<script lang="ts">
  import { album } from "../../lib/stores/album.svelte";
  import type { Foto } from "../../lib/tipos";
  import { toastError, toastOk } from "../../lib/stores/toast.svelte";
  import Modal from "../ui/Modal.svelte";
  import PapeleraMiniatura from "./PapeleraMiniatura.svelte";

  interface Props {
    abierto: boolean;
    onCerrar: () => void;
  }

  const { abierto, onCerrar }: Props = $props();
  let fotoPendiente = $state<Foto | null>(null);
  let procesando = $state(false);

  const propias = $derived(album.papelera);

  async function restaurar(foto: Foto): Promise<void> {
    procesando = true;
    try {
      await album.restaurar([foto.id]);
      toastOk("Foto restaurada en el álbum.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo restaurar la foto.");
    } finally {
      procesando = false;
    }
  }

  async function borrarDefinitivamente(): Promise<void> {
    if (!fotoPendiente) return;
    procesando = true;
    try {
      await album.borrarDefinitivamente([fotoPendiente.id]);
      fotoPendiente = null;
      toastOk("Foto eliminada definitivamente de Google Drive.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo borrar la foto definitivamente.");
    } finally {
      procesando = false;
    }
  }
</script>

<Modal
  {abierto}
  titulo="Fotos eliminadas"
  descripcion="Restaura tus fotos o elimínalas definitivamente para liberar espacio."
  onCerrar={onCerrar}
>
  {#snippet children()}
    {#if propias.length}
    <ul class="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
      {#each propias as foto (foto.id)}
        <li class="flex gap-3 rounded-md border border-borde bg-superficie-2 p-2">
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded bg-fondo">
            <PapeleraMiniatura foto={foto} />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold" title={foto.name}>{foto.name}</p>
            <p class="mt-1 text-xs text-suave">{foto.createdTime?.slice(0, 10) ?? "Sin fecha"}</p>
          <div class="mt-3 flex flex-wrap gap-1">
            <button type="button" class="btn btn-sec btn-sm flex-1" disabled={procesando} onclick={() => restaurar(foto)}>
              Restaurar
            </button>
            <button type="button" class="btn btn-peligro btn-sm" disabled={procesando} aria-label={`Borrar definitivamente ${foto.name}`} onclick={() => (fotoPendiente = foto)}>
              Borrar
            </button>
          </div></div>
        </li>
      {/each}
    </ul>
    {:else}
      <p class="py-8 text-center text-sm text-suave">No tienes fotos pendientes en la papelera.</p>
    {/if}
  {/snippet}
</Modal>

<Modal
  abierto={Boolean(fotoPendiente)}
  titulo="¿Borrar definitivamente?"
  descripcion="Esta acción eliminará la foto de forma permanente de Google Drive y no se podrá recuperar."
  cerrable={!procesando}
  onCerrar={() => (fotoPendiente = null)}
>
  {#snippet acciones()}
    <button type="button" class="btn btn-sec" disabled={procesando} onclick={() => (fotoPendiente = null)}>Cancelar</button>
    <button type="button" class="btn btn-peligro" disabled={procesando} onclick={borrarDefinitivamente}>
      {procesando ? "Borrando…" : "Borrar definitivamente"}
    </button>
  {/snippet}
</Modal>
