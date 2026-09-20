import { $ } from "../util.js";
import { AUTH } from "../auth.js";
import { state } from "./state.js";

export function salir() {
  AUTH.salir();
  location.href = "index.html";
}

export async function prepararSesion() {
  const u = await AUTH.quienSoy();
  state.yo = u.emailAddress;
  state.yoNombre = u.displayName || state.yo;
  return u;
}

export function renderSesion(rolFijo) {
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
  const rol = rolFijo || state.rol || "visitante";
  const et = document.createElement("span");
  et.className = "etiqueta " + rol;
  et.textContent = rol;
  const chip = $("#txtSesion").parentElement;
  const old = chip.querySelector(".etiqueta");
  if (old) old.remove();
  chip.appendChild(et);
}

export function mostrarGateError(e) {
  $("#capaContenido").classList.add("oculto");
  $("#capaAuth").classList.remove("oculto");
  $("#msjCapa").textContent = e.message || "No se pudo conectar";
  AUTH.salir();
}