import { $ } from "../util.js";
import { state, toggleSel, limpiarSel } from "./state.js";
import { renderGaleria, marcarSel } from "./gallery.js";

export function entrarSeleccion() {
  state.selActivo = true;
  limpiarSel();
  renderEstado();
  renderGaleria();
}

export function cancelarSeleccion() {
  state.selActivo = false;
  limpiarSel();
  renderEstado();
  renderGaleria();
}

export function salirDeSeleccion() {
  cancelarSeleccion();
}

export function toggleEnSeleccion(id) {
  toggleSel(id);
  marcarSel(id);
  renderEstado();
}

export function haySeleccion() {
  return state.selActivo;
}

export function renderEstado() {
  const n = state.fsSel.length;
  const barra = $("#barraSel");
  if (barra) barra.classList.toggle("oculto", !(state.selActivo && n > 0));
  const c = $("#selConteo");
  if (c) c.textContent = n + " seleccionada" + (n === 1 ? "" : "s");
  const b = $("#btnSelBorrar");
  if (b) b.disabled = n === 0;
}