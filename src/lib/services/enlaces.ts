import { CONFIG } from "../config";
import type { MemoEstructura } from "../tipos";

/**
 * Enlace de invitación. El token se codifica aquí para que ningún llamador
 * pueda olvidarse (y para que no se codifique dos veces).
 */
export function enlaceInvitacion(token: string, memo: MemoEstructura = CONFIG.memo): string {
  return (
    CONFIG.siteUrl +
    "/album.html?drive=" +
    memo.raiz +
    "&token=" +
    encodeURIComponent(token) +
    "&inv=" +
    memo.inv +
    "&users=" +
    memo.users +
    "&fotos=" +
    memo.fotos
  );
}
