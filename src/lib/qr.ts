import { renderSVG } from "uqr";

/** Genera el QR localmente: el enlace de invitación nunca sale del navegador. */
export function qrSvg(texto: string): string {
  return renderSVG(texto, { border: 2, ecc: "M" });
}

/** Versión lista para <img src> o descarga. */
export function qrDataUrl(texto: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(qrSvg(texto));
}
