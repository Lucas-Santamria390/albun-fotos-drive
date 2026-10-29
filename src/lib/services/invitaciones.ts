import { PERMISOS_INICIALES } from "./permisos";
import type { Invitacion, Invitaciones, Permisos, ResultadoValidacion } from "../tipos";

/**
 * Token aleatorio criptográficamente seguro.
 * Formato: alb-<timestamp base36>-<32 hex>
 * Los 16 bytes de entropía hacen inviable adivinar una invitación.
 */
export function generarToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return "alb-" + Date.now().toString(36) + "-" + hex;
}

export function permisosSegunRol(invitacion?: Pick<Invitacion, "permisos"> | null): Permisos {
  return invitacion?.permisos ?? { ...PERMISOS_INICIALES };
}

export function invitacionExpirada(
  invitacion?: Pick<Invitacion, "expiracion"> | null,
  referencia: Date = new Date(),
): boolean {
  const exp = invitacion?.expiracion;
  if (!exp || exp === "indefinida") return false;
  return new Date(exp) < referencia;
}

export function validarInvitacion(
  invitaciones: Invitaciones | null | undefined,
  token: string | null | undefined,
  referencia: Date = new Date(),
): ResultadoValidacion {
  const invitacion = token ? invitaciones?.[token] : undefined;
  if (!invitacion) return { ok: false, motivo: "invalida" };
  if (invitacionExpirada(invitacion, referencia)) return { ok: false, motivo: "expirada" };
  return { ok: true, invitacion };
}
