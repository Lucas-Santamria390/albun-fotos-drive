/** Estado global de notificaciones (runes de Svelte 5). */

export type TipoToast = "ok" | "error" | "info";

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

let contador = 0;

export const toasts = $state<Toast[]>([]);

/** Añade una notificación. Devuelve el id para poder cerrarla manualmente. */
export function mostrarToast(mensaje: string, tipo: TipoToast = "info", duracion = 4200): number {
  const id = ++contador;
  toasts.push({ id, tipo, mensaje });
  if (duracion > 0 && typeof window !== "undefined") {
    window.setTimeout(() => cerrarToast(id), duracion);
  }
  return id;
}

export function cerrarToast(id: number): void {
  const i = toasts.findIndex((t) => t.id === id);
  if (i !== -1) toasts.splice(i, 1);
}

export const toastOk = (m: string) => mostrarToast(m, "ok");
export const toastError = (m: string) => mostrarToast(m, "error", 6000);
export const toastInfo = (m: string) => mostrarToast(m, "info");
