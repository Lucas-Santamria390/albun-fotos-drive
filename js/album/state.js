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
  orden: "recientes"
};

export function puedeSubir() {
  return !!(state.permisos && state.permisos.subir);
}

export function puedeBorrar() {
  return !!(state.permisos && state.permisos.borrar);
}

export async function cargarJson(id) {
  try {
    const t = await DriveApi.leer(id);
    return t ? JSON.parse(t) : {};
  } catch (e) {
    return {};
  }
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