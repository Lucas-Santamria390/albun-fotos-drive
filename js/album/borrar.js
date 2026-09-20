import { $, toast } from "../util.js";
import { state } from "./state.js";
import { DriveApi } from "../drive/api.js";
import { renderGaleria } from "./gallery.js";

let borrarPendiente = null;

export function modalConfirmAbierto() {
  return !$("#modalConfirm").classList.contains("oculto");
}

export function solicitarBorrar(id) {
  const f = state.fotos.find(function (x) { return x.id === id; });
  borrarPendiente = id;
  $("#txtConfirm").textContent = "La foto \u201c" + (f ? f.name : "") + "\u201d se eliminará del álbum de forma permanente.";
  $("#modalConfirm").classList.remove("oculto");
}

export function cerrarConfirm() {
  $("#modalConfirm").classList.add("oculto");
  borrarPendiente = null;
}

async function ejecutarBorrar() {
  const id = borrarPendiente;
  if (!id) return;
  $("#modalConfirm").classList.add("oculto");
  try {
    await DriveApi.borrar(id);
    if (state.cache[id]) { URL.revokeObjectURL(state.cache[id]); delete state.cache[id]; }
    state.fotos = state.fotos.filter(function (x) { return x.id !== id; });
    renderGaleria();
    toast("Foto eliminada.", "ok");
  } catch (err) {
    toast(err.message, "error");
  } finally {
    borrarPendiente = null;
  }
}

export function initBorrar() {
  $("#btnCancelDel").addEventListener("click", cerrarConfirm);
  $("#btnConfirmDel").addEventListener("click", ejecutarBorrar);
}