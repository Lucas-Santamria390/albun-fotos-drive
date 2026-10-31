import type { Grupo } from "../tipos";

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export function leerGrupos(crudo: string | null | undefined): Grupo[] {
  if (!crudo?.trim()) return [];
  try {
    const datos = JSON.parse(crudo) as unknown;
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((grupo): grupo is Partial<Grupo> => Boolean(grupo && typeof grupo === "object"))
      .map((grupo) => ({
        id: texto(grupo.id),
        nombre: texto(grupo.nombre),
        fotos: Array.isArray(grupo.fotos)
          ? [...new Set(grupo.fotos.filter((id): id is string => typeof id === "string").map((id) => id.trim()).filter(Boolean))]
          : [],
      }))
      .filter((grupo) => Boolean(grupo.id && grupo.nombre));
  } catch {
    return [];
  }
}

export function serializarGrupos(grupos: Grupo[]): Grupo[] {
  return grupos.map((grupo) => ({
    id: grupo.id,
    nombre: grupo.nombre.trim(),
    fotos: [...new Set(grupo.fotos.filter(Boolean))],
  }));
}

export function agregarFotosAlGrupo(grupo: Grupo, ids: string[]): Grupo {
  return { ...grupo, fotos: [...new Set([...grupo.fotos, ...ids])] };
}

export function quitarFotosDeGrupo(grupo: Grupo, ids: string[]): Grupo {
  const quitar = new Set(ids);
  return { ...grupo, fotos: grupo.fotos.filter((id) => !quitar.has(id)) };
}
