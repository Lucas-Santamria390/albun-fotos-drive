import { CONFIG } from "../config.js";

export function enlaceInvitacion(token, memo) {
  const m = memo || CONFIG.memo;
  return (
    CONFIG.siteUrl +
    "/album.html?drive=" + m.raiz +
    "&token=" + token +
    "&inv=" + m.inv +
    "&users=" + m.users +
    "&fotos=" + m.fotos
  );
}