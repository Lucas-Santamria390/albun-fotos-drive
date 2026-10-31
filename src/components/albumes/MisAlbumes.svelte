<script lang="ts">
  import { onMount } from "svelte";
  import { AUTH } from "../../lib/auth";
  import { SCOPE } from "../../lib/config";
  import { albumes } from "../../lib/stores/albumes.svelte";
  import { album } from "../../lib/stores/album.svelte";
  import { toastError, toastOk } from "../../lib/stores/toast.svelte";
  import { inicial } from "../../lib/services/texto";
  import InterruptorTema from "../ui/InterruptorTema.svelte";
  import Modal from "../ui/Modal.svelte";
  import type { AlbumGuardado, PerfilGoogle } from "../../lib/tipos";

  let fase = $state<"cargando" | "auth" | "listo">("cargando");
  let yo = $state<PerfilGoogle | null>(null);
  let enlace = $state("");
  let saliendo = $state<string | null>(null);
  let porSalir = $state<AlbumGuardado | null>(null);

  const compartidos = $derived(albumes.lista);

  onMount(() => {
    void iniciar();
  });

  async function iniciar(): Promise<void> {
    albumes.cargar();
    AUTH.init();

    // Un token de una versión anterior (drive.file) no sirve para este flujo.
    if (!AUTH.token || AUTH.scope !== SCOPE) {
      AUTH.salir();
      fase = "auth";
      return;
    }

    try {
      yo = await AUTH.quienSoy();
      fase = "listo";
    } catch {
      AUTH.salir();
      fase = "auth";
    }
  }

  async function entrar(): Promise<void> {
    try {
      await AUTH.login(SCOPE);
      await iniciar();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    }
  }

  function unirse(): void {
    try {
      album.entrarPorEnlace(enlace);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Ese enlace no es válido.");
    }
  }

  function cerrarSesion(): void {
    AUTH.salir();
    window.location.href = "/";
  }

  async function confirmarSalida(): Promise<void> {
    const entrada = porSalir;
    if (!entrada || !yo) return;

    saliendo = entrada.drive;
    try {
      await albumes.salirDe(entrada, yo.emailAddress);
      toastOk("Has salido del álbum.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo salir del álbum.");
    } finally {
      saliendo = null;
      porSalir = null;
    }
  }

  function quitarDeLista(entrada: AlbumGuardado): void {
    albumes.quitar(entrada.drive);
    toastOk("Álbum quitado de tu lista.");
  }

  function fecha(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  }
</script>

<div class="flex min-h-dvh flex-col">
  <header class="sticky top-0 z-40 border-b border-borde bg-fondo/85 backdrop-blur-md">
    <div class="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
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

      <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
        {#if yo}
          <div class="chip hidden max-w-[16rem] sm:inline-flex" title={yo.emailAddress}>
            {#if yo.photoLink}
              <img
                src={yo.photoLink}
                alt=""
                referrerpolicy="no-referrer"
                class="h-7 w-7 rounded-full object-cover"
                width="28"
                height="28"
              />
            {:else}
              <span
                class="grid h-7 w-7 place-items-center rounded-full bg-primario text-xs font-bold text-white"
                aria-hidden="true">{inicial(yo.displayName || yo.emailAddress)}</span
              >
            {/if}
            <span class="truncate text-xs font-semibold text-texto"
              >{yo.displayName || yo.emailAddress}</span
            >
          </div>
        {/if}

        <InterruptorTema />

        {#if fase === "listo"}
          <button type="button" class="btn btn-sec btn-sm" onclick={cerrarSesion}>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke-linecap="round"
                stroke-linejoin="round"></path>
            </svg>
            <span class="hidden sm:inline">Cerrar sesión</span>
          </button>
        {/if}
      </div>
    </div>
  </header>

  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
    {#if fase === "cargando"}
      <div class="grid place-items-center py-16" role="status" aria-live="polite">
        <div class="flex flex-col items-center gap-3">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-borde border-t-primario"></div>
          <p class="text-sm text-suave">Cargando tus álbumes…</p>
        </div>
      </div>
    {:else if fase === "auth"}
      <div class="tarjeta mx-auto max-w-md p-6 text-left sm:p-8">
        <h1 class="text-xl font-extrabold tracking-tight">Tus álbumes</h1>
        <p class="mt-2 text-sm text-suave">
          Inicia sesión con Google para ver tu álbum personal y los álbumes en los que participas.
        </p>
        <div class="mt-5 flex flex-col gap-2">
          <button type="button" class="btn btn-prim" onclick={entrar}>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M15.5 8.5a4 4 0 1 0 0 7" stroke-linecap="round"></path>
            </svg>
            Iniciar sesión con Google
          </button>
          <a href="/" class="btn btn-ghost">Volver al inicio</a>
        </div>
      </div>
    {:else}
      <header class="mb-8">
        <p class="text-xs font-bold tracking-widest text-primario uppercase">Tu cuenta</p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight">Mis álbumes</h1>
        <p class="mt-2 text-sm text-suave">
          Tu álbum personal y los álbumes a los que te han invitado.
        </p>
      </header>

      <section class="mb-10" aria-labelledby="titulo-personal">
        <h2 id="titulo-personal" class="mb-3 text-sm font-bold tracking-wider text-suave uppercase">
          Mi álbum
        </h2>
        <div class="tarjeta flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <span
            class="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primario-suave text-primario"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="3"></rect>
              <circle cx="8.5" cy="10.5" r="1.6"></circle>
              <path d="M3 16l4.4-4.2a1.4 1.4 0 0 1 2 0L14 16"></path>
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-base font-bold">Tu álbum personal</p>
            <p class="mt-1 text-sm text-suave">
              Guardado en tu propio Drive. Tú decides quién entra y qué puede hacer.
            </p>
          </div>
          <a href="/album.html" class="btn btn-prim">Abrir</a>
        </div>
      </section>

      <section class="mb-10" aria-labelledby="titulo-compartidos">
        <h2 id="titulo-compartidos" class="mb-3 text-sm font-bold tracking-wider text-suave uppercase">
          Compartidos contigo
        </h2>

        {#if !compartidos.length}
          <p class="tarjeta vacio text-sm">
            Todavía no participas en ningún álbum. Pega un enlace de invitación para unirte.
          </p>
        {:else}
          <ul class="grid gap-3 sm:grid-cols-2">
            {#each compartidos as entrada (entrada.drive)}
              <li class="tarjeta flex flex-col gap-3 p-5">
                <div class="flex items-start gap-3">
                  <span
                    class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-exito-suave text-sm font-bold text-exito"
                    aria-hidden="true">{inicial(entrada.nombre)}</span
                  >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-bold" title={entrada.nombre}>{entrada.nombre}</p>
                    <p class="mt-0.5 text-xs text-suave">
                      {#if entrada.unido}Desde {fecha(entrada.unido)} · {/if}
                      <span
                        class="etiqueta-rol"
                        class:bg-primario-suave={entrada.rol === "admin"}
                        class:text-primario={entrada.rol === "admin"}
                        class:bg-exito-suave={entrada.rol === "colaborador"}
                        class:text-exito={entrada.rol === "colaborador"}
                        class:bg-aviso-suave={entrada.rol === "visitante"}
                        class:text-aviso={entrada.rol === "visitante"}>{entrada.rol}</span
                      >
                    </p>
                  </div>
                </div>

                <div class="mt-auto flex flex-wrap gap-2">
                  <a href={albumes.enlace(entrada)} class="btn btn-prim btn-sm">Abrir</a>
                  {#if entrada.rol === "admin"}
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      onclick={() => quitarDeLista(entrada)}
                    >
                      Quitar de mi lista
                    </button>
                  {:else}
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm text-peligro"
                      disabled={saliendo === entrada.drive}
                      onclick={() => (porSalir = entrada)}
                    >
                      {saliendo === entrada.drive ? "Saliendo…" : "Salir del álbum"}
                    </button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="tarjeta p-5 sm:p-6" aria-labelledby="titulo-unirse">
        <h2 id="titulo-unirse" class="text-lg font-bold">Unirme con un enlace</h2>
        <p class="mt-1 text-sm text-suave">
          Pega el enlace o el QR que te compartieron para entrar a un álbum nuevo.
        </p>
        <form
          class="mt-4 flex flex-col gap-2 sm:flex-row"
          onsubmit={(e) => {
            e.preventDefault();
            unirse();
          }}
        >
          <label class="sr-only" for="enlace-invitacion">Enlace de invitación</label>
          <input
            id="enlace-invitacion"
            type="text"
            class="campo"
            placeholder="https://…/album.html?drive=…"
            bind:value={enlace}
            autocomplete="off"
          />
          <button type="submit" class="btn btn-prim shrink-0" disabled={!enlace.trim()}>
            Unirme
          </button>
        </form>
      </section>
    {/if}
  </main>
</div>

<Modal
  abierto={porSalir !== null}
  titulo="Salir del álbum"
  descripcion="Vas a dejar de tener acceso a este álbum. Para volver necesitarás un enlace de invitación."
  onCerrar={() => (porSalir = null)}
>
  {#snippet children()}
    {#if porSalir}
      <p class="text-sm font-semibold">{porSalir.nombre}</p>
    {/if}
  {/snippet}

  {#snippet acciones()}
    <button type="button" class="btn btn-sec" onclick={() => (porSalir = null)}>Cancelar</button>
    <button
      type="button"
      class="btn btn-peligro"
      disabled={saliendo !== null}
      onclick={confirmarSalida}
    >
      {saliendo ? "Saliendo…" : "Salir del álbum"}
    </button>
  {/snippet}
</Modal>
