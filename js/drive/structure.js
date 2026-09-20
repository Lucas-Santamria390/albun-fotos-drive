import { CONFIG } from "../config.js";
import { DriveApi } from "./api.js";

function buscarCarpeta(nombre, cPadre) {
  const q = "name='" + nombre + "' and mimeType='" + CONFIG.folderMime + "' and '" + cPadre + "' in parents and trashed=false";
  return DriveApi.list(q, "files(id,name)").then(function (f) {
    return f[0] || DriveApi.crearCarpeta(nombre, cPadre);
  });
}

function pedirJsonCarpeta(nombre, cPadre) {
  const q = "name='" + nombre + "' and '" + cPadre.id + "' in parents and trashed=false";
  return DriveApi.list(q, "files(id,name)").then(function (f) {
    if (f[0]) return f[0];
    return DriveApi.crearJson(nombre, cPadre.id).then(function (creado) {
      return DriveApi.actualizarJson(creado.id, {}).then(function () { return creado; });
    });
  });
}

export async function asegurarEstructura() {
  const raiz = await buscarCarpeta(CONFIG.rootNombre, "root");
  const inv = await pedirJsonCarpeta("invitaciones.json", raiz);
  const users = await pedirJsonCarpeta("usuarios.json", raiz);
  const fotos = await buscarCarpeta("fotos", raiz.id);
  CONFIG.memo = { raiz: raiz.id, inv: inv.id, users: users.id, fotos: fotos.id };
  return CONFIG.memo;
}

export async function compartirAlbum() {
  await DriveApi.compartir(CONFIG.memo.users, "writer").catch(function () {});
  await DriveApi.compartir(CONFIG.memo.inv, "reader").catch(function () {});
  await DriveApi.compartir(CONFIG.memo.fotos, "writer").catch(function () {});
}