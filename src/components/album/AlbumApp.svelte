<script lang="ts">
  import { onMount } from "svelte";
  import { album } from "../../lib/stores/album.svelte";
  import { albumes } from "../../lib/stores/albumes.svelte";
  import { CONFIG } from "../../lib/config";
  import { toastError, toastOk } from "../../lib/stores/toast.svelte";
  import { inicial } from "../../lib/services/texto";
  import InterruptorTema from "../ui/InterruptorTema.svelte";
  import Modal from "../ui/Modal.svelte";
  import Galeria from "./Galeria.svelte";
  import ZonaSubida from "./ZonaSubida.svelte";
  import BarraSeleccion from "./BarraSeleccion.svelte";
  import ConfirmarBorrado from "./ConfirmarBorrado.svelte";
  import ModalNombre from "./ModalNombre.svelte";
  import Lightbox from "./Lightbox.svelte";

  let cargando = $state(false);
  let idsPendientes = $state<string[]>([]);
  let porSalirAlbum = $state(false);
  let saliendoDelAlbum = $state(false);

  onMount(() => {
    void album.iniciar();
    return () => album.limpiarCache();
  });

  async function recargar(): Promise<void> {
    cargando = true;
    try {
      await album.recargarFotos();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo recargar la galería.");
    } finally {
      cargando = false;
    }
  }

  function pedirBorrar(id: string): void {
    idsPendientes = [id];
  }

  function pedirBorrarSeleccion(): void {
    idsPendientes = [...album.seleccion];
  }

  async function confirmarBorrado(): Promise<void> {
    const ids = [...idsPendientes];
    const resultados = await album.borrar(ids);
    idsPendientes = [];

    if (resultados.ok > 0) {
      toastOk(
        resultados.ok === 1 ? "Foto eliminada." : `${resultados.ok} fotos eliminadas.`,
      );
    }
    if (resultados.fallos.length) {
      toastError(`No se pudieron eliminar ${resultados.fallos.length} foto(s).`);
    }
    if (album.seleccionActiva) album.cancelarSeleccion();
  }

  async function registrarNombre(nombre: string): Promise<void> {
    await album.registrarNombre(nombre);
    toastOk("¡Ya estás dentro!");
  }

  async function confirmarSalirDelAlbum(): Promise<void> {
    saliendoDelAlbum = true;
    try {
      // Si sale bien, el store redirige a "Mis álbumes".
      await album.salirDelAlbum();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo salir del álbum.");
      saliendoDelAlbum = false;
      porSalirAlbum = false;
    }
  }

  function quitarDeMiLista(): void {
    if (album.modo !== "inv" || !CONFIG.memo.raiz) return;
    albumes.quitar(CONFIG.memo.raiz);
    toastOk("Álbum quitado de tu lista.");
    window.location.href = "/albumes.html";
  }
</script>

<div class="flex min-h-dvh flex-col">
  {#if album.fase === "auth" || album.fase === "error" || album.fase === "cargando"}
    <main class="grid flex-1 place-items-center px-4 py-16">
      <div class="w-full max-w-md text-center">
        <div class="mb-6 flex justify-center">
          <span
            class="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-primario to-primario-2 text-white shadow-md"
            aria-hidden="true"
          >
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="3"></rect>
              <circle cx="8.5" cy="10.5" r="1.6"></circle>
              <path d="M3 16l4.4-4.2a1.4 1.4 0 0 1 2 0L14 16"></path>
              <path d="M14.5 14.5l1.6-1.5a1.4 1.4 0 0 1 2 0L21 15.5"></path>
            </svg>
          </span>
        </div>

        {#if album.fase === "cargando"}
          <div class="flex flex-col items-center gap-3" role="status" aria-live="polite">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-borde border-t-primario"></div>
            <p class="text-sm text-suave">Cargando tu álbum…</p>
          </div>
        {:else}
          <div class="tarjeta p-6 text-left sm:p-8">
            <h1 class="text-xl font-extrabold tracking-tight">
              {album.fase === "error" ? "No pudimos abrir el álbum" : "Para entrar al álbum"}
            </h1>
            <p class="mt-2 text-sm text-suave">
              {album.fase === "error"
                ? album.mensaje
                : "Necesitas iniciar sesión con Google para acceder al contenido."}
            </p>

            <div class="mt-5 flex flex-col gap-2">
              <button
                type="button"
                class="btn btn-prim"
                onclick={() => (album.fase === "error" ? album.entrarDeNuevo() : album.entrar())}
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M15.5 8.5a4 4 0 1 0 0 7" stroke-linecap="round"></path>
                </svg>
                {album.fase === "error" ? "Iniciar sesión de nuevo" : "Iniciar sesión con Google"}
              </button>

              {#if album.fase === "error"}
                <button type="button" class="btn btn-sec" onclick={() => album.cargar()}>
                  Reintentar
                </button>
                {#if album.modo === "inv"}
                  <button type="button" class="btn btn-ghost" onclick={quitarDeMiLista}>
                    Quitar de mi lista
                  </button>
                {/if}
              {/if}

              <a href="/" class="btn btn-ghost">Volver al inicio</a>
            </div>

            {#if album.fase === "auth" && album.mensaje}
              <p class="mt-4 text-xs font-semibold text-peligro" role="alert">{album.mensaje}</p>
            {/if}
          </div>
        {/if}
      </div>
    </main>
  {/if}

  {#if album.fase === "nombre"}
    <main class="grid flex-1 place-items-center px-4 py-16">
      <p class="text-sm text-suave">Cargando tu álbum…</p>
    </main>
    <ModalNombre onGuardar={registrarNombre} />
  {/if}

  {#if album.fase === "listo"}
    <header class="sticky top-0 z-40 border-b border-borde bg-fondo/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <a href="/" class="flex items-center gap-2.5 rounded-md no-underline" aria-label="MiAlbumWeb, inicio">
          <span
            class="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primario to-primario-2 text-white shadow-sm"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="3"></rect>
              <circle cx="8.5" cy="10.5" r="1.6"></circle>
              <path d="M3 16l4.4-4.2a1.4 1.4 0 0 1 2 0L14 16"></path>
              <path d="M14.5 14.5l1.6-1.5a1.4 1.4 0 0 1 2 0L21 15.5"></path>
            </svg>
          </span>
          <span class="hidden text-lg font-extrabold tracking-tight sm:inline">MiAlbumWeb</span>
        </a>

        <span
          class="hidden max-w-[14rem] truncate text-sm font-semibold text-suave lg:inline"
          title={album.nombre}>{album.nombre}</span
        >

        <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div class="chip hidden max-w-[16rem] sm:inline-flex" title={album.yo ?? ""}>
            {#if album.yoFoto}
              <img
                src={album.yoFoto}
                alt=""
                referrerpolicy="no-referrer"
                class="h-7 w-7 rounded-full object-cover"
                width="28"
                height="28"
              />
            {:else}
              <span
                class="grid h-7 w-7 place-items-center rounded-full bg-primario text-xs font-bold text-white"
                aria-hidden="true">{inicial(album.yoNombre)}</span
              >
            {/if}
            <span class="truncate text-xs font-semibold text-texto">{album.yoNombre}</span>
            {#if album.rol}
              <span
                class="etiqueta-rol"
                class:bg-primario-suave={album.rol === "admin"}
                class:text-primario={album.rol === "admin"}
                class:bg-exito-suave={album.rol === "colaborador"}
                class:text-exito={album.rol === "colaborador"}
                class:bg-aviso-suave={album.rol === "visitante"}
                class:text-aviso={album.rol === "visitante"}>{album.rol}</span
              >
            {/if}
          </div>

          <InterruptorTema />

          {#if album.esOwner}
            <a href="/ajustes.html" class="btn btn-ghost btn-sm" title="Ajustes del álbum">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3"></circle>
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  stroke-linecap="round"
                  stroke-linejoin="round"></path>
              </svg>
              <span class="hidden md:inline">Ajustes</span>
            </a>
          {/if}

          <a href="/albumes.html" class="btn btn-ghost btn-sm" title="Mis álbumes">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="2"></rect>
              <rect x="14" y="3" width="7" height="7" rx="2"></rect>
              <rect x="3" y="14" width="7" height="7" rx="2"></rect>
              <rect x="14" y="14" width="7" height="7" rx="2"></rect>
            </svg>
            <span class="hidden md:inline">Mis álbumes</span>
          </a>

          {#if !album.esOwner && album.rol !== "admin"}
            <button
              type="button"
              class="btn btn-ghost btn-sm text-peligro"
              title="Salir del álbum"
              aria-label="Salir del álbum"
              onclick={() => (porSalirAlbum = true)}
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span class="hidden md:inline">Salir del álbum</span>
            </button>
          {/if}

          <button type="button" class="btn btn-sec btn-sm" onclick={() => album.salir()}>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke-linecap="round"
                stroke-linejoin="round"></path>
            </svg>
            <span class="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <ZonaSubida />
      <Galeria onBorrar={pedirBorrar} onRecargar={recargar} {cargando} />
    </main>

    <BarraSeleccion onBorrar={pedirBorrarSeleccion} />
    <ConfirmarBorrado
      ids={idsPendientes}
      onCerrar={() => (idsPendientes = [])}
      onConfirmar={confirmarBorrado}
    />
    <Lightbox />

    <Modal
      abierto={porSalirAlbum}
      titulo="Salir del álbum"
      descripcion="Vas a dejar de tener acceso a este álbum. Para volver necesitarás un enlace de invitación."
      cerrable={!saliendoDelAlbum}
      onCerrar={() => (porSalirAlbum = false)}
    >
      {#snippet children()}
        <p class="text-sm font-semibold">{album.nombre}</p>
      {/snippet}

      {#snippet acciones()}
        <button
          type="button"
          class="btn btn-sec"
          disabled={saliendoDelAlbum}
          onclick={() => (porSalirAlbum = false)}
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-peligro"
          disabled={saliendoDelAlbum}
          onclick={confirmarSalirDelAlbum}
        >
          {saliendoDelAlbum ? "Saliendo…" : "Salir del álbum"}
        </button>
      {/snippet}
    </Modal>
  {/if}
</div>
