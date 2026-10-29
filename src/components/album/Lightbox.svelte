<script lang="ts">
  import { album } from "../../lib/stores/album.svelte";
  import { toastError } from "../../lib/stores/toast.svelte";

  let url = $state<string | undefined>(undefined);
  let cargando = $state(false);

  const abierto = $derived(album.fotoAbierta !== null);
  const indice = $derived(album.indiceActual);
  const total = $derived(album.visibles.length);

  $effect(() => {
    const foto = album.fotoActual;
    if (!foto) {
      url = undefined;
      return;
    }

    const cacheada = album.urlEnCache(foto.id);
    if (cacheada) {
      url = cacheada;
      cargando = false;
      return;
    }

    url = undefined;
    cargando = true;
    let cancelado = false;

    album
      .fotoUrl(foto.id)
      .then((u) => {
        if (cancelado) return;
        url = u;
        cargando = false;
      })
      .catch(() => {
        if (cancelado) return;
        cargando = false;
        toastError("No se pudo cargar la foto.");
      });

    return () => {
      cancelado = true;
    };
  });

  $effect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  });

  function alPulsar(e: KeyboardEvent): void {
    if (!abierto) return;
    if (e.key === "Escape") {
      album.cerrarFoto();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      album.navegarFoto(1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      album.navegarFoto(-1);
    }
  }

  async function descargar(): Promise<void> {
    try {
      await album.descargarFotoActual();
    } catch {
      toastError("No se pudo descargar la foto.");
    }
  }
</script>

<svelte:window onkeydown={alPulsar} />

{#if abierto && album.fotoActual}
  <div
    class="fixed inset-0 z-50 flex flex-col bg-slate-950/92 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="Visor de foto"
  >
    <div class="flex items-center justify-between gap-3 px-3 py-3 text-white sm:px-5">
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold">{album.fotoActual.name || "Foto"}</p>
        <p class="text-xs text-white/60">{indice + 1} / {total}</p>
      </div>

      <div class="flex items-center gap-1">
        <button type="button" class="lb-boton" aria-label="Descargar foto" title="Descargar" onclick={descargar}>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
              stroke-linecap="round"
              stroke-linejoin="round"></path>
          </svg>
        </button>
        <button type="button" class="lb-boton" aria-label="Cerrar visor" title="Cerrar" onclick={() => album.cerrarFoto()}>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"></path>
          </svg>
        </button>
      </div>
    </div>

    <div
      class="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4 sm:px-16"
      role="presentation"
      onclick={(e) => {
        if (e.target === e.currentTarget) album.cerrarFoto();
      }}
    >
      {#if url}
        <img
          src={url}
          alt={album.fotoActual.name || "Foto del álbum"}
          class="anim-zoom max-h-full max-w-full rounded-md object-contain shadow-lg"
        />
      {:else if cargando}
        <div class="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" role="status">
          <span class="sr-only">Cargando foto…</span>
        </div>
      {:else}
        <p class="text-sm text-white/70">No se pudo mostrar esta foto.</p>
      {/if}

      {#if total > 1}
        <button
          type="button"
          class="lb-nav left-1 sm:left-4"
          aria-label="Foto anterior"
          onclick={() => album.navegarFoto(-1)}
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
        <button
          type="button"
          class="lb-nav right-1 sm:right-4"
          aria-label="Foto siguiente"
          onclick={() => album.navegarFoto(1)}
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .lb-boton {
    display: grid;
    place-items: center;
    height: 2.5rem;
    width: 2.5rem;
    border-radius: 9999px;
    color: white;
    background: rgb(255 255 255 / 0.1);
    cursor: pointer;
    transition: background 150ms ease;
  }

  .lb-boton:hover {
    background: rgb(255 255 255 / 0.2);
  }

  .lb-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    height: 2.75rem;
    width: 2.75rem;
    border-radius: 9999px;
    background: rgb(0 0 0 / 0.45);
    color: white;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: background 150ms ease;
  }

  .lb-nav:hover {
    background: rgb(0 0 0 / 0.7);
  }
</style>
