import type { ErrorHttp } from "../tipos";

/**
 * Traduce los errores de Drive al abrir un enlace de invitación.
 * Distingue sesión expirada, falta de permiso de app y archivos no encontrados.
 */
export function mensajeAccesoAlbum(error: ErrorHttp): string {
  if (error.code === 401) {
    return "Tu sesión expiró. Inicia sesión de nuevo.";
  }

  if (error.reason === "appNotAuthorizedToFile" || error.code === 403) {
    return (
      "Tu cuenta no tiene acceso de app a los archivos del álbum. " +
      "Vuelve a iniciar sesión aceptando el permiso de Drive; si el problema " +
      "continúa, pide una invitación nueva al administrador."
    );
  }

  if (error.code === 404) {
    return (
      "No se pudieron encontrar los archivos del álbum. Comprueba que el " +
      "enlace esté completo o pide una invitación nueva."
    );
  }

  return error.message || "No se pudo acceder al álbum.";
}
