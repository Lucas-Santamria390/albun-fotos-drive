import { AUTH } from "../auth";
import { CONFIG } from "../config";
import { DriveApi } from "../drive/api";
import { asegurarEstructura, compartirAlbum } from "../drive/structure";
import { filtrarOrdenar } from "../services/galeria";
import { generarToken, permisosSegunRol, validarInvitacion } from "../services/invitaciones";
import { enlaceInvitacion } from "../services/enlaces";
import { PERMISOS_ADMIN, puedeBorrar, puedeSubir } from "../services/permisos";
import type {
  ErrorHttp,
  Foto,
  Invitacion,
  Invitaciones,
  OrdenGaleria,
  Permisos,
  Rol,
  Usuario,
  Usuarios,
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

const CAMPOS = "files(id,name,mimeType,thumbnailLink,createdTime,size)";

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

  fotos = $state<Foto[]>([]);
  busqueda = $state("");
  orden = $state<OrdenGaleria>("recientes");

  seleccionActiva = $state(false);
  seleccion = $state<string[]>([]);

  subiendo = $state<ItemCola[]>([]);
  borrando = $state(false);

  /** Enlace de la última invitación generada (solo ajustes). */
  enlaceActual = $state("");
  invitacionGenerada = $state("");

  /** id de la foto abierta en el visor. */
  fotoAbierta = $state<string | null>(null);

  #cache = new Map<string, string>();
  #promesas = new Map<string, Promise<string>>();
  #contadorCola = 0;

  visibles = $derived(filtrarOrdenar(this.fotos, this.busqueda, this.orden));
  total = $derived(this.fotos.length);
  puedeSubir = $derived(puedeSubir(this.permisos));
  puedeBorrar = $derived(puedeBorrar(this.permisos));
  seleccionadas = $derived(this.seleccion.length);
  esOwner = $derived(this.modo === "owner");

  fotoActual = $derived(this.fotos.find((f) => f.id === this.fotoAbierta) ?? null);

  // ---------------------------------------------------------------- sesión

  /** Arranque: decide si hace falta login y precarga la sesión. */
  async iniciar(): Promise<void> {
    AUTH.init();
    const params = new URLSearchParams(window.location.search);
    this.modo = params.get("token") ? "inv" : "owner";
    this.fId = params.get("fotos") ?? "";

    if (!AUTH.token) {
      this.fase = "auth";
      return;
    }
    await this.cargar();
  }

  async entrar(): Promise<void> {
    this.fase = "cargando";
    this.mensaje = "";
    try {
      await AUTH.login();
      await this.cargar();
    } catch (e) {
      this.fase = "auth";
      this.mensaje = mensajeDe(e);
    }
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
    await asegurarEstructura();
    this.fId = CONFIG.memo.fotos;

    const [usuarios, invitaciones] = await Promise.all([
      this.cargarJson<Usuarios>(CONFIG.memo.users),
      this.cargarJson<Invitaciones>(CONFIG.memo.inv),
      compartirAlbum().catch(() => undefined),
    ]);

    this.usuarios = usuarios;
    this.invitaciones = invitaciones;

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
    const invId = params.get("inv");
    const usersId = params.get("users");
    const fotosId = params.get("fotos");

    if (!invId || !usersId || !fotosId) {
      throw new Error("Este enlace de invitación está incompleto. Pide uno nuevo al administrador.");
    }

    this.fId = fotosId;

    let invitaciones: Invitaciones;
    let usuarios: Usuarios;
    try {
      [invitaciones, usuarios] = await Promise.all([
        this.cargarJson<Invitaciones>(invId),
        this.cargarJson<Usuarios>(usersId),
      ]);
    } catch (e) {
      const err = e as ErrorHttp;
      if (err.code === 404 || err.code === 403) {
        throw new Error("La invitación no es válida o ya fue revocada.");
      }
      throw e;
    }

    const validacion = validarInvitacion(invitaciones, token);
    if (!validacion.ok) {
      throw new Error(
        validacion.motivo === "expirada"
          ? "Esta invitación ha caducado. Pide una nueva al administrador."
          : "Invitación no válida o ya revocada.",
      );
    }

    this.invitaciones = invitaciones;
    this.usuarios = usuarios;

    const email = this.yo ?? "";
    const existente = this.usuarios[email];
    if (existente) {
      this.rol = existente.rol;
      this.permisos = existente.permisos;
      return false;
    }

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
      permisos: this.permisos ?? { subir: true, borrar: false, modificar: false },
    };
    this.yoNombre = limpio;

    await this.guardarUsuarios();
    await this.recargarFotos();
    this.fase = "listo";
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

    const enlace = enlaceInvitacion(token, CONFIG.memo);
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
    this.enlaceActual = enlaceInvitacion(token, CONFIG.memo);
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
    return DriveApi.actualizarJson(CONFIG.memo.users, $state.snapshot(this.usuarios));
  }

  guardarInvitaciones(): Promise<unknown> {
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
    const archivos = await DriveApi.listarTodas(
      "'" + this.fId + "' in parents and trashed=false",
      CAMPOS,
    );
    this.fotos = archivos.map((a) => ({
      id: a.id,
      name: a.name ?? "",
      size: a.size,
      createdTime: a.createdTime,
      mimeType: a.mimeType,
      thumbnailLink: a.thumbnailLink,
    }));
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
          },
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

    for (const id of ids) {
      try {
        await DriveApi.borrar(id);
        ok++;
        this.fotos = this.fotos.filter((f) => f.id !== id);
        this.seleccion = this.seleccion.filter((s) => s !== id);
        const url = this.#cache.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          this.#cache.delete(id);
        }
        if (this.fotoAbierta === id) this.fotoAbierta = null;
      } catch (e) {
        fallos.push(mensajeDe(e));
      }
    }

    this.borrando = false;
    return { ok, fallos };
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
