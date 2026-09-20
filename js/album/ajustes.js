import { $, toast } from "../util.js";
import { applyTema, initTema } from "../theme.js";
import { AUTH } from "../auth.js";
import { DriveApi } from "../drive/api.js";
import { state } from "./state.js";
import { iniciarOwner, renderAdmin, crearInvitacion, copiarEnlace, clickInvitaciones, cambiarRol } from "./admin.js";

function salir() {
  AUTH.salir();
  location.href = "index.html";
}

function comenzarLogin() {
  const msj = $("#msjCapa");
  msj.textContent = "Conectando con Google…";
  AUTH.login().then(bootAjustes).catch(function (err) {
    msj.textContent = err.message;
  });
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
  et.className = "etiqueta admin";
  et.textContent = "admin";
  const chip = $("#txtSesion").parentElement;
  const old = chip.querySelector(".etiqueta");
  if (old) old.remove();
  chip.appendChild(et);
}

async function bootAjustes() {
  try {
    const u = await AUTH.quienSoy();
    state.yo = u.emailAddress;
    state.yoNombre = u.displayName || state.yo;
    await iniciarOwner();
    const fotos = await DriveApi.listarFotos(state.fId);
    state.fotos = fotos.map(function (f) {
      return { id: f.id, name: f.name, size: f.size, createdTime: f.createdTime };
    });
    $("#capaAuth").classList.add("oculto");
    $("#capaContenido").classList.remove("oculto");
    renderAdmin();
    renderSesion();
  } catch (e) {
    $("#capaContenido").classList.add("oculto");
    $("#capaAuth").classList.remove("oculto");
    $("#msjCapa").textContent = e.message || "No se pudo conectar";
    AUTH.salir();
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
    $("#capaAuth").classList.remove("oculto");
    $("#capaContenido").classList.add("oculto");
    return;
  }
  bootAjustes();
}

init();