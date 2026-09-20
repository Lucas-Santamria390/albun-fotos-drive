import { $, toast } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "./state.js";
import { DriveApi } from "../drive/api.js";
import { renderGaleria } from "./gallery.js";
import { renderStats } from "./admin.js";

function itemProgreso(nombre) {
  const cola = $("#progresoCola");
  const li = document.createElement("div");
  li.className = "prog-item";
  const nom = document.createElement("span");
  nom.className = "nom";
  nom.textContent = nombre;
  const est = document.createElement("span");
  est.className = "estado";
  est.textContent = "Subiendo…";
  const pct = document.createElement("span");
  pct.className = "pct";
  pct.textContent = "0%";
  const bar = document.createElement("div");
  bar.className = "prog-bar";
  const inner = document.createElement("i");
  bar.appendChild(inner);
  li.appendChild(nom);
  li.appendChild(est);
  li.appendChild(pct);
  li.appendChild(bar);
  cola.appendChild(li);
  return { li: li, barra: inner, pct: pct, estado: est };
}

export async function subirFotos(files) {
  if (!state.permisos || !state.permisos.subir) {
    toast("No tienes permiso para subir fotos.", "error");
    return;
  }
  const lista = Array.prototype.slice.call(files).filter(function (f) {
    return CONFIG.mimeImagen.indexOf(f.type) >= 0;
  });
  if (!lista.length) {
    toast("Arrastra archivos de imagen (JPG, PNG, GIF, WEBP…).", "error");
    return;
  }
  for (const archivo of lista) {
    const el = itemProgreso(archivo.name);
    try {
      const creado = await DriveApi.subirConProgreso(
        { name: archivo.name, mimeType: archivo.type, parents: [state.fId] },
        archivo,
        archivo.name,
        function (pct) { el.barra.style.width = pct + "%"; el.pct.textContent = pct + "%"; }
      );
      state.fotos.unshift({
        id: creado.id,
        name: creado.name || archivo.name,
        createdTime: creado.createdTime || new Date().toISOString()
      });
      el.estado.textContent = "Subida";
      el.barra.style.width = "100%";
      setTimeout(function () { el.li.remove(); }, 700);
      toast("\u201c" + archivo.name + "\u201d subida.", "ok");
    } catch (err) {
      el.estado.textContent = "Error";
      el.li.classList.add("error-prog");
      setTimeout(function () { el.li.remove(); }, 3000);
      toast("No se pudo subir \u201c" + archivo.name + "\u201d: " + err.message, "error");
    }
    renderGaleria();
    renderStats();
  }
  $("#inputSubir").value = "";
}

export function initUpload() {
  const uz = $("#uploadZone");
  if (!uz) return;
  const ov = $("#dragov");
  uz.addEventListener("click", function () { $("#inputSubir").click(); });
  uz.addEventListener("dragover", function (e) { e.preventDefault(); ov.classList.add("va"); });
  uz.addEventListener("dragleave", function () { ov.classList.remove("va"); });
  uz.addEventListener("drop", function (e) {
    e.preventDefault();
    ov.classList.remove("va");
    if (e.dataTransfer && e.dataTransfer.files.length) subirFotos(e.dataTransfer.files);
  });
  $("#inputSubir").addEventListener("change", function (e) { subirFotos(e.target.files); });
}