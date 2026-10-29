<script lang="ts">
  import Modal from "../ui/Modal.svelte";
  import { toastError } from "../../lib/stores/toast.svelte";

  interface Props {
    onGuardar: (nombre: string) => Promise<void>;
  }

  const { onGuardar }: Props = $props();

  let nombre = $state("");
  let guardando = $state(false);

  async function enviar(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio || guardando) return;

    guardando = true;
    try {
      await onGuardar(limpio);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "No se pudo guardar tu nombre.");
    } finally {
      guardando = false;
    }
  }
</script>

<Modal
  abierto
  titulo="¿Cómo te llamas?"
  descripcion="Así te verán las demás personas del álbum. Solo hace falta una vez."
  cerrable={false}
>
  {#snippet children()}
    <form id="form-nombre" onsubmit={enviar} class="flex flex-col gap-1.5">
      <label for="nombre-invitado" class="text-xs font-semibold text-suave">Tu nombre</label>
      <input
        id="nombre-invitado"
        class="campo"
        type="text"
        required
        maxlength="40"
        placeholder="Tu nombre"
        autocomplete="name"
        bind:value={nombre}
      />
    </form>
  {/snippet}

  {#snippet acciones()}
    <button type="submit" form="form-nombre" class="btn btn-prim" disabled={guardando}>
      {guardando ? "Entrando…" : "Entrar al álbum"}
    </button>
  {/snippet}
</Modal>
