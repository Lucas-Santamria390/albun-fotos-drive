import { normalizarOrigen } from "../origen";
import type { MemoEstructura } from "../tipos";

/**
 * Enlace de invitación. El token se codifica aquí una sola vez y el origen se
 * recibe explícitamente para que el servicio sea testeable y no dependa de un
 * dominio fijo.
 */
export function enlaceInvitacion(token: string, memo: MemoEstructura, base: string): string {
  const origen = normalizarOrigen(base);
  if (!origen) {
    throw new Error("No se pudo determinar una URL válida para el enlace de invitación.");
  }

  const url = new URL("/album.html", origen);
  url.searchParams.set("drive", memo.raiz);
  url.searchParams.set("token", token);
  url.searchParams.set("inv", memo.inv);
  url.searchParams.set("users", memo.users);
  url.searchParams.set("fotos", memo.fotos);
  // Opcional: los enlaces emitidos antes de album.json siguen siendo válidos.
  if (memo.album) url.searchParams.set("album", memo.album);
  if (memo.ocultas) url.searchParams.set("ocultas", memo.ocultas);
  if (memo.grupos) url.searchParams.set("grupos", memo.grupos);
  return url.toString();
}
