import type { Foto, OrdenGaleria } from "../tipos";

function fecha(foto: Foto): number {
  return foto.createdTime ? new Date(foto.createdTime).getTime() : 0;
}

function ordenar(fotos: Foto[], orden: OrdenGaleria): Foto[] {
  return fotos.slice().sort((a, b) => {
    if (orden === "antiguos") return fecha(a) - fecha(b);
    if (orden === "nombre") return String(a.name ?? "").localeCompare(String(b.name ?? ""), "es");
    return fecha(b) - fecha(a);
  });
}

export function filtrarOrdenar(
  fotos: Foto[] | null | undefined,
  busqueda: string | null | undefined,
  orden: OrdenGaleria | null | undefined,
): Foto[] {
  const q = String(busqueda ?? "").toLowerCase();
  const filtradas = (fotos ?? []).filter(
    (foto) => !q || String(foto.name ?? "").toLowerCase().includes(q),
  );
  return ordenar(filtradas, orden ?? "recientes");
}

export function estiloConteo(total: number, visibles: number): string {
  if (!total) return "";
  return visibles === total ? `${total} foto${total === 1 ? "" : "s"}` : `${visibles} de ${total}`;
}
