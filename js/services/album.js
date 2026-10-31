import { DriveApi } from "../drive/api.js";
import { CONFIG } from "../config.js";
import { asegurarEstructura, compartirAlbum } from "../drive/structure.js";
import { puedeSubir as tieneSubir, puedeBorrar as tieneBorrar, PERMISOS_ADMIN } from "./permisos.js";
import { filtrarOrdenar } from "./galeria.js";
import { generarToken } from "./invitaciones.js";
import { enlaceInvitacion } from "./enlaces.js";

export const state = {
  params: null,
  modo: "owner",
  yo: null,
  yoNombre: null,
  rol: null,
  permisos: null,
  fId: null,
  usuarios: {},
  invitaciones: {},
  fotos: [],
  cache: {},
  invitacionActual: "",
  txBusqueda: "",
  orden: "recientes",
  selActivo: false,
  fsSel: []
};

export function puedeSubir() {
  return tieneSubir(state.permisos);
}

export function puedeBorrar() {
  return tieneBorrar(state.permisos);
}

export function visibles() {
  return filtrarOrdenar(state.fotos, state.txBusqueda, state.orden);
}

export function toggleSel(id) {
  const i = state.fsSel.indexOf(id);
  if (i >= 0) {
    state.fsSel.splice(i, 1);
  } else {
    state.fsSel.push(id);
  }
}

export function limpiarSel() {
  state.fsSel = [];
}

export function selIds() {
  return state.fsSel.slice();
}

export async function cargarJson(id) {
  const t = await DriveApi.leer(id);
  return t ? JSON.parse(t) : {};
}

export async function cargarFotos() {
  const fotos = await DriveApi.listarFotos(state.fId);
  state.fotos = fotos.map(function (f) {
    return { id: f.id, name: f.name, size: f.size, createdTime: f.createdTime };
  });
}

export function fotoUrl(id) {
  if (state.cache[id]) return Promise.resolve(state.cache[id]);
  return DriveApi.fotoUrl(id).then(function (u) {
    state.cache[id] = u;
    return u;
  });
}

export function limpiarCache() {
  state.cache = {};
}

export async function iniciarOwner() {
  await asegurarEstructura();
  state.fId = CONFIG.memo.fotos;
  await Promise.all([
    compartirAlbum(),
    cargarJson(CONFIG.memo.users).then(function (u) { state.usuarios = u; }),
    cargarJson(CONFIG.memo.inv).then(function (i) { state.invitaciones = i; })
  ]);
  if (!state.usuarios[state.yo] || state.usuarios[state.yo].rol !== "admin") {
    state.usuarios[state.yo] = {
      nombre: state.yoNombre,
      rol: "admin",
      permisos: PERMISOS_ADMIN
    };
    await DriveApi.actualizarJson(CONFIG.memo.users, state.usuarios);
  }
  state.rol = "admin";
  state.permisos = state.usuarios[state.yo].permisos || PERMISOS_ADMIN;
}

export function guardarUsuarios() {
  return DriveApi.actualizarJson(CONFIG.memo.users, state.usuarios);
}

export function guardarInvitaciones() {
  return DriveApi.actualizarJson(CONFIG.memo.inv, state.invitaciones);
}

export async function crearInvitacion(rol, permisos, expiracion) {
  const token = generarToken();
  state.invitaciones[token] = {
    rol: rol,
    permisos: permisos,
    expiracion: expiracion || "indefinida"
  };
  await guardarInvitaciones();
  const enlace = enlaceInvitacion(encodeURIComponent(token));
  state.invitacionActual = enlace;
  return { token: token, enlace: enlace };
}

export async function revocarInvitacion(token) {
  delete state.invitaciones[token];
  await guardarInvitaciones();
}

export async function subirFotos(files, onEst, onError) {
  const lista = Array.prototype.slice.call(files).filter(function (f) {
    return CONFIG.mimeImagen.indexOf(f.type) >= 0;
  });
  if (!lista.length) throw new Error("Arrastra archivos de imagen (JPG, PNG, GIF, WEBP…).");
  for (const archivo of lista) {
    if (onEst) onEst({ nombre: archivo.name, estado: "iniciando", pct: 0 });
    try {
      const creado = await DriveApi.subirConProgreso(
        { name: archivo.name, mimeType: archivo.type, parents: [state.fId] },
        archivo,
        archivo.name,
        function (pct) { if (onEst) onEst({ nombre: archivo.name, estado: "subiendo", pct: pct }); }
      );
      state.fotos.unshift({
        id: creado.id,
        name: creado.name || archivo.name,
        createdTime: creado.createdTime || new Date().toISOString()
      });
      if (onEst) onEst({ nombre: archivo.name, estado: "ok", pct: 100 });
    } catch (err) {
      if (onError) onError(archivo.name, err);
    }
  }
}

export async function borrarFotos(ids, onAvance) {
  let ok = 0;
  const fallos = [];
  for (let i = 0; i < ids.length; i++) {
    if (onAvance) onAvance(i + 1, ids.length);
    try {
      await DriveApi.borrar(ids[i]);
      ok++;
      if (state.cache[ids[i]]) {
        URL.revokeObjectURL(state.cache[ids[i]]);
        delete state.cache[ids[i]];
      }
      state.fotos = state.fotos.filter(function (x) { return x.id !== ids[i]; });
    } catch (err) {
      fallos.push(err instanceof Error ? err.message : String(err));
    }
  }
  return { ok: ok, fallos: fallos };
}