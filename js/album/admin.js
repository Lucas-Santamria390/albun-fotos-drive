import { $, toast, ICONOS } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "./state.js";
import { DriveApi } from "../drive/api.js";

export function renderStats() {
  $("#statUsuarios").textContent = Object.keys(state.usuarios || {}).length;
  $("#statInv").textContent = Object.keys(state.invitaciones || {}).length;
  $("#statFotos").textContent = state.fotos ? state.fotos.length : 0;
}

export function renderUsuarios() {
  const ul = $("#listaUsuarios");
  if (!ul) return;
  const keys = Object.keys(state.usuarios || {});
  ul.innerHTML = "";
  if (!keys.length) {
    ul.innerHTML = '<li class="detalle">Aún no hay usuarios invitados.</li>';
    return;
  }
  keys.sort().forEach(function (k) {
    const u = state.usuarios[k];
    const per = u.permisos || {};
    const li = document.createElement("li");
    const det = document.createElement("div");
    det.className = "detalle";
    const nombre = document.createElement("strong");
    nombre.textContent = u.nombre || k;
    const email = document.createElement("span");
    email.className = "token";
    email.textContent = k;
    const rol = document.createElement("span");
    rol.className = "etiqueta " + (u.rol || "colaborador");
    rol.textContent = u.rol || "colaborador";
    det.appendChild(nombre);
    det.appendChild(email);
    det.appendChild(rol);
    const per1 = document.createElement("span");
    per1.className = "perm";
    per1.textContent = "subir:" + (per.subir ? "sí" : "no");
    const per2 = document.createElement("span");
    per2.className = "perm";
    per2.textContent = "borrar:" + (per.borrar ? "sí" : "no");
    const per3 = document.createElement("span");
    per3.className = "perm";
    per3.textContent = "modificar:" + (per.modificar ? "sí" : "no");
    det.appendChild(per1);
    det.appendChild(per2);
    det.appendChild(per3);
    li.appendChild(det);
    ul.appendChild(li);
  });
}

export function renderInvitaciones() {
  const ul = $("#listaInvitaciones");
  if (!ul) return;
  ul.innerHTML = "";
  const keys = Object.keys(state.invitaciones || {});
  if (!keys.length) {
    ul.innerHTML = '<li class="detalle">No hay invitaciones activas.</li>';
    return;
  }
  keys.forEach(function (tok) {
    const inv = state.invitaciones[tok];
    const li = document.createElement("li");
    const det = document.createElement("div");
    det.className = "detalle";
    const cod = document.createElement("span");
    cod.className = "token";
    cod.textContent = tok;
    const rol = document.createElement("span");
    rol.className = "etiqueta " + (inv.rol || "colaborador");
    rol.textContent = inv.rol || "colaborador";
    const exp = document.createElement("span");
    exp.className = "perm";
    exp.textContent = "expira: " + (inv.expiracion || "indefinida");
    det.appendChild(cod);
    det.appendChild(rol);
    det.appendChild(exp);
    const acc = document.createElement("div");
    acc.className = "acciones";
    const b = document.createElement("button");
    b.className = "btn btn-ghost borrar-inv";
    b.innerHTML = ICONOS.papelera;
    b.title = "Revocar invitación";
    b.dataset.token = tok;
    acc.appendChild(b);
    li.appendChild(det);
    li.appendChild(acc);
    ul.appendChild(li);
  });
}

export function renderAdmin() {
  $("#panelAdmin").classList.remove("oculto");
  renderUsuarios();
  renderInvitaciones();
  renderStats();
}

export function cambiarRol(e) {
  const visit = e.target.value === "visitante";
  $("#chkSubir").checked = !visit;
  $("#chkBorrar").checked = false;
  $("#chkModificar").checked = false;
}

function construirEnlace(token) {
  const base = CONFIG.siteUrl || location.origin;
  return base + "/album.html?drive=" + CONFIG.memo.raiz +
    "&token=" + token +
    "&inv=" + CONFIG.memo.inv +
    "&users=" + CONFIG.memo.users +
    "&fotos=" + CONFIG.memo.fotos;
}

export async function crearInvitacion() {
  const rol = $("#selRol").value;
  const exp = $("#inpExp").value.trim() || "indefinida";
  const per = {
    subir: $("#chkSubir").checked,
    borrar: $("#chkBorrar").checked,
    modificar: $("#chkModificar").checked
  };
  const token = "alb-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  state.invitaciones[token] = { rol: rol, permisos: per, expiracion: exp };
  await DriveApi.actualizarJson(CONFIG.memo.inv, state.invitaciones);
  const enlace = construirEnlace(encodeURIComponent(token));
  state.invitacionActual = enlace;
  $("#salidaInvitacion").classList.remove("oculto");
  $("#enlaceInv").value = enlace;
  $("#qrInv").src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(enlace);
  renderInvitaciones();
  renderStats();
  toast("Invitación generada", "ok");
}

export function copiarEnlace() {
  if (!state.invitacionActual) return;
  navigator.clipboard.writeText(state.invitacionActual).then(function () {
    toast("Enlace copiado al portapapeles", "ok");
  });
}

export async function clickInvitaciones(e) {
  const btn = e.target.closest(".borrar-inv");
  if (!btn) return;
  delete state.invitaciones[btn.dataset.token];
  await DriveApi.actualizarJson(CONFIG.memo.inv, state.invitaciones);
  renderInvitaciones();
  renderStats();
  toast("Invitación revocada.", "ok");
}