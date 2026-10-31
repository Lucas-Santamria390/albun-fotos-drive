import { resolverOrigen } from "./origen";
import type { MemoEstructura } from "./tipos";

/** Client ID público de Google OAuth (no es un secreto). */
const CLIENT_ID_POR_DEFECTO = "622196535234-ddrlisjppqaivef385ncm17jvi22pojk.apps.googleusercontent.com";

const clientIdEnv = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID as string | undefined;
const apiKeyEnv = import.meta.env.PUBLIC_GOOGLE_API_KEY as string | undefined;
const sitioEnv = import.meta.env.PUBLIC_SITE_URL as string | undefined;

/**
 * Scope único de la app.
 *
 * `drive.file` es por usuario, no por aplicación: Google solo deja ver los
 * archivos que la app creó a nombre de esa cuenta. Como Drive asigna la
 * propiedad a quien sube la foto, el dueño con `drive.file` no podía ver lo que
 * subía un invitado en su propia carpeta `fotos/`. Con `drive` ambas cuentas
 * alcanzan la carpeta compartida y el álbum funciona sin backend.
 */
export const SCOPE = "https://www.googleapis.com/auth/drive";

/** Alias conservados para no romper llamadas existentes. */
export const SCOPE_DUENO = SCOPE;
export const SCOPE_INVITADO = SCOPE;

/** Origen de la app: `PUBLIC_SITE_URL` o, si no existe, la barra de direcciones. */
export function origenSitio(
  ubicacion: { origin?: string } | undefined = typeof window !== "undefined" ? window.location : undefined
): string {
  return resolverOrigen(sitioEnv, ubicacion?.origin);
}

/**
 * Scope que corresponde al modo de acceso. Hoy es el mismo para dueño e
 * invitado; se mantiene la función porque la sesión guarda el scope y hay que
 * poder compararlo para forzar re-login si cambia.
 */
export function scopeDelModo(_modo: "owner" | "inv" = "owner"): string {
  return SCOPE;
}

export const CONFIG = {
  clientId: clientIdEnv || CLIENT_ID_POR_DEFECTO,
  /** Clave pública de la API de Google (Picker). Se restringe por referrer. */
  apiKey: apiKeyEnv || "",
  rootNombre: "MiAlbumWeb_Config",
  folderMime: "application/vnd.google-apps.folder",
  jsonMime: "application/json",
  mimeImagen: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/heic"] as string[],
  apiBase: "https://www.googleapis.com/drive/v3",
  uploadBase: "https://www.googleapis.com/upload/drive/v3",
  /** Se rellena con asegurarEstructura() o con los parámetros del enlace. */
  memo: { raiz: "", inv: "", users: "", fotos: "", album: "" } as MemoEstructura,
};
