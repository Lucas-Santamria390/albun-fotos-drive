import { DriveApi } from "../drive/api.js";
import { puedeSubir as tieneSubir, puedeBorrar as tieneBorrar } from "../services/permisos.js";
import { filtrarOrdenar } from "../services/galeria.js";

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
  return filtrarOrdenar(state.fotos, state.txBusqueda, state.orden);
}