<script lang="ts">
  import Modal from "../ui/Modal.svelte";
  import { toastOk, toastError, toastInfo } from "../../lib/stores/toast.svelte";

  let abierto = $state(false);
</script>

<div class="flex flex-wrap gap-2">
  <button type="button" class="btn btn-prim" onclick={() => (abierto = true)}>
    Abrir modal
  </button>
  <button type="button" class="btn btn-sec" onclick={() => toastOk("Foto subida correctamente")}>
    Toast de éxito
  </button>
  <button type="button" class="btn btn-sec" onclick={() => toastInfo("Enlace copiado")}>
    Toast informativo
  </button>
  <button
    type="button"
    class="btn btn-sec"
    onclick={() => toastError("No se pudo conectar. Revisa tu conexión.")}
  >
    Toast de error
  </button>
</div>

<Modal
  abierto={abierto}
  titulo="¿Eliminar esta foto?"
  descripcion="Esta acción no se puede deshacer. La foto se borrará para todas las personas del álbum."
  onCerrar={() => (abierto = false)}
>
  {#snippet children()}{/snippet}

  {#snippet acciones()}
    <button type="button" class="btn btn-sec" onclick={() => (abierto = false)}>Cancelar</button>
    <button
      type="button"
      class="btn btn-peligro"
      onclick={() => {
        abierto = false;
        toastOk("Foto eliminada");
      }}
    >
      Eliminar
    </button>
  {/snippet}
</Modal>
