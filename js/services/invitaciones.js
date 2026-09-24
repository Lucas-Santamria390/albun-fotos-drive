import { PERMISOS_INICIALES } from "./permisos.js";

export function generarToken() {
  const aleatorio = Math.random().toString(36).slice(2, 12);
  return "alb-" + Date.now().toString(36) + "-" + aleatorio;
}

export function permisosSegunRol(invitacion) {
  return (invitacion && invitacion.permisos) || PERMISOS_INICIALES;
}

export function invitacionExpirada(invitacion, referencia = new Date()) {
  if (!invitacion) return false;
  const exp = invitacion.expiracion;
  if (!exp || exp === "indefinida") return false;
  return new Date(exp) < referencia;
}

export function validarInvitacion(invitaciones, token, referencia = new Date()) {
  const inv = invitaciones ? invitaciones[token] : undefined;
  if (!inv) return { ok: false, motivo: "invalida" };
  if (invitacionExpirada(inv, referencia)) return { ok: false, motivo: "expirada" };
  return { ok: true, invitacion: inv };
}