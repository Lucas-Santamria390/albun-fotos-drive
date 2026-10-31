/**
 * Lista de fotos ocultas del álbum (ocultas.json).
 *
 * Solo el dueño de un archivo puede borrarlo en Drive; una foto subida por un
 * invitado pertenece a su cuenta. Para que el dueño pueda quitarla del álbum
 * sin borrarla de un Drive ajeno, se guarda su id aquí y la galería la filtra.
 */

export interface Ocultas {
  ocultas: string[];
}

function idsValidos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const limpios = valor
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter(Boolean);
  return [...new Set(limpios)];
}

/**
 * Lee el contenido de ocultas.json. Tolera JSON corrupto, un array directo o
 * la forma `{ ocultas: [...] }` y descarta ids vacíos o repetidos.
 */
export function leerOcultas(crudo: string | null | undefined): string[] {
  if (!crudo || !crudo.trim()) return [];

  let datos: unknown;
  try {
    datos = JSON.parse(crudo);
  } catch {
    return [];
  }

  if (Array.isArray(datos)) return idsValidos(datos);
  return idsValidos((datos as Ocultas | null)?.ocultas);
}

/** Añade ids sin duplicar. Devuelve una lista nueva. */
export function agregarOcultas(lista: string[] | null | undefined, ids: string[] | null | undefined): string[] {
  return idsValidos([...(lista ?? []), ...(ids ?? [])]);
}

export function quitarOcultas(
  lista: string[] | null | undefined,
  ids: string[] | null | undefined,
): string[] {
  const quitar = new Set(idsValidos(ids));
  return idsValidos(lista).filter((id) => !quitar.has(id));
}

/** Contenido listo para guardar en ocultas.json. */
export function serializarOcultas(ids: string[] | null | undefined): Ocultas {
  return { ocultas: idsValidos(ids) };
}

/** Quita de la galería las fotos cuyo id está en la lista de ocultas. */
export function filtrarOcultas<T extends { id: string }>(
  fotos: T[] | null | undefined,
  ocultas: string[] | null | undefined,
): T[] {
  const lista = fotos ?? [];
  if (!ocultas?.length) return lista;

  const conjunto = new Set(ocultas);
  return lista.filter((foto) => !conjunto.has(foto.id));
}
