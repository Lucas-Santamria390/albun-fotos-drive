export const $ = function (s) { return document.querySelector(s); };
export const $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

export function mostrarCarga() {
  const o = $("#cargando");
  if (o) o.classList.remove("oculto");
}

export function ocultarCarga() {
  const o = $("#cargando");
  if (o) o.classList.add("oculto");
}

export function toast(msj, tipo) {
  const c = $("#toasts");
  if (!c) return;
  const t = document.createElement("div");
  t.className = "toast" + (tipo ? " " + tipo : "");
  const p = document.createElement("span");
  p.className = "punto";
  const s = document.createElement("span");
  s.textContent = msj;
  t.appendChild(p);
  t.appendChild(s);
  c.appendChild(t);
  requestAnimationFrame(function () { t.classList.add("va"); });
  setTimeout(function () {
    t.classList.add("se");
    setTimeout(function () { t.remove(); }, 420);
  }, 3600);
}

export const ICONOS = {
  check: '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  img: '<svg class="icono borrar-img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="10.5" r="1.6"/><path d="M3 16l4.4-4.2a1.4 1.4 0 0 1 2 0L14 16"/></svg>',
  papelera: '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fotos: '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="10.5" r="1.6"/><path d="M3 16l4.4-4.2a1.4 1.4 0 0 1 2 0L14 16" stroke-linecap="round"/><path d="M14.5 14.5l1.6-1.5a1.4 1.4 0 0 1 2 0L21 15.5" stroke-linecap="round"/></svg>'
};