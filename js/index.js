import { applyTema, initTema } from "./theme.js";
import { AUTH } from "./auth.js";
import { toast } from "./util.js";

function entrarAlAlbum() {
  location.href = "album.html" + location.search;
}

function conectar(btn) {
  btn.disabled = true;
  toast("Conectando con Google…", "se");
  AUTH.login().then(entrarAlAlbum).catch(function (e) {
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
  const btnReg = document.getElementById("btnRegistrarse");
  const btnLogin = document.getElementById("btnLoginNav");
  if (btnReg) btnReg.addEventListener("click", function () { conectar(btnReg); });
  if (btnLogin) btnLogin.addEventListener("click", function () { conectar(btnLogin); });
}

init();