export const PERMISOS_INICIALES = { subir: true, borrar: false, modificar: false };
export const PERMISOS_ADMIN = { subir: true, borrar: true, modificar: true };
export const PERMISOS_VISITANTE = { subir: false, borrar: false, modificar: false };

export function puede(permisos, accion) {
  return !!(permisos && permisos[accion]);
}

export function puedeSubir(permisos) {
  return puede(permisos, "subir");
}

export function puedeBorrar(permisos) {
  return puede(permisos, "borrar");
}