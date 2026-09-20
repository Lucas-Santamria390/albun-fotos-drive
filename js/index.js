import { applyTema, initTema } from "./theme.js";
import { AUTH } from "./auth.js";
import { toast, mostrarCarga, ocultarCarga } from "./util.js";

function entrarAlAlbum() {
  location.href = "album.html" + location.search;
}

function conectar(btn) {
  btn.disabled = true;
  mostrarCarga();
  AUTH.login().then(entrarAlAlbum).catch(function (e) {
    ocultarCarga();
    toast(e.message, "error");
    btn.disabled = false;
  });
}

function init() {
  AUTH.init();
  applyTema();
  initTema();
  if (AUTH.token) {
    entrarAlAlbum();
    return;
  }
  ocultarCarga();
  const btnReg = document.getElementById("btnRegistrarse");
  const btnLogin = document.getElementById("btnLoginNav");
  if (btnReg) btnReg.addEventListener("click", function () { conectar(btnReg); });
  if (btnLogin) btnLogin.addEventListener("click", function () { conectar(btnLogin); });
}

init();