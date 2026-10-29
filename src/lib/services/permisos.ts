import type { Permisos } from "../tipos";

export const PERMISOS_INICIALES: Permisos = { subir: true, borrar: false, modificar: false };
export const PERMISOS_ADMIN: Permisos = { subir: true, borrar: true, modificar: true };
export const PERMISOS_VISITANTE: Permisos = { subir: false, borrar: false, modificar: false };

export function puede(permisos: Permisos | null | undefined, accion: keyof Permisos): boolean {
  return Boolean(permisos?.[accion]);
}

export function puedeSubir(permisos: Permisos | null | undefined): boolean {
  return puede(permisos, "subir");
}

export function puedeBorrar(permisos: Permisos | null | undefined): boolean {
  return puede(permisos, "borrar");
}

export function puedeModificar(permisos: Permisos | null | undefined): boolean {
  return puede(permisos, "modificar");
}
