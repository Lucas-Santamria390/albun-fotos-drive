import { $, toast } from "../util.js";
import { applyTema, initTema } from "../theme.js";
import { AUTH } from "../auth.js";
import { DriveApi } from "../drive/api.js";
import { asegurarEstructura, compartirAlbum } from "../drive/structure.js";
import { state, cargarJson, puedeSubir } from "./state.js";
import { renderGaleria } from "./gallery.js";
import { abrirLightbox, cerrarLightbox, navegarFoto, initLightbox } from "./lightbox.js";
import { initUpload, subirFotos } from "./upload.js";
import { renderAdmin, renderStats, crearInvitacion, copiarEnlace, clickInvitaciones, cambiarRol } from "./admin.js";

let borrarPendiente = null;

function salir() {
  AUTH.salir();
  location.href = "index.html";
}

function comenzarLogin() {
  const msj = $("#msjCapa");
  msj.textContent = "Conectando con Google…";
  AUTH.login().then(continuar).catch(function (err) {
    msj.textContent = err.message;
  });
}

async function continuar() {
  try {
    const u = await AUTH.quienSoy();
    state.yo = u.emailAddress;
    state.yoNombre = u.displayName || state.yo;
    $("#capaAuth").classList.add("oculto");
    $("#capaContenido").classList.remove("oculto");
    if (state.modo === "owner") {
      await iniciarOwner();
      renderAdmin();
    } else {
      await entrarInvitado();
    }
    await cargarGaleria();
    renderBotones();
    renderSesion();
  } catch (e) {
    $("#capaContenido").classList.add("oculto");
    $("#capaAuth").classList.remove("oculto");
    $("#msjCapa").textContent = e.message || "No se pudo conectar";
    AUTH.salir();
  }
}

async function iniciarOwner() {
  await asegurarEstructura();
  state.fId = CONFIG.memo.fotos;
  await compartirAlbum();
  state.usuarios = await cargarJson(CONFIG.memo.users);
  if (!state.usuarios[state.yo] || state.usuarios[state.yo].rol !== "admin") {
    state.usuarios[state.yo] = {
      nombre: state.yoNombre,
      rol: "admin",
      permisos: { subir: true, borrar: true, modificar: true }
    };
    await DriveApi.actualizarJson(CONFIG.memo.users, state.usuarios);
  }
  state.rol = "admin";
  state.permisos = state.usuarios[state.yo].permisos || { subir: true, borrar: true, modificar: true };
  state.invitaciones = await cargarJson(CONFIG.memo.inv);
}

async function entrarInvitado() {
  const token = state.params.get("token");
  const invId = state.params.get("inv");
  const usersId = state.params.get("users");
  const fId = state.params.get("fotos");
  if (!invId || !usersId || !fId) {
    toast("Enlace de invitación incompleto.", "error");
    return;
  }
  state.fId = fId;
  const invs = await cargarJson(invId);
  const inv = invs[token];
  if (!inv) {
    toast("Invitación no válida o ya no existe.", "error");
    return;
  }
  if (inv.expiracion && inv.expiracion !== "indefinida" && new Date(inv.expiracion) < new Date()) {
    toast("Esta invitación ha expirado.", "error");
    return;
  }
  state.usuarios = await cargarJson(usersId);
  if (!state.usuarios[state.yo]) {
    state.permisos = inv.permisos || { subir: true, borrar: false, modificar: false };
    state.rol = inv.rol;
    $("#modalNombre").classList.remove("oculto");
    $("#inpNombre").focus();
    return;
  }
  state.rol = state.usuarios[state.yo].rol;
  state.permisos = state.usuarios[state.yo].permisos;
}

function enviarNombre(e) {
  e.preventDefault();
  const nombre = $("#inpNombre").value.trim();
  if (!nombre) return;
  $("#modalNombre").classList.add("oculto");
  state.usuarios[state.yo] = {
    nombre: nombre,
    rol: state.rol || "colaborador",
    permisos: state.permisos || { subir: true, borrar: false, modificar: false }
  };
  const reg = state.usuarios[state.yo];
  DriveApi.actualizarJson(state.params.get("users"), state.usuarios).then(function () {
    state.rol = reg.rol;
    state.permisos = reg.permisos;
    renderBotones();
    renderSesion();
    return cargarGaleria();
  }).catch(function (err) { toast(err.message, "error"); });
}

async function cargarGaleria() {
  state.cache = {};
  const fotos = await DriveApi.listarFotos(state.fId);
  state.fotos = fotos.map(function (f) {
    return { id: f.id, name: f.name, size: f.size, createdTime: f.createdTime };
  });
  renderGaleria();
  renderStats();
}

function renderBotones() {
  $("#panelAdmin").classList.toggle("oculto", state.modo !== "owner");
  $("#secSubir").classList.toggle("oculto", !puedeSubir());
}

function renderSesion() {
  $("#txtSesion").textContent = (state.yoNombre || state.yo) + " \u00b7 ";
  const av = $("#avatar");
  if (AUTH.user && AUTH.user.photoLink) {
    av.innerHTML = "";
    const img = document.createElement("img");
    img.src = AUTH.user.photoLink;
    img.referrerPolicy = "no-referrer";
    img.alt = "";
    img.width = 40;
    img.height = 40;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";
    av.appendChild(img);
  } else {
    av.textContent = (state.yoNombre || state.yo).charAt(0).toUpperCase();
  }
  const et = document.createElement("span");
  et.className = "etiqueta " + (state.rol || "visitante");
  et.textContent = state.rol || "visitante";
  const chip = $("#txtSesion").parentElement;
  const old = chip.querySelector(".etiqueta");
  if (old) old.remove();
  chip.appendChild(et);
}

function clickGaleria(e) {
  const tar = e.target.closest(".foto");
  if (!tar) return;
  if (e.target.closest("[data-accion='borrar']")) {
    solicitarBorrar(tar.dataset.id);
    return;
  }
  abrirLightbox(tar.dataset.id);
}

function solicitarBorrar(id) {
  const f = state.fotos.find(function (x) { return x.id === id; });
  borrarPendiente = id;
  $("#txtConfirm").textContent = "La foto \u201c" + (f ? f.name : "") + "\u201d se eliminará del álbum de forma permanente.";
  $("#modalConfirm").classList.remove("oculto");
}

function cerrarConfirm() {
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
    renderStats();
    toast("Foto eliminada.", "ok");
  } catch (err) {
    toast(err.message, "error");
  } finally {
    borrarPendiente = null;
  }
}

function teclas(e) {
  const lbAbierto = !$("#modalFoto").classList.contains("oculto");
  if (lbAbierto) {
    if (e.key === "ArrowRight") navegarFoto(1);
    if (e.key === "ArrowLeft") navegarFoto(-1);
    if (e.key === "Escape") cerrarLightbox();
    return;
  }
  if (!$("#modalConfirm").classList.contains("oculto") && e.key === "Escape") {
    cerrarConfirm();
  }
}

function clickPagina(e) {
  if (e.target.closest(".foto")) clickGaleria(e);
  if (e.target.closest(".borrar-inv")) clickInvitaciones(e);
}

function initConfirm() {
  $("#btnCancelDel").addEventListener("click", cerrarConfirm);
  $("#btnConfirmDel").addEventListener("click", ejecutarBorrar);
}

function init() {
  AUTH.init();
  applyTema();
  initTema();
  state.params = new URLSearchParams(location.search);
  state.modo = state.params.get("token") ? "inv" : "owner";

  $("#btnSalir").addEventListener("click", salir);
  $("#btnLoginGoogle").addEventListener("click", comenzarLogin);
  $("#inputSubir").addEventListener("change", function (e) { subirFotos(e.target.files); });
  $("#btnCrearInvitacion").addEventListener("click", crearInvitacion);
  $("#btnCopiar").addEventListener("click", copiarEnlace);
  $("#formNombre").addEventListener("submit", enviarNombre);
  $("#selRol").addEventListener("change", cambiarRol);
  $("#btnRefrescar").addEventListener("click", cargarGaleria);
  $("#inpBuscar").addEventListener("input", function (e) {
    state.txBusqueda = e.target.value.trim();
    renderGaleria();
  });
  $("#selOrden").addEventListener("change", function (e) {
    state.orden = e.target.value;
    renderGaleria();
  });

  initUpload();
  initLightbox();
  initConfirm();
  document.addEventListener("keydown", teclas);
  document.addEventListener("click", clickPagina);

  if (!AUTH.token) {
    $("#capaAuth").classList.remove("oculto");
    $("#capaContenido").classList.add("oculto");
    return;
  }
  continuar();
}

init();