import { $, mostrarCarga, ocultarCarga } from "../util.js";
import { applyTema, initTema } from "../theme.js";
import { AUTH } from "../auth.js";
import { cargarFotos } from "./state.js";
import { iniciarOwner, renderAdmin, crearInvitacion, copiarEnlace, clickInvitaciones, cambiarRol } from "./admin.js";
import { prepararSesion, renderSesion, salir, mostrarGateError } from "./sesion.js";

function comenzarLogin() {
  const msj = $("#msjCapa");
  msj.textContent = "Conectando con Google…";
  mostrarCarga();
  AUTH.login().then(bootAjustes).catch(function (err) {
    ocultarCarga();
    msj.textContent = err.message;
  });
}

async function bootAjustes() {
  try {
    await prepararSesion();
    await iniciarOwner();
    await cargarFotos();
    $("#capaAuth").classList.add("oculto");
    $("#capaContenido").classList.remove("oculto");
    renderAdmin();
    renderSesion("admin");
    ocultarCarga();
  } catch (e) {
    ocultarCarga();
    mostrarGateError(e);
  }
}

function init() {
  AUTH.init();
  applyTema();
  initTema();
  $("#btnSalir").addEventListener("click", salir);
  $("#btnLoginGoogle").addEventListener("click", comenzarLogin);
  $("#btnCrearInvitacion").addEventListener("click", crearInvitacion);
  $("#btnCopiar").addEventListener("click", copiarEnlace);
  $("#selRol").addEventListener("change", cambiarRol);
  document.addEventListener("click", clickInvitaciones);

  if (!AUTH.token) {
    ocultarCarga();
    $("#capaAuth").classList.remove("oculto");
    $("#capaContenido").classList.add("oculto");
    return;
  }
  bootAjustes();
}

init();