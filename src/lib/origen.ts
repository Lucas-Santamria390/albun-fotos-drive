/**
 * Normalización del origen público de la app.
 * No lee el DOM ni variables de entorno: así se puede probar sin navegador.
 */

/** Devuelve el origen (`https://dominio`) o "" si el valor no es válido. */
export function normalizarOrigen(valor?: string | null): string {
  const limpio = (valor ?? "").trim().replace(/\/+$/, "");
  if (!limpio) return "";

  try {
    const url = new URL(limpio);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

/**
 * Prioriza la variable de entorno sobre el origen real del navegador.
 * Si ninguno es válido devuelve "", nunca un dominio de producción fijo.
 */
export function resolverOrigen(origenEnv?: string | null, origenNavegador?: string | null): string {
  return normalizarOrigen(origenEnv) || normalizarOrigen(origenNavegador);
}
