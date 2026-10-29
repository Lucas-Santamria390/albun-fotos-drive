<script lang="ts">
  import { album } from "../../lib/stores/album.svelte";
  import type { Foto } from "../../lib/tipos";

  interface Props {
    foto: Foto;
    onBorrar: (id: string) => void;
  }

  const { foto, onBorrar }: Props = $props();

  let nodo = $state<HTMLButtonElement | null>(null);
  let url = $state<string | undefined>(undefined);
  let fallo = $state(false);

  const seleccionada = $derived(album.estaSeleccionada(foto.id));

  // Carga la imagen solo cuando está cerca del viewport.
  $effect(() => {
    const el = nodo;
    if (!el || url) return;

    const cacheada = album.urlEnCache(foto.id);
    if (cacheada) {
      url = cacheada;
      return;
    }

    let cancelado = false;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        observador.disconnect();
        album
          .fotoUrl(foto.id)
          .then((u) => {
            if (!cancelado) url = u;
          })
          .catch(() => {
            if (!cancelado) fallo = true;
          });
      },
      { rootMargin: "400px" },
    );

    observador.observe(el);
    return () => {
      cancelado = true;
      observador.disconnect();
    };
  });

  function activar(): void {
    if (album.seleccionActiva) {
      album.alternarSeleccion(foto.id);
      return;
    }
    album.abrirFoto(foto.id);
  }
</script>

<li
  class="group relative overflow-hidden rounded-md border bg-superficie-2 transition-shadow"
  class:border-primario={seleccionada}
  class:border-borde={!seleccionada}
  class:shadow-md={seleccionada}
>
  <button
    type="button"
    bind:this={nodo}
    class="block aspect-square w-full cursor-pointer overflow-hidden bg-superficie-2"
    aria-label={foto.name || "Ver foto"}
    onclick={activar}
  >
    {#if url}
      <img
        src={url}
        alt={foto.name || "Foto del álbum"}
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />
    {:else if fallo}
      <span class="grid h-full w-full place-items-center text-xs text-suave">No disponible</span>
    {:else}
      <span class="anim-shimmer block h-full w-full" aria-hidden="true"></span>
    {/if}

    {#if album.seleccionActiva}
      <span
        class="absolute top-2 left-2 grid h-6 w-6 place-items-center rounded-full border-2 shadow-sm transition-colors"
        class:border-primario={seleccionada}
        class:bg-primario={seleccionada}
        class:border-white={!seleccionada}
        class:bg-slate-900={!seleccionada}
        aria-hidden="true"
      >
        {#if seleccionada}
          <svg class="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        {/if}
      </span>
    {/if}
  </button>

  {#if album.puedeBorrar && !album.seleccionActiva}
    <button
      type="button"
      class="absolute top-2 right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-slate-950/55 text-white opacity-100 backdrop-blur-sm transition hover:bg-peligro sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
      aria-label={`Eliminar ${foto.name || "foto"}`}
      title="Eliminar foto"
      onclick={() => onBorrar(foto.id)}
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path
          d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
          stroke-linecap="round"
          stroke-linejoin="round"></path>
      </svg>
    </button>
  {/if}
</li>
