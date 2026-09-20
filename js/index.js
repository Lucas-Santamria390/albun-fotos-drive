const INDEX = {
  init() {
    AUTH.init();
    if (AUTH.token) {
      location.href = "album.html" + location.search;
      return;
    }
    const btn = document.getElementById("btnLogin");
    const msj = document.getElementById("msj");
    btn.addEventListener("click", function () {
      msj.textContent = "Conectando con Google…";
      btn.disabled = true;
      AUTH.login().then(function () {
        location.href = "album.html" + location.search;
      }).catch(function (e) {
        msj.textContent = e.message;
        btn.disabled = false;
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", function () { INDEX.init(); });