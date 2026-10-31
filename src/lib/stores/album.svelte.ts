import { AUTH } from "../auth";
import { CONFIG, origenSitio, scopeDelModo } from "../config";
import { DriveApi } from "../drive/api";
import { asegurarEstructura, compartirAlbum } from "../drive/structure";
import { filtrarOrdenar } from "../services/galeria";
import { generarToken, permisosSegunRol, validarInvitacion } from "../services/invitaciones";
import { enlaceInvitacion } from "../services/enlaces";
import { destinoEnlace, nombreAlbum } from "../services/albumes";
import { mensajeAccesoAlbum } from "../services/errores";
import { PERMISOS_ADMIN } from "../services/permisos";
import { agregarOcultas, filtrarOcultas, leerOcultas, quitarOcultas, serializarOcultas } from "../services/ocultas";
import { agregarFotosAlGrupo, leerGrupos, quitarFotosDeGrupo, serializarGrupos } from "../services/grupos";
import { albumes } from "./albumes.svelte";
import type {
  AlbumInfo,
  ErrorHttp,
  Foto,
  Invitacion,
  Invitaciones,
  OrdenGaleria,
  Permisos,
  Rol,
  Usuario,
  Usuarios,
  Grupo,
} from "../tipos";

export type Fase = "cargando" | "auth" | "nombre" | "listo" | "error";

export interface ItemCola {
  id: number;
  nombre: string;
  pct: number;
  estado: "subiendo" | "ok" | "error";
}

interface OpcionesInvitacion {
  rol: Rol;
  permisos: Permisos;
  expiracion: string;
}

const CAMPOS = "files(id,name,mimeType,thumbnailLink,createdTime,size,owners(emailAddress))";

/**
 * Estado y casos de uso del álbum.
 * Es el único punto que habla con Drive: las vistas solo leen estado y
 * llaman a métodos. Las claves se mantienen en español.
 */
class EstadoAlbum {
  fase = $state<Fase>("cargando");
  mensaje = $state("");
  modo = $state<"owner" | "inv">("owner");

  yo = $state<string | null>(null);
  yoNombre = $state<string>("");
  yoFoto = $state<string>("");
  rol = $state<Rol | null>(null);
  permisos = $state<Permisos | null>(null);

  usuarios = $state<Usuarios>({});
  invitaciones = $state<Invitaciones>({});
  fId = $state("");
  /** Contenido de album.json (nombre visible). */
  info = $state<AlbumInfo | null>(null);
  /** Ids de fotos ocultas del álbum (subidas por otras cuentas). */
  ocultas = $state<string[]>([]);
  grupos = $state<Grupo[]>([]);

  todasFotos = $state<Foto[]>([]);
  fotos = $state<Foto[]>([]);
  busqueda = $state("");
  orden = $state<OrdenGaleria>("recientes");
  grupoActivo = $state("");
  subidorActivo = $state("");
  fechaDesde = $state("");
  fechaHasta = $state("");

  seleccionActiva = $state(false);
  seleccion = $state<string[]>([]);

  subiendo = $state<ItemCola[]>([]);
  borrando = $state(false);

  /** Enlace de la última invitación generada (solo ajustes). */
  enlaceActual = $state("");
  invitacionGenerada = $state("");
  /** Error al habilitar el acceso público para invitados. */
  avisoCompartir = $state("");

  /** id de la foto abierta en el visor. */
  fotoAbierta = $state<string | null>(null);

  #cache = new Map<string, string>();
  #promesas = new Map<string, Promise<string>>();
  #contadorCola = 0;

  fotosFiltradas = $derived.by(() => {
    const grupo = this.grupos.find((item) => item.id === this.grupoActivo);
    return this.fotos.filter((foto) => {
      const fecha = foto.createdTime?.slice(0, 10) ?? "";
      return (
        (!grupo || grupo.fotos.includes(foto.id)) &&
        (!this.subidorActivo || foto.ownerEmail === this.subidorActivo) &&
        (!this.fechaDesde || fecha >= this.fechaDesde) &&
        (!this.fechaHasta || fecha <= this.fechaHasta)
      );
    });
  });
  visibles = $derived(filtrarOrdenar(this.fotosFiltradas, this.busqueda, this.orden));
  total = $derived(this.fotos.length);
  puedeSubir = $derived(this.rol !== "visitante" && Boolean(this.yo));
  puedeBorrar = $derived(this.rol !== "visitante" && Boolean(this.yo));
  seleccionadas = $derived(this.seleccion.length);
  esOwner = $derived(this.modo === "owner");
  nombre = $derived(nombreAlbum(this.info, this.esOwner ? "Mi álbum" : "Álbum compartido"));

  fotoActual = $derived(this.fotos.find((f) => f.id === this.fotoAbierta) ?? null);
  papelera = $derived(
    this.todasFotos.filter(
      (foto) => this.ocultas.includes(foto.id) && foto.ownerEmail === this.yo,
    ),
  );

  // ---------------------------------------------------------------- sesión

  /** Arranque: decide si hace falta login y precarga la sesión. */
  async iniciar(): Promise<void> {
    AUTH.init();
    albumes.cargar();
    const params = new URLSearchParams(window.location.search);
    // Con `drive` en la URL se abre un álbum ajeno; sin él, el propio.
    this.modo = params.get("drive") ? "inv" : "owner";
    this.fId = params.get("fotos") ?? "";

    if (!AUTH.token) {
      this.fase = "auth";
      return;
    }

    // Un token de una versión anterior (drive.file) no coincide con el scope
    // actual: se pide login de nuevo en vez de provocar un 404 de Drive.
    if (AUTH.scope !== scopeDelModo(this.modo)) {
      AUTH.salir();
      this.fase = "auth";
      return;
    }

    await this.cargar();
  }

  async entrar(): Promise<void> {
    this.fase = "cargando";
    this.mensaje = "";
    try {
      await AUTH.login(scopeDelModo(this.modo));
      await this.cargar();
    } catch (e) {
      this.fase = "auth";
      this.mensaje = mensajeDe(e);
    }
  }

  /** Fuerza un login nuevo (scope distinto o permiso revocado). */
  async entrarDeNuevo(): Promise<void> {
    AUTH.salir();
    const params = new URLSearchParams(window.location.search);
    this.modo = params.get("drive") ? "inv" : "owner";
    await this.entrar();
  }

  async cargar(): Promise<void> {
    this.fase = "cargando";
    this.mensaje = "";
    try {
      const perfil = await AUTH.quienSoy();
      this.yo = perfil.emailAddress;
      this.yoNombre = perfil.displayName || perfil.emailAddress;
      this.yoFoto = perfil.photoLink ?? "";

      if (this.modo === "owner") {
        await this.prepararOwner();
      } else {
        const pideNombre = await this.prepararInvitado();
        if (pideNombre) {
          this.fase = "nombre";
          return;
        }
      }

      await this.recargarFotos();
      this.fase = "listo";
    } catch (e) {
      const err = e as ErrorHttp;
      if (err.code === 401) AUTH.salir();
      this.mensaje = mensajeDe(e);
      this.fase = err.code === 401 ? "auth" : "error";
    }
  }

  private async prepararOwner(): Promise<void> {
    await asegurarEstructura(this.yo ?? undefined);
    this.fId = CONFIG.memo.fotos;
    this.info = await this.#cargarInfo(CONFIG.memo.album);
    this.ocultas = await this.#cargarOcultas(CONFIG.memo.ocultas ?? "");
    this.grupos = await this.#cargarGrupos(CONFIG.memo.grupos ?? "");

    const [usuarios, invitaciones] = await Promise.all([
      this.cargarJson<Usuarios>(CONFIG.memo.users),
      this.cargarJson<Invitaciones>(CONFIG.memo.inv),
    ]);

    this.usuarios = usuarios;
    this.invitaciones = invitaciones;

    try {
      await compartirAlbum();
      this.avisoCompartir = "";
    } catch (e) {
      this.avisoCompartir = mensajeDe(e);
    }

    const email = this.yo ?? "";
    const actual = this.usuarios[email];
    if (!actual || actual.rol !== "admin") {
      this.usuarios[email] = {
        nombre: this.yoNombre,
        rol: "admin",
        permisos: { ...PERMISOS_ADMIN },
      };
      await this.guardarUsuarios();
    }

    this.rol = "admin";
    this.permisos = this.usuarios[email]?.permisos ?? { ...PERMISOS_ADMIN };
  }

  /** Devuelve true si hay que pedir el nombre al invitado. */
  private async prepararInvitado(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const raizId = params.get("drive");
    const invId = params.get("inv");
    const usersId = params.get("users");
    const fotosId = params.get("fotos");
    const albumId = params.get("album") ?? "";
    const ocultasId = params.get("ocultas") ?? "";
    const gruposId = params.get("grupos") ?? "";

    if (!raizId || !invId || !usersId || !fotosId) {
      throw new Error("Este enlace de invitación está incompleto. Pide uno nuevo al administrador.");
    }

    // El invitado también necesita el memo: registrarNombre() escribe en
    // usuarios.json usando CONFIG.memo.users.
    CONFIG.memo = {
      raiz: raizId,
      inv: invId,
      users: usersId,
      fotos: fotosId,
      album: albumId,
      ocultas: ocultasId,
      grupos: gruposId,
    };
    this.fId = fotosId;
    this.info = await this.#cargarInfo(albumId);
    this.ocultas = await this.#cargarOcultas(ocultasId);
    this.grupos = await this.#cargarGrupos(gruposId);

    let usuarios: Usuarios;
    try {
      usuarios = await this.cargarJson<Usuarios>(usersId);
    } catch (e) {
      throw new Error(mensajeAccesoAlbum(e as ErrorHttp));
    }

    this.usuarios = usuarios;

    // Ya registrado: basta con estar en usuarios.json (el enlace sin token del
    // hub funciona así). El token solo hace falta para la primera entrada.
    const email = this.yo ?? "";
    const existente = this.usuarios[email];
    if (existente) {
      this.rol = existente.rol;
      this.permisos = existente.permisos;
      this.#registrarEnLista();
      return false;
    }

    if (!token) {
      throw new Error(
        "Ya no formas parte de este álbum. Pide un enlace de invitación nuevo al administrador."
      );
    }

    let invitaciones: Invitaciones;
    try {
      invitaciones = await this.cargarJson<Invitaciones>(invId);
    } catch (e) {
      throw new Error(mensajeAccesoAlbum(e as ErrorHttp));
    }

    const validacion = validarInvitacion(invitaciones, token);
    if (!validacion.ok) {
      throw new Error(
        validacion.motivo === "expirada"
          ? "Esta invitación ha caducado. Pide una nueva al administrador."
          : "Invitación no válida o ya revocada."
      );
    }

    this.invitaciones = invitaciones;
    this.rol = validacion.invitacion.rol;
    this.permisos = permisosSegunRol(validacion.invitacion);
    return true;
  }

  /** Registra al invitado en usuarios.json. */
  async registrarNombre(nombre: string): Promise<void> {
    const limpio = nombre.trim();
    if (!limpio || !this.yo) return;

    this.usuarios[this.yo] = {
      nombre: limpio,
      rol: this.rol ?? "colaborador",
      permisos: { subir: true, borrar: true, modificar: true },
    };
    this.yoNombre = limpio;

    await this.guardarUsuarios();
    this.#registrarEnLista();
    await this.recargarFotos();
    this.fase = "listo";
  }

  /** Lee album.json sin bloquear la apertura del álbum si no se puede. */
  async #cargarInfo(id: string): Promise<AlbumInfo | null> {
    if (!id) return null;
    try {
      const info = await this.cargarJson<AlbumInfo>(id);
      return info?.nombre ? info : null;
    } catch {
      return null;
    }
  }

  /** Lee ocultas.json sin bloquear la apertura del álbum si no se puede. */
  async #cargarOcultas(id: string): Promise<string[]> {
    if (!id) return [];
    try {
      return leerOcultas(await DriveApi.leer(id));
    } catch {
      return [];
    }
  }

  async #cargarGrupos(id: string): Promise<Grupo[]> {
    if (!id) return [];
    try {
      return leerGrupos(await DriveApi.leer(id));
    } catch {
      return [];
    }
  }

  /** Guarda el álbum actual en la lista de este navegador (solo invitados). */
  #registrarEnLista(): void {
    if (this.modo !== "inv" || !this.yo || !CONFIG.memo.raiz) return;
    // El admin que abre su propio álbum con un enlace no lo añade a "compartidos".
    if (this.rol === "admin") return;

    albumes.agregar({
      drive: CONFIG.memo.raiz,
      inv: CONFIG.memo.inv,
      users: CONFIG.memo.users,
      fotos: CONFIG.memo.fotos,
      album: CONFIG.memo.album || undefined,
      ocultas: CONFIG.memo.ocultas || undefined,
      grupos: CONFIG.memo.grupos || undefined,
      nombre: nombreAlbum(this.info),
      rol: this.rol ?? "colaborador",
      unido: new Date().toISOString(),
    });
  }

  /** Abre un álbum a partir de un enlace pegado (conserva el token si lo trae). */
  entrarPorEnlace(crudo: string): void {
    const destino = destinoEnlace(crudo, origenSitio());
    if (!destino) {
      throw new Error(
        "Ese enlace no es una invitación válida. Copia el enlace completo que te compartieron."
      );
    }
    window.location.href = destino;
  }

  /**
   * Salir de un álbum al que te invitaron: se elimina la entrada propia de
   * usuarios.json y la fila de la lista local. No cierra la sesión.
   */
  async salirDelAlbum(): Promise<void> {
    if (this.modo !== "inv" || !this.yo) {
      throw new Error("Solo puedes salir de un álbum al que te invitaron.");
    }
    if (this.rol === "admin") {
      throw new Error("El administrador no puede salir de su propio álbum.");
    }

    const email = this.yo;

    await albumes.salirDe(
      { drive: CONFIG.memo.raiz, users: CONFIG.memo.users },
      email
    );

    delete this.usuarios[email];
    this.limpiarCache();
    window.location.href = "/albumes.html";
  }

  /** Cambia el nombre visible del álbum (solo el dueño). */
  async renombrarAlbum(nombre: string): Promise<void> {
    if (!this.esOwner) {
      throw new Error("Solo el administrador puede cambiar el nombre del álbum.");
    }
    const limpio = nombre.trim();
    if (!limpio) throw new Error("El nombre del álbum no puede estar vacío.");
    if (!CONFIG.memo.album) throw new Error("No se encontró album.json del álbum.");

    const info: AlbumInfo = {
      nombre: limpio.slice(0, 60),
      creado: this.info?.creado ?? new Date().toISOString(),
    };
    if (this.yo) info.dueno = this.yo;

    await DriveApi.actualizarJson(CONFIG.memo.album, info);
    this.info = info;
  }

  salir(): void {
    AUTH.salir();
    this.limpiarCache();
    window.location.href = "/";
  }

  // ------------------------------------------------------------- invitados

  /** Ajustes: crea una invitación y devuelve el enlace listo para compartir. */
  async crearInvitacion(opciones: OpcionesInvitacion): Promise<string> {
    const token = generarToken();
    const invitacion: Invitacion = {
      rol: opciones.rol,
      permisos: opciones.permisos,
      expiracion: opciones.expiracion || "indefinida",
    };

    this.invitaciones[token] = invitacion;
    await this.guardarInvitaciones();

    // El acceso del invitado depende de los permisos públicos de Drive: si
    // fallan, se avisa en ajustes en lugar de entregar un enlace roto.
    try {
      await compartirAlbum();
      this.avisoCompartir = "";
    } catch (e) {
      this.avisoCompartir = mensajeDe(e);
    }

    const enlace = enlaceInvitacion(token, CONFIG.memo, origenSitio());
    this.invitacionGenerada = token;
    this.enlaceActual = enlace;
    return enlace;
  }

  async revocarInvitacion(token: string): Promise<void> {
    delete this.invitaciones[token];
    if (this.invitacionGenerada === token) {
      this.invitacionGenerada = "";
      this.enlaceActual = "";
    }
    await this.guardarInvitaciones();
  }

  /** Reconstruye el enlace de una invitación existente (para volver a mostrar el QR). */
  mostrarEnlace(token: string): void {
    this.invitacionGenerada = token;
    this.enlaceActual = enlaceInvitacion(token, CONFIG.memo, origenSitio());
  }

  async crearDesdeAjustes(usuario: string, datos: Usuario): Promise<void> {
    this.usuarios[usuario] = datos;
    await this.guardarUsuarios();
  }

  async eliminarUsuario(usuario: string): Promise<void> {
    delete this.usuarios[usuario];
    await this.guardarUsuarios();
  }

  guardarUsuarios(): Promise<unknown> {
    if (!CONFIG.memo.users) {
      return Promise.reject(new Error("No se pudo identificar usuarios.json del álbum."));
    }
    return DriveApi.actualizarJson(CONFIG.memo.users, $state.snapshot(this.usuarios));
  }

  guardarInvitaciones(): Promise<unknown> {
    if (!CONFIG.memo.inv) {
      return Promise.reject(new Error("No se pudo identificar invitaciones.json del álbum."));
    }
    return DriveApi.actualizarJson(CONFIG.memo.inv, $state.snapshot(this.invitaciones));
  }

  async cargarJson<T>(id: string): Promise<T> {
    const texto = await DriveApi.leer(id);
    if (!texto) return {} as T;
    try {
      return JSON.parse(texto) as T;
    } catch {
      return {} as T;
    }
  }

  // ------------------------------------------------------------------ fotos

  async recargarFotos(): Promise<void> {
    const archivos = await DriveApi.listarTodas("'" + this.fId + "' in parents and trashed=false", CAMPOS);
    const fotos = archivos.map((a) => ({
      id: a.id,
      name: a.name ?? "",
      size: a.size,
      createdTime: a.createdTime,
      mimeType: a.mimeType,
      thumbnailLink: a.thumbnailLink,
      ownerEmail: a.owners?.[0]?.emailAddress,
    }));
    this.todasFotos = fotos;
    this.fotos = filtrarOcultas(fotos, this.ocultas);
  }

  /** URL de objeto para <img>, cacheada y sin peticiones duplicadas. */
  fotoUrl(id: string): Promise<string> {
    const cacheada = this.#cache.get(id);
    if (cacheada) return Promise.resolve(cacheada);

    const enCurso = this.#promesas.get(id);
    if (enCurso) return enCurso;

    const peticion = DriveApi.fotoUrl(id)
      .then((url) => {
        this.#cache.set(id, url);
        this.#promesas.delete(id);
        return url;
      })
      .catch((e: unknown) => {
        this.#promesas.delete(id);
        throw e;
      });

    this.#promesas.set(id, peticion);
    return peticion;
  }

  urlEnCache(id: string): string | undefined {
    return this.#cache.get(id);
  }

  limpiarCache(): void {
    for (const url of this.#cache.values()) URL.revokeObjectURL(url);
    this.#cache.clear();
    this.#promesas.clear();
  }

  async subir(archivos: FileList | File[]): Promise<{ ok: number; fallos: string[] }> {
    if (!this.puedeSubir) {
      throw new Error("No tienes permiso para subir fotos.");
    }

    const lista = Array.from(archivos).filter((f) => CONFIG.mimeImagen.includes(f.type));
    if (!lista.length) {
      throw new Error("Arrastra archivos de imagen (JPG, PNG, GIF, WEBP…).");
    }

    let ok = 0;
    const fallos: string[] = [];

    for (const archivo of lista) {
      const item: ItemCola = {
        id: ++this.#contadorCola,
        nombre: archivo.name,
        pct: 0,
        estado: "subiendo",
      };
      this.subiendo.push(item);

      try {
        const creado = await DriveApi.subirConProgreso(
          { name: archivo.name, mimeType: archivo.type, parents: [this.fId] },
          archivo,
          archivo.name,
          (pct) => {
            item.pct = pct;
          }
        );

        this.fotos.unshift({
          id: creado.id,
          name: creado.name ?? archivo.name,
          createdTime: creado.createdTime ?? new Date().toISOString(),
          mimeType: archivo.type,
        });
        item.pct = 100;
        item.estado = "ok";
        ok++;
        window.setTimeout(() => this.#quitarDeCola(item.id), 900);
      } catch (e) {
        item.estado = "error";
        fallos.push(`${archivo.name}: ${mensajeDe(e)}`);
        window.setTimeout(() => this.#quitarDeCola(item.id), 4000);
      }
    }

    return { ok, fallos };
  }

  async borrar(ids: string[]): Promise<{ ok: number; fallos: string[] }> {
    if (!ids.length) return { ok: 0, fallos: [] };

    this.borrando = true;
    let ok = 0;
    const fallos: string[] = [];
    const ocultar: string[] = [];

    for (const id of ids) {
      try {
        ocultar.push(id);
      } catch (e) {
        // Solo el dueño de un archivo puede borrarlo en Drive. Las fotos que
        // subió otra cuenta se ocultan del álbum en vez de fallar.
        if ((e as ErrorHttp).code === 403) {
          ocultar.push(id);
          continue;
        }
        fallos.push(mensajeDe(e));
      }
    }

    if (ocultar.length) {
      try {
        await this.#ocultar(ocultar);
        for (const id of ocultar) this.#quitarFoto(id);
        ok += ocultar.length;
      } catch (e) {
        fallos.push(mensajeDe(e));
      }
    }

    this.borrando = false;
    return { ok, fallos };
  }

  async restaurar(ids: string[]): Promise<void> {
    const lista = quitarOcultas(this.ocultas, ids);
    await this.guardarOcultas(lista);
    this.ocultas = lista;
    this.fotos = filtrarOcultas(this.todasFotos, lista);
  }

  esPropietario(id: string): boolean {
    return this.todasFotos.find((foto) => foto.id === id)?.ownerEmail === this.yo;
  }

  async borrarDefinitivamente(ids: string[]): Promise<void> {
    const propias = ids.filter((id) => this.papelera.some((foto) => foto.id === id));
    for (const id of propias) await DriveApi.borrar(id);
    const lista = quitarOcultas(this.ocultas, propias);
    await this.guardarOcultas(lista);
    this.ocultas = lista;
    this.todasFotos = this.todasFotos.filter((foto) => !propias.includes(foto.id));
    this.fotos = filtrarOcultas(this.todasFotos, lista);
  }

  async crearGrupo(nombre: string, ids: string[] = []): Promise<void> {
    const limpio = nombre.trim().slice(0, 60);
    if (!limpio || !CONFIG.memo.grupos) throw new Error("Escribe un nombre válido para el grupo.");
    const grupo: Grupo = { id: crypto.randomUUID(), nombre: limpio, fotos: [...new Set(ids)] };
    this.grupos = [...this.grupos, grupo];
    await this.guardarGrupos();
  }

  async asignarAlGrupo(idGrupo: string, ids: string[]): Promise<void> {
    const grupo = this.grupos.find((item) => item.id === idGrupo);
    if (!grupo) return;
    this.grupos = this.grupos.map((item) => (item.id === idGrupo ? agregarFotosAlGrupo(item, ids) : item));
    await this.guardarGrupos();
  }

  async quitarDelGrupo(idGrupo: string, ids: string[]): Promise<void> {
    const grupo = this.grupos.find((item) => item.id === idGrupo);
    if (!grupo) return;
    this.grupos = this.grupos.map((item) => (item.id === idGrupo ? quitarFotosDeGrupo(item, ids) : item));
    await this.guardarGrupos();
  }

  async guardarOcultas(lista: string[]): Promise<void> {
    if (!CONFIG.memo.ocultas) throw new Error("No se encontró ocultas.json del álbum.");
    await DriveApi.actualizarJson(CONFIG.memo.ocultas, serializarOcultas(lista));
  }

  async guardarGrupos(): Promise<void> {
    if (!CONFIG.memo.grupos) throw new Error("Este enlace no incluye grupos compartidos.");
    await DriveApi.actualizarJson(CONFIG.memo.grupos, serializarGrupos(this.grupos));
  }

  /** Añade ids a ocultas.json y actualiza la lista en memoria. */
  async #ocultar(ids: string[]): Promise<void> {
    if (!CONFIG.memo.ocultas) {
      throw new Error(
        "No se pudo identificar la lista de fotos ocultas. Pide un enlace de invitación nuevo al administrador."
      );
    }

    const lista = agregarOcultas(this.ocultas, ids);
    await DriveApi.actualizarJson(CONFIG.memo.ocultas, serializarOcultas(lista));
    this.ocultas = lista;
  }

  /** Quita una foto del estado local (galería, selección, visor y caché). */
  #quitarFoto(id: string): void {
    this.fotos = this.fotos.filter((f) => f.id !== id);
    this.seleccion = this.seleccion.filter((s) => s !== id);
    const url = this.#cache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.#cache.delete(id);
    }
    if (this.fotoAbierta === id) this.fotoAbierta = null;
  }

  #quitarDeCola(id: number): void {
    this.subiendo = this.subiendo.filter((i) => i.id !== id);
  }

  // -------------------------------------------------------------- selección

  alternarSeleccionActiva(): void {
    this.seleccionActiva = !this.seleccionActiva;
    this.seleccion = [];
  }

  cancelarSeleccion(): void {
    this.seleccionActiva = false;
    this.seleccion = [];
  }

  alternarSeleccion(id: string): void {
    this.seleccion = this.seleccion.includes(id)
      ? this.seleccion.filter((s) => s !== id)
      : [...this.seleccion, id];
  }

  estaSeleccionada(id: string): boolean {
    return this.seleccion.includes(id);
  }

  // ----------------------------------------------------------------- visor

  abrirFoto(id: string): void {
    this.fotoAbierta = id;
  }

  cerrarFoto(): void {
    this.fotoAbierta = null;
  }

  get indiceActual(): number {
    if (!this.fotoAbierta) return -1;
    return this.visibles.findIndex((f) => f.id === this.fotoAbierta);
  }

  navegarFoto(paso: number): void {
    const lista = this.visibles;
    if (!lista.length) return;
    const i = this.indiceActual;
    const siguiente = (i + paso + lista.length) % lista.length;
    this.fotoAbierta = lista[siguiente]?.id ?? null;
  }

  async descargarFotoActual(): Promise<void> {
    const foto = this.fotoActual;
    if (!foto) return;
    const url = await this.fotoUrl(foto.id);
    const a = document.createElement("a");
    a.href = url;
    a.download = foto.name || "foto.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

function mensajeDe(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return "No se pudo completar la operación.";
}

export const album = new EstadoAlbum();
