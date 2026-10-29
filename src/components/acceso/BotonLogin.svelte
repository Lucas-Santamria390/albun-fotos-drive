<script lang="ts">
  import { AUTH } from "../../lib/auth";
  import { toastError } from "../../lib/stores/toast.svelte";

  interface Props {
    variante?: "prim" | "sec";
    texto?: string;
    destino?: string;
    class?: string;
  }

  const {
    variante = "prim",
    texto = "Iniciar sesión",
    destino = "/album.html",
    class: claseExtra = "",
  } = $props();

  let cargando = $state(false);

  async function entrar(): Promise<void> {
    if (cargando) return;
    cargando = true;
    try {
      AUTH.init();
      await AUTH.login();
      window.location.href = destino;
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    } finally {
      cargando = false;
    }
  }
</script>

<button
  type="button"
  class="btn {variante === 'prim' ? 'btn-prim' : 'btn-sec'} {claseExtra}"
  disabled={cargando}
  aria-busy={cargando}
  onclick={entrar}
>
  {#if cargando}
    <span
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    ></span>
    Conectando…
  {:else}
    <svg
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
        stroke-linecap="round"
        stroke-linejoin="round"></path>
    </svg>
    {texto}
  {/if}
</button>
