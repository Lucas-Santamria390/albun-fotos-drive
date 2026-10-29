import { CONFIG } from "./config";
import type { ErrorHttp, PerfilGoogle } from "./tipos";

const CLAVE_TOKEN = "MiAlbumWeb_token";

interface RespuestaToken {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (r: RespuestaToken) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

function crearError(mensaje: string, code?: number): ErrorHttp {
  const error = new Error(mensaje) as ErrorHttp;
  if (code !== undefined) error.code = code;
  return error;
}

/**
 * Sesión OAuth implícita con Google.
 * El token vive en sessionStorage (se pierde al cerrar la pestaña).
 */
export const AUTH = {
  token: null as string | null,
  client: null as TokenClient | null,
  user: null as PerfilGoogle | null,
  _cb: null as (() => void) | null,
  _err: null as ((e: Error) => void) | null,

  init(): void {
    this.token = sessionStorage.getItem(CLAVE_TOKEN);
  },

  cargarScript(): Promise<void> {
    return new Promise((resolver, rechazar) => {
      if (window.google?.accounts?.oauth2) {
        resolver();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolver();
      script.onerror = () => rechazar(new Error("No se pudo cargar la librería de Google"));
      document.head.appendChild(script);
    });
  },

  async login(): Promise<void> {
    await this.cargarScript();

    if (!this.client) {
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) throw new Error("No se pudo cargar la librería de Google");
      this.client = oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope: CONFIG.scope,
        callback: (r) => {
          if (r.access_token) {
            this.token = r.access_token;
            sessionStorage.setItem(CLAVE_TOKEN, r.access_token);
            const cb = this._cb;
            this._cb = null;
            this._err = null;
            cb?.();
            return;
          }
          const err = this._err;
          this._cb = null;
          this._err = null;
          err?.(crearError(r.error_description || r.error || "Inicio de sesión no completado", 401));
        },
      });
    }

    return new Promise<void>((resolver, rechazar) => {
      this._cb = resolver;
      this._err = rechazar;
      this.client?.requestAccessToken();
    });
  },

  async quienSoy(): Promise<PerfilGoogle> {
    if (this.user) return this.user;

    const r = await fetch(CONFIG.apiBase + "/about?fields=user", {
      headers: { Authorization: "Bearer " + this.token },
    });

    if (!r.ok) {
      throw crearError(
        r.status === 401 ? "Tu sesión expiró. Inicia sesión de nuevo." : "No se pudo obtener la sesión",
        r.status,
      );
    }

    const datos = (await r.json()) as { user?: PerfilGoogle };
    this.user = datos.user ?? { emailAddress: "", displayName: "" };
    return this.user;
  },

  salir(): void {
    this.token = null;
    this.user = null;
    sessionStorage.removeItem(CLAVE_TOKEN);
  },
};
