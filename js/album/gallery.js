import { $, ICONOS, escapeHtml } from "../util.js";
import { state, visibles } from "./state.js";
import { DriveApi } from "../drive/api.js";
import { estiloConteo } from "../services/galeria.js";

function tarjetaFoto(f) {
  const t = document.createElement("div");
  t.className = "foto";
  t.dataset.id = f.id;
  const img = document.createElement("img");
  img.className = "sk";
  img.alt = f.name || "Foto";
  img.loading = "lazy";
  img.decoding = "async";
  t.appendChild(img);
  const marca = document.createElement("span");
  marca.className = "sel-marca";
  marca.innerHTML = ICONOS.check;
  t.appendChild(marca);
  if (!state.selActivo && state.permisos && state.permisos.borrar) {
    const b = document.createElement("button");
    b.className = "borrar";
    b.title = "Eliminar foto";
    b.dataset.accion = "borrar";
    b.innerHTML = ICONOS.papelera;
    t.appendChild(b);
  }
  if (state.selActivo && state.fsSel.indexOf(f.id) >= 0) t.classList.add("sel");
  const p = document.createElement("span");
  p.className = "pill";
  p.textContent = f.name || "Foto";
  t.appendChild(p);
  return t;
}

export function marcarSel(id) {
  const f = document.querySelector('.foto[data-id="' + id + '"]');
  if (!f) return;
  f.classList.toggle("sel", state.fsSel.indexOf(id) >= 0);
}

export function cargarImagen(f, img) {
  if (!img) return;
  const url = state.cache[f.id];
  if (url) {
    img.src = url;
    img.classList.remove("sk");
    return;
  }
  DriveApi.fotoUrl(f.id).then(function (u) {
    if (document.body.contains(img)) img.src = u;
    state.cache[f.id] = u;
    img.classList.remove("sk");
  }).catch(function () {
    if (document.body.contains(img)) {
      img.classList.add("fallo-img");
      img.classList.remove("sk");
      img.alt = "No accesible";
    }
  });
}

export function renderGaleria() {
  const secg = $("#galeria");
  if (!secg) return;
  secg.innerHTML = "";
  secg.classList.toggle("modo-sel", !!state.selActivo);
  const vis = visibles();

  const tConteo = $("#txtConteo");
  tConteo.textContent = estiloConteo(state.fotos.length, vis.length);

  if (!state.fotos.length) {
    secg.innerHTML =
      '<div class="vacio">' + ICONOS.fotos +
      "<p>Este álbum aún no tiene fotos.</p>" +
      (state.permisos && state.permisos.subir ? "<small>Sube la primera desde arriba.</small>" : "<small>Vuelve pronto, pronto habrá novedades.</small>") +
      "</div>";
    return;
  }
  if (!vis.length) {
    secg.innerHTML =
      '<div class="vacio">' + ICONOS.img +
      "<p>No hay resultados para \u201c" + escapeHtml(state.txBusqueda) + "\u201d.</p>" +
      "<small>Prueba con otro término o recarga la galería.</small></div>";
    return;
  }

  vis.forEach(function (f) {
    const tar = tarjetaFoto(f);
    secg.appendChild(tar);
    cargarImagen(f, tar.querySelector("img"));
  });
}