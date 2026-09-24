import { DriveApi } from "../drive/api.js";

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
  return !!(state.permisos && state.permisos.subir);
}

export function puedeBorrar() {
  return !!(state.permisos && state.permisos.borrar);
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

export function visibles() {
  const q = state.txBusqueda.toLowerCase();
  let arr = state.fotos.filter(function (f) {
    return !q || (f.name || "").toLowerCase().indexOf(q) >= 0;
  });
  const o = state.orden;
  arr.sort(function (a, b) {
    if (o === "antiguos") return new Date(a.createdTime) - new Date(b.createdTime);
    if (o === "nombre") return (a.name || "").localeCompare(b.name || "", "es");
    return new Date(b.createdTime) - new Date(a.createdTime);
  });
  return arr;
}