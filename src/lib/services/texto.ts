/** Utilidades de texto sin dependencias del DOM (testeables en Node). */

export function escapeHtml(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function inicial(nombre: string | null | undefined): string {
  return String(nombre ?? "")
    .trim()
    .charAt(0)
    .toUpperCase();
}
