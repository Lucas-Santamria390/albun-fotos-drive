import { $, toast, mostrarCarga, ocultarCarga } from "../util.js";
import { applyTema, initTema } from "../theme.js";
import { AUTH } from "../auth.js";
import { DriveApi } from "../drive/api.js";
import { state, cargarJson, cargarFotos, puedeSubir, puedeBorrar } from "./state.js";
import { renderGaleria } from "./gallery.js";
import { abrirLightbox, cerrarLightbox, navegarFoto, initLightbox } from "./lightbox.js";
import { initUpload } from "./upload.js";
import { iniciarOwner } from "./admin.js";
import { prepararSesion, renderSesion, salir, mostrarGateError } from "./sesion.js";
import { solicitarBorrar, solicitarBorrarSel, initBorrar, cerrarConfirm, modalConfirmAbierto } from "./borrar.js";
import { entrarSeleccion, cancelarSeleccion, toggleEnSeleccion, haySeleccion } from "./seleccion.js";

function comenzarLogin() {
  const msj = $("#msjCapa");
  msj.textContent = "Conectando con Google…";
  mostrarCarga();
  AUTH.login().then(continuar).catch(function (err) {
    ocultarCarga();
    msj.textContent = err.message;
  });
}

async function continuar() {
  try {
    await prepararSesion();
    $("#capaAuth").classList.add("oculto");
    $("#capaContenido").classList.remove("oculto");
    if (state.modo === "owner") {
      await iniciarOwner();
    } else {
      await entrarInvitado();
    }
    await cargarGaleria();
    renderBotones();
    renderSesion();
    ocultarCarga();
  } catch (e) {
    ocultarCarga();
    mostrarGateError(e);
  }
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
  const [invs, usuarios] = await Promise.all([cargarJson(invId), cargarJson(usersId)]);
  const inv = invs[token];
  if (!inv) {
    toast("Invitación no válida o ya no existe.", "error");
    return;
  }
  if (inv.expiracion && inv.expiracion !== "indefinida" && new Date(inv.expiracion) < new Date()) {
    toast("Esta invitación ha expirado.", "error");
    return;
  }
  state.usuarios = usuarios;
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
  await cargarFotos();
  renderGaleria();
}

function renderBotones() {
  $("#btnAjustes").classList.toggle("oculto", state.modo !== "owner");
  $("#secSubir").classList.toggle("oculto", !puedeSubir());
  $("#btnSel").classList.toggle("oculto", !puedeBorrar());
}

function clickGaleria(e) {
  const tar = e.target.closest(".foto");
  if (!tar) return;
  if (haySeleccion()) {
    toggleEnSeleccion(tar.dataset.id);
    return;
  }
  if (e.target.closest("[data-accion='borrar']")) {
    solicitarBorrar(tar.dataset.id);
    return;
  }
  abrirLightbox(tar.dataset.id);
}

function teclas(e) {
  const lbAbierto = !$("#modalFoto").classList.contains("oculto");
  if (lbAbierto) {
    if (e.key === "ArrowRight") navegarFoto(1);
    if (e.key === "ArrowLeft") navegarFoto(-1);
    if (e.key === "Escape") cerrarLightbox();
    return;
  }
  if (e.key === "Escape") {
    if (haySeleccion()) {
      cancelarSeleccion();
      return;
    }
    if (modalConfirmAbierto()) cerrarConfirm();
  }
}

function clickPagina(e) {
  if (e.target.closest(".foto")) clickGaleria(e);
}

function init() {
  AUTH.init();
  applyTema();
  initTema();
  state.params = new URLSearchParams(location.search);
  state.modo = state.params.get("token") ? "inv" : "owner";

  $("#btnSalir").addEventListener("click", salir);
  $("#btnLoginGoogle").addEventListener("click", comenzarLogin);
  $("#formNombre").addEventListener("submit", enviarNombre);
  $("#btnRefrescar").addEventListener("click", cargarGaleria);
  $("#btnSel").addEventListener("click", entrarSeleccion);
  $("#btnSelCancelar").addEventListener("click", cancelarSeleccion);
  $("#btnSelBorrar").addEventListener("click", solicitarBorrarSel);
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
  initBorrar();
  document.addEventListener("keydown", teclas);
  document.addEventListener("click", clickPagina);

  if (!AUTH.token) {
    ocultarCarga();
    $("#capaAuth").classList.remove("oculto");
    $("#capaContenido").classList.add("oculto");
    return;
  }
  continuar();
}

init();