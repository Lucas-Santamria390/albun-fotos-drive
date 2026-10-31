import { normalizarOrigen } from "../origen";
import type { AlbumGuardado, AlbumInfo, Rol } from "../tipos";

/** Clave de localStorage con la lista de álbumes de este navegador. */
export const CLAVE_ALBUMES = "MiAlbumWeb_albumes";

/** Ids mínimos para abrir un álbum. El token nunca forma parte de la lista. */
export interface DatosEnlace {
  drive: string;
  inv: string;
  users: string;
  fotos: string;
  album?: string;
}

const ROLES: Rol[] = ["admin", "colaborador", "visitante"];
const NOMBRE_RESPALDO = "Álbum compartido";
const LARGO_NOMBRE = 60;

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function rolValido(valor: unknown): Rol {
  return ROLES.includes(valor as Rol) ? (valor as Rol) : "colaborador";
}

/**
 * Lee la lista guardada en el navegador. Cualquier contenido inválido o
 * corrupto se descarta sin romper la app (se prioriza poder abrir el álbum).
 */
export function leerAlbumes(crudo: string | null | undefined): AlbumGuardado[] {
  if (!crudo) return [];

  let datos: unknown;
  try {
    datos = JSON.parse(crudo);
  } catch {
    return [];
  }
  if (!Array.isArray(datos)) return [];

  const lista: AlbumGuardado[] = [];
  for (const item of datos) {
    const entrada = item as Partial<AlbumGuardado> | null;
    const drive = texto(entrada?.drive);
    const inv = texto(entrada?.inv);
    const users = texto(entrada?.users);
    const fotos = texto(entrada?.fotos);
    if (!drive || !inv || !users || !fotos) continue;

    lista.push({
      drive,
      inv,
      users,
      fotos,
      album: texto(entrada?.album) || undefined,
      nombre: texto(entrada?.nombre) || NOMBRE_RESPALDO,
      rol: rolValido(entrada?.rol),
      unido: texto(entrada?.unido),
    });
  }
  return lista;
}

export function serializarAlbumes(lista: AlbumGuardado[]): string {
  return JSON.stringify(lista);
}

/**
 * Añade un álbum a la lista sin duplicar por `drive`. Si ya existía, actualiza
 * nombre y rol pero conserva la fecha original de unión.
 */
export function agregarAlbum(lista: AlbumGuardado[], nuevo: AlbumGuardado): AlbumGuardado[] {
  const existente = lista.find((a) => a.drive === nuevo.drive);
  const entrada: AlbumGuardado = {
    ...nuevo,
    nombre: texto(nuevo.nombre) || NOMBRE_RESPALDO,
    rol: rolValido(nuevo.rol),
    unido: existente?.unido || nuevo.unido,
  };

  return [entrada, ...lista.filter((a) => a.drive !== nuevo.drive)];
}

export function quitarAlbum(lista: AlbumGuardado[], drive: string): AlbumGuardado[] {
  return lista.filter((a) => a.drive !== drive);
}

export function estaEnLista(lista: AlbumGuardado[], drive: string): boolean {
  return lista.some((a) => a.drive === drive);
}

/** Enlace para abrir un álbum ya unido: sin token, la pertenencia se valida contra usuarios.json. */
export function enlaceAlbum(datos: DatosEnlace, base: string): string {
  const origen = normalizarOrigen(base);
  if (!origen) {
    throw new Error("No se pudo determinar una URL válida para el álbum.");
  }

  const url = new URL("/album.html", origen);
  url.searchParams.set("drive", datos.drive);
  url.searchParams.set("inv", datos.inv);
  url.searchParams.set("users", datos.users);
  url.searchParams.set("fotos", datos.fotos);
  if (datos.album) url.searchParams.set("album", datos.album);
  return url.toString();
}

/**
 * Extrae los ids de un enlace de invitación (o del texto del QR). Acepta una
 * URL absoluta o solo la query string. Devuelve null si falta algún id.
 */
export function parsearEnlace(crudo: string): DatosEnlace | null {
  const limpio = texto(crudo);
  if (!limpio) return null;

  let params: URLSearchParams;
  if (limpio.includes("://")) {
    let url: URL;
    try {
      url = new URL(limpio);
    } catch {
      return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    params = url.searchParams;
  } else {
    const interrogacion = limpio.indexOf("?");
    params = new URLSearchParams(interrogacion >= 0 ? limpio.slice(interrogacion + 1) : limpio);
  }

  const drive = texto(params.get("drive"));
  const inv = texto(params.get("inv"));
  const users = texto(params.get("users"));
  const fotos = texto(params.get("fotos"));
  if (!drive || !inv || !users || !fotos) return null;

  const datos: DatosEnlace = { drive, inv, users, fotos };
  const album = texto(params.get("album"));
  if (album) datos.album = album;
  return datos;
}

/**
 * URL absoluta a la que navegar con un enlace pegado en el hub. A diferencia
 * de `parsearEnlace`, conserva el token (solo se usa para navegar, nunca se
 * guarda) y cualquier otro parámetro del enlace original.
 */
export function destinoEnlace(crudo: string, base: string): string | null {
  const limpio = texto(crudo);
  if (!parsearEnlace(limpio)) return null;

  const origen = normalizarOrigen(base);
  if (!origen) return null;

  if (limpio.includes("://")) {
    const url = new URL(limpio);
    return url.toString();
  }

  const interrogacion = limpio.indexOf("?");
  const query = interrogacion >= 0 ? limpio.slice(interrogacion + 1) : limpio;
  return new URL("/album.html?" + query, origen).toString();
}

/** Nombre visible del álbum: recorta espacios y cae a un respaldo legible. */
export function nombreAlbum(
  info: AlbumInfo | null | undefined,
  respaldo: string = NOMBRE_RESPALDO,
): string {
  const limpio = texto(info?.nombre).replace(/\s+/g, " ");
  if (!limpio) return respaldo;
  return limpio.slice(0, LARGO_NOMBRE);
}
