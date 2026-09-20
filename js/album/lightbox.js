import { $, toast } from "../util.js";
import { state, visibles } from "./state.js";
import { DriveApi } from "../drive/api.js";

let cola = [];
let index = -1;

function mostrarLbItem() {
  const it = cola[index];
  const img = $("#imgGrande");
  const url = state.cache[it.id];
  if (url) {
    img.src = url;
  } else {
    img.src = "";
    DriveApi.fotoUrl(it.id).then(function (u) {
      state.cache[it.id] = u;
      const actual = cola[index];
      if (actual && actual.id === it.id) img.src = u;
    }).catch(function () {});
  }
  $("#lbNombre").textContent = it.name || "Foto";
  $("#lbCont").textContent = (index + 1) + " / " + cola.length;
}

export function abrirLightbox(id) {
  const vis = visibles();
  const ix = vis.findIndex(function (x) { return x.id === id; });
  if (ix < 0) return;
  cola = vis;
  index = ix;
  $("#lbPrev").style.display = vis.length > 1 ? "" : "none";
  $("#lbNext").style.display = vis.length > 1 ? "" : "none";
  $("#modalFoto").classList.remove("oculto");
  mostrarLbItem();
}

export function cerrarLightbox() {
  $("#modalFoto").classList.add("oculto");
  $("#imgGrande").src = "";
}

export function navegarFoto(d) {
  if (!cola.length) return;
  index = (index + d + cola.length) % cola.length;
  mostrarLbItem();
}

function desencolarDescarga(it, url) {
  const a = document.createElement("a");
  a.href = url;
  a.download = it.name || "foto.jpg";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function descargarActual() {
  const it = cola[index];
  if (!it) return;
  const url = state.cache[it.id];
  if (url) {
    desencolarDescarga(it, url);
  } else {
    DriveApi.fotoUrl(it.id).then(function (u) {
      state.cache[it.id] = u;
      desencolarDescarga(it, u);
    }).catch(function (e) { toast(e.message, "error"); });
  }
}

export function initLightbox() {
  $("#btnCerrarFoto").addEventListener("click", cerrarLightbox);
  $("#modalFoto").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) cerrarLightbox();
  });
  $("#lbPrev").addEventListener("click", function (e) { e.stopPropagation(); navegarFoto(-1); });
  $("#lbNext").addEventListener("click", function (e) { e.stopPropagation(); navegarFoto(1); });
  $("#lbDescargar").addEventListener("click", function (e) {
    e.stopPropagation();
    descargarActual();
  });
}