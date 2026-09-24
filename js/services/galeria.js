function ordenar(arr, orden) {
  return arr.slice().sort(function (a, b) {
    if (orden === "antiguos") return new Date(a.createdTime) - new Date(b.createdTime);
    if (orden === "nombre") return String(a.name || "").localeCompare(String(b.name || ""), "es");
    return new Date(b.createdTime) - new Date(a.createdTime);
  });
}

export function filtrarOrdenar(fotos, busqueda, orden) {
  const q = String(busqueda || "").toLowerCase();
  const filtradas = (fotos || []).filter(function (f) {
    return !q || String(f.name || "").toLowerCase().indexOf(q) >= 0;
  });
  return ordenar(filtradas, orden || "recientes");
}

export function estiloConteo(total, visibles) {
  if (!total) return "";
  return visibles === total ? total + " foto" + (total === 1 ? "" : "s") : visibles + " de " + total;
}