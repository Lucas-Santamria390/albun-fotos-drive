import { CONFIG } from "../config";
import { DriveApi } from "./api";
import type { ArchivoDrive, MemoEstructura } from "../tipos";

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
 * Garantiza la estructura del álbum en el Drive del dueño:
 * MiAlbumWeb_Config/{invitaciones.json, usuarios.json, fotos/}
 */
export async function asegurarEstructura(): Promise<MemoEstructura> {
  const raiz = await buscarCarpeta(CONFIG.rootNombre, "root");
  const inv = await pedirJsonCarpeta("invitaciones.json", raiz);
  const users = await pedirJsonCarpeta("usuarios.json", raiz);
  const fotos = await buscarCarpeta("fotos", raiz.id);

  CONFIG.memo = { raiz: raiz.id, inv: inv.id, users: users.id, fotos: fotos.id };
  return CONFIG.memo;
}

/**
 * Comparte los recursos necesarios para que un invitado autenticado pueda
 * leer/escribir usando su propio token. Se ignoran fallos: si ya estaban
 * compartidos, Drive devuelve error y no es un problema.
 */
export async function compartirAlbum(): Promise<void> {
  await Promise.all([
    DriveApi.compartir(CONFIG.memo.users, "writer").catch(() => undefined),
    DriveApi.compartir(CONFIG.memo.inv, "reader").catch(() => undefined),
    DriveApi.compartir(CONFIG.memo.fotos, "writer").catch(() => undefined),
  ]);
}
