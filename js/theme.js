const CLAVE = "malbum-tema";

export function applyTema(t) {
  const v = t || localStorage.getItem(CLAVE) || "claro";
  document.documentElement.setAttribute("data-tema", v);
}

export function initTema() {
  const b = document.getElementById("btnTema");
  if (!b) return;
  const alternar = function () {
    const cur = document.documentElement.getAttribute("data-tema") === "oscuro" ? "claro" : "oscuro";
    localStorage.setItem(CLAVE, cur);
    applyTema(cur);
  };
  b.addEventListener("click", alternar);
  b.setAttribute("aria-checked", document.documentElement.getAttribute("data-tema") === "oscuro");
}