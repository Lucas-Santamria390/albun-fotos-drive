import { CONFIG } from "../config";
import { DriveApi } from "./api";
import type { AlbumInfo, ArchivoDrive, MemoEstructura } from "../tipos";

async function buscarCarpeta(nombre: string, cPadre: string): Promise<ArchivoDrive> {
  const q =
    "name='" +
    nombre +
    "' and mimeType='" +
    CONFIG.folderMime +
    "' and '" +
    cPadre +
    "' in parents and trashed=false";
  const encontradas = await DriveApi.list(q, "files(id,name)");
  return encontradas[0] ?? (await DriveApi.crearCarpeta(nombre, cPadre));
}

async function pedirJsonCarpeta(nombre: string, cPadre: ArchivoDrive): Promise<ArchivoDrive> {
  const q = "name='" + nombre + "' and '" + cPadre.id + "' in parents and trashed=false";
  const encontrados = await DriveApi.list(q, "files(id,name)");
  if (encontrados[0]) return encontrados[0];

  const creado = await DriveApi.crearJson(nombre, cPadre.id);
  await DriveApi.actualizarJson(creado.id, {});
  return creado;
}

/**
 * album.json guarda el nombre visible del álbum. Se crea con valores por
 * defecto solo si está vacío: nunca pisa un nombre ya elegido por el dueño.
 */
async function asegurarAlbumJson(raiz: ArchivoDrive, dueno?: string): Promise<ArchivoDrive> {
  const archivo = await pedirJsonCarpeta("album.json", raiz);

  let actual: AlbumInfo | null = null;
  try {
    const texto = await DriveApi.leer(archivo.id);
    actual = texto ? (JSON.parse(texto) as AlbumInfo) : null;
  } catch {
    actual = null;
  }

  if (!actual?.nombre) {
    const inicial: AlbumInfo = {
      nombre: "Mi álbum",
      creado: actual?.creado ?? new Date().toISOString(),
    };
    if (dueno) inicial.dueno = dueno;
    await DriveApi.actualizarJson(archivo.id, inicial);
  }

  return archivo;
}

/**
 * Garantiza la estructura del álbum en el Drive del dueño:
 * MiAlbumWeb_Config/{invitaciones.json, usuarios.json, album.json, fotos/}
 */
export async function asegurarEstructura(dueno?: string): Promise<MemoEstructura> {
  const raiz = await buscarCarpeta(CONFIG.rootNombre, "root");
  const inv = await pedirJsonCarpeta("invitaciones.json", raiz);
  const users = await pedirJsonCarpeta("usuarios.json", raiz);
  const album = await asegurarAlbumJson(raiz, dueno);
  const fotos = await buscarCarpeta("fotos", raiz.id);

  CONFIG.memo = {
    raiz: raiz.id,
    inv: inv.id,
    users: users.id,
    fotos: fotos.id,
    album: album.id,
  };
  return CONFIG.memo;
}

function mensajeDe(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "error desconocido";
}

/**
 * Comparte los recursos necesarios para que un invitado autenticado pueda
 * leer/escribir usando su propio token. Ya no se ignoran los fallos: si algo
 * no queda compartido, el panel de ajustes lo muestra.
 */
export async function compartirAlbum(): Promise<void> {
  const objetivos = [
    { id: CONFIG.memo.users, rol: "writer" as const, nombre: "usuarios.json" },
    { id: CONFIG.memo.inv, rol: "reader" as const, nombre: "invitaciones.json" },
    { id: CONFIG.memo.album, rol: "reader" as const, nombre: "album.json" },
    { id: CONFIG.memo.fotos, rol: "writer" as const, nombre: "fotos/" },
  ];

  const fallos: string[] = [];

  for (const objetivo of objetivos) {
    if (!objetivo.id) {
      fallos.push(`${objetivo.nombre}: falta el identificador`);
      continue;
    }

    try {
      await DriveApi.asegurarPermisoPublico(objetivo.id, objetivo.rol);
      const verificado = await DriveApi.tienePermisoPublico(objetivo.id, objetivo.rol);
      if (!verificado) {
        fallos.push(`${objetivo.nombre}: el permiso público no quedó activo`);
      }
    } catch (e) {
      fallos.push(`${objetivo.nombre}: ${mensajeDe(e)}`);
    }
  }

  if (fallos.length) {
    throw new Error(fallos.join(" · "));
  }
}
