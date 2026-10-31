<script lang="ts">
  import { album } from "../../lib/stores/album.svelte";
  import { toastError, toastOk } from "../../lib/stores/toast.svelte";
  import { estiloConteo } from "../../lib/services/galeria";
  import FotoCard from "./FotoCard.svelte";

  interface Props {
    onBorrar: (id: string) => void;
    onRecargar: () => void;
    cargando?: boolean;
  }

  const { onBorrar, onRecargar, cargando = false }: Props = $props();

  const conteo = $derived(estiloConteo(album.total, album.visibles.length));
  let nuevoGrupo = $state("");

  async function crearGrupo(): Promise<void> {
    const nombre = nuevoGrupo.trim();
    if (!nombre) return;
    try {
      await album.crearGrupo(nombre);
      nuevoGrupo = "";
      toastOk("Grupo creado.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo crear el grupo.");
    }
  }

  async function asignarSeleccion(): Promise<void> {
    if (!album.grupoActivo) return;
    try {
      await album.asignarAlGrupo(album.grupoActivo, album.seleccion);
      album.cancelarSeleccion();
      toastOk("Fotos añadidas al grupo.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudieron asignar las fotos.");
    }
  }
</script>

<section class="pb-24" aria-label="Galería de fotos">
  <div class="mb-4 -mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
    <div class="relative min-w-[13rem] flex-1 sm:min-w-[10rem]">
      <svg
        class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-suave"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7"></circle>
        <path d="M21 21l-4.3-4.3" stroke-linecap="round"></path>
      </svg>
      <input
        type="search"
        class="campo pl-9"
        placeholder="Buscar fotos…"
        aria-label="Buscar fotos por nombre"
        autocomplete="off"
        bind:value={album.busqueda}
      />
    </div>

    <select class="campo w-auto shrink-0" aria-label="Ordenar fotos" bind:value={album.orden}>
      <option value="recientes">Más recientes</option>
      <option value="antiguos">Más antiguas</option>
      <option value="nombre">Orden alfabético</option>
    </select>

    <select class="campo w-auto shrink-0" aria-label="Filtrar por grupo" bind:value={album.grupoActivo}>
      <option value="">Todas las fotos</option>
      {#each album.grupos as grupo (grupo.id)}
        <option value={grupo.id}>{grupo.nombre}</option>
      {/each}
    </select>

    <select class="campo w-auto shrink-0" aria-label="Filtrar por persona que subió la foto" bind:value={album.subidorActivo}>
      <option value="">Cualquier subidor</option>
      {#each [...new Set(album.fotos.map((foto) => foto.ownerEmail).filter(Boolean))] as email}
        <option value={email}>{email}</option>
      {/each}
    </select>

    <label class="flex shrink-0 items-center gap-1 text-xs text-suave">
      Desde
      <input class="campo w-32" type="date" aria-label="Fecha inicial" bind:value={album.fechaDesde} />
    </label>
    <label class="flex shrink-0 items-center gap-1 text-xs text-suave">
      Hasta
      <input class="campo w-32" type="date" aria-label="Fecha final" bind:value={album.fechaHasta} />
    </label>

    <form class="flex shrink-0 gap-1" onsubmit={(e) => { e.preventDefault(); void crearGrupo(); }}>
      <input class="campo w-32" aria-label="Nombre del nuevo grupo" placeholder="Nuevo grupo" bind:value={nuevoGrupo} />
      <button type="submit" class="btn btn-sec btn-sm" disabled={!nuevoGrupo.trim()}>Crear</button>
    </form>

    {#if album.puedeBorrar && album.total > 0}
      <button
        type="button"
        class="btn btn-ghost"
        aria-pressed={album.seleccionActiva}
        title="Seleccionar varias fotos"
        onclick={() => album.alternarSeleccionActiva()}
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3"></rect>
          <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        <span class="hidden sm:inline">Seleccionar</span>
      </button>
    {/if}

    {#if album.seleccionadas > 0 && album.grupoActivo}
      <button type="button" class="btn btn-sec btn-sm" onclick={() => void asignarSeleccion()}>
        Añadir al grupo
      </button>
    {/if}

    <button
      type="button"
      class="btn btn-ghost"
      title="Recargar galería"
      aria-label="Recargar galería"
      disabled={cargando}
      onclick={onRecargar}
    >
      <svg
        class="h-4 w-4"
        class:animate-spin={cargando}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </button>

    <span class="ml-auto text-xs font-semibold text-suave">{conteo}</span>
  </div>

  {#if cargando && !album.total}
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden="true">
      {#each Array(10) as _}
        <div class="anim-shimmer aspect-square rounded-md bg-superficie-2"></div>
      {/each}
    </div>
  {:else if !album.total}
    <div class="vacio anim-subir">
      <div class="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-superficie-2 text-suave">
        <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="3"></rect>
          <circle cx="8.5" cy="10.5" r="1.6"></circle>
          <path d="M3 16l4.4-4.2a1.4 1.4 0 0 1 2 0L14 16"></path>
        </svg>
      </div>
      <p class="text-base font-semibold text-texto">Aún no hay fotos</p>
      <p class="mx-auto mt-1 max-w-sm text-sm">
        {album.puedeSubir ? "Sube la primera y empieza el álbum." : "Cuando alguien suba fotos, aparecerán aquí."}
      </p>
    </div>
  {:else if !album.visibles.length}
    <div class="vacio anim-subir">
      <p class="text-base font-semibold text-texto">Sin resultados</p>
      <p class="mx-auto mt-1 max-w-sm text-sm">No hay fotos que coincidan con «{album.busqueda}».</p>
      <button type="button" class="btn btn-sec btn-sm mt-4" onclick={() => (album.busqueda = "")}>
        Limpiar búsqueda
      </button>
    </div>
  {:else}
    <ul class="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {#each album.visibles as foto (foto.id)}
        <FotoCard {foto} {onBorrar} />
      {/each}
    </ul>
  {/if}
</section>
