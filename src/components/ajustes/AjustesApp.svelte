<script lang="ts">
  import { onMount } from "svelte";
  import { album } from "../../lib/stores/album.svelte";
  import { toastError, toastOk } from "../../lib/stores/toast.svelte";
  import { qrDataUrl } from "../../lib/qr";
  import { PERMISOS_INICIALES, PERMISOS_VISITANTE } from "../../lib/services/permisos";
  import { inicial } from "../../lib/services/texto";
  import type { Rol } from "../../lib/tipos";
  import InterruptorTema from "../ui/InterruptorTema.svelte";

  let rol = $state<Rol>("colaborador");
  let subir = $state(true);
  let borrar = $state(false);
  let modificar = $state(false);
  let expiracion = $state("");
  let generando = $state(false);
  let copiado = $state(false);
  let revocando = $state<string | null>(null);
  let nombreInput = $state("");
  let guardandoNombre = $state(false);
  let nombreCargado = $state(false);

  // album.json llega de Drive después del montaje: se copia una sola vez.
  $effect(() => {
    if (nombreCargado || !album.info) return;
    nombreInput = album.info.nombre;
    nombreCargado = true;
  });

  const visitante = $derived(rol === "visitante");
  const qr = $derived(album.enlaceActual ? qrDataUrl(album.enlaceActual) : "");

  const usuarios = $derived(Object.entries(album.usuarios).sort(([a], [b]) => a.localeCompare(b)));
  const invitaciones = $derived(Object.entries(album.invitaciones));

  onMount(() => {
    void album.iniciar();
  });

  function cambiarRol(): void {
    if (visitante) {
      subir = PERMISOS_VISITANTE.subir;
      borrar = PERMISOS_VISITANTE.borrar;
      modificar = PERMISOS_VISITANTE.modificar;
      return;
    }
    subir = PERMISOS_INICIALES.subir;
    borrar = PERMISOS_INICIALES.borrar;
    modificar = PERMISOS_INICIALES.modificar;
  }

  async function generar(): Promise<void> {
    generando = true;
    copiado = false;
    try {
      await album.crearInvitacion({
        rol,
        permisos: { subir, borrar, modificar },
        expiracion: expiracion.trim() || "indefinida",
      });
      toastOk("Invitación generada.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo crear la invitación.");
    } finally {
      generando = false;
    }
  }

  async function copiar(texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      copiado = true;
      toastOk("Enlace copiado al portapapeles.");
      window.setTimeout(() => (copiado = false), 2200);
    } catch {
      toastError("No se pudo copiar. Selecciona el enlace manualmente.");
    }
  }

  async function revocar(token: string): Promise<void> {
    revocando = token;
    try {
      await album.revocarInvitacion(token);
      toastOk("Invitación revocada.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo revocar la invitación.");
    } finally {
      revocando = null;
    }
  }

  async function quitarUsuario(email: string): Promise<void> {
    try {
      await album.eliminarUsuario(email);
      toastOk("Acceso retirado. La persona perderá el álbum de su lista al abrirlo.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo retirar el acceso.");
    }
  }

  async function guardarNombre(): Promise<void> {
    guardandoNombre = true;
    try {
      await album.renombrarAlbum(nombreInput);
      toastOk("Nombre del álbum actualizado.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudo guardar el nombre.");
    } finally {
      guardandoNombre = false;
    }
  }

  const permisosTexto = (p: { subir?: boolean; borrar?: boolean; modificar?: boolean }): string => {
    const activos = [p.subir && "subir", p.borrar && "borrar", p.modificar && "modificar"].filter(
      Boolean,
    );
    return activos.length ? activos.join(" · ") : "solo lectura";
  };
</script>

<div class="flex min-h-dvh flex-col">
  {#if album.fase === "cargando" || album.fase === "auth" || album.fase === "error"}
    <main class="grid flex-1 place-items-center px-4 py-16">
      <div class="w-full max-w-md text-center">
        {#if album.fase === "cargando"}
          <div class="flex flex-col items-center gap-3" role="status" aria-live="polite">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-borde border-t-primario"></div>
            <p class="text-sm text-suave">Cargando ajustes…</p>
          </div>
        {:else}
          <div class="tarjeta p-6 text-left sm:p-8">
            <h1 class="text-xl font-extrabold tracking-tight">Ajustes del álbum</h1>
            <p class="mt-2 text-sm text-suave">
              {album.fase === "error"
                ? album.mensaje
                : "Inicia sesión con la cuenta dueña del álbum para gestionar accesos."}
            </p>
            <div class="mt-5 flex flex-col gap-2">
              <button type="button" class="btn btn-prim" onclick={() => album.entrar()}>
                Iniciar sesión con Google
              </button>
              <a href="/" class="btn btn-ghost">Volver al inicio</a>
            </div>
          </div>
        {/if}
      </div>
    </main>
  {:else if album.fase === "listo" && !album.esOwner}
    <main class="grid flex-1 place-items-center px-4 py-16">
      <div class="tarjeta max-w-md p-6 text-center sm:p-8">
        <h1 class="text-xl font-extrabold tracking-tight">Solo para el administrador</h1>
        <p class="mt-2 text-sm text-suave">
          Esta página gestiona los accesos del álbum. Pide al administrador que te comparta el enlace
          si necesitas entrar a la galería.
        </p>
        <a href="/album.html" class="btn btn-prim mt-5">Ir a mi álbum</a>
      </div>
    </main>
  {:else if album.fase === "listo"}
    <header class="sticky top-0 z-40 border-b border-borde bg-fondo/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
        <a href="/album.html" class="flex items-center gap-2 rounded-md text-sm font-semibold no-underline">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          Volver al álbum
        </a>

        <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span class="chip hidden sm:inline-flex">
            <span
              class="grid h-6 w-6 place-items-center rounded-full bg-primario text-[0.65rem] font-bold text-white"
              aria-hidden="true">{inicial(album.yoNombre)}</span
            >
            <span class="text-xs font-semibold text-texto">{album.yoNombre}</span>
          </span>
          <InterruptorTema />
          <a href="/albumes.html" class="btn btn-ghost btn-sm">Mis álbumes</a>
          <button type="button" class="btn btn-sec btn-sm" onclick={() => album.salir()}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header class="mb-8">
        <p class="text-xs font-bold tracking-widest text-primario uppercase">Administración</p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight">Ajustes del álbum</h1>
        <p class="mt-2 text-sm text-suave">
          Gestiona quién puede ver, subir o borrar fotos. Los cambios se guardan al instante.
        </p>
      </header>

      <section class="mb-8 grid gap-3 sm:grid-cols-3" aria-label="Resumen">
        <div class="tarjeta p-5">
          <p class="text-xs font-bold tracking-wider text-suave uppercase">Fotos</p>
          <p class="mt-1 text-3xl font-extrabold">{album.total}</p>
        </div>
        <div class="tarjeta p-5">
          <p class="text-xs font-bold tracking-wider text-suave uppercase">Personas</p>
          <p class="mt-1 text-3xl font-extrabold">{usuarios.length}</p>
        </div>
        <div class="tarjeta p-5">
          <p class="text-xs font-bold tracking-wider text-suave uppercase">Invitaciones</p>
          <p class="mt-1 text-3xl font-extrabold">{invitaciones.length}</p>
        </div>
      </section>

      <!-- Nombre del álbum -->
      <section class="tarjeta mb-8 p-5 sm:p-6" aria-labelledby="titulo-nombre">
        <h2 id="titulo-nombre" class="text-lg font-bold">Nombre del álbum</h2>
        <p class="mt-1 text-sm text-suave">
          Es el nombre que ven las personas invitadas en «Mis álbumes».
        </p>
        <form
          class="mt-4 flex flex-col gap-2 sm:flex-row"
          onsubmit={(e) => {
            e.preventDefault();
            void guardarNombre();
          }}
        >
          <label class="sr-only" for="nombre-album">Nombre del álbum</label>
          <input
            id="nombre-album"
            class="campo"
            type="text"
            maxlength="60"
            placeholder="Mi álbum"
            bind:value={nombreInput}
          />
          <button
            type="submit"
            class="btn btn-prim shrink-0"
            disabled={guardandoNombre || !nombreInput.trim()}
          >
            {guardandoNombre ? "Guardando…" : "Guardar"}
          </button>
        </form>
      </section>

      <!-- Generador de invitaciones -->
      <section class="tarjeta mb-8 p-5 sm:p-6" aria-labelledby="titulo-invitar">
        <h2 id="titulo-invitar" class="text-lg font-bold">Crear una invitación</h2>
        <p class="mt-1 text-sm text-suave">
          Elige qué podrá hacer la persona invitada. El enlace y el QR se generan aquí mismo.
        </p>

        <form
          class="mt-5 grid gap-4 sm:grid-cols-2"
          onsubmit={(e) => {
            e.preventDefault();
            void generar();
          }}
        >
          <div class="flex flex-col gap-1.5">
            <label for="rol-inv" class="text-xs font-semibold text-suave">Rol</label>
            <select
              id="rol-inv"
              class="campo"
              bind:value={rol}
              onchange={cambiarRol}
            >
              <option value="colaborador">Colaborador</option>
              <option value="visitante">Visitante</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="exp-inv" class="text-xs font-semibold text-suave">Caduca el</label>
            <input id="exp-inv" type="date" class="campo" bind:value={expiracion} />
            <p class="text-xs text-suave">Déjalo vacío para una invitación sin caducidad.</p>
          </div>

          <fieldset class="sm:col-span-2" disabled={visitante}>
            <legend class="mb-2 text-xs font-semibold text-suave">Permisos</legend>
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" class="h-4 w-4 accent-primario" bind:checked={subir} disabled={visitante} />
                Subir fotos
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" class="h-4 w-4 accent-primario" bind:checked={borrar} disabled={visitante} />
                Borrar fotos
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-primario"
                  bind:checked={modificar}
                  disabled={visitante}
                />
                Modificar
              </label>
            </div>
          </fieldset>

          <div class="sm:col-span-2">
            <button type="submit" class="btn btn-prim" disabled={generando}>
              {generando ? "Generando…" : "Generar invitación"}
            </button>
          </div>
        </form>

        {#if album.avisoCompartir}
          <div class="mt-4 rounded-md border border-peligro/40 bg-peligro-suave p-4" role="alert">
            <p class="text-sm font-semibold text-peligro">
              No se pudo habilitar el acceso público del álbum
            </p>
            <p class="mt-1 text-xs text-suave">{album.avisoCompartir}</p>
            <p class="mt-1 text-xs text-suave">
              El enlace puede no funcionar para otras cuentas hasta que se corrija.
            </p>
          </div>
        {/if}

        {#if album.enlaceActual}
          <div class="anim-subir mt-6 grid gap-4 rounded-md border border-borde bg-superficie-2/50 p-4 sm:grid-cols-[auto_1fr]">
            <img
              src={qr}
              alt="Código QR del enlace de invitación"
              class="mx-auto h-36 w-36 rounded-md bg-white p-2"
              width="144"
              height="144"
            />

            <div class="flex min-w-0 flex-col gap-2">
              <p class="text-sm font-semibold">Enlace listo para compartir</p>
              <input
                class="campo text-xs"
                type="text"
                readonly
                value={album.enlaceActual}
                aria-label="Enlace de invitación"
                onfocus={(e) => e.currentTarget.select()}
              />
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn btn-prim btn-sm" onclick={() => copiar(album.enlaceActual)}>
                  {copiado ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <a class="btn btn-sec btn-sm" href={qr} download="invitacion.svg">Descargar QR</a>
              </div>
              <p class="text-xs text-suave">
                Compártelo solo con quien quieras invitar: el enlace da acceso al álbum.
              </p>
            </div>
          </div>
        {/if}
      </section>

      <!-- Usuarios -->
      <section class="tarjeta mb-8 p-5 sm:p-6" aria-labelledby="titulo-usuarios">
        <h2 id="titulo-usuarios" class="text-lg font-bold">Personas con acceso</h2>
        <p class="mt-1 text-sm text-suave">El administrador siempre tiene acceso total.</p>

        {#if !usuarios.length}
          <p class="vacio text-sm">Todavía no hay otras personas en el álbum.</p>
        {:else}
          <ul class="mt-4 divide-y divide-borde">
            {#each usuarios as [email, usuario] (email)}
              <li class="flex flex-wrap items-center gap-3 py-3">
                <span
                  class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primario-suave text-sm font-bold text-primario"
                  aria-hidden="true">{inicial(usuario.nombre || email)}</span
                >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{usuario.nombre || email}</p>
                  <p class="truncate text-xs text-suave">{email}</p>
                </div>
                <span
                  class="etiqueta-rol"
                  class:bg-primario-suave={usuario.rol === "admin"}
                  class:text-primario={usuario.rol === "admin"}
                  class:bg-exito-suave={usuario.rol === "colaborador"}
                  class:text-exito={usuario.rol === "colaborador"}
                  class:bg-aviso-suave={usuario.rol === "visitante"}
                  class:text-aviso={usuario.rol === "visitante"}>{usuario.rol}</span
                >
                <span class="hidden text-xs text-suave sm:inline">{permisosTexto(usuario.permisos)}</span>

                {#if usuario.rol !== "admin"}
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm text-peligro"
                    aria-label={`Retirar acceso a ${usuario.nombre || email}`}
                    onclick={() => quitarUsuario(email)}
                  >
                    Retirar
                  </button>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <!-- Invitaciones -->
      <section class="tarjeta p-5 sm:p-6" aria-labelledby="titulo-invitaciones">
        <h2 id="titulo-invitaciones" class="text-lg font-bold">Invitaciones activas</h2>
        <p class="mt-1 text-sm text-suave">Revoca cualquier enlace que ya no quieras usar.</p>

        {#if !invitaciones.length}
          <p class="vacio text-sm">No hay invitaciones activas.</p>
        {:else}
          <ul class="mt-4 divide-y divide-borde">
            {#each invitaciones as [token, inv] (token)}
              <li class="flex flex-wrap items-center gap-3 py-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate font-mono text-xs text-suave">{token}</p>
                  <p class="mt-1 text-xs text-suave">
                    Caduca: {inv.expiracion || "nunca"} · {permisosTexto(inv.permisos)}
                  </p>
                </div>
                <span
                  class="etiqueta-rol"
                  class:bg-primario-suave={inv.rol === "admin"}
                  class:text-primario={inv.rol === "admin"}
                  class:bg-exito-suave={inv.rol === "colaborador"}
                  class:text-exito={inv.rol === "colaborador"}
                  class:bg-aviso-suave={inv.rol === "visitante"}
                  class:text-aviso={inv.rol === "visitante"}>{inv.rol}</span
                >
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  onclick={() => album.mostrarEnlace(token)}
                >
                  Ver QR
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm text-peligro"
                  disabled={revocando === token}
                  onclick={() => revocar(token)}
                >
                  {revocando === token ? "Revocando…" : "Revocar"}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </main>
  {/if}
</div>
