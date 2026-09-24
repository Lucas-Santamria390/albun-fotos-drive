import { $, toast } from "../util.js";
import { state } from "./state.js";
import { DriveApi } from "../drive/api.js";
import { renderGaleria } from "./gallery.js";
import { salirDeSeleccion } from "./seleccion.js";

let pendientes = null;
let borrando = false;

export function modalConfirmAbierto() {
  return !$("#modalConfirm").classList.contains("oculto");
}

export function solicitarBorrar(id) {
  pendientes = [id];
  const f = state.fotos.find(function (x) { return x.id === id; });
  $("#txtConfirm").textContent = "La foto \u201c" + (f ? f.name : "") + "\u201d se eliminará del álbum de forma permanente.";
  $("#modalConfirm").classList.remove("oculto");
}

export function solicitarBorrarSel() {
  const ids = state.fsSel.slice();
  if (!ids.length) return;
  pendientes = ids;
  $("#txtConfirm").textContent = ids.length + " fotos se eliminarán del álbum de forma permanente.";
  $("#modalConfirm").classList.remove("oculto");
}

export function cerrarConfirm() {
  if (borrando) return;
  $("#modalConfirm").classList.add("oculto");
  pendientes = null;
}

async function ejecutarBorrar() {
  const ids = pendientes;
  if (!ids || !ids.length || borrando) return;
  const enSel = state.selActivo;
  const total = ids.length;
  borrando = true;
  pendientes = null;
  $("#btnCancelDel").disabled = true;
  $("#btnConfirmDel").disabled = true;
  let ok = 0;
  try {
    for (let i = 0; i < ids.length; i++) {
      $("#txtConfirm").textContent = "Borrando foto " + (i + 1) + " de " + total + "…";
      try {
        await DriveApi.borrar(ids[i]);
        ok++;
        if (state.cache[ids[i]]) { URL.revokeObjectURL(state.cache[ids[i]]); delete state.cache[ids[i]]; }
        state.fotos = state.fotos.filter(function (x) { return x.id !== ids[i]; });
      } catch (err) {
        toast("No se pudo borrar una foto: " + err.message, "error");
      }
    }
  } finally {
    $("#btnCancelDel").disabled = false;
    $("#btnConfirmDel").disabled = false;
    $("#modalConfirm").classList.add("oculto");
    borrando = false;
    if (enSel) {
      salirDeSeleccion();
    } else {
      renderGaleria();
    }
    toast(
      ok > 1 ? ok + " fotos eliminadas." : ok === 1 ? "Foto eliminada." : "Ninguna foto se eliminó.",
      ok > 0 ? "ok" : "error"
    );
  }
}

export function initBorrar() {
  $("#btnCancelDel").addEventListener("click", cerrarConfirm);
  $("#btnConfirmDel").addEventListener("click", ejecutarBorrar);
}