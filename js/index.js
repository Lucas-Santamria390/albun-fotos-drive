import { applyTema, initTema } from "./theme.js";
import { AUTH } from "./auth.js";

function init() {
  AUTH.init();
  applyTema();
  initTema();
  if (AUTH.token) {
    location.href = "album.html" + location.search;
    return;
  }
  const btns = Array.prototype.slice.call(document.querySelectorAll(".btn-login"));
  const msj = document.getElementById("msj");
  btns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (msj) msj.textContent = "Conectando con Google…";
      btn.disabled = true;
      AUTH.login().then(function () {
        location.href = "album.html" + location.search;
      }).catch(function (e) {
        if (msj) msj.textContent = e.message;
        btn.disabled = false;
      });
    });
  });
}

init();